// SPDX-License-Identifier: MIT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenDeployment = buildModule("TokenDeployment", (m) => {
  const eurt = m.contract("EURT", []);
  const task = m.contract("TASK", []);

  return { eurt, task };
});

export default TokenDeployment; 