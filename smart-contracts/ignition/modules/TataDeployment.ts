// SPDX-License-Identifier: MIT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TataDeployment = buildModule("TataDeployment", (m) => {
  // Deploy the TATA token
  const tata = m.contract("TATA", []);
  const eurt = m.contract("EURT", []);

  return { tata, eurt };
});

export default TataDeployment; 