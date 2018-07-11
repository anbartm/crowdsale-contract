pragma solidity 0.4.24;

import "./Crowdsale.sol";

contract CrowdsaleTest is Crowdsale {
  uint public _now;

  constructor() Crowdsale(
    1519142400, 
    1519315200, 
    1519747200, 
    1521561600, 
    1 ether, 
    100 ether, 
    100 ether, 
    47000, 
    1000000000 * 10**18, 
    115996000  * 10**18, 
    0xd7C4af0e30EC62a01036e45b6ed37BC6D0a3bd53, 
    0x47D634Ce50170a156ec4300d35BE3b48E17CAaf6
  ) public {}

  function currentTime() public view returns (uint256 _time) {
    return _now;
  } 

  function setTime(uint256 _newTime) public {
    _now = _newTime;
  }

  function timeTravel(uint256 _delta) public {
    _now += _delta;
  }
}