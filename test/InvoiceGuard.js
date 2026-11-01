const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvoiceGuard", function () {
  async function setup() {
    const [owner, supplier, investor, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("InvoiceGuard");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, owner, supplier, investor, other };
  }

  async function futureTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 86400;
  }

  it("registers an invoice", async function () {
    const { contract, supplier } = await setup();
    const due = await futureTimestamp();
    await contract.connect(supplier).registerInvoice("INV-1001", ethers.parseEther("1"), due);
    const inv = await contract.getInvoice("INV-1001");
    expect(inv.supplier).to.equal(supplier.address);
    expect(inv.faceValue).to.equal(ethers.parseEther("1"));
    expect(inv.status).to.equal(0);
  });

  it("rejects duplicate invoice IDs", async function () {
    const { contract, supplier, other } = await setup();
    const due = await futureTimestamp();
    await contract.connect(supplier).registerInvoice("INV-1001", ethers.parseEther("1"), due);
    await expect(
      contract.connect(other).registerInvoice("INV-1001", ethers.parseEther("1"), due)
    ).to.be.revertedWith("Invoice ID already exists");
  });

  it("lets a different wallet fund an invoice and pays the supplier", async function () {
    const { contract, supplier, investor } = await setup();
    const due = await futureTimestamp();
    await contract.connect(supplier).registerInvoice("INV-1002", ethers.parseEther("1"), due);
    await expect(
      contract.connect(investor).fundInvoice("INV-1002", { value: ethers.parseEther("0.8") })
    ).to.emit(contract, "InvoiceFunded");
    const inv = await contract.getInvoice("INV-1002");
    expect(inv.investor).to.equal(investor.address);
    expect(inv.status).to.equal(1);
  });

  it("rejects supplier funding their own invoice", async function () {
    const { contract, supplier } = await setup();
    const due = await futureTimestamp();
    await contract.connect(supplier).registerInvoice("INV-1003", ethers.parseEther("1"), due);
    await expect(
      contract.connect(supplier).fundInvoice("INV-1003", { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Supplier cannot fund own invoice");
  });

  it("settles a funded invoice when owner submits the full repayment", async function () {
    const { contract, supplier, investor, owner } = await setup();
    const due = await futureTimestamp();
    await contract.connect(supplier).registerInvoice("INV-1004", ethers.parseEther("1"), due);
    await contract.connect(investor).fundInvoice("INV-1004", { value: ethers.parseEther("0.8") });
    await expect(
      contract.connect(owner).settleInvoice("INV-1004", { value: ethers.parseEther("1") })
    ).to.emit(contract, "InvoiceSettled");
    const inv = await contract.getInvoice("INV-1004");
    expect(inv.status).to.equal(2);
  });
});