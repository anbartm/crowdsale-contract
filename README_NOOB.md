
## Interacting with your smart contracts using local Ganache like a total noob.

Deploy contract on local ganache
```
yarn truffle migrate --reset
```

Open truffle console
```
yarn truffle console
```

Get instance of crowdsale
```
Crowdsale.deployed().then(instance => crowdsale = instance)
```

```
Token.deployed().then(instance => token = instance)
```

CrowdsaleTest contract allows you to travel in time by setting crowdsale.setTime. Use this to fake current time and to set it to the contract phase you wish to test. Check test/constants.js to get times of different phases. For example, lets set time for public sale. The public sale means we don't have to edit contributors (add address) to sent eth to contract.
```
crowdsale.setTime(1519747201)

crowdsale.currentTime().then(x => x.toNumber())
>1519747201

crowdsale.crowdsaleStartTime().then(x => x.toNumber())
crowdsale.crowdsaleEndedTime().then(x => x.toNumber())
>1531397843
```

Check crowdsale state. Until eth has been sent to contranct it will stay in PENDING_START state.
- PENDING_START: 0
- PRIORITY_PASS: 1
- OPENED_PRIORITY_PASS: 2
- CROWDSALE: 3,
- CROWDSALE_ENDED: 4,
```
crowdsale.crowdsaleState().then(res => result = res.toNumber())
```

Add wallet to whitelist (you can skip this if you set contract time to public sale)
```
crowdsale.editContributors(['0x0d1d4e623d10f9fba5db95830f7d3839406c6af2'],[web3.toWei(2, 'ether')])

### or
crowdsale.editContributors([web3.eth.accounts[2]],[web3.toWei(10, 'ether')])

### or add as list

crowdsale.editContributors([web3.eth.accounts[2], web3.eth.accounts[3], web3.eth.accounts[4]],[web3.toWei(50, 'ether'), web3.toWei(50, 'ether'), web3.toWei(90, 'ether')])
```

Send ethers to contract.
```
web3.eth.sendTransaction({from: web3.eth.accounts[2],to: crowdsale.address,value: web3.toWei('0.2', 'ether'),gas: 1000000,gasPrice: web3.toWei('20', 'gwei')})

web3.eth.sendTransaction({from: web3.eth.accounts[3],to: crowdsale.address,value: web3.toWei('50', 'ether'),gas: 1000000,gasPrice: web3.toWei('20', 'gwei')})

web3.eth.sendTransaction({from: web3.eth.accounts[4],to: crowdsale.address,value: web3.toWei('20', 'ether'),gas: 1000000,gasPrice: web3.toWei('20', 'gwei')})
```
Get amount of raised ethers
```
crowdsale.ethRaised().then(res => result = web3.fromWei(res).toNumber())
```

Get crowdsale minCap()

```
crowdsale.minCap().then(res => result = web3.fromWei(res).toNumber())
```

Get crowdsale maxCap()

```
crowdsale.maxCap().then(res => result = web3.fromWei(res).toNumber())

```

Withdraw. There will be no ether in your wallet yet. You have to set an address to send Ethers to and run pullBalance(). (See instructions below)
```
crowdsale.withdrawEth()
```

Check ether amount pending for withdraw.
```
crowdsale.pendingEthWithdrawal().then(res => result = web3.fromWei(res).toNumber());
```

Set multisig addres (where to pull ethers from contract)
```
crowdsale.setMultisigAddress(web3.eth.accounts[0])
crowdsale.setMultisigAddress('0x18016bFd91AEe5d695301aF400E8a10233799EcF')
```

Check multisig addres
```
crowdsale.multisigAddress()
```

Pullbalance
```
crowdsale.pullBalance()

web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0]).toNumber())
```

It's also possible to kill contracts, meaning that they stop functioning and their
code gets deleted.

```
> crowdsale.kill()
```
