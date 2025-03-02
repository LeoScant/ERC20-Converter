import { expect } from "chai";
import { ethers } from "hardhat";
import { TASK } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TASK Token", function () {
  let task: TASK;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let MINTER_ROLE: string;
  let BLACKLISTER_ROLE: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const TASK = await ethers.getContractFactory("TASK");
    task = await TASK.deploy();
    MINTER_ROLE = await task.MINTER_ROLE();
    BLACKLISTER_ROLE = await task.BLACKLISTER_ROLE();
  });

  describe("Basic Token Functionality", function () {
    it("Should have zero initial supply", async function () {
      expect(await task.totalSupply()).to.equal(0);
    });

    it("Should have correct decimals", async function () {
      expect(await task.decimals()).to.equal(18);
    });

    it("Should have correct name and symbol", async function () {
      expect(await task.name()).to.equal("Task Token");
      expect(await task.symbol()).to.equal("TASK");
    });
  });

  describe("Mint and Burn", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await task.mint(user1.address, mintAmount);
      expect(await task.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(task.connect(user1).mint(user1.address, mintAmount))
        .to.be.revertedWithCustomError(task, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, MINTER_ROLE);
    });

    it("Should allow anyone to burn their tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const burnAmount = ethers.parseEther("500");
      await task.mint(user1.address, mintAmount);
      await task.connect(user1).burn(burnAmount);
      expect(await task.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });
  });

  describe("Blacklist", function () {
    it("Should allow blacklister to blacklist an address", async function () {
      await task.addToBlacklist(user1.address);
      expect(await task.isBlacklisted(user1.address)).to.be.true;
    });

    it("Should not allow non-blacklister to blacklist an address", async function () {
      await expect(task.connect(user1).addToBlacklist(user2.address))
        .to.be.revertedWithCustomError(task, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, BLACKLISTER_ROLE);
    });

    it("Should prevent blacklisted address from sending tokens", async function () {
      const amount = ethers.parseEther("100");
      await task.mint(user1.address, amount);
      await task.addToBlacklist(user1.address);
      await expect(task.connect(user1).transfer(user2.address, amount))
        .to.be.revertedWith("TASK: sender is blacklisted");
    });

    it("Should prevent sending tokens to blacklisted address", async function () {
      const amount = ethers.parseEther("100");
      await task.mint(owner.address, amount);
      await task.addToBlacklist(user2.address);
      await expect(task.transfer(user2.address, amount))
        .to.be.revertedWith("TASK: recipient is blacklisted");
    });

    it("Should allow blacklister to remove address from blacklist", async function () {
      await task.addToBlacklist(user1.address);
      await task.removeFromBlacklist(user1.address);
      expect(await task.isBlacklisted(user1.address)).to.be.false;
    });

    it("Should not allow non-blacklister to remove address from blacklist", async function () {
      await task.addToBlacklist(user1.address);
      await expect(task.connect(user1).removeFromBlacklist(user1.address))
        .to.be.revertedWithCustomError(task, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, BLACKLISTER_ROLE);
    });
  });
}); 