# Testnet Wallet DApp

React/Vite asosidagi oddiy DApp. U Sepolia testnetga ulanadi, uch xil wallet orqali connect qiladi, smart-kontraktdan ma'lumot o'qiydi va forma orqali kontraktga ma'lumot yozadi.

## Smart-kontrakt interfeysi

Frontend Sepolia testnetdagi verified `SimpleStorage` kontrakti bilan ishlaydi.
Default kontrakt adresi:

```text
0x91e6c1e10058Ca2DfE80b0F6A796Bab7B094e76B
```

ABI:

```solidity
function get() view returns (uint256)
function set(uint256 _num)
```

Namuna kontrakt:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedNumber;

    function set(uint256 _num) public {
        storedNumber = _num;
    }

    function get() public view returns (uint256) {
        return storedNumber;
    }
}
```

## Ishga tushirish

1. `.env.example` faylini `.env` qilib nusxalang.
2. `VITE_CONTRACT_ADDRESS` qiymatiga Sepolia testnetdagi kontrakt adresini yozing. Default demo kontrakt allaqachon berilgan.
3. WalletConnect ishlatish uchun `VITE_WALLETCONNECT_PROJECT_ID` qiymatini kiriting.
4. Paketlarni o'rnating va lokal serverni ishga tushiring:

```bash
npm install
npm run dev
```

Vite odatda `http://127.0.0.1:5173` manzilida ochiladi.

## Deploy

### Vercel

```bash
npm run build
vercel
```

Vercel dashboardda environment variables sifatida `VITE_CONTRACT_ADDRESS`, `VITE_WALLETCONNECT_PROJECT_ID` va kerak bo'lsa `VITE_SEPOLIA_RPC_URL` ni qo'shing.

### GitHub Pages

Repo rootiga quyidagi command bilan deploy qilish mumkin:

```bash
npm run build
npm install --save-dev gh-pages
npx gh-pages -d dist
```

GitHub Pages uchun Vite base path kerak bo'lsa, `vite.config.js` ichidagi `base` qiymatini repo nomiga moslang.
