// SPDX-License-Identifier: MIT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TataDeployment = buildModule("TataDeployment", (m) => {
  // Deploy the TATA token
  const tata = m.contract("TATA", []);

  return { tata };
});

export default TataDeployment; 