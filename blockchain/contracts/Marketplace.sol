// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Marketplace {
    struct TransactionRecord {
        string orderId;
        string paymentReference;
        string amountETB;  
        string buyerId;        // ✅ CHANGED: address → string
        string producerId;     // ✅ CHANGED: address → string
        uint256 timestamp;
        string txHash;
        bool isVerified;
    }
    
    mapping(string => TransactionRecord) public transactions;
    mapping(string => string[]) public userTransactions;     // ✅ CHANGED: address → string
    mapping(string => string[]) public producerTransactions; // ✅ CHANGED: address → string
    string[] public allTransactionIds;
    
    address public owner;
    
    event TransactionRecorded(
        string indexed orderId,
        string indexed buyerId,      // ✅ CHANGED: address → string
        string indexed producerId,   // ✅ CHANGED: address → string
        string paymentReference,
        string amountETB,
        uint256 timestamp,
        string txHash
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function recordTransaction(
        string memory _orderId,
        string memory _paymentReference,
        string memory _amountETB,  
        string memory _buyerId,      // ✅ CHANGED: address → string
        string memory _producerId,   // ✅ CHANGED: address → string
        string memory _txHash
    ) external onlyOwner {
        require(bytes(_orderId).length > 0, "Order ID required");
        require(bytes(_paymentReference).length > 0, "Payment reference required");
        require(bytes(_amountETB).length > 0, "Amount required");
        require(bytes(_buyerId).length > 0, "Buyer ID required");        // ✅ UPDATED validation
        require(bytes(_producerId).length > 0, "Producer ID required");  // ✅ UPDATED validation
        require(bytes(transactions[_orderId].orderId).length == 0, "Transaction already recorded");
        
        transactions[_orderId] = TransactionRecord({
            orderId: _orderId,
            paymentReference: _paymentReference,
            amountETB: _amountETB,
            buyerId: _buyerId,        // ✅ UPDATED
            producerId: _producerId,  // ✅ UPDATED
            timestamp: block.timestamp,
            txHash: _txHash,
            isVerified: true
        });
        
        userTransactions[_buyerId].push(_orderId);          // ✅ UPDATED
        producerTransactions[_producerId].push(_orderId);   // ✅ UPDATED
        allTransactionIds.push(_orderId);
        
        emit TransactionRecorded(_orderId, _buyerId, _producerId, _paymentReference, _amountETB, block.timestamp, _txHash);
    }
    
    function getTransaction(string memory _orderId) external view returns (
        string memory orderId,
        string memory paymentReference,
        string memory amountETB,
        string memory buyerId,        // ✅ CHANGED: address → string
        string memory producerId,     // ✅ CHANGED: address → string
        uint256 timestamp,
        string memory txHash,
        bool isVerified
    ) {
        TransactionRecord memory txRecord = transactions[_orderId];
        require(bytes(txRecord.orderId).length > 0, "Transaction not found");
        
        return (
            txRecord.orderId,
            txRecord.paymentReference,
            txRecord.amountETB,
            txRecord.buyerId,         // ✅ UPDATED
            txRecord.producerId,      // ✅ UPDATED
            txRecord.timestamp,
            txRecord.txHash,
            txRecord.isVerified
        );
    }
    
    function verifyTransaction(string memory _orderId) external view returns (bool) {
        return bytes(transactions[_orderId].orderId).length > 0;
    }
    
    function getUserTransactions(string memory _userId) external view returns (string[] memory) {
        return userTransactions[_userId];  // ✅ UPDATED parameter
    }
    
    function getProducerTransactions(string memory _producerId) external view returns (string[] memory) {
        return producerTransactions[_producerId];  // ✅ UPDATED parameter
    }
    
    function getTransactionCount() external view returns (uint256) {
        return allTransactionIds.length;
    }
}