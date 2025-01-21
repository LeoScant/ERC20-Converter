import { expect } from "chai";
import { ethers } from "hardhat";
import { EURT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EURT Token", function () {
  let eurt: EURT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let MINTER_ROLE: string;
  let BURNER_ROLE: string;
  let BLACKLISTER_ROLE: string;
  const initialSupply = ethers.parseUnits("1000000", 6); // 1M tokens with 6 decimals

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const EURT = await ethers.getContractFactory("EURT");
    eurt = await EURT.deploy();
    MINTER_ROLE = await eurt.MINTER_ROLE();
    BURNER_ROLE = await eurt.BURNER_ROLE();
    BLACKLISTER_ROLE = await eurt.BLACKLISTER_ROLE();
  });

  describe("Basic Token Functionality", function () {
    it("Should have correct initial supply", async function () {
      expect(await eurt.totalSupply()).to.equal(initialSupply);
    });

    it("Should have correct decimals", async function () {
      expect(await eurt.decimals()).to.equal(6);
    });

    it("Should have correct name and symbol", async function () {
      expect(await eurt.name()).to.equal("Euro Token");
      expect(await eurt.symbol()).to.equal("EURT");
    });
  });

  describe("Mint and Burn", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 6);
      await eurt.mint(user1.address, mintAmount);
      expect(await eurt.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 6);
      await expect(eurt.connect(user1).mint(user1.address, mintAmount))
        .to.be.revertedWithCustomError(eurt, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, MINTER_ROLE);
    });

    it("Should allow burner to burn their tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 6);
      const burnAmount = ethers.parseUnits("500", 6);
      await eurt.mint(user1.address, mintAmount);
      await eurt.grantRole(BURNER_ROLE, user1.address);
      await eurt.connect(user1).burn(burnAmount);
      expect(await eurt.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should not allow non-burner to burn tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 6);
      const burnAmount = ethers.parseUnits("500", 6);
      await eurt.mint(user1.address, mintAmount);
      await expect(eurt.connect(user1).burn(burnAmount))
        .to.be.revertedWithCustomError(eurt, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, BURNER_ROLE);
    });
  });

  describe("Blacklist", function () {
    it("Should allow blacklister to blacklist an address", async function () {
      await eurt.addToBlacklist(user1.address);
      expect(await eurt.isBlacklisted(user1.address)).to.be.true;
    });

    it("Should not allow non-blacklister to blacklist an address", async function () {
      await expect(eurt.connect(user1).addToBlacklist(user2.address))
        .to.be.revertedWithCustomError(eurt, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, BLACKLISTER_ROLE);
    });

    it("Should prevent blacklisted address from sending tokens", async function () {
      const amount = ethers.parseUnits("100", 6);
      await eurt.transfer(user1.address, amount);
      await eurt.addToBlacklist(user1.address);
      await expect(eurt.connect(user1).transfer(user2.address, amount))
        .to.be.revertedWith("EURT: sender is blacklisted");
    });

    it("Should prevent sending tokens to blacklisted address", async function () {
      const amount = ethers.parseUnits("100", 6);
      await eurt.addToBlacklist(user2.address);
      await expect(eurt.transfer(user2.address, amount))
        .to.be.revertedWith("EURT: recipient is blacklisted");
    });

    it("Should allow blacklister to remove address from blacklist", async function () {
      await eurt.addToBlacklist(user1.address);
      await eurt.removeFromBlacklist(user1.address);
      expect(await eurt.isBlacklisted(user1.address)).to.be.false;
    });

    it("Should not allow non-blacklister to remove address from blacklist", async function () {
      await eurt.addToBlacklist(user1.address);
      await expect(eurt.connect(user1).removeFromBlacklist(user1.address))
        .to.be.revertedWithCustomError(eurt, "AccessControlUnauthorizedAccount")
        .withArgs(user1.address, BLACKLISTER_ROLE);
    });
  });
}); 