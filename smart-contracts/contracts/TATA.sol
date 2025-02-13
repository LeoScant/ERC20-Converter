// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TATA is ERC20, AccessControl {
    mapping(address => bool) private _blacklist;
    uint8 private constant DECIMALS = 18;
    uint256 private constant INITIAL_SUPPLY = 100 * 10**18; // 100 tokens with 18 decimals
    uint256 private constant FEE_RATE = 5; // 0.5% = 5/1000
    address public feeCollector;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant FEE_COLLECTOR_ROLE = keccak256("FEE_COLLECTOR_ROLE");

    constructor() ERC20("Tata Token", "TATA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BLACKLISTER_ROLE, msg.sender);
        _grantRole(FEE_COLLECTOR_ROLE, msg.sender);
        feeCollector = msg.sender;
        
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function setFeeCollector(address newCollector) public onlyRole(FEE_COLLECTOR_ROLE) {
        require(newCollector != address(0), "TATA: fee collector cannot be zero address");
        feeCollector = newCollector;
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
        require(!_blacklist[from], "TATA: sender is blacklisted");
        require(!_blacklist[to], "TATA: recipient is blacklisted");

        // Skip fee calculation for minting and burning
        if (from != address(0) && to != address(0)) {
            uint256 fee = (amount * FEE_RATE) / 1000;
            uint256 remainingAmount = amount - fee;
            
            super._update(from, to, remainingAmount);
            super._update(from, feeCollector, fee);
        } else {
            super._update(from, to, amount);
        }
    }
} 