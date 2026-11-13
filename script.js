// Replace this with your newly deployed contract address from `truffle migrate`
const CONTRACT_ADDRESS = "0x4a4157C9572491c38F801E9911a93a762e0f8Aaf";
const CONTRACT_ABI = [
    "function postNote(string _message)",
    "function getNoteCount() view returns (uint256)",
    "function getNote(uint256 _index) view returns (address author, string message, uint256 timestamp)",
    "function getMyNoteCount() view returns (uint256)"
];

let provider;
let signer;
let contract;
let currentAccount;

const connectBtn = document.getElementById("connectBtn");
const postBtn = document.getElementById("postBtn");
const refreshBtn = document.getElementById("refreshBtn");

async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert("Please install MetaMask first.");
            return;
        }

        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        currentAccount = accounts[0];

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        const network = await provider.getNetwork();

        if (network.chainId !== 1337 && network.chainId !== 5777) {
            alert("Please select Ganache Local network in MetaMask.");
            return;
        }

        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

        document.getElementById("walletStatus").innerText =
            "Connected: " + currentAccount;

        connectBtn.innerText = "Wallet Connected";
        postBtn.disabled = false;
        showFeedback("");

        await loadMessages();

    } catch (error) {
        showFeedback(error.message, true);
    }
}

async function postMessage() {
    try {
        if (!contract) {
            showFeedback("Please connect your wallet first.", true);
            return;
        }

        const message = document.getElementById("messageInput").value.trim();

        if (!message) {
            alert("Please enter a message.");
            return;
        }

        postBtn.disabled = true;
        showFeedback("Confirm the transaction in MetaMask...");

        const transaction = await contract.postNote(message);

        showFeedback("Waiting for transaction confirmation...");
        await transaction.wait();

        document.getElementById("messageInput").value = "";
        showFeedback("Message successfully stored on blockchain!");

        await loadMessages();

    } catch (error) {
        showFeedback(error.reason || error.message, true);
    } finally {
        if (contract) {
            postBtn.disabled = false;
        }
    }
}

async function loadMessages() {
    try {
        if (!contract) {
            showFeedback("Please connect your wallet first.", true);
            return;
        }

        const total = await contract.getNoteCount();
        const mine = await contract.getMyNoteCount();

        document.getElementById("totalCount").innerText = total.toString();
        document.getElementById("myCount").innerText = mine.toString();

        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML = "";

        if (total.toNumber() === 0) {
            messagesDiv.innerHTML = "<p>No messages posted yet.</p>";
            return;
        }

        for (let i = total.toNumber() - 1; i >= 0; i--) {
            const note = await contract.getNote(i);

            const card = document.createElement("div");
            card.className = "message-card";

            const messageText = document.createElement("p");
            messageText.textContent = note.message;

            const author = document.createElement("small");
            author.textContent = "Author: " + note.author;

            const date = document.createElement("small");
            date.textContent = new Date(
                note.timestamp.toNumber() * 1000
            ).toLocaleString();

            card.appendChild(messageText);
            card.appendChild(author);
            card.appendChild(document.createElement("br"));
            card.appendChild(date);

            messagesDiv.appendChild(card);
        }

    } catch (error) {
        showFeedback(error.message, true);
    }
}

function showFeedback(message, isError = false) {
    const feedback = document.getElementById("feedback");
    feedback.innerText = message;
    feedback.style.color = isError ? "red" : "green";
}

connectBtn.addEventListener("click", connectWallet);
postBtn.addEventListener("click", postMessage);
refreshBtn.addEventListener("click", loadMessages);

if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
}