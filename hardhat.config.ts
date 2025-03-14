import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import { vars } from 'hardhat/config';

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
      accounts: [vars.get('PRIVATE_KEY')],
      chainId: 10143,
    },
  },
  etherscan: {
    enabled: false,
  },
  sourcify: {
    enabled: true,
    apiUrl: 'https://sourcify-api-monad.blockvision.org',
    browserUrl: 'https://testnet.monadexplorer.com',
  },
};

export default config;