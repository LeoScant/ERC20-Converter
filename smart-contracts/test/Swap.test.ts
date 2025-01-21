import { expect } from "chai";
import { ethers } from "hardhat";
import { Swap, EURT, TASK } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Swap", function () {
  let swap: Swap;
  let eurt: EURT;
  let task: TASK;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const initialConversionRate = 2; // 2 EURT = 1 TASK

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy EURT
    const EURT = await ethers.getContractFactory("EURT");
    eurt = await EURT.deploy();

    // Deploy TASK
    const TASK = await ethers.getContractFactory("TASK");
    task = await TASK.deploy();

    // Deploy Swap
    const Swap = await ethers.getContractFactory("Swap");
    swap = await Swap.deploy(
      await eurt.getAddress(),
      await task.getAddress(),
      initialConversionRate
    );

    // Setup roles
    const MINTER_ROLE = await task.MINTER_ROLE();
    const BURNER_ROLE = await eurt.BURNER_ROLE();
    await task.grantRole(MINTER_ROLE, await swap.getAddress());
    await eurt.grantRole(BURNER_ROLE, await swap.getAddress());

    // Transfer some EURT to user1 for testing
    const testAmount = ethers.parseUnits("1000", 6);
    await eurt.transfer(user1.address, testAmount);
  });

  describe("Initialization", function () {
    it("Should initialize with correct token addresses", async function () {
      expect(await swap.eurt()).to.equal(await eurt.getAddress());
      expect(await swap.task()).to.equal(await task.getAddress());
    });

    it("Should initialize with correct conversion rate", async function () {
      expect(await swap.conversionRate()).to.equal(initialConversionRate);
    });

    it("Should set correct owner", async function () {
      expect(await swap.owner()).to.equal(owner.address);
    });
  });

  describe("Swap Functionality", function () {
    const swapAmount = ethers.parseUnits("100", 6); // 100 EURT

    beforeEach(async function () {
      // Approve swap contract to spend user's EURT
      await eurt.connect(user1).approve(await swap.getAddress(), swapAmount);
    });

    it("Should successfully swap EURT for TASK", async function () {
      const expectedTaskAmount = (swapAmount * BigInt(10**12)) / BigInt(initialConversionRate);
      
      await expect(swap.connect(user1).swapEURTtoTASK(swapAmount))
        .to.emit(swap, "SwapExecuted")
        .withArgs(user1.address, swapAmount, expectedTaskAmount);

      // Check balances after swap
      expect(await eurt.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("900", 6) // 1000 - 100
      );
      expect(await task.balanceOf(user1.address)).to.equal(expectedTaskAmount);
    });

    it("Should fail if EURT amount is zero", async function () {
      await expect(swap.connect(user1).swapEURTtoTASK(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail if user has insufficient EURT balance", async function () {
      const largeAmount = ethers.parseUnits("2000", 6); // More than user has
      await eurt.connect(user1).approve(await swap.getAddress(), largeAmount);
      
      await expect(swap.connect(user1).swapEURTtoTASK(largeAmount))
        .to.be.reverted;
    });

    it("Should fail if user hasn't approved EURT transfer", async function () {
      // Reset approval to 0
      await eurt.connect(user1).approve(await swap.getAddress(), 0);
      
      await expect(swap.connect(user1).swapEURTtoTASK(swapAmount))
        .to.be.revertedWithCustomError(eurt, "ERC20InsufficientAllowance");
    });
  });

  describe("Conversion Rate Management", function () {
    it("Should allow owner to set new conversion rate", async function () {
      const newRate = 3;
      await swap.setConversionRate(newRate);
      expect(await swap.conversionRate()).to.equal(newRate);
    });

    it("Should not allow non-owner to set conversion rate", async function () {
      const newRate = 3;
      await expect(swap.connect(user1).setConversionRate(newRate))
        .to.be.revertedWithCustomError(swap, "OwnableUnauthorizedAccount");
    });

    it("Should not allow setting conversion rate to zero", async function () {
      await expect(swap.setConversionRate(0))
        .to.be.revertedWith("Rate must be greater than 0");
    });

    it("Should correctly calculate TASK amount with new rate", async function () {
      const newRate = 4; // 4 EURT = 1 TASK
      await swap.setConversionRate(newRate);
      
      const swapAmount = ethers.parseUnits("100", 6);
      const expectedTaskAmount = (swapAmount * BigInt(10**12)) / BigInt(newRate);
      
      await eurt.connect(user1).approve(await swap.getAddress(), swapAmount);
      
      await expect(swap.connect(user1).swapEURTtoTASK(swapAmount))
        .to.emit(swap, "SwapExecuted")
        .withArgs(user1.address, swapAmount, expectedTaskAmount);
      
      expect(await task.balanceOf(user1.address)).to.equal(expectedTaskAmount);
    });
  });
}); 