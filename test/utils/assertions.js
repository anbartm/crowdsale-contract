// require this file to monkey-patch
// some extra assertions into the normal assert
// object
const { toPromise } = require('.')

/**
 * Assert that a transaction reverts. Returns a promise.
 * Example:
 * await reverts(contract.sendTransaction({...})
 * @param promise The promise that the assertion is done on
 */
assert.reverts = async promise => {
  try {
    await promise
    assert.fail('Expected revert not received')
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0
    assert(revertFound, `Expected "revert", got ${error} instead`)
  }
}

/**
 * Assert that the crowdsale's state is equal
 * to `state`. Returns a promise.
 * @param crowdsale The crowdsale instance
 * @param state The state, taken from constants.states
 * @param msg The assertion message
 */
assert.state = async (crowdsale, state, msg) => {
  assert.equal(await crowdsale.crowdsaleState(), state, msg)
}

/**
 * Assert that the balance of an address or
 * contract instance is `balance`. Returns a promise.
 * @param ob A contract instance or an address
 * @param balance The balance in wei
 * @param msg The assertion message
 */
assert.balance = async (ob, balance, msg) => {
  let address = ob.address || ob
  let b = await toPromise(web3.eth.getBalance)(address)
  assert(b.equals(balance), msg)
}

/**
 * Assert that an address is whitelisted. Returns
 * a promise.
 * @param crowdsale The crowdsale contract instance
 * @param address The address that we're checking
 * @param msg The assertion message
 */
assert.whitelisted = async (crowdsale, address, msg) => {
  let [, isActive] = await crowdsale.contributorList(address)
  assert(isActive, msg)
}

/**
 * Assert that an address is not whitelisted. Returns
 * a promise.
 * @param crowdsale The crowdsale contract instance
 * @param address The address that we're checking
 * @param msg The assertion message
 */
assert.notWhitelisted = async (crowdsale, address, msg) => {
  let [, isActive] = await crowdsale.contributorList(address)
  assert(!isActive, msg)
}

/**
 * Assert that an contract or address' token balance
 * is equal to `balance`. Returns a promise.
 * @param ob A contract instance or address whose balance we should check
 * @param tokenContract The instance of the token contract
 * @param balance The balance in wei-ish units
 * @param msg The assertion message
 */
assert.tokenBalance = async (ob, tokenContract, balance, msg) => {
  let address = ob.address || ob
  let b = await tokenContract.balanceOf(address)
  assert(b.equals(balance), msg)
}
