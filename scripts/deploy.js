import hre from "hardhat";

async function main() {
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();

  await simpleStorage.waitForDeployment();

  const address = await simpleStorage.getAddress();
  console.log(`SimpleStorage deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
