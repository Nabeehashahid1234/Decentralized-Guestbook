# 🌿 EcoLedger — Decentralized On-Chain Guestbook dApp

> **An immutable, censorship-resistant Ethereum Decentralized Application (dApp) enabling users to permanently record, verify, and audit timestamped public notes on a local blockchain.**

---

## 📑 Table of Contents

1. [Introduction & Problem Statement](#-1-introduction--problem-statement)
2. [Core Objectives & Key Features](#-2-core-objectives--key-features)
3. [System Architecture & Data Flow](#-3-system-architecture--data-flow)
4. [Technology Stack](#-4-technology-stack)
5. [Smart Contract Deep Dive](#-5-smart-contract-deep-dive)
   - [Data Structures](#data-structures)
   - [Contract Functions & Gas Behavior](#contract-functions--gas-behavior)
   - [Security & Validation Rules](#security--validation-rules)
6. [Deployment & Migration Metrics](#-6-deployment--migration-metrics)
7. [Repository & Directory Structure](#-7-repository--directory-structure)
8. [Prerequisites & Environment Setup](#-8-prerequisites--environment-setup)
9. [Step-by-Step Installation & Execution](#-9-step-by-step-installation--execution)
10. [Frontend Architecture & Wallet Fallback Design](#-10-frontend-architecture--wallet-fallback-design)
11. [Testing & Verification Scenarios](#-11-testing--verification-scenarios)
12. [Troubleshooting Guide](#-12-troubleshooting-guide)
13. [Future Enhancements](#-13-future-enhancements)

---

## 🎯 1. Introduction & Problem Statement

In conventional Web2 guestbooks, comment sections, and public ledgers, user-submitted records are stored inside centralized relational or NoSQL databases controlled by a single administrator. This architecture introduces several critical vulnerabilities:

- **Mutable History:** Database administrators can silently edit, backdate, or delete previously published entries.
- **Single Point of Failure:** If the central server or database goes offline, the entire historical ledger becomes inaccessible.
- **Lack of Cryptographic Attribution:** Standard database rows lack verifiable cryptographic proof that a specific user authored a specific message at a given point in time.

**EcoLedger** solves these challenges by replacing the centralized backend with an **Ethereum Smart Contract (`DecentralizedGuestbook`)**. Once a user signs and broadcasts a transaction via their Web3 wallet, the message, sender's Ethereum address, and block timestamp are permanently committed to the blockchain ledger—making every entry **tamper-proof, publicly auditable, and cryptographically attributable**.

---

## ✨ 2. Core Objectives & Key Features

- **Immutable On-Chain Persistence:** Messages are stored in EVM contract storage arrays and cannot be modified or erased once mined.
- **Cryptographic Authorship & Timestamping:** Every note automatically captures `msg.sender` and `block.timestamp` at the protocol level without trusting client-side clocks.
- **Real-Time Ledger Analytics:**
  - **Total Ledger Notes:** Live count of all messages stored in the smart contract (`getNoteCount()`).
  - **Personal Contribution Tracking:** Live count of notes authored specifically by the currently connected wallet (`getMyNoteCount()`).
  - **Active Network Indicator:** Displays real-time connection status and active local chain ID (`5777`).
- **Input Validation & XSS Protection:** Enforces non-empty strings and a maximum 280-character limit both on-chain (Solidity `require` checks) and off-chain (UI character counter + safe DOM `innerText` rendering).
- **Resilient Dual-Mode Web3 Connection:** Supports standard MetaMask browser injection (`window.ethereum`) alongside an automatic timeout-based fallback to Ganache's local JSON-RPC provider (`http://127.0.0.1:7545`).

---

## 🏗️ 3. System Architecture & Data Flow

EcoLedger follows a clean **two-tier Web3 architecture** consisting of a static client-side frontend and an on-chain Ethereum smart contract runtime:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER (Browser)                            │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  EcoLedger Frontend (frontend/index.html)                       │   │
│   │  • Responsive Emerald Web3 UI (HTML5 / CSS3)                    │   │
│   │  • Application Logic & ABI Binding (Web3.js v1.10.0)            │   │
│   │  • 4-Second Promise.race() Wallet Connection Handler            │   │
│   └───────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   ▼ (Primary)                       ▼ (Fallback)
        ┌─────────────────────┐           ┌─────────────────────┐
        │ MetaMask Extension  │           │ Direct HTTPProvider │
        │ (window.ethereum)   │           │ 127.0.0.1:7545      │
        └──────────┬──────────┘           └──────────┬──────────┘
                   │          JSON-RPC 2.0           │
                   └────────────────┬────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN TIER (Local EVM)                          │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Ganache Local Ethereum Node (Network ID: 5777)                 │   │
│   │                                                                 │   │
│   │  ┌───────────────────────────────────────────────────────────┐  │   │
│   │  │  Smart Contract: DecentralizedGuestbook                   │  │   │
│   │  │  Address: 0x4a4157C9572491c38F801E9911a93a762e0f8Aaf      │  │   │
│   │  │                                                           │  │   │
│   │  │  • State Storage: Note[] private notes                    │  │   │
│   │  │  • Write Tx: postNote(string _message)                    │  │   │
│   │  │  • Read Calls: getNoteCount(), getNote(), getMyNoteCount()│  │   │
│   │  └───────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Read vs. Write Execution Flow

1. **Write Operations (`postNote`):** Require gas fees, modify EVM state, produce a transaction hash, and mine a new block on Ganache.
2. **Read Operations (`getNoteCount`, `getNote`, `getMyNoteCount`):** Executed via `eth_call` against the local EVM state without modifying storage, costing **0 gas** and returning instantaneously.

---

## 🛠️ 4. Technology Stack

| Component                   | Technology          | Version / Specification                      | Purpose                                                |
| :-------------------------- | :------------------ | :------------------------------------------- | :----------------------------------------------------- |
| **Smart Contract Language** | Solidity            | `^0.8.20` (`solc 0.8.20+commit.a1b79de6`)    | Core on-chain business logic & storage                 |
| **Compilation & Migration** | Truffle Suite       | EVM target: `paris`, Optimizer: `200 runs`   | Contract compilation, artifact generation & deployment |
| **Local Blockchain**        | Ganache             | RPC `http://127.0.0.1:7545`, Chain ID `5777` | Local deterministic Ethereum test network              |
| **Web3 Provider Library**   | Web3.js             | `v1.10.0`                                    | ABI encoding, RPC calls & transaction signing          |
| **Wallet Integration**      | MetaMask            | Browser Extension                            | Account management & transaction approval              |
| **Frontend UI**             | HTML5, CSS3, ES6 JS | Single-file architecture (`index.html`)      | Responsive dashboard, feed rendering & live counters   |

---

## 📜 5. Smart Contract Deep Dive

- **Contract Name:** `DecentralizedGuestbook`
- **Source Location:** `contracts/SmartContract.sol`
- **License:** `MIT`
- **Compiled Artifact:** `build/contracts/DecentralizedGuestbook.json`

### Data Structures

Each guestbook submission is encapsulated in a structured on-chain record:

```solidity
struct Note {
    address author;     // 20-byte Ethereum address of the message sender
    string message;     // UTF-8 encoded guestbook message (1 to 280 bytes)
    uint256 timestamp;  // Block creation Unix timestamp (seconds since epoch)
}
```

### Contract Functions & Gas Behavior

| Function Signature          | State Mutability | Gas Cost                       | Input Parameters            | Return Values                                         | Functional Behavior                                                           |
| :-------------------------- | :--------------- | :----------------------------- | :-------------------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------- |
| `postNote(string _message)` | `nonpayable`     | Paid by sender (~80k–150k gas) | `_message`: String text     | None                                                  | Validates length (`> 0` and `<= 280`), pushes `Note` struct to storage array. |
| `getNoteCount()`            | `view`           | Free (`eth_call`)              | None                        | `uint256`                                             | Returns `notes.length` representing total entries on-chain.                   |
| `getNote(uint256 _index)`   | `view`           | Free (`eth_call`)              | `_index`: Zero-based index  | `(address author, string message, uint256 timestamp)` | Reverts if `_index >= notes.length`; otherwise returns full note tuple.       |
| `getMyNoteCount()`          | `view`           | Free (`eth_call`)              | None (`msg.sender` context) | `uint256 count`                                       | Iterates over stored notes and counts entries matching `msg.sender`.          |

### Security & Validation Rules

1. **Empty Payload Prevention:** Rejects empty strings (`bytes(_message).length > 0`) with revert reason `"Message cannot be empty"` to prevent blank spam transactions.
2. **Storage DoS Protection:** Caps message length at `280` bytes (`"Message is too long"`) to keep transaction gas costs predictable and bounded.
3. **Bounds-Checked Indexing:** `getNote(uint256 _index)` explicitly verifies `_index < notes.length` (`"Note does not exist"`) before reading storage slots.
4. **Solidity 0.8.20 Built-in Overflow Checks:** All arithmetic increments inside loops and array indexing benefit from native compiler overflow/underflow protection.

---

## 🚀 6. Deployment & Migration Metrics

During `truffle migrate`, the contract was compiled with Solidity `0.8.20` and deployed onto the `development` network with the following verified on-chain parameters:

| Deployment Parameter          | Recorded Value                                                       |
| :---------------------------- | :------------------------------------------------------------------- |
| **Network Name**              | `development`                                                        |
| **Network ID**                | `5777`                                                               |
| **Deployed Contract Address** | `0x4a4157C9572491c38F801E9911a93a762e0f8Aaf`                         |
| **Transaction Hash**          | `0x24a9278ca55a9ea048d8b7c006cabe17116e08a9eb1188eea954cb51e1105d9c` |
| **Deployer Account (`from`)** | `0x4c504383CA564a1826c332921dD872BFD815C78C`                         |
| **Block Number**              | `1`                                                                  |
| **Gas Used**                  | `401,610` (`0x620ca`)                                                |
| **Gas Price**                 | `3.375 gwei`                                                         |
| **Total Deployment Cost**     | `0.00135543375 ETH`                                                  |

---

## 📁 7. Repository & Directory Structure

```text
EcoLedger-Assignment3/
├── build/
│   └── contracts/
│       └── DecentralizedGuestbook.json   # Compiled ABI, bytecode, metadata & network IDs
├── contracts/
│   └── SmartContract.sol                 # Solidity source code for DecentralizedGuestbook
├── frontend/
│   └── index.html                        # Complete Web3 frontend (HTML5, CSS3 & Web3.js)
├── migrations/
│   └── 2_deploy_contract.js              # Truffle deployment script for DecentralizedGuestbook
├── truffle-config.js                     # Truffle configuration (Ganache port 7545 & solc 0.8.20)
└── README.md                             # Comprehensive project documentation
```

---

## ⚙️ 8. Prerequisites & Environment Setup

Ensure the following tools are installed on your workstation before running the project:

1. **Node.js (v16+ LTS) & npm:** Required to run Truffle CLI commands.
2. **Truffle Framework:** Install globally via terminal:
   ```bash
   npm install -g truffle
   ```
3. **Ganache Desktop (or Ganache CLI):** Provides the local Ethereum blockchain node on port `7545`.
4. **Modern Web Browser + MetaMask Extension:** Chrome, Brave, or Microsoft Edge with MetaMask installed.
5. **Local HTTP Server:** VS Code **Live Server** extension or Python's built-in `http.server`.

---

## 🧭 9. Step-by-Step Installation & Execution

### Step 1: Launch Local Blockchain (Ganache)

1. Open **Ganache** and select **Quickstart (Ethereum)**.
2. Confirm the top bar displays:
   - **RPC Server:** `HTTP://127.0.0.1:7545`
   - **Network ID:** `5777`
   - **Accounts:** 10 pre-funded test accounts with `100.00 ETH` each.

### Step 2: Compile & Migrate the Smart Contract

Navigate to the project root folder in your terminal and execute:

```bash
truffle compile
truffle migrate --reset
```

> **Important:** Whenever Ganache is restarted with a clean workspace, copy the newly printed `contract address` from the Truffle migration output and update `const CONTRACT_ADDRESS` inside `frontend/index.html`.

### Step 3: Configure MetaMask Wallet

1. Open MetaMask and click **Networks → Add a custom network**:
   - **Network Name:** `Ganache Local`
   - **Default RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337` _(or `5777` depending on Ganache workspace settings)_
   - **Currency Symbol:** `ETH`
2. In Ganache, click the **Key (`🔑`)** icon next to Account `0` (`0x4c504383...`) and copy its **Private Key**.
3. In MetaMask, select **Add account or hardware wallet → Import account** and paste the Private Key.

### Step 4: Serve & Interact with the Frontend

1. Right-click `frontend/index.html` in VS Code and select **Open with Live Server** (opens `http://127.0.0.1:5500/frontend/index.html`), or run:
   ```bash
   python -m http.server 8000
   ```
2. Click **Connect MetaMask** in the top navigation bar.
3. Type a message in the **Post a Message** box and click **Post Message**.
4. Observe the live statistics update and your entry appear immediately under **Guestbook Messages**.

---

## 🛡️ 10. Frontend Architecture & Wallet Fallback Design

Modern browser extensions (particularly in Chromium/Edge side-panel modes) can occasionally leave `window.ethereum.request({ method: "eth_requestAccounts" })` in a pending state if a popup stream is orphaned. To guarantee uninterrupted functionality during local testing and demonstrations, `frontend/index.html` implements a **Promise Race Fallback Pattern**:

```javascript
const accounts = await Promise.race([
  window.ethereum.request({ method: "eth_requestAccounts" }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("MetaMask timeout")), 4000),
  ),
]);
```

- **If MetaMask responds within 4 seconds:** The dApp binds directly to the injected `window.ethereum` signer.
- **If MetaMask is unavailable or hangs:** The catch block automatically initializes `new Web3("http://127.0.0.1:7545")`, fetches Ganache's unlocked primary account (`accounts[0]`), and completes contract initialization seamlessly.

---

## ✅ 11. Testing & Verification Scenarios

| Test Case                             | Action Performed                                     | Expected Result                                                                 | Status    |
| :------------------------------------ | :--------------------------------------------------- | :------------------------------------------------------------------------------ | :-------- |
| **TC-01: Wallet Connection**          | Click **Connect MetaMask** button                    | Status pill turns green, displays `Connected: 0x4c504383...`, loads metrics.    | ✅ Passed |
| **TC-02: Empty Message Guard**        | Click **Post Message** with blank input              | Blocks transaction client-side and displays `"Please write a message first."`.  | ✅ Passed |
| **TC-03: On-Chain Note Creation**     | Enter `"hello"` and click **Post Message**           | Sends transaction to `postNote()`, deducts gas in Ganache, increments counters. | ✅ Passed |
| **TC-04: Reverse-Chronological Feed** | Post multiple notes and click **↻ Refresh Messages** | Fetches notes via `getNote(i)` from `count - 1` down to `0` (newest first).     | ✅ Passed |
| **TC-05: XSS Sanitization**           | Submit HTML/script tags as message text              | Rendered via `.innerText`, preventing arbitrary script execution in browser.    | ✅ Passed |

---

## 🔧 12. Troubleshooting Guide

- **`Failed to load messages` or RPC Connection Refused:**
  - Verify Ganache is actively running on port `7545`.
  - If Ganache was closed and reopened, run `truffle migrate --reset` and update `CONTRACT_ADDRESS` in `frontend/index.html`.
- **MetaMask Nonce Mismatch Error (`the tx doesn't have the correct nonce`):**
  - This occurs when Ganache is restarted while MetaMask still caches old transaction counts. Fix it in MetaMask via **Settings → Advanced → Clear activity and nonce data**.
- **MetaMask Side Panel Blocking Popups:**
  - Close the right-hand browser side panel (`X`) and click the toolbar fox icon directly, or let the built-in 4-second Ganache RPC fallback connect automatically.

---

## 🔮 13. Future Enhancements

- **Solidity Event Indexing (`event NotePosted`):** Emit indexed events upon note creation so the frontend can subscribe to real-time WebSocket updates without manual polling.
- **Pagination Support (`getNotesPaginated`):** Add offset/limit view functions to scale efficiently when the guestbook grows to thousands of entries.
- **Public Testnet Deployment (Sepolia):** Deploy the contract to Ethereum Sepolia testnet using Infura/Alchemy RPC endpoints and HDWalletProvider.
- **ENS Name Resolution:** Resolve Ethereum addresses (`0x4c50...`) to human-readable `.eth` domain names where available.
