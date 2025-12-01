// backend/src/services/systemWalletService.js
const { ethers } = require('ethers');
const { prisma } = require('../config/database');

class SystemWalletService {
  constructor() {
    // Store user identifiers (user IDs mapped to blockchain identifiers)
    this.userIdentifiers = new Map();

    console.log('✅ System Wallet Service initialized for user identifiers');
  }

  /**
   * Get user identifier for blockchain - uses actual user IDs
   * Now stores in database for persistence and reverse lookup
   * Example: "35883486-e6aa-46c8-b765-7e5a11e456f4" → "buyer_35883486e6aa46c8b7657e5a11e456f4"
   */
  async getUserWalletAddress(userId, role = 'BUYER') {
    if (!userId) {
      console.error('❌ User ID is required for generating identifier');
      return this.getFallbackIdentifier(role);
    }

    try {
      // Check if identifier exists in database
      let identifier = await prisma.blockchainIdentifier.findUnique({
        where: {
          userId_role: {
            userId: userId,
            role: role
          }
        }
      });

      if (identifier) {
        // Update usage count and last used time
        await prisma.blockchainIdentifier.update({
          where: { id: identifier.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        });

        console.log('✅ Retrieved existing blockchain identifier:', {
          userId,
          role,
          blockchainId: identifier.blockchainId,
          usageCount: identifier.usageCount + 1
        });

        return identifier.blockchainId;
      }

      // Generate new identifier
      const blockchainId = this.generateUserIdentifier(userId, role);

      // Store in database
      identifier = await prisma.blockchainIdentifier.create({
        data: {
          userId: userId,
          role: role,
          blockchainId: blockchainId,
          usageCount: 1
        }
      });

      console.log('🔑 Generated and stored new blockchain identifier:', {
        userId,
        role,
        blockchainId: identifier.blockchainId
      });

      return identifier.blockchainId;

    } catch (error) {
      console.error('❌ Error getting blockchain identifier:', error);
      // Fallback to in-memory generation
      return this.generateUserIdentifier(userId, role);
    }
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
   * Get buyer identifier (convenience method)
   */
  async getBuyerIdentifier(buyerUserId) {
    return await this.getUserWalletAddress(buyerUserId, 'BUYER');
  }

  /**
   * Get producer identifier (convenience method)
   */
  async getProducerIdentifier(producerUserId) {
    return await this.getUserWalletAddress(producerUserId, 'PRODUCER');
  }

  /**
   * Reverse lookup: Find user by blockchain identifier
   */
  async getUserByBlockchainId(blockchainId) {
    try {
      const identifier = await prisma.blockchainIdentifier.findUnique({
        where: { blockchainId: blockchainId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!identifier) {
        return null;
      }

      return {
        user: identifier.user,
        role: identifier.role,
        usageCount: identifier.usageCount,
        createdAt: identifier.createdAt,
        lastUsedAt: identifier.lastUsedAt
      };
    } catch (error) {
      console.error('❌ Error in reverse lookup:', error);
      return null;
    }
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