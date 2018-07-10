pragma solidity 0.4.24;

import "./Token.sol";

contract TokenTest is Token {

  /* Initializes contract */
  constructor(
    address _crowdsaleAddress, 
    uint _tokenStartTime
  ) Token(
    _crowdsaleAddress, 
    _tokenStartTime, 
    " v1.0", 
    "MyToken", 
    "MTK", 
    18
  ) public {}
}
