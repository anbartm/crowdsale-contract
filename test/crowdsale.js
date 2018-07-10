let { ignoreRevert, txFee, sendEth, toPromise } = require('./utils')
let { timePoints, states, GAS_PRICE, ETH_TO_TOKEN_CONVERSION } = require('./constants')
require('./utils/assertions')

let Crowdsale = artifacts.require('CrowdsaleTest')
let Token = artifacts.require('TokenTest')

let toWei = web3.toWei

let crowdsale, token

let [owner, multisig, presaleBonus, presaleBonusCS] = web3.eth.accounts
let ppMembers = web3.eth.accounts.slice(4, 4 + 20)
let plebs = web3.eth.accounts.slice(24, 24 + 10)

/**
 * Will be run before every test suite defined by `contract`
 * For every `contract`, the contracts are deployed anew. Here
 * We assign the instances to the actual deployed contracts and
 * populate the whitelist
 */
let setUp = async () => {
  crowdsale = await Crowdsale.deployed()
  token = await Token.deployed()
  // Populate the whitelist
  let allowances = ppMembers.map(_ => toWei(10, 'ether'))
  await crowdsale.editContributors(ppMembers, allowances)
  // Time travel to just before phase 1
  await crowdsale.setTime(timePoints.BEFORE)
}

/**
 * Kill all contracts after a test is done. We don't have to
 * do this on ganache, but if it's good to do this if we're
 * running the tests on kovan
 */
let cleanUp = async () => {
  await crowdsale.kill()
  await token.kill()
}

contract(`Crowdsale, pre-phase 1`, () => {
  before(setUp)
  after(cleanUp)
  /**
   * A non pp member sends 1 eth. The contract should return it and mark
   * it as rejected.
   */
  it(`Should reject 1 eth from a non PP member`, async () => {
    // Dalibor wants to send 1 eth to the crowdsale
    let dalibor = plebs[0]
    // But the crowdsale hasn't started yet
    await crowdsale.setTime(timePoints.BEFORE)
    // Dalibor isn't on the whitelist
    await assert.notWhitelisted(crowdsale, dalibor)
    // He still sends 1 ether to the contract because fuck it
    await assert.reverts(sendEth(dalibor, crowdsale, toWei(1, 'ether')))
    // After the transaction is complete, we check the balances and
    // the state of the crowdsale
    await assert.state(crowdsale, states.PENDING_START, `The state should be PENDING_START`)
    await assert.balance(crowdsale, 0, `The contract balance should be 0`)
  })
})

contract(`Crowdsale, pre-phase 1`, () => {
  before(setUp)
  after(cleanUp)
  /**
   * A PP member sends 1 eth. The contract should
   * return it and mark it as rejected.
   */
  it(`Should reject 1 eth from a PP member`, async () => {
    // Vanda wants to send 1 eth to the crowdsale
    let vanda = ppMembers[0]
    // Vanda is on the whitelist
    await assert.whitelisted(crowdsale, vanda)
    // But the crowdsale hasn't started yet
    await crowdsale.setTime(timePoints.BEFORE)
    // She still sends 1 ether to the contract because fuck it
    await assert.reverts(sendEth(vanda, crowdsale, toWei(1, 'ether')))
    await assert.state(crowdsale, states.PENDING_START, `The state should be PENDING_START`)
    await assert.balance(crowdsale, 0, `The contract balance should be 0`)
  })
})

