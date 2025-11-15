// backend/src/services/systemWalletService.js
const { ethers } = require('ethers');

class SystemWalletService {
  constructor() {
    // Store user identifiers (user IDs mapped to blockchain identifiers)
    this.userIdentifiers = new Map();
    
    console.log('✅ System Wallet Service initialized for user identifiers');
  }

  /**
   * Get user identifier for blockchain - uses actual user IDs
   * Example: "35883486-e6aa-46c8-b765-7e5a11e456f4" → "buyer_35883486e6aa46c8b7657e5a11e456f4"
   */
  getUserWalletAddress(userId, role = 'BUYER') {
    if (!userId) {
      console.error('❌ User ID is required for generating identifier');
      return this.getFallbackIdentifier(role);
    }

    // Create a unique key for this user+role combination
    const identifierKey = `${role.toUpperCase()}_${userId}`;
    
    // Return cached identifier or generate new one
    if (!this.userIdentifiers.has(identifierKey)) {
      const identifier = this.generateUserIdentifier(userId, role);
      this.userIdentifiers.set(identifierKey, identifier);
      
      console.log('🔑 Generated new user identifier:', {
        userId,
        role,
        identifier,
        identifierKey
      });
    }
    
    return this.userIdentifiers.get(identifierKey);
  }

  /**
   * Generate deterministic user identifier from user ID
   */
  generateUserIdentifier(userId, role = 'BUYER') {
    try {
      // Remove dashes from UUID for cleaner identifier
      const cleanUserId = userId.replace(/-/g, '');
      
      // Create role-specific identifier
      // Format: "role_cleanedUserId"
      const identifier = `${role.toLowerCase()}_${cleanUserId}`;
      
      // Validate it's not too long (blockchain gas optimization)
      if (identifier.length > 64) {
        console.warn('⚠️ User identifier might be too long:', identifier);
      }
      
      return identifier;
      
    } catch (error) {
      console.error('❌ Error generating user identifier:', error);
      return this.getFallbackIdentifier(role);
    }
  }

  /**
   * Fallback identifier in case of errors
   */
  getFallbackIdentifier(role = 'BUYER') {
    const fallback = `${role.toLowerCase()}_fallback_${Date.now()}`;
    console.warn('⚠️ Using fallback identifier:', fallback);
    return fallback;
  }

  /**
   * Get buyer identifier (convenience method) - THIS IS THE MISSING METHOD!
   */
  getBuyerIdentifier(buyerUserId) {
    return this.getUserWalletAddress(buyerUserId, 'BUYER');
  }

  /**
   * Get producer identifier (convenience method)
   */
  getProducerIdentifier(producerUserId) {
    return this.getUserWalletAddress(producerUserId, 'PRODUCER');
  }

  /**
   * System address (only for contract ownership - not for user identification)
   */
  getSystemAddress() {
    return process.env.SYSTEM_WALLET_ADDRESS || '0x0BACfe253c447A406A5d834b9e266939ebEc0b00';
  }

  /**
   * Get all generated identifiers (for debugging)
   */
  getAllIdentifiers() {
    return Array.from(this.userIdentifiers.entries()).map(([key, identifier]) => ({
      key,
      identifier
    }));
  }

  /**
   * Clear cached identifiers (for testing)
   */
  clearCache() {
    const count = this.userIdentifiers.size;
    this.userIdentifiers.clear();
    console.log(`🧹 Cleared ${count} cached identifiers`);
    return count;
  }
}

module.exports = new SystemWalletService();