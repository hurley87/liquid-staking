import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StPeaqModule = buildModule("StPeaqModule", (m) => {
  const stakingContract = '0x0000000000000000000000000000000000000000';

  const stPeaqToken = m.contract("stPEAQ", [stakingContract]);

  return { stPeaqToken };
});

export default StPeaqModule;
