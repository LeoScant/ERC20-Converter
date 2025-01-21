// SPDX-License-Identifier: MIT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_CONVERSION_RATE = 2n; // 2 EURT = 1 TASK

const TokenDeployment = buildModule("TokenDeployment", (m) => {
  // First deploy the tokens
  const eurt = m.contract("EURT", []);
  const task = m.contract("TASK", []);

  // Then deploy Swap with the token addresses and conversion rate
  const swap = m.contract("Swap", [eurt, task, INITIAL_CONVERSION_RATE]);

  // Grant roles
  m.call(task, "grantRole", [
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", // MINTER_ROLE
    swap
  ]);

  m.call(eurt, "grantRole", [
    "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848", // BURNER_ROLE
    swap
  ]);

  return { eurt, task, swap };
});

export default TokenDeployment; 