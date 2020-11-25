// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./lib/ERC20AcsConstructor.sol";

contract AcsERC20_Google is AcsERC20 {

    constructor() AcsERC20("Alphabet Inc.", "xGOOG", 333630000000, 6) {}
}
