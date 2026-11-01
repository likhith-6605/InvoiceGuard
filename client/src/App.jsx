import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import contractInfo from "./contract.json";

const statusNames = ["Registered", "Funded", "Settled", "Cancelled"];

export default function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [notice, setNotice] = useState("Connect MetaMask to interact with the local blockchain.");
  const [invoices, setInvoices] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [fundingId, setFundingId] = useState("");
  const [fundingAmount, setFundingAmount] = useState("0.8");
  const [settlementId, setSettlementId] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("1");
  const [flagId, setFlagId] = useState("");
  const [flagReason, setFlagReason] = useState("Suspicious or unverified invoice");

  const shortAccount = useMemo(
    () => account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected",
    [account]
  );

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setNotice("MetaMask was not detected. Install the MetaMask browser extension first.");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const instance = new Contract(contractInfo.address, contractInfo.abi, signer);
      setAccount(await signer.getAddress());
      setContract(instance);
      setNotice("Wallet connected. Make sure MetaMask is using the Hardhat Local network.");
      await loadInvoices(instance);
    } catch (error) {
      setNotice(error.shortMessage || error.message || "Wallet connection failed.");
    }
  }

  async function loadInvoices(instance = contract) {
    if (!instance) return;
    // The prototype reads the IDs stored in this browser for its dashboard.
    // Contract state remains authoritative; invoice details are fetched from chain.
    const ids = JSON.parse(localStorage.getItem("invoiceguard_ids") || "[]");
    const rows = [];
    for (const id of ids) {
      try {
        const inv = await instance.getInvoice(id);
        rows.push({
          id,
          supplier: inv.supplier,
          investor: inv.investor,
          faceValue: formatEther(inv.faceValue),
          advanceValue: formatEther(inv.advanceValue),
          dueDate: new Date(Number(inv.dueDate) * 1000).toLocaleDateString(),
          status: statusNames[Number(inv.status)],
          flagged: inv.flagged
        });
      } catch { /* Ignore IDs that are not on this connected chain. */ }
    }
    setInvoices(rows);
  }

  async function runTransaction(action, successMessage) {
    try {
      if (!contract) {
        setNotice("Connect MetaMask first.");
        return;
      }
      setNotice("Please confirm the transaction in MetaMask...");
      const tx = await action();
      await tx.wait();
      setNotice(`${successMessage} Transaction: ${tx.hash}`);
      await loadInvoices();
    } catch (error) {
      setNotice(error.shortMessage || error.reason || error.message || "Transaction failed.");
    }
  }

  async function registerInvoice(event) {
    event.preventDefault();
    if (!dueDate) return setNotice("Choose a due date.");
    const due = Math.floor(new Date(`${dueDate}T23:59:00`).getTime() / 1000);
    const id = invoiceNumber.trim();
    await runTransaction(
      () => contract.registerInvoice(id, parseEther(amount), due),
      "Invoice registered."
    );
    const ids = JSON.parse(localStorage.getItem("invoiceguard_ids") || "[]");
    if (id && !ids.includes(id)) {
      ids.push(id);
      localStorage.setItem("invoiceguard_ids", JSON.stringify(ids));
    }
    setInvoiceNumber("");
    await loadInvoices();
  }

  async function fundInvoice(event) {
    event.preventDefault();
    await runTransaction(
      () => contract.fundInvoice(fundingId.trim(), { value: parseEther(fundingAmount) }),
      "Invoice funded and advance sent to supplier."
    );
  }

  async function settleInvoice(event) {
    event.preventDefault();
    await runTransaction(
      () => contract.settleInvoice(settlementId.trim(), { value: parseEther(settlementAmount) }),
      "Invoice settled."
    );
  }

  async function flagInvoice(event) {
    event.preventDefault();
    await runTransaction(
      () => contract.flagInvoice(flagId.trim(), flagReason.trim()),
      "Invoice flagged."
    );
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", () => {
        setAccount("");
        setContract(null);
        setNotice("Wallet account changed. Reconnect your wallet.");
      });
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">IG</span><span>InvoiceGuard<small>TRADE FINANCE • ON-CHAIN</small></span></a>
        <div className="wallet-area">
          <span className={`status-dot ${contract ? "connected" : ""}`}></span>
          <span className="account-label">{shortAccount}</span>
          <button className="button button-primary" onClick={connectWallet}>{contract ? "Reconnect wallet" : "Connect MetaMask"}</button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">BLOCKCHAIN-POWERED INVOICE FINANCING</div>
            <h1>Unlock working capital.<br /><span>Build trust on-chain.</span></h1>
            <p>Register invoices, finance eligible receivables and track settlement in one transparent demo platform.</p>
            <div className="hero-pills"><span>✓ Duplicate ID protection</span><span>✓ Smart-contract escrow flow</span><span>✓ Audit events</span></div>
          </div>
          <div className="hero-card"><div className="hero-card-icon">↗</div><span>INVOICEGUARD PROTOTYPE</span><strong>Financing, made transparent.</strong><small>Local blockchain • Test ETH only</small></div>
        </section>

        <div className="notice"><strong>Connection status</strong><span>{notice}</span></div>

        <section className="stats-grid">
          <article className="stat-card"><span>Total tracked invoices</span><strong>{invoices.length}</strong><small>Saved invoice IDs on this browser</small></article>
          <article className="stat-card"><span>Available to finance</span><strong>{invoices.filter(i => i.status === "Registered" && !i.flagged).length}</strong><small>Registered and not flagged</small></article>
          <article className="stat-card"><span>Funded</span><strong>{invoices.filter(i => i.status === "Funded").length}</strong><small>Awaiting settlement</small></article>
          <article className="stat-card"><span>Settled</span><strong>{invoices.filter(i => i.status === "Settled").length}</strong><small>Completed repayments</small></article>
        </section>

        <div className="section-heading"><div><div className="eyebrow">WORKSPACE</div><h2>Invoice operations</h2></div><button className="button button-light" onClick={() => loadInvoices()}>↻ Refresh data</button></div>
        <section className="forms-grid">
          <form className="panel" onSubmit={registerInvoice}>
            <div className="panel-title"><span className="panel-icon">＋</span><div><h3>Register an invoice</h3><p>Supplier action</p></div></div>
            <label>Invoice ID<input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-1001" required /></label>
            <label>Invoice face value (ETH)<input type="number" min="0.000000000000000001" step="any" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
            <label>Payment due date<input type="date" value={dueDate} min={new Date().toISOString().slice(0,10)} onChange={e => setDueDate(e.target.value)} required /></label>
            <button className="button button-primary button-wide" type="submit">Register on blockchain</button>
          </form>

          <form className="panel" onSubmit={fundInvoice}>
            <div className="panel-title"><span className="panel-icon green">↗</span><div><h3>Finance an invoice</h3><p>Investor action</p></div></div>
            <label>Invoice ID<input value={fundingId} onChange={e => setFundingId(e.target.value)} placeholder="e.g. INV-1001" required /></label>
            <label>Advance amount (ETH)<input type="number" min="0.000000000000000001" step="any" value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} required /></label>
            <p className="helper">Must be lower than the invoice face value. Use a different wallet from the supplier.</p>
            <button className="button button-primary button-wide" type="submit">Fund invoice</button>
          </form>

          <form className="panel" onSubmit={settleInvoice}>
            <div className="panel-title"><span className="panel-icon purple">✓</span><div><h3>Simulate buyer repayment</h3><p>Authorized verifier / contract owner</p></div></div>
            <label>Invoice ID<input value={settlementId} onChange={e => setSettlementId(e.target.value)} placeholder="e.g. INV-1001" required /></label>
            <label>Repayment amount (ETH)<input type="number" min="0.000000000000000001" step="any" value={settlementAmount} onChange={e => setSettlementAmount(e.target.value)} required /></label>
            <p className="helper">For this demo, the contract owner submits the full invoice value as simulated repayment.</p>
            <button className="button button-primary button-wide" type="submit">Settle invoice</button>
          </form>

          <form className="panel" onSubmit={flagInvoice}>
            <div className="panel-title"><span className="panel-icon red">!</span><div><h3>Flag suspicious invoice</h3><p>Supplier or contract owner</p></div></div>
            <label>Invoice ID<input value={flagId} onChange={e => setFlagId(e.target.value)} placeholder="e.g. INV-1001" required /></label>
            <label>Reason<input value={flagReason} onChange={e => setFlagReason(e.target.value)} required /></label>
            <p className="helper">Flagged registered invoices cannot be financed in this prototype.</p>
            <button className="button button-danger button-wide" type="submit">Flag invoice</button>
          </form>
        </section>

        <section className="panel table-panel">
          <div className="section-heading table-heading"><div><div className="eyebrow">ON-CHAIN RECORDS</div><h2>Invoice register</h2></div><span className="record-count">{invoices.length} records</span></div>
          {invoices.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><strong>No invoices loaded yet</strong><p>Connect your wallet, register an invoice, then refresh the records.</p></div> : (
            <div className="table-wrap"><table><thead><tr><th>Invoice ID</th><th>Face value (ETH)</th><th>Advance (ETH)</th><th>Supplier</th><th>Due date</th><th>Status</th></tr></thead><tbody>
              {invoices.map(row => <tr key={row.id}><td><strong>{row.id}</strong>{row.flagged && <small className="flag-label">Flagged</small>}</td><td>{row.faceValue}</td><td>{row.advanceValue}</td><td>{row.supplier.slice(0,6)}...{row.supplier.slice(-4)}</td><td>{row.dueDate}</td><td><span className={`badge ${row.status.toLowerCase()}`}>{row.status}</span></td></tr>)}
            </tbody></table></div>
          )}
          <p className="helper footnote">This dashboard stores invoice IDs in this browser for display and fetches each invoice's details from the connected contract. For a production app, use an indexed event service and authenticated off-chain invoice documents.</p>
        </section>
        <footer>InvoiceGuard · Student FinTech + Blockchain Prototype · Test ETH only</footer>
      </main>
    </div>
  );
}