const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

const config = {
  minClaimAmount: 10,
  maxClaimAmount: 20,
  deadlineDuration: 24 * 60 * 60,
};

const privateKey = process.env.PRIVATE_KEY;
const RPC_URL = 'https://testnet-rpc.monad.xyz';
const contractAddress = '0x23a0e51c9F11a6f61372Cf81353EC2a0DD9dbF47';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const contractAbi = [
  'function getNonce(address claimant) external view returns (uint256)',
];
const contract = new ethers.Contract(contractAddress, contractAbi, provider);

function loadWalletsFromFile(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const wallets = fileContent
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => ethers.isAddress(line));
    return wallets;
  } catch (error) {
    console.error(`读取 ${filePath} 失败:`, error);
    return [];
  }
}

async function batchGenerateSignatures() {
  const claimants = loadWalletsFromFile('wallets.txt');
  if (claimants.length === 0) {
    console.error('没有有效的钱包地址可供处理');
    return [];
  }
  console.log('开始生成签名数据...', `共 ${claimants.length} 个地址`);

  const signatures = [];

  for (const claimant of claimants) {
    let nonce;
    try {
      nonce = await contract.getNonce(claimant);
      console.log(`${claimant} 获取 nonce 成功: ${nonce}`);
    } catch (error: any) {
      console.error(`${claimant} 获取 nonce 失败:`, error.message);
      continue;
    }

    const randomAmountEther = config.minClaimAmount + Math.random() * (config.maxClaimAmount - config.minClaimAmount);
    const amountWei = ethers.parseEther(randomAmountEther.toFixed(18));
    const deadline = Math.floor(Date.now() / 1000) + config.deadlineDuration;

    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'uint256', 'uint256', 'address'],
        [claimant, amountWei, nonce, deadline, contractAddress]
      )
    );
    const signatureBase = await wallet.signMessage(ethers.getBytes(messageHash));

    const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'uint256'],
      [amountWei, nonce, deadline]
    );
    const signature = ethers.concat([signatureBase, extraData]);

    signatures.push({
      address: claimant,
      signature,
    });
  }

  const outputFile = 'signatures.json';
  if (signatures.length > 0) {
    fs.writeFileSync(outputFile, JSON.stringify(signatures, null, 2));
  } else {
    console.warn('没有生成任何签名，未保存文件');
  }

  return signatures;
}

batchGenerateSignatures()
  .then((signatures) => {
    console.log(`所有地址签名生成完成，总数: ${signatures.length}`);
  })
  .catch((error) => {
    console.error('生成签名过程中发生全局错误:', error.message);
  });