contract(`Crowdsale, phase 1`, () => {
  before(setUp)
  after(cleanUp)
  /**
   * A non PP members sends 1 eth. The contract should
   * return it and mark it as rejected.
   */
  it(`Should reject 1 eth from a non PP member`, async () => {
    // Dalibor wants to send 1 eth to the crowdsale
    let dalibor = plebs[0]
    let daliborOldBalance = web3.eth.getBalance(dalibor)
    // But the crowdsale hasn't started yet
    await crowdsale.setTime(timePoints.PHASE1)
    // We haven't sent a transaction, so the state should not
    // change yet
    await assert.state(crowdsale, states.PENDING_START, `The state shouldn't change yet`)
    // Dalibor isn't on the whitelist
    await assert.notWhitelisted(crowdsale, dalibor)
    // He still sends 1 ether to the contract because fuck it
    let { fee } = await sendEth(dalibor, crowdsale, toWei(1, 'ether'))
    // After the transaction is complete, we check the balances and
    // the state of the crowdsale
    await assert.state(crowdsale, states.PRIORITY_PASS, `The state should be PRIORITY_PASS`)
    await assert.balance(crowdsale, 0, `The contract balance should be 0`)

    // Check that dalibor should have only paid for gas
    await assert.balance(
      dalibor,
      daliborOldBalance.minus(fee),
      `Dalibor's new balance should be the same, minus the transaction fee`
    )
  })
})

contract(`Crowdsale, phase 1`, () => {
  before(setUp)
  after(cleanUp)
  /**
   * Users 1-10 send 10 eth each. Those contributions are accepted.
   * User 1 sends 1 eth, gets it refunded and closes the crowdsale.
   */
  it(`Should accept 10 ether from 10 PP members`, async () => {
    // We set the time to after phase 1 has started
    await crowdsale.setTime(timePoints.PHASE1)

    await assert.state(
      crowdsale,
      states.PENDING_START,
      `The state should not be changed yet because 
       we haven't sent a transaction`
    )
    assert.balance(crowdsale, 0, `The balance on the contract should be 0`)
    // Now 10 pp members each send 10 ether to the
    // crowdsale
    for (let ppMember of ppMembers.slice(0, 10)) {
      await sendEth(ppMember, crowdsale, toWei(10, 'ether'))
      await assert.state(crowdsale, states.PRIORITY_PASS)
      await assert.tokenBalance(
        ppMember,
        token,
        toWei(10 * ETH_TO_TOKEN_CONVERSION),
        `The user should receive the correct amount of tokens`
      )
    }
    await assert.balance(
      crowdsale,
      toWei(100),
      `The contract should have received money from everyone`
    )
    await assert.state(
      crowdsale,
      states.PRIORITY_PASS,
      `Should still be in the priority pass state`
    )
  })

  it(`Should close the crowdsale after max cap reached`, async () => {
    // The first pp member now sends 1 ether. This should
    // be returned and then the crowdsale should be closed.
    let vanda = ppMembers[0]
    let vandaOldBalance = web3.eth.getBalance(vanda)
    let { fee } = await sendEth(vanda, crowdsale, toWei(1, 'ether'))
    await assert.balance(
      vanda,
      vandaOldBalance.minus(fee),
      `The pp member should only be charged for gas`
    )
    await assert.balance(
      crowdsale,
      toWei(100),
      `The contract should not receive any amount over the max cap`
    )
    await assert.tokenBalance(
      ppMembers[0],
      token,
      toWei(10 * ETH_TO_TOKEN_CONVERSION),
      `The user should not receive tokens for her contribution`
    )
    await assert.state(
      crowdsale,
      states.CROWDSALE_ENDED,
      `The crowdsale has reached its max cap and should be ended`
    )
  })
})

contract(`Crowdsale, multiple phases`, () => {
  before(setUp)
  after(cleanUp)

  it(`Should accept 5 eth and then 2 eth from user 0`, async () => {
    // We set the time to after phase 1 has started
    await crowdsale.setTime(timePoints.PHASE1)
    assert.state(
      crowdsale,
      states.PENDING_START,
      `No transaction yet, so state should be PENDING_START`
    )
    await assert.balance(crowdsale, 0, `Crowdsale should have no money`)
    // User 0 sends 5 eth, it is accepted.
    await sendEth(ppMembers[0], crowdsale, toWei(5, 'ether'))
    await assert.balance(crowdsale, toWei(5, 'ether'), `Crowdsale should have 5 ether`)
    await assert.tokenBalance(
      ppMembers[0],
      token,
      toWei(5 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 5 eth worth of tokens`
    )
    // They send 2 eth again, it is also accepted.
    await sendEth(ppMembers[0], crowdsale, toWei(2, 'ether'))
    await assert.balance(crowdsale, toWei(7, 'ether'), `Crowdsale should have 7 ether`)
    await assert.tokenBalance(
      ppMembers[0],
      token,
      toWei(7 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 7 eth worth of tokens`
    )
  })

  it(`Should accept 10 eth from user 1`, async () => {
    // User 1 sends 10 eth, it is accepted, total eth now at 17
    await sendEth(ppMembers[1], crowdsale, toWei(10, 'ether'))
    await assert.balance(crowdsale, toWei(17, 'ether'), `Crowdsale should have 17 ether`)
    await assert.tokenBalance(
      ppMembers[1],
      token,
      toWei(10 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 10 eth worth of tokens`
    )
  })

  it(`Should return 2 eth to a user who sends 12 eth`, async () => {
    // User 2 sends 12 eth, 10 eth is accepted, 2 eth is returned back (Total eth now at 27)
    let oldBalance = web3.eth.getBalance(ppMembers[2])
    let { fee } = await sendEth(ppMembers[2], crowdsale, toWei(12, 'ether'))
    await assert.balance(crowdsale, toWei(27, 'ether'), `Crowdsale should have 27 ether`)
    await assert.tokenBalance(
      ppMembers[2],
      token,
      toWei(10 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 10 eth worth of tokens`
    )
    await assert.balance(
      ppMembers[2],
      oldBalance.minus(toWei(10, 'ether')).minus(fee),
      `User should have 10 ether + gas money less`
    )
  })

  it(`Should return eth over the max allowed contribution`, async () => {
    // User 3 sends 10 eth, it is accepted
    await sendEth(ppMembers[3], crowdsale, toWei(10, 'ether'))
    await assert.balance(crowdsale, toWei(37, 'ether'), `Crowdsale should have 37 ether`)
    await assert.tokenBalance(
      ppMembers[3],
      token,
      toWei(10 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 10 eth worth of tokens`
    )
    // Now she sends 5 more eth, they are returned
    oldBalance = web3.eth.getBalance(ppMembers[3])
    let { fee } = await sendEth(ppMembers[3], crowdsale, toWei(5, 'ether'))
    await assert.balance(crowdsale, toWei(37, 'ether'), `Crowdsale should have 37 ether`)
    await assert.balance(ppMembers[3], oldBalance.minus(fee), `She should only be down gas money`)
    await assert.tokenBalance(
      ppMembers[3],
      token,
      toWei(10 * ETH_TO_TOKEN_CONVERSION),
      `The user should have 10 eth worth of tokens`
    )
  })

  it(`Should revert a 5 eth contribution from a non pp member`, async () => {
    // Non whitelisted user sends 5 eth, the transaction is reverted
    await assert.reverts(sendEth(plebs[0], crowdsale, toWei(5, 'ether')))
    await assert.balance(
      crowdsale,
      toWei(37, 'ether'),
      `Crowdsale shouldn't accept the non-pp money`
    )
  })

  it(`Should accept 5 eth from users 4,5,6,7,8,9`, async () => {
    // Users 4 to 9 each send 5 eth
    for (let ppMember of ppMembers.slice(4, 10)) {
      await sendEth(ppMember, crowdsale, toWei(5, 'ether'))
      await assert.tokenBalance(
        ppMember,
        token,
        toWei(5 * ETH_TO_TOKEN_CONVERSION),
        `Each user should have 5 eth worth of tokens`
      )
    }
    await assert.balance(crowdsale, toWei(67, 'ether'), `Crowdsale should have 67 ether`)
    await assert.state(crowdsale, states.PRIORITY_PASS, `Should still be in PP state`)
  })

  it(`Should switch to phase 2 at the appropriate time`, async () => {
    await crowdsale.setTime(timePoints.PHASE2)
    await assert.state(
      crowdsale,
      states.PRIORITY_PASS,
      `Should still be in PP state, no txn sent yet`
    )
    // User 2 sends 23 more eth
    await sendEth(ppMembers[2], crowdsale, toWei(23, 'ether'))
    await assert.balance(crowdsale, toWei(90, 'ether'), `Crowsdale should have 90 eth now`)
    await assert.tokenBalance(
      ppMembers[2],
      token,
      toWei(33 * ETH_TO_TOKEN_CONVERSION),
      `User 2 should have 33 eth worth of tokens`
    )
    await assert.state(crowdsale, states.OPENED_PRIORITY_PASS, `Phase should switch to phase 2`)
  })

  it(`Should not accept 5 eth from a pleb`, async () => {
    await assert.reverts(sendEth(plebs[3], crowdsale, toWei(5, 'ether')))
    await assert.balance(crowdsale, toWei(90, 'ether'), `Crowsdale should have 90 eth now`)
    await assert.tokenBalance(plebs[3], token, 0, `The pleb should have 0 tokens`)
  })

  it(`Should accept money from a non-pp member in phase 3`, async () => {
    let pleb = plebs[3]
    await crowdsale.setTime(timePoints.PUBLIC)
    await assert.state(crowdsale, states.OPENED_PRIORITY_PASS, `No txn, no change`)
    // Pleb sends 5 eth, should be accepted
    let oldBalance = web3.eth.getBalance(pleb)
    let { fee } = await sendEth(pleb, crowdsale, toWei(5, 'ether'))
    await assert.balance(crowdsale, toWei(95, 'ether'), `Crowdsale should have 95 eth now`)
    await assert.tokenBalance(
      pleb,
      token,
      toWei(5 * ETH_TO_TOKEN_CONVERSION),
      `Pleb should have her tokens`
    )
    await assert.state(crowdsale, states.CROWDSALE, `Should be in public sale now`)
    await assert.balance(
      pleb,
      oldBalance.minus(toWei(5, 'ether')).minus(fee),
      `Should have 5 ether and gas money less`
    )
  })

  it(`Should return money over the contribution limit`, async () => {
    let pleb = plebs[6]
    // Pleb sends 15 eth, 10 is returned
    let oldBalance = web3.eth.getBalance(pleb)
    let { fee } = await sendEth(pleb, crowdsale, toWei(15, 'ether'))
    await assert.balance(crowdsale, toWei(100, 'ether'), `Crowdsale should have 100 eth`)
    await assert.tokenBalance(
      pleb,
      token,
      toWei(5 * ETH_TO_TOKEN_CONVERSION),
      `Pleb should have 5 eth worth of tokens`
    )
    await assert.balance(
      pleb,
      oldBalance.minus(toWei(5, 'ether')).minus(fee),
      `Pleb should have 5 eth and fee money less`
    )
  })

  it(`Should close the crowdsale after the hard cap is reached`, async () => {
    let pleb = plebs[4]
    let oldBalance = web3.eth.getBalance(pleb)
    let { fee } = await sendEth(pleb, crowdsale, toWei(15, 'ether'))
    await assert.tokenBalance(pleb, token, 0, `Pleb should have 0 tokens, she was too late`)
    await assert.balance(crowdsale, toWei(100, 'ether'), `Crowdsale should still have 100 eth`)
    await assert.balance(pleb, oldBalance.minus(fee), `Pleb should only have been charged txn fees`)
    await assert.state(crowdsale, states.CROWDSALE_ENDED, `Crowdsale should be ended`)
  })
})

/**
 * The truffle test framework has this weird bug/feature: for every
 * `contract` block, it issues evm_snapshot when setting it up
 * and evm_revert when the block is finished, effectively reverting
 * the whole blockchain state. However, for the last contract, it only
 * calls evm_snapshot, but not evm_revert. That means that the stuff that's
 * done in the last contract block isn't reverted. That's why we just
 * put a dummy block here that does nothing, so that the previous `contract`
 * block calls evm_revert.
 */
contract(`Crowdsale`, () => {
  it(`Should be done with testing! 🐸`, () => {
    assert(true)
  })
})
