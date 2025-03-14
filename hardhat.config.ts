import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY || '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      metadata: {
        bytecodeHash: 'none', // disable ipfs
        useLiteralContent: true, // store source code in the json file directly
      },
    },
  },
  networks: {
    monadTestnet: {
      url: 'https://testnet-rpc.monad.xyz',
      accounts: [privateKey],
      chainId: 10143,
    },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    enabled: false,
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
};

export default config;