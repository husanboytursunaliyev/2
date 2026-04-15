# Web3.js Localhost Smart Contract Demo

Bu loyiha Web3.js yordamida lokal Hardhat blockchain bilan ishlash uchun tayyorlangan oddiy demo.

Loyihada quyidagilar bor:

- Web3.js kutubxonasi bilan frontend
- Hardhat localhost node
- `SimpleStorage` smart-kontrakti
- ABI orqali kontrakt obyektini yaratish
- `view` funksiyani chaqirish
- `send` orqali tranzaksiya yuborish
- Error handling
- Gas limit va gas price sozlash
- MetaMask yoki Hardhat localhost account bilan ulanish

## Talablar

Kompyuterda quyidagilar o'rnatilgan bo'lishi kerak:

- Node.js
- npm
- Git
- MetaMask, agar MetaMask orqali ishlatilsa

## O'rnatish

Repository yuklab olingandan keyin dependencylarni o'rnating:

```bash
npm install
```

## Hardhat Node Ishga Tushirish

Birinchi terminalda lokal blockchainni ishga tushiring:

```bash
npm run node
```

Bu terminalni yopmang. Hardhat sizga 10000 ETH bor test accountlarni chiqaradi.

## Kontraktni Deploy Qilish

Ikkinchi terminalda kontraktni deploy qiling:

```bash
npm run deploy
```

Terminalda shunga o'xshash natija chiqadi:

```text
SimpleStorage deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Shu addressni saytdagi **Kontrakt adresi** inputiga kiriting.

Muhim: Hardhat account addressini kontrakt address o'rniga kiritmang. Account addresslar yonida odatda `10000 ETH` yoziladi. Kontrakt address esa `npm run deploy` natijasida chiqadi.

## Frontendni Ishga Tushirish

Uchinchi terminalda frontend serverni ishga tushiring:

```bash
npm run dev
```

Brauzerda oching:

```text
http://127.0.0.1:5173
```

## Ishlatish

Eng oson yo'l:

1. `npm run node` ishlayotgan bo'lsin.
2. `npm run deploy` orqali kontrakt address oling.
3. Frontendda contract addressni kiriting.
4. **Localhost account ulash** tugmasini bosing.
5. **View funksiyani chaqirish** orqali `getValue()` natijasini oling.
6. **Tranzaksiya yuborish** orqali `setValue(42)` tranzaksiyasini yuboring.
7. Yana **View funksiyani chaqirish** bosib qiymat o'zgarganini tekshiring.

## MetaMask Bilan Ishlatish

MetaMask network sozlamasi:

```text
Network name: Hardhat Localhost 31337
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency symbol: ETH
```

Hardhat terminalida chiqqan private keylardan birini MetaMaskga import qiling. Shunda accountda 10000 ETH bo'ladi.

## Asosiy Fayllar

- `contracts/SimpleStorage.sol` - smart-kontrakt
- `scripts/deploy.js` - deploy script
- `hardhat.config.js` - Hardhat konfiguratsiyasi
- `src/contractAbi.json` - kontrakt ABI fayli
- `src/app.js` - Web3.js logikasi
- `index.html` - frontend sahifa

## Foydali Buyruqlar

```bash
npm run node
npm run deploy
npm run dev
npm run build
```

## Eslatma

Hardhat node qayta ishga tushirilsa, kontraktlar ham qayta deploy qilinishi kerak. Shuning uchun `npm run node` ni qayta ishga tushirgandan keyin yana `npm run deploy` qiling va yangi contract addressni frontendga kiriting.
