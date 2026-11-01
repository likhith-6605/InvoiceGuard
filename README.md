# InvoiceGuard
### Blockchain-Powered Invoice Financing and Fraud Prevention

InvoiceGuard is a blockchain-based invoice financing prototype designed to help small and medium-sized businesses (SMEs) access faster financing while improving transparency and reducing invoice-related fraud risks.

The platform allows suppliers to register invoices on a blockchain, investors to finance registered invoices at a discount, and authorized users to simulate buyer repayment and settlement. Blockchain transactions provide a transparent and tamper-resistant record of invoice activities.

## 1. Project Overview

Traditional invoice financing can involve delays, paperwork, limited transparency, and risks such as duplicate invoice financing.

InvoiceGuard demonstrates how blockchain technology and smart contracts can help address these challenges.

The system uses a Solidity smart contract deployed on a local Ethereum-compatible blockchain. A React-based dashboard allows users to interact with the contract through MetaMask.

## 2. Key Features

- **Invoice Registration:** Suppliers can register invoices on the blockchain.
- **Invoice Financing:** Investors can finance registered invoices at a discounted advance amount.
- **Repayment and Settlement:** Authorized users can simulate buyer repayment and settle funded invoices.
- **Duplicate Invoice Prevention:** The smart contract prevents an already registered invoice ID from being registered again.
- **Suspicious Invoice Flagging:** Users with the required permissions can flag suspicious invoices.
- **Transaction Transparency:** Invoice activities are recorded through blockchain transactions.
- **Dashboard:** Displays invoice information and status, including Registered, Funded, and Settled.
- **MetaMask Integration:** Connects the frontend to the local blockchain using a wallet.

## 3. Technology Stack

| Technology | Purpose |
|---|---|
| Solidity | Smart contract development |
| Hardhat | Local blockchain development and deployment |
| Ethereum-compatible local network | Executes smart contract transactions |
| React.js | Frontend user interface |
| Vite | Frontend development server |
| Ethers.js | Connects React frontend to the blockchain |
| MetaMask | Wallet connection and transaction approval |
| JavaScript | Application logic |
| CSS | Dashboard styling |
| Git and GitHub | Version control and project hosting |

## 4. Project Structure

```text
InvoiceGuard/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── style.css
│   │   └── contract.json
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── contracts/
│   └── InvoiceGuard.sol
│
├── scripts/
│   └── deploy.js
│
├── test/
│   └── InvoiceGuard.js
│
├── hardhat.config.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## 5. Prerequisites

Install the following before running the project:

- Node.js and npm
- Visual Studio Code
- MetaMask browser extension
- Git

Check Node.js and npm installation:

```bash
node -v
npm -v
```

## 6. Installation and Execution

### Step 1: Clone the repository

```bash
git clone https://github.com/likhith-6605/InvoiceGuard.git
cd InvoiceGuard
```

### Step 2: Install blockchain dependencies

Run this command in the root InvoiceGuard folder:

```bash
npm install
```

### Step 3: Compile the smart contract

```bash
npx hardhat compile
```

### Step 4: Start the local blockchain

Open a terminal in the root InvoiceGuard folder and run:

```bash
npx hardhat node
```

Keep this terminal running.

The local blockchain will be available at:

```text
http://127.0.0.1:8545
```

The local Hardhat network uses Chain ID:

```text
31337
```

### Step 5: Deploy the smart contract

Open a second terminal in the root InvoiceGuard folder and run:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deployment script deploys the InvoiceGuard smart contract and writes its contract address and ABI to:

```text
client/src/contract.json
```

### Step 6: Install frontend dependencies

Open another terminal and navigate to the client folder:

```bash
cd client
npm install
```

### Step 7: Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, normally:

```text
http://localhost:5173
```

## 7. MetaMask Configuration

To connect MetaMask to the local blockchain, add a custom network with these details:

| Setting | Value |
|---|---|
| Network Name | Hardhat Local |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency Symbol | ETH |

Import a development account using one of the private keys displayed by the running Hardhat node.

**Important:** Hardhat accounts and their private keys are for local development only. Never use these development keys with real funds or on a public network.

## 8. Application Workflow

1. The supplier connects their MetaMask wallet.
2. The supplier registers an invoice by entering its invoice ID, face value, and due date.
3. The smart contract records the invoice on the local blockchain.
4. An investor connects using a different wallet account.
5. The investor finances an eligible invoice by providing the advance amount.
6. The invoice status changes to Funded.
7. An authorized user simulates buyer repayment and settlement.
8. The invoice status changes to Settled.
9. Users can also test duplicate invoice rejection and suspicious invoice flagging.

## 9. Testing

The prototype can be tested using the following scenarios:

| Test Scenario | Expected Result |
|---|---|
| Register a new invoice | Invoice is registered successfully |
| Register the same invoice ID again | Duplicate registration is rejected |
| Finance an eligible invoice | Invoice status