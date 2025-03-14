# Monad Token Distributor

## 项目概述
`MonadTestTokenDistributor` 是一个用于在 Monad 测试网分发测试代币的智能合约。

## 编译智能合约
要编译智能合约，请运行以下命令：

```sh
npx hardhat compile
```

## 部署
使用以下命令部署合约：

```sh
npx hardhat ignition deploy ./ignition/modules/MonadTokenDistribute.ts --network monadTestnet
```

## 合约验证
要在 Monad 测试网上验证已部署的合约，请运行：

```sh
npx hardhat verify --network monadTestnet <DEPLOYED_CONTRACT_ADDRESS>
```

请将 `<DEPLOYED_CONTRACT_ADDRESS>` 替换为实际部署的合约地址。

示例：

```sh
npx hardhat verify --network monadTestnet 0x23a0e51c9F11a6f61372Cf81353EC2a0DD9dbF47
```

## 注意事项
- 确保 `hardhat.config.ts` 文件已正确配置 Monad 测试网参数。
- 如果需要进行合约验证，可能需要配置 API Key。
- 在运行上述命令前，请确保已安装所有必要的依赖项。

## 许可证
本项目基于 MIT 许可证开源。

