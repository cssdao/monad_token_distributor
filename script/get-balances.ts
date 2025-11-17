import { ethers } from "ethers";
import fs from "fs";
require("dotenv").config();

const rpcUrl = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(rpcUrl);

function loadAddressesFromFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean);

  const addresses: string[] = [];

  lines.forEach((line: string) => {
    // 处理可能包含金额的格式 (address-amount)
    const [address] = line.split("-");
    if (ethers.isAddress(address)) {
      addresses.push(address);
    } else {
      console.warn(`无效地址: ${address}，跳过此行`);
    }
  });

  if (!addresses.length) throw new Error("whitelist.txt 中没有有效地址");
  return addresses;
}

async function getMonBalances() {
  console.log("正在读取 whitelist.txt 中的地址...");

  const addresses = loadAddressesFromFile("whitelist.txt");
  console.log(`找到 ${addresses.length} 个有效地址\n`);

  console.log("开始查询 MON 余额...\n");
  console.log("=".repeat(80));
  console.log("地址".padEnd(45) + "余额 (MON)".padEnd(20) + "状态");
  console.log("-".repeat(80));

  let totalBalance = ethers.parseEther("0");
  const balanceResults: string[] = [];

  for (const address of addresses) {
    try {
      const balance = await provider.getBalance(address);
      const balanceInMon = ethers.formatEther(balance);
      totalBalance += balance;

      const status = balance > 0n ? "有余额" : "无余额";
      console.log(
        address.padEnd(45) +
          balanceInMon.padStart(15) +
          " MON".padEnd(10) +
          status,
      );

      // 将结果添加到数组中，格式：地址-金额
      balanceResults.push(`${address}-${balanceInMon}`);
    } catch (error) {
      console.error(address.padEnd(45) + "查询失败".padStart(20) + "错误");
    }
  }

  console.log("-".repeat(80));
  console.log(
    "总余额:".padEnd(45) +
      ethers.formatEther(totalBalance).padStart(15) +
      " MON",
  );
  console.log("=".repeat(80));

  // 生成地址-金额文件
  const outputFileName = "address-balances.txt";
  fs.writeFileSync(outputFileName, balanceResults.join("\n"), "utf8");
  console.log(`\n已将地址和余额信息写入文件: ${outputFileName}`);
}

getMonBalances()
  .then(() => console.log("\n余额查询完成"))
  .catch((error) => {
    console.error("错误:", error);
    process.exit(1);
  });
