import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";

dotenv.config();


const config: HardhatUserConfig = {
  solidity: '0.8.17',
  defaultNetwork: 'rc',
  networks: {
    opal: {
      url: process.env.OPAL_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    uniqsu: {
      url: process.env.UNIQSU_OPAL_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rc: {
      url: process.env.RC_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  }
};

export default config;
