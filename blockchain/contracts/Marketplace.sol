// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Marketplace {
    struct TransactionRecord {
        string orderId;
        string paymentReference;
        string amountETB;  // Store as string "150.50 ETB"
        address buyer;
        address producer;
        uint256 timestamp;
        string txHash;
        bool isVerified;
    }
    
    mapping(string => TransactionRecord) public transactions;
    mapping(address => string[]) public userTransactions;
    mapping(address => string[]) public producerTransactions;
    string[] public allTransactionIds;
    
    address public owner;
    
    event TransactionRecorded(
        string indexed orderId,
        address indexed buyer,
        address indexed producer,
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
        address _buyer,
        address _producer,
        string memory _txHash
    ) external onlyOwner {
        require(bytes(_orderId).length > 0, "Order ID required");
        require(bytes(_paymentReference).length > 0, "Payment reference required");
        require(bytes(_amountETB).length > 0, "Amount required");
        require(_buyer != address(0), "Invalid buyer address");
        require(_producer != address(0), "Invalid producer address");
        require(bytes(transactions[_orderId].orderId).length == 0, "Transaction already recorded");
        
        transactions[_orderId] = TransactionRecord({
            orderId: _orderId,
            paymentReference: _paymentReference,
            amountETB: _amountETB,
            buyer: _buyer,
            producer: _producer,
            timestamp: block.timestamp,
            txHash: _txHash,
            isVerified: true
        });
        
        userTransactions[_buyer].push(_orderId);
        producerTransactions[_producer].push(_orderId);
        allTransactionIds.push(_orderId);
        
        emit TransactionRecorded(_orderId, _buyer, _producer, _paymentReference, _amountETB, block.timestamp, _txHash);
    }
    
    function getTransaction(string memory _orderId) external view returns (
        string memory orderId,
        string memory paymentReference,
        string memory amountETB,
        address buyer,
        address producer,
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
            txRecord.buyer,
            txRecord.producer,
            txRecord.timestamp,
            txRecord.txHash,
            txRecord.isVerified
        );
    }
    
    function verifyTransaction(string memory _orderId) external view returns (bool) {
        return bytes(transactions[_orderId].orderId).length > 0;
    }
    
    function getUserTransactions(address _user) external view returns (string[] memory) {
        return userTransactions[_user];
    }
    
    function getProducerTransactions(address _producer) external view returns (string[] memory) {
        return producerTransactions[_producer];
    }
    
    function getTransactionCount() external view returns (uint256) {
        return allTransactionIds.length;
    }
}