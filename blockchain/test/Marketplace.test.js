const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace Contract", function () {
  let marketplace;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
  });

  it("Should record a transaction", async function () {
    const orderId = "order-123";
    const paymentReference = "pay-ref-456";
    const txHash = "chapa-tx-789";

    await marketplace.recordTransaction(orderId, paymentReference, txHash);

    const transaction = await marketplace.getTransaction(orderId);
    
    expect(transaction.orderId).to.equal(orderId);
    expect(transaction.paymentReference).to.equal(paymentReference);
    expect(transaction.txHash).to.equal(txHash);
  });

  it("Should verify transaction exists", async function () {
    const orderId = "order-123";
    
    // Should not exist initially
    expect(await marketplace.verifyTransaction(orderId)).to.be.false;

    // Record transaction
    await marketplace.recordTransaction(orderId, "ref-123", "tx-123");
    
    // Should exist after recording
    expect(await marketplace.verifyTransaction(orderId)).to.be.true;
  });

  it("Should not allow duplicate transactions", async function () {
    const orderId = "order-123";
    
    await marketplace.recordTransaction(orderId, "ref-123", "tx-123");
    
    // Try to record same order again - should fail
    await expect(
      marketplace.recordTransaction(orderId, "ref-456", "tx-456")
    ).to.be.revertedWith("Transaction already recorded");
  });

  it("Should return correct transaction count", async function () {
    expect(await marketplace.getTransactionCount()).to.equal(0);

    await marketplace.recordTransaction("order-1", "ref-1", "tx-1");
    expect(await marketplace.getTransactionCount()).to.equal(1);

    await marketplace.recordTransaction("order-2", "ref-2", "tx-2");
    expect(await marketplace.getTransactionCount()).to.equal(2);
  });
});