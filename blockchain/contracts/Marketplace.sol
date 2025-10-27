// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Marketplace {
    struct TransactionRecord {
        string orderId;
        string paymentReference;
        uint256 timestamp;
        string txHash;
    }
    
    mapping(string => TransactionRecord) public transactions;
    string[] public transactionIds;
    
    event TransactionRecorded(
        string indexed orderId,
        string paymentReference,
        uint256 timestamp,
        string txHash
    );
    
    function recordTransaction(
        string memory _orderId,
        string memory _paymentReference,
        string memory _txHash
    ) external {
        require(bytes(_orderId).length > 0, "Order ID required");
        require(bytes(_paymentReference).length > 0, "Payment reference required");
        require(bytes(transactions[_orderId].orderId).length == 0, "Transaction already recorded");
        
        transactions[_orderId] = TransactionRecord({
            orderId: _orderId,
            paymentReference: _paymentReference,
            timestamp: block.timestamp,
            txHash: _txHash
        });
        
        transactionIds.push(_orderId);
        
        emit TransactionRecorded(_orderId, _paymentReference, block.timestamp, _txHash);
    }
    
    function getTransaction(string memory _orderId) external view returns (
        string memory orderId,
        string memory paymentReference,
        uint256 timestamp,
        string memory txHash
    ) {
        TransactionRecord memory txRecord = transactions[_orderId];
        require(bytes(txRecord.orderId).length > 0, "Transaction not found");
        
        return (
            txRecord.orderId,
            txRecord.paymentReference,
            txRecord.timestamp,
            txRecord.txHash
        );
    }
    
    function verifyTransaction(string memory _orderId) external view returns (bool) {
        return bytes(transactions[_orderId].orderId).length > 0;
    }
    
    function getTransactionCount() external view returns (uint256) {
        return transactionIds.length;
    }
    
    function getAllTransactionIds() external view returns (string[] memory) {
        return transactionIds;
    }
}