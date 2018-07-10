// Time points for the crowdsale phases, use this with
// crowdsale.setTime to time travel to different
// phases.
let timePoints = {
  BEFORE: 1519142399,
  PHASE1: 1519142401,
  PHASE2: 1519315201,
  PUBLIC: 1519747201,
  AFTER: 1521561601,
}

// Corresponds to the `crowdsaleState` enum
// from Crowdsale.sol
let states = {
  PENDING_START: 0,
  PRIORITY_PASS: 1,
  OPENED_PRIORITY_PASS: 2,
  CROWDSALE: 3,
  CROWDSALE_ENDED: 4,
}

let GAS_PRICE = web3.toWei('20', 'gwei')

let ETH_TO_TOKEN_CONVERSION = 47000

module.exports = {
  timePoints,
  states,
  GAS_PRICE,
  ETH_TO_TOKEN_CONVERSION,
}
