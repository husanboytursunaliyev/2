import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ethers } from 'ethers';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import EthereumProvider from '@walletconnect/ethereum-provider';
import './styles.css';

const SEPOLIA = {
  chainId: '0xaa36a7',
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  ],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

const DEFAULT_CONTRACT_ADDRESS = '0x91e6c1e10058Ca2DfE80b0F6A796Bab7B094e76B';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const STORAGE_ABI = [
  'function get() view returns (uint256)',
  'function set(uint256 _num)',
];

const walletOptions = [
  {
    id: 'metamask',
    label: 'MetaMask',
    hint: 'Browser extension',
    accent: '#f6851b',
  },
  {
    id: 'coinbase',
    label: 'Coinbase Wallet',
    hint: 'Extension yoki mobile',
    accent: '#0052ff',
  },
  {
    id: 'walletconnect',
    label: 'WalletConnect',
    hint: 'QR orqali ulanish',
    accent: '#3396ff',
  },
];

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeError(error) {
  return error?.shortMessage || error?.reason || error?.message || 'Noma\'lum xatolik yuz berdi';
}

async function switchToSepolia(provider) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA.chainId }],
    });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [SEPOLIA],
    });
  }
}

function App() {
  const [selectedWallet, setSelectedWallet] = useState('metamask');
  const [rawProvider, setRawProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [networkName, setNetworkName] = useState('Ulanmagan');
  const [contractValue, setContractValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: 'Wallet ulang va kontraktdan ma\'lumot o\'qing.' });
  const [txHash, setTxHash] = useState('');

  const contractAddress = CONTRACT_ADDRESS.trim();

  const browserProvider = useMemo(() => {
    if (!rawProvider) return null;
    return new ethers.BrowserProvider(rawProvider);
  }, [rawProvider]);

  const statusLabel = {
    idle: 'Tayyor',
    pending: 'Pending',
    success: 'Success',
    error: 'Error',
  }[status.type];

  const getContract = useCallback(async (withSigner = false) => {
    if (!browserProvider) {
      throw new Error('Avval wallet ulang.');
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error('Kontrakt adresi noto\'g\'ri. .env ichidagi VITE_CONTRACT_ADDRESS ni tekshiring.');
    }

    const runner = withSigner ? await browserProvider.getSigner() : browserProvider;
    return new ethers.Contract(contractAddress, STORAGE_ABI, runner);
  }, [browserProvider, contractAddress]);

  const readContractValue = useCallback(async () => {
    try {
      setStatus({ type: 'pending', message: 'Kontraktdan ma\'lumot o\'qilyapti...' });
      const contract = await getContract(false);
      const value = await contract.get();
      setContractValue(value.toString());
      setStatus({ type: 'success', message: 'Kontrakt qiymati muvaffaqiyatli o\'qildi.' });
    } catch (error) {
      setStatus({ type: 'error', message: normalizeError(error) });
    }
  }, [getContract]);

  const connectWallet = async () => {
    try {
      setStatus({ type: 'pending', message: `${walletOptions.find((item) => item.id === selectedWallet)?.label} ulanmoqda...` });

      let provider;
      if (selectedWallet === 'metamask') {
        if (!window.ethereum) {
          throw new Error('MetaMask topilmadi. Browser extensionni o\'rnating.');
        }
        provider = window.ethereum;
      }

      if (selectedWallet === 'coinbase') {
        const coinbase = new CoinbaseWalletSDK({
          appName: 'Testnet DApp',
          appChainIds: [Number.parseInt(SEPOLIA.chainId, 16)],
        });
        provider = coinbase.makeWeb3Provider(SEPOLIA.rpcUrls[0], Number.parseInt(SEPOLIA.chainId, 16));
      }

      if (selectedWallet === 'walletconnect') {
        if (!WALLETCONNECT_PROJECT_ID) {
          throw new Error('WalletConnect uchun VITE_WALLETCONNECT_PROJECT_ID kerak.');
        }
        provider = await EthereumProvider.init({
          projectId: WALLETCONNECT_PROJECT_ID,
          chains: [Number.parseInt(SEPOLIA.chainId, 16)],
          showQrModal: true,
          rpcMap: {
            [Number.parseInt(SEPOLIA.chainId, 16)]: SEPOLIA.rpcUrls[0],
          },
        });
      }

      await switchToSepolia(provider);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const ethersProvider = new ethers.BrowserProvider(provider);
      const network = await ethersProvider.getNetwork();

      setRawProvider(provider);
      setAccount(accounts[0]);
      setNetworkName(network.name === 'unknown' ? 'Sepolia' : network.name);
      setStatus({ type: 'success', message: 'Wallet Sepolia testnetga ulandi.' });
    } catch (error) {
      setStatus({ type: 'error', message: normalizeError(error) });
    }
  };

  const submitValue = async (event) => {
    event.preventDefault();
    const parsedValue = Number(newValue);
    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      setStatus({ type: 'error', message: 'Yuborish uchun 0 yoki undan katta butun son kiriting.' });
      return;
    }

    try {
      setTxHash('');
      setStatus({ type: 'pending', message: 'Tranzaksiya walletda tasdiqlanishi kutilmoqda...' });
      const contract = await getContract(true);
      const tx = await contract.set(parsedValue);
      setTxHash(tx.hash);
      setStatus({ type: 'pending', message: 'Tranzaksiya blockchain tasdig\'ini kutyapti...' });

      await tx.wait();
      setStatus({ type: 'success', message: 'Kontrakt funksiyasi muvaffaqiyatli bajarildi.' });
      setNewValue('');
      await readContractValue();
    } catch (error) {
      setStatus({ type: 'error', message: normalizeError(error) });
    }
  };

  useEffect(() => {
    if (!rawProvider?.on) return undefined;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || '');
      if (!accounts[0]) {
        setStatus({ type: 'idle', message: 'Wallet uzildi.' });
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    rawProvider.on('accountsChanged', handleAccountsChanged);
    rawProvider.on('chainChanged', handleChainChanged);

    return () => {
      rawProvider.removeListener?.('accountsChanged', handleAccountsChanged);
      rawProvider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [rawProvider]);

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Sepolia Testnet DApp</span>
          <h1>Wallet ulang, kontraktni o'qing va tranzaksiya yuboring.</h1>
          <p>
            MetaMask, Coinbase Wallet yoki WalletConnect orqali Sepolia testnetga ulaning.
            UI pending, success va error holatlarini real vaqtga yaqin ko'rsatadi.
          </p>
        </div>
        <div className="network-orbit" aria-hidden="true">
          <div className="chain-node primary">ETH</div>
          <div className="chain-node">RPC</div>
          <div className="chain-node">ABI</div>
        </div>
      </section>

      <section className="workspace">
        <div className="panel wallet-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Wallet</span>
              <h2>Connect Wallet</h2>
            </div>
            <span className={`status-pill ${status.type}`}>{statusLabel}</span>
          </div>

          <div className="wallet-grid" role="radiogroup" aria-label="Wallet tanlash">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                className={`wallet-option ${selectedWallet === wallet.id ? 'active' : ''}`}
                style={{ '--wallet-accent': wallet.accent }}
                type="button"
                onClick={() => setSelectedWallet(wallet.id)}
                aria-pressed={selectedWallet === wallet.id}
              >
                <span className="wallet-mark">{wallet.label.slice(0, 2)}</span>
                <span>
                  <strong>{wallet.label}</strong>
                  <small>{wallet.hint}</small>
                </span>
              </button>
            ))}
          </div>

          <button className="connect-button" type="button" onClick={connectWallet}>
            Connect Wallet
          </button>

          <dl className="account-list">
            <div>
              <dt>Account</dt>
              <dd>{account ? shortAddress(account) : 'Ulanmagan'}</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>{networkName}</dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd>{ethers.isAddress(contractAddress) ? shortAddress(contractAddress) : 'Adres kerak'}</dd>
            </div>
          </dl>
        </div>

        <div className="panel contract-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Smart Contract</span>
              <h2>Read & Write</h2>
            </div>
            <button className="ghost-button" type="button" onClick={readContractValue} disabled={!account}>
              O'qish
            </button>
          </div>

          <div className="value-box">
            <span>Kontraktdagi qiymat</span>
            <strong>{contractValue || 'Hali o\'qilmadi'}</strong>
          </div>

          <form className="write-form" onSubmit={submitValue}>
            <label htmlFor="newValue">Yangi qiymat</label>
            <div className="input-row">
              <input
                id="newValue"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder="Masalan: 80"
                disabled={!account}
              />
              <button type="submit" disabled={!account || status.type === 'pending'}>
                Yuborish
              </button>
            </div>
          </form>

          <div className={`tx-status ${status.type}`} aria-live="polite">
            <strong>{statusLabel}</strong>
            <span>{status.message}</span>
            {txHash && (
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                Etherscan
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
