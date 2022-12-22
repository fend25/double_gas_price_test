// SPDX-License-Identifier: OTHER
pragma solidity ^0.8.0;

contract Test {
  event NumberSetEvent(uint indexed num);

  uint number;

  function getNumber() public view returns (uint) {
    return number;
  }

  function setNumber(uint _number) public {
    number = _number;
    emit NumberSetEvent(number);
  }
}
