pragma solidity ^0.4.24;

interface IToken {
  function totalSupply() external constant returns (uint256 _totalSupply);
  function mintTokens(address _to, uint256 _amount) external;
}
