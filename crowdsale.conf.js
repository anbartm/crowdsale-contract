let Web3 = require('web3')
let web3 = new Web3()

module.exports = {
  token: {
    standard: ' v1.0',
    name: 'My Token',
    symbol: 'MTK',
    decimals: 18,
  },
  crowdsale: {
    presaleStartTime: 1519142400,
    presaleUnlimitedStartTime: 1519315200, //22/2/2017/1700
    crowdsaleStartTime: 1519747200, //27/2/2017/1700
    crowdsaleEndedTime: 1521561600, //20/3/2017/1700
    minCap: web3.toWei(1, 'ether'),
    maxCap: web3.toWei(100, 'ether'),
    maxP1Cap: web3.toWei(100, 'ether'),
    ethToTokenConversion: 47000,
    maxTokenSupply: web3.toBigNumber('1000000000e18'),
    presaleBonusTokens: web3.toBigNumber('115996000e18'),
    presaleBonusAddress: '0xd7c4af0e30ec62a01036e45b6ed37bc6d0a3bd53',
    presaleBonusAddressColdStorage: '0x47d634ce50170a156ec4300d35be3b48e17caaf6',
  },
}
