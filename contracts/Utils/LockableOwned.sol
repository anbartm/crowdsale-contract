pragma solidity ^0.4.24;

import "./Owned.sol";

contract LockableOwned is Owned{

  uint256 public lockedUntilTime;

  event ContractLocked(uint256 _untilTime, string _reason);

  modifier lockAffected {
      require(block.timestamp > lockedUntilTime);
      _;
  }

  function lockFromSelf(uint256 _untilTime, string _reason) internal {
    lockedUntilTime = _untilTime;
    emit ContractLocked(_untilTime, _reason);
  }


  function lockUntil(uint256 _untilTime, string _reason) public onlyOwner {
    lockedUntilTime = _untilTime;
    emit ContractLocked(_untilTime, _reason);
  }
}
