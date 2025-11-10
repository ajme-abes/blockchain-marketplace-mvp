// src/contexts/CartContext.tsx - UPDATED VERSION
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  region: string;
  unit: string;
  stock: number;
  producerId: string;
  producerName?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoaded: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'SET_LOADED' };

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

// Generate unique cart item ID
const generateCartItemId = (productId: string, userId: string) => {
  return `cart_${userId}_${productId}_${Date.now()}`;
};

// Get storage key based on user ID
const getCartStorageKey = (userId: string | undefined) => {
  return userId ? `blockchain-marketplace-cart-${userId}` : 'blockchain-marketplace-cart-guest';
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { 
                ...item, 
                quantity: Math.min(item.quantity + action.payload.quantity, item.stock),
                price: action.payload.price // Update price in case it changed
              }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }

      return calculateCartTotals(newItems);
    }

    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return calculateCartTotals(filteredItems);
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items
        .map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(0, Math.min(action.payload.quantity, item.stock)) }
            : item
        )
        .filter(item => item.quantity > 0);
      
      return calculateCartTotals(updatedItems);
    }

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        itemCount: 0,
        isLoaded: true,
      };

    case 'LOAD_CART':
      return {
        ...calculateCartTotals(action.payload),
        isLoaded: true,
      };

    case 'SET_LOADED':
      return {
        ...state,
        isLoaded: true,
      };

    default:
      return state;
  }
};

// Helper function to calculate cart totals
const calculateCartTotals = (items: CartItem[]): CartState => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    total,
    itemCount,
    isLoaded: true,
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth(); // Add this to get current user

  // Load cart from localStorage on mount or when user changes
  useEffect(() => {
    try {
      const storageKey = getCartStorageKey(user?.id);
      const savedCart = localStorage.getItem(storageKey);
      
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } else {
        // If no cart found for this user, start with empty cart
        dispatch({ type: 'LOAD_CART', payload: [] });
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    } finally {
      dispatch({ type: 'SET_LOADED' });
    }
  }, [user?.id]); // Reload cart when user changes

  // Save cart to localStorage whenever it changes or user changes
  useEffect(() => {
    if (state.isLoaded && user) {
      try {
        const storageKey = getCartStorageKey(user.id);
        localStorage.setItem(storageKey, JSON.stringify(state.items));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [state.items, state.isLoaded, user?.id]); // Save when cart changes or user changes

  const addToCart = (itemData: Omit<CartItem, 'id'>) => {
    if (!user && !isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItem = {
      ...itemData,
      id: generateCartItemId(itemData.productId, user?.id || 'guest'),
    };

    const existingItem = state.items.find(item => item.productId === itemData.productId);
    const newQuantity = existingItem ? existingItem.quantity + itemData.quantity : itemData.quantity;

    if (newQuantity > itemData.stock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${itemData.stock} ${itemData.unit} available in stock`,
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: cartItem });

    toast({
      title: "Added to cart! 🛒",
      description: `${itemData.quantity} ${itemData.unit} of ${itemData.name} added to cart`,
    });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const contextValue: CartContextType = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoaded: false,
};