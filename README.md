# InvoiceGuard

InvoiceGuard is an educational FinTech + Blockchain prototype for invoice financing and duplicate-ID prevention.

## Features
- Register invoice IDs on an Ethereum-compatible smart contract.
- Reject duplicate invoice IDs in the same contract registry.
- Let a separate investor wallet fund a registered invoice.
- Simulate repayment through the contract owner.
- Flag eligible registered invoices.
- React dashboard with MetaMask and contract reads/writes.
- Hardhat tests for core flows.

## Requirements
- Node.js LTS
- VS Code
- MetaMask browser extension (for the frontend demo)

## Setup
Run these commands from the project root:

```powershell
npm install
npm --prefix client install
npx hardhat compile
npx hardhat test
```

## Run local blockchain
Terminal 1:
```powershell
npx hardhat node
```

Terminal 2:
```powershell
npx hardhat run scripts/deploy.js --network localhost
```

The deployment script writes the contract address and ABI to `client/src/contract.json`.

In MetaMask, add a network:
- Network name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import a test account using a private key printed by `npx hardhat node`. Use test accounts only. Never use a real wallet's private key.

Terminal 3:
```powershell
npm run client
```
Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Demo flow
1. Connect the supplier wallet and register an invoice with a future due date.
2. Switch to another local test account in MetaMask.
3. Fund the invoice with an advance below the invoice face value.
4. Switch back to the deployer/owner account and submit the full invoice value as simulated repayment.
5. Refresh the invoice register to view the status.

## Limitations
- This is a student prototype, not production financial software.
- Values are test ETH, not INR or stablecoins.
- The contract owner simulates an authorized buyer/payment verifier.
- Duplicate detection is only within this contract and does not prove an invoice is genuine across other systems.
- Invoice IDs for the dashboard are stored in browser local storage; the invoice details are fetched from the contract.
- A production version needs external invoice verification, document privacy, robust indexing, legal review and an independent smart-contract security audit.
