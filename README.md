# Monad Token Distributor

## 项目概述
`MonadTestTokenDistributor` 是一个用于在 Monad 测试网分发测试代币的智能合约。

## 创建.env 文件
在项目根目录下创建 `.env` 文件，并添加以下内容：

```sh
PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

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

## 添加白名单
批量添加白名单，请运行以下命令：

```sh
pnpm start
```

## 注意事项  
- 确保 `hardhat.config.ts` 文件已正确配置 Monad 测试网参数。  
- 运行 `pnpm start` 前，请替换为你的合约地址，并设置领取范围。  
- 将白名单地址添加到 `whitelist.txt` 文件，每行一个地址。如需为特定地址设置领取金额，请在地址后加 `-`，然后填写金额。  
- 运行前，请确保已安装所有必要依赖。