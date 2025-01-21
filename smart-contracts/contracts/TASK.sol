// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TASK is ERC20, AccessControl {
    mapping(address => bool) private _blacklist;
    uint8 private constant DECIMALS = 18;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    constructor() ERC20("Task Token", "TASK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BLACKLISTER_ROLE, msg.sender);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function addToBlacklist(address account) public onlyRole(BLACKLISTER_ROLE) {
        _blacklist[account] = true;
    }

    function removeFromBlacklist(address account) public onlyRole(BLACKLISTER_ROLE) {
        _blacklist[account] = false;
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!_blacklist[from], "TASK: sender is blacklisted");
        require(!_blacklist[to], "TASK: recipient is blacklisted");
        super._update(from, to, amount);
    }
} 