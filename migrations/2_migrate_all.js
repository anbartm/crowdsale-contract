var Crowdsale = artifacts.require('Crowdsale')
var CrowdsaleTest = artifacts.require('CrowdsaleTest')
var Token = artifacts.require('Token')
var TokenTest = artifacts.require('TokenTest')
var conf = require('../crowdsale.conf')

module.exports = (deployer, network) => {
  if (network === 'development') {
    deployer
      .deploy(CrowdsaleTest)
      .then(() => deployer.deploy(TokenTest, CrowdsaleTest.address, 1521561600))
      .then(() => CrowdsaleTest.deployed())
      .then(crowdsale => crowdsale.setToken(TokenTest.address))
  } else {
    let {
      presaleStartTime,
      presaleUnlimitedStartTime,
      crowdsaleStartTime,
      crowdsaleEndedTime,
      minCap,
      maxCap,
      maxP1Cap,
      ethToTokenConversion,
      maxTokenSupply,
      presaleBonusTokens,
      presaleBonusAddress,
      presaleBonusAddressColdStorage,
    } = conf.crowdsale

    let { standard, name, symbol, decimals } = conf.token

    deployer
      .deploy(
        Crowdsale,
        presaleStartTime,
        presaleUnlimitedStartTime,
        crowdsaleStartTime,
        crowdsaleEndedTime,
        minCap,
        maxCap,
        maxP1Cap,
        ethToTokenConversion,
        maxTokenSupply,
        presaleBonusTokens,
        presaleBonusAddress,
        presaleBonusAddressColdStorage
      )
      .then(() => {
        return deployer.deploy(
          Token,
          Crowdsale.address,
          1521561600,
          standard,
          name,
          symbol,
          decimals
        )
      })
  }
}
