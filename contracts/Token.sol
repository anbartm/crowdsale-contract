pragma solidity 0.4.24;

import "./Interfaces/ITokenRecipient.sol";
import "./Interfaces/IERC20Token.sol";
import "./Utils/SafeMath.sol";
import "./Utils/LockableOwned.sol";

contract Token is IERC20Token, LockableOwned {

  using SafeMath for uint256;

  /* Public variables of the token */
  string public standard;
  string public name;
  string public symbol;
  uint8 public decimals;

  address public crowdsaleContractAddress;

  /* Private variables of the token */
  uint256 supply = 0;
  mapping (address => uint256) balances;
  mapping (address => mapping (address => uint256)) allowances;

  /* Events */
  event Mint(address indexed _to, uint256 _value);

  constructor(
    address _crowdsaleAddress, 
    uint _tokenStartTime, 
    string _standard, 
    string _name, 
    string _symbol, 
    uint8 _decimals
  ) public {
    crowdsaleContractAddress = _crowdsaleAddress;
    standard = _standard;
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    lockFromSelf(_tokenStartTime, "Lock before crowdsale starts");
  }

  /* Returns total supply of issued tokens */
  function totalSupply() public constant returns (uint256) {
    return supply;
  }

  /* Returns balance of address */
  function balanceOf(address _owner) public constant returns (uint256 balance) {
    return balances[_owner];
  }

  /* Transfers tokens from your address to other */
  function transfer(address _to, uint256 _value) public lockAffected returns (bool success) {
    require(_to != 0x0 && _to != address(this));
    balances[msg.sender] = balances[msg.sender].sub(_value); // Deduct senders balance
    balances[_to] = balances[_to].add(_value);               // Add receivers balance
    emit Transfer(msg.sender, _to, _value);                       // Raise Transfer event
    return true;
  }

  /* Approve other address to spend tokens on your account */
  function approve(address _spender, uint256 _value) public lockAffected returns (bool success) {
    allowances[msg.sender][_spender] = _value;        // Set allowance
    emit Approval(msg.sender, _spender, _value);           // Raise Approval event
    return true;
  }

  /* Approve and then communicate the approved contract in a single tx */
  function approveAndCall(address _spender, uint256 _value, bytes _extraData) public lockAffected returns (bool success) {
    ItokenRecipient spender = ItokenRecipient(_spender);            // Cast spender to tokenRecipient contract
    approve(_spender, _value);                                      // Set approval to contract for _value
    spender.receiveApproval(msg.sender, _value, this, _extraData);  // Raise method on _spender contract
    return true;
  }

  /* A contract attempts to get the coins */
  function transferFrom(address _from, address _to, uint256 _value) public lockAffected returns (bool success) {
    require(_to != 0x0 && _to != address(this));
    balances[_from] = balances[_from].sub(_value);                              // Deduct senders balance
    balances[_to] = balances[_to].add(_value);                                  // Add recipient balance
    allowances[_from][msg.sender] = allowances[_from][msg.sender].sub(_value);  // Deduct allowance for this address
    emit Transfer(_from, _to, _value);                                               // Raise Transfer event
    return true;
  }

  function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
    return allowances[_owner][_spender];
  }

  function mintTokens(address _to, uint256 _amount) public {
    require(msg.sender == crowdsaleContractAddress);

    supply = supply.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(0x0, _to, _amount);
  }

  function salvageTokensFromContract(address _tokenAddress, address _to, uint _amount) public onlyOwner{
    IERC20Token(_tokenAddress).transfer(_to, _amount);
  }
  
  // TODO: Remove this, this was addedd for testing purposes
  // only
  function kill() public onlyOwner {
    selfdestruct(owner);
  }
}
