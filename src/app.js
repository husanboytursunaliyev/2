import Web3 from "web3";
import contractAbi from "./contractAbi.json";
import "./styles.css";

const LOCALHOST_CHAIN_ID = "0x7a69"; // 31337: Hardhat local node.
const LOCALHOST_RPC_URL = "http://127.0.0.1:8545";
const DEFAULT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

const elements = {
  connectLocalhostButton: document.querySelector("#connectLocalhostButton"),
  connectButton: document.querySelector("#connectButton"),
  readButton: document.querySelector("#readButton"),
  sendButton: document.querySelector("#sendButton"),
  networkBadge: document.querySelector("#networkBadge"),
  output: document.querySelector("#output"),
  contractAddressInput: document.querySelector("#contractAddressInput"),
  viewFunctionInput: document.querySelector("#viewFunctionInput"),
  sendFunctionInput: document.querySelector("#sendFunctionInput"),
  sendValueInput: document.querySelector("#sendValueInput"),
  gasLimitInput: document.querySelector("#gasLimitInput"),
  gasPriceInput: document.querySelector("#gasPriceInput")
};

let web3;
let selectedAccount;
let contract;
let connectionMode;

elements.contractAddressInput.value = DEFAULT_CONTRACT_ADDRESS;

function print(message, payload = null) {
  const time = new Date().toLocaleTimeString();
  const body =
    payload === null
      ? message
      : `${message}\n${JSON.stringify(
          payload,
          (_, value) => (typeof value === "bigint" ? value.toString() : value),
          2
        )}`;
  elements.output.textContent = `[${time}] ${body}`;
  console.log(message, payload ?? "");
}

function showError(error) {
  const message = getFriendlyErrorMessage(error);
  elements.output.textContent = `Xatolik: ${message}`;
  console.error(error);
}

function getFriendlyErrorMessage(error) {
  const message = error?.message || "Noma'lum xatolik yuz berdi.";

  if (message.includes("Bu addressda smart-kontrakt topilmadi")) {
    return message;
  }

  if (message.includes("Parameter decoding error") || message.includes("Returned values aren't valid")) {
    return "Bu address kontrakt addressiga o'xshamaydi yoki ABI mos emas. Deploydan chiqqan SimpleStorage contract addressni kiriting, Hardhat account addressni emas.";
  }

  if (message.includes("Failed to fetch") || message.includes("too many errors")) {
    return `Lokal RPC bilan aloqa bo'lmadi. Terminalda "npm run node" ishlab turganini tekshiring. RPC: ${LOCALHOST_RPC_URL}`;
  }

  if (message.includes("insufficient funds")) {
    return "Accountda ETH yetarli emas. Hardhat node terminalidagi private keylardan birini MetaMaskga import qiling.";
  }

  if (message.includes("User denied") || message.includes("User rejected")) {
    return "MetaMask oynasida tranzaksiya rad etildi.";
  }

  return message;
}

function ensureMetaMask() {
  if (!window.ethereum) {
    throw new Error("MetaMask topilmadi. Brauzerga MetaMask o'rnating va sahifani qayta oching.");
  }
}

function getContractAddress() {
  const address = elements.contractAddressInput.value.trim();

  if (!web3.utils.isAddress(address) || address === DEFAULT_CONTRACT_ADDRESS) {
    throw new Error("Haqiqiy smart-kontrakt adresini kiriting.");
  }

  return address;
}

function createContract() {
  const address = getContractAddress();
  contract = new web3.eth.Contract(contractAbi, address);
  return contract;
}

async function ensureContractDeployed(address) {
  const code = await web3.eth.getCode(address);

  if (!code || code === "0x") {
    throw new Error(
      `Bu addressda smart-kontrakt topilmadi: ${address}. Bu Hardhat account address bo'lishi mumkin. "npm run deploy" qilganda chiqqan contract addressni kiriting.`
    );
  }
}

function ensureWalletConnected() {
  if (!web3 || !selectedAccount) {
    throw new Error("Avval Localhost account yoki MetaMaskni ulang.");
  }
}

async function ensureLocalRpcReady() {
  const localChainId = await fetchJsonRpc("eth_chainId");

  if (localChainId.toLowerCase() !== LOCALHOST_CHAIN_ID) {
    throw new Error(
      `Hardhat RPC boshqa chain qaytaryapti: ${localChainId}. Kutilgan chain: ${LOCALHOST_CHAIN_ID}.`
    );
  }

  if (connectionMode === "localhost") {
    await web3.eth.getBlockNumber();
    return;
  }

  const chainId = await window.ethereum.request({ method: "eth_chainId" });

  if (chainId.toLowerCase() !== LOCALHOST_CHAIN_ID) {
    await switchToLocalhost();
  }

  try {
    await window.ethereum.request({ method: "eth_blockNumber" });
  } catch (error) {
    throw new Error(
      `Hardhat node ishlayapti, lekin MetaMask shu RPCga ulana olmadi. MetaMask networkni o'chirib qayta qo'shing: RPC ${LOCALHOST_RPC_URL}, Chain ID 31337. Asl xato: ${error.message}`
    );
  }
}

