// smart-contracts/contracts/Swap.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EURT.sol";
import "./TASK.sol";

contract Swap is Ownable {
    EURT public eurt;
    TASK public task;
    uint256 public conversionRate;
    uint256 private constant DECIMAL_DIFFERENCE = 12; // TASK decimals (18) - EURT decimals (6)

    event SwapExecuted(address indexed user, uint256 eurtAmount, uint256 taskAmount);

    constructor(address _eurt, address _task, uint256 _conversionRate) Ownable(msg.sender) {
        eurt = EURT(_eurt);
        task = TASK(_task);
        conversionRate = _conversionRate;
    }

    function swapEURTtoTASK(uint256 _eurtAmount) external {
        require(_eurtAmount > 0, "Amount must be greater than 0");

        bool transferred = eurt.transferFrom(msg.sender, address(this), _eurtAmount);
        require(transferred, "EURT transfer failed");

        eurt.burn(_eurtAmount);

        uint256 taskAmount = (_eurtAmount * 10**DECIMAL_DIFFERENCE) / conversionRate;

        task.mint(msg.sender, taskAmount);

        emit SwapExecuted(msg.sender, _eurtAmount, taskAmount);
    }

    function setConversionRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than 0");
        conversionRate = _newRate;
    }
}