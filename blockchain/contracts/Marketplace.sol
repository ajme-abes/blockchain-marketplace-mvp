// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Marketplace {
    struct TransactionRecord {
        string orderId;
        string productId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 timestamp;
        string paymentMethod;
        string status;
    }
    
    mapping(string => TransactionRecord) public transactions;
    string[] public transactionIds;
    
    address public owner;
    
    event TransactionRecorded(
        string indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 timestamp
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
        string memory _productId,
        address _buyer,
        address _seller,
        uint256 _amount,
        string memory _paymentMethod,
        string memory _status
    ) external onlyOwner {
        require(bytes(transactions[_orderId].orderId).length == 0, "Transaction already recorded");
        
        transactions[_orderId] = TransactionRecord({
            orderId: _orderId,
            productId: _productId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            timestamp: block.timestamp,
            paymentMethod: _paymentMethod,
            status: _status
        });
        
        transactionIds.push(_orderId);
        
        emit TransactionRecorded(_orderId, _buyer, _seller, _amount, block.timestamp);
    }
    
    function getTransaction(string memory _orderId) external view returns (TransactionRecord memory) {
        return transactions[_orderId];
    }
    
    function getAllTransactionIds() external view returns (string[] memory) {
        return transactionIds;
    }
    
    function getTransactionCount() external view returns (uint256) {
        return transactionIds.length;
    }
}