const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Factory = await ethers.getContractFactory("InvoiceGuard");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const artifact = await artifacts.readArtifact("InvoiceGuard");

  const output = {
    address: address,
    abi: artifact.abi
  };

  const outputPath = path.join(
    __dirname,
    "..",
    "client",
    "src",
    "contract.json"
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("InvoiceGuard deployed to:", address);
  console.log("Contract ABI saved successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});