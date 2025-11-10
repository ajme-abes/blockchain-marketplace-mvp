// src/services/cartService.ts - UPDATED VERSION
import { CartItem } from '@/contexts/CartContext';

export interface CartStorage {
  items: CartItem[];
  timestamp: number;
  version: string;
  userId?: string;
}

export const CART_VERSION = '1.1.0';

// Get storage key based on user ID
export const getCartStorageKey = (userId: string | undefined): string => {
  return userId ? `blockchain-marketplace-cart-${userId}` : 'blockchain-marketplace-cart-guest';
};

export const cartService = {
  // Save cart to localStorage
  saveCart(items: CartItem[], userId?: string): void {
    try {
      const storageKey = getCartStorageKey(userId);
      const cartData: CartStorage = {
        items,
        timestamp: Date.now(),
        version: CART_VERSION,
        userId,
      };
      localStorage.setItem(storageKey, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
      throw new Error('Failed to save cart');
    }
  },

  // Load cart from localStorage
  loadCart(userId?: string): CartItem[] {
    try {
      const storageKey = getCartStorageKey(userId);
      const savedCart = localStorage.getItem(storageKey);
      
      if (!savedCart) return [];

      const cartData: CartStorage = JSON.parse(savedCart);
      
      // Validate cart data structure
      if (!cartData.items || !Array.isArray(cartData.items)) {
        this.clearCart(userId);
        return [];
      }

      // Migrate data if version changed
      if (cartData.version !== CART_VERSION) {
        console.warn('Cart version mismatch, migrating...');
        // Add migration logic if needed
      }

      return cartData.items;
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      this.clearCart(userId);
      return [];
    }
  },

  // Clear cart from localStorage
  clearCart(userId?: string): void {
    try {
      const storageKey = getCartStorageKey(userId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  },

  // Migrate guest cart to user cart (when user logs in)
  migrateGuestCartToUserCart(guestItems: CartItem[], userId: string): CartItem[] {
    try {
      const userCart = this.loadCart(userId);
      
      // Merge guest cart with user cart, preferring user cart for duplicates
      const mergedItems = [...userCart];
      
      guestItems.forEach(guestItem => {
        const existingIndex = mergedItems.findIndex(item => item.productId === guestItem.productId);
        if (existingIndex >= 0) {
          // Update quantity if item exists
          mergedItems[existingIndex].quantity += guestItem.quantity;
        } else {
          // Add new item
          mergedItems.push(guestItem);
        }
      });

      // Save merged cart
      this.saveCart(mergedItems, userId);
      
      // Clear guest cart
      this.clearCart(); // Clear guest cart
      
      return mergedItems;
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
      return userCart;
    }
  },

  // Validate cart item
  validateCartItem(item: Partial<CartItem>): boolean {
    return !!(item.productId && item.name && item.price && item.quantity && item.stock);
  },

  // Calculate cart totals
  calculateTotals(items: CartItem[]): { total: number; itemCount: number } {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return { total, itemCount };
  },

  // Check if item can be added (stock validation)
  canAddItem(currentQuantity: number, quantityToAdd: number, stock: number): boolean {
    return currentQuantity + quantityToAdd <= stock;
  },

  // Get cart statistics
  getCartStats(items: CartItem[]) {
    const { total, itemCount } = this.calculateTotals(items);
    const uniqueProducts = new Set(items.map(item => item.productId)).size;
    const categories = new Set(items.map(item => item.category));
    const regions = new Set(items.map(item => item.region));

    return {
      total,
      itemCount,
      uniqueProducts,
      categories: Array.from(categories),
      regions: Array.from(regions),
    };
  },
};

export default cartService;