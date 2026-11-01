// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InvoiceGuard is Ownable, ReentrancyGuard {
    enum Status { Registered, Funded, Settled, Cancelled }

    struct Invoice {
        address supplier;
        address investor;
        uint256 faceValue;
        uint256 advanceValue;
        uint64 dueDate;
        Status status;
        bool flagged;
    }

    mapping(bytes32 => Invoice) private invoices;
    mapping(bytes32 => bool) public invoiceIdUsed;

    event InvoiceRegistered(bytes32 indexed invoiceId, address indexed supplier, uint256 faceValue);
    event InvoiceFunded(bytes32 indexed invoiceId, address indexed investor, uint256 advanceValue);
    event InvoiceSettled(bytes32 indexed invoiceId, address indexed investor, uint256 repayment);
    event InvoiceFlagged(bytes32 indexed invoiceId, address indexed reporter, string reason);
    event InvoiceCancelled(bytes32 indexed invoiceId);

    constructor() Ownable(msg.sender) {}

    function hashInvoiceId(string calldata invoiceNumber) public pure returns (bytes32) {
        return keccak256(bytes(invoiceNumber));
    }

    function registerInvoice(
        string calldata invoiceNumber,
        uint256 faceValueWei,
        uint64 dueDate
    ) external {
        require(bytes(invoiceNumber).length > 0, "Invoice ID required");
        require(faceValueWei > 0, "Amount must be positive");
        require(dueDate > block.timestamp, "Due date must be future");

        bytes32 id = hashInvoiceId(invoiceNumber);
        require(!invoiceIdUsed[id], "Invoice ID already exists");

        invoiceIdUsed[id] = true;
        invoices[id] = Invoice({
            supplier: msg.sender,
            investor: address(0),
            faceValue: faceValueWei,
            advanceValue: 0,
            dueDate: dueDate,
            status: Status.Registered,
            flagged: false
        });

        emit InvoiceRegistered(id, msg.sender, faceValueWei);
    }

    function fundInvoice(string calldata invoiceNumber) external payable nonReentrant {
        bytes32 id = hashInvoiceId(invoiceNumber);
        Invoice storage inv = invoices[id];

        require(inv.supplier != address(0), "Invoice not found");
        require(inv.status == Status.Registered, "Invoice unavailable");
        require(!inv.flagged, "Invoice is flagged");
        require(msg.sender != inv.supplier, "Supplier cannot fund own invoice");
        require(msg.value > 0, "Advance required");
        require(msg.value < inv.faceValue, "Advance must be below face value");

        inv.investor = msg.sender;
        inv.advanceValue = msg.value;
        inv.status = Status.Funded;

        (bool sent, ) = payable(inv.supplier).call{value: msg.value}("");
        require(sent, "Supplier payment failed");

        emit InvoiceFunded(id, msg.sender, msg.value);
    }

    // Educational prototype: owner simulates an authorized buyer/payment verifier.
    // msg.value is the buyer's simulated repayment; it is paid to the investor.
    function settleInvoice(string calldata invoiceNumber) external payable onlyOwner nonReentrant {
        bytes32 id = hashInvoiceId(invoiceNumber);
        Invoice storage inv = invoices[id];

        require(inv.status == Status.Funded, "Invoice not funded");
        require(!inv.flagged, "Invoice is flagged");
        require(msg.value == inv.faceValue, "Repayment must equal invoice value");

        inv.status = Status.Settled;
        (bool sent, ) = payable(inv.investor).call{value: msg.value}("");
        require(sent, "Investor repayment failed");

        emit InvoiceSettled(id, inv.investor, msg.value);
    }

    function flagInvoice(string calldata invoiceNumber, string calldata reason) external {
        bytes32 id = hashInvoiceId(invoiceNumber);
        Invoice storage inv = invoices[id];
        require(inv.supplier != address(0), "Invoice not found");
        require(bytes(reason).length > 0, "Reason required");
        require(inv.status == Status.Registered, "Only unfunded invoices can be flagged");
        require(msg.sender == owner() || msg.sender == inv.supplier, "Not authorized");
        inv.flagged = true;
        emit InvoiceFlagged(id, msg.sender, reason);
    }

    function cancelInvoice(string calldata invoiceNumber) external {
        bytes32 id = hashInvoiceId(invoiceNumber);
        Invoice storage inv = invoices[id];
        require(inv.supplier == msg.sender, "Only supplier can cancel");
        require(inv.status == Status.Registered, "Only registered invoices can cancel");
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id);
    }

    function getInvoice(string calldata invoiceNumber) external view returns (Invoice memory) {
        bytes32 id = hashInvoiceId(invoiceNumber);
        require(invoices[id].supplier != address(0), "Invoice not found");
        return invoices[id];
    }
}