// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleStorage {
    uint256 private value;

    function getValue() public view returns (uint256) {
        return value;
    }

    function setValue(uint256 _value) public {
        value = _value;
    }
}