async function fetchJsonRpc(method, params = []) {
  let response;

  try {
    response = await fetch(LOCALHOST_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      })
    });
  } catch {
    throw new Error(
      `Hardhat node topilmadi. Terminalda "npm run node" ishga tushiring. RPC: ${LOCALHOST_RPC_URL}`
    );
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  return payload.result;
}

async function switchToLocalhost() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LOCALHOST_CHAIN_ID }]
    });
  } catch (error) {
    if (error.code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: LOCALHOST_CHAIN_ID,
          chainName: "Hardhat Localhost 31337",
          rpcUrls: [LOCALHOST_RPC_URL],
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
          }
        }
      ]
    });
  }
}

async function connectMetaMask() {
  try {
    ensureMetaMask();
    web3 = new Web3(window.ethereum);
    connectionMode = "metamask";

    await switchToLocalhost();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    selectedAccount = accounts[0];

    elements.readButton.disabled = false;
    elements.sendButton.disabled = false;
    elements.networkBadge.textContent = `${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`;
    elements.networkBadge.classList.add("is-connected");

    print("MetaMask ulandi. Endi kontrakt adresini kiritib view yoki send metodini chaqiring.", {
      account: selectedAccount
    });
  } catch (error) {
    showError(error);
  }
}

async function connectLocalhost() {
  try {
    web3 = new Web3(LOCALHOST_RPC_URL);
    connectionMode = "localhost";

    await ensureLocalRpcReady();
    const accounts = await web3.eth.getAccounts();

    if (!accounts.length) {
      throw new Error("Hardhat accountlari topilmadi. Terminalda \"npm run node\" ishlayotganini tekshiring.");
    }

    selectedAccount = accounts[0];
    const balanceWei = await web3.eth.getBalance(selectedAccount);
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");

    elements.readButton.disabled = false;
    elements.sendButton.disabled = false;
    elements.networkBadge.textContent = `${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`;
    elements.networkBadge.classList.add("is-connected");

    print("Localhost Hardhat account ulandi. Bu account node tomonidan unlocked va tranzaksiya yubora oladi.", {
      account: selectedAccount,
      balanceEth
    });
  } catch (error) {
    showError(error);
  }
}

async function callViewFunction() {
  try {
    ensureWalletConnected();
    await ensureLocalRpcReady();
    await ensureContractDeployed(getContractAddress());
    const activeContract = createContract();
    const functionName = elements.viewFunctionInput.value.trim();

    if (!functionName || typeof activeContract.methods[functionName] !== "function") {
      throw new Error(`ABI ichida "${functionName}" view funksiyasi topilmadi.`);
    }

    const result = await activeContract.methods[functionName]().call({ from: selectedAccount });
    print(`View funksiya natijasi: ${result}`, { functionName, result });
  } catch (error) {
    showError(error);
  }
}

async function sendTransaction() {
  try {
    ensureWalletConnected();
    await ensureLocalRpcReady();
    await ensureContractDeployed(getContractAddress());
    const activeContract = createContract();
    const functionName = elements.sendFunctionInput.value.trim();
    const value = elements.sendValueInput.value.trim();

    if (!functionName || typeof activeContract.methods[functionName] !== "function") {
      throw new Error(`ABI ichida "${functionName}" send funksiyasi topilmadi.`);
    }

    const gas = Number(elements.gasLimitInput.value);
    const gasPriceGwei = elements.gasPriceInput.value.trim();

    if (!Number.isFinite(gas) || gas < 21000) {
      throw new Error("Gas limit kamida 21000 bo'lishi kerak.");
    }

    if (!gasPriceGwei || Number(gasPriceGwei) <= 0) {
      throw new Error("Gas price musbat son bo'lishi kerak.");
    }

    const method = activeContract.methods[functionName](value);
    const estimatedGas = BigInt(await method.estimateGas({ from: selectedAccount }));
    const selectedGas = BigInt(gas);

    if (selectedGas < estimatedGas) {
      throw new Error(`Gas limit kam. Taxminiy kerakli gas: ${estimatedGas.toString()}.`);
    }

    const receipt = await method.send({
      from: selectedAccount,
      gas: selectedGas.toString(),
      gasPrice: web3.utils.toWei(gasPriceGwei, "gwei")
    });

    print("Tranzaksiya muvaffaqiyatli yuborildi.", {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed
    });
  } catch (error) {
    showError(error);
  }
}

window.ethereum?.on("accountsChanged", (accounts) => {
  if (connectionMode !== "metamask") {
    return;
  }

  selectedAccount = accounts[0];
  if (!selectedAccount) {
    elements.readButton.disabled = true;
    elements.sendButton.disabled = true;
    elements.networkBadge.textContent = "Ulanmagan";
    elements.networkBadge.classList.remove("is-connected");
    print("MetaMask account uzildi.");
    return;
  }

  elements.networkBadge.textContent = `${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`;
  print("MetaMask account o'zgardi.", { account: selectedAccount });
});

window.ethereum?.on("chainChanged", () => {
  window.location.reload();
});

elements.connectButton.addEventListener("click", connectMetaMask);
elements.connectLocalhostButton.addEventListener("click", connectLocalhost);
elements.readButton.addEventListener("click", callViewFunction);
elements.sendButton.addEventListener("click", sendTransaction);
