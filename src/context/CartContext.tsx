import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, Shop } from '../types';

interface CartContextType {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;
  shopImage: string | null;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: MenuItem, shop: Shop) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  getItemQuantity: (itemId: string) => number;
  clearCart: () => void;
  conflictData: { newItem: MenuItem; newShop: Shop; existingShopName: string } | null;
  resolveConflict: (replace: boolean) => void;
}

const CART_STORAGE_KEY = 'foodflow_cart_state';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.items || [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [shopId, setShopId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).shopId || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [shopName, setShopName] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).shopName || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [shopImage, setShopImage] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved).shopImage || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    newItem: MenuItem;
    newShop: Shop;
    existingShopName: string;
  } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items, shopId, shopName, shopImage })
      );
    } catch {
      // ignore
    }
  }, [items, shopId, shopName, shopImage]);

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce(
    (acc, curr) => acc + curr.menuItem.price * curr.quantity,
    0
  );

  const getItemQuantity = (itemId: string): number => {
    const item = items.find((i) => i.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const addItem = (item: MenuItem, shop: Shop) => {
    if (!item.isAvailable) return;

    // Check if cart has items from a different shop
    if (shopId && shopId !== shop.id && items.length > 0) {
      setConflictData({
        newItem: item,
        newShop: shop,
        existingShopName: shopName || 'another stall',
      });
      return;
    }

    setShopId(shop.id);
    setShopName(shop.name);
    setShopImage(shop.image);

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, shopId: shop.id }];
    });
  };

  const resolveConflict = (replace: boolean) => {
    if (replace && conflictData) {
      setShopId(conflictData.newShop.id);
      setShopName(conflictData.newShop.name);
      setShopImage(conflictData.newShop.image);
      setItems([
        {
          menuItem: conflictData.newItem,
          quantity: 1,
          shopId: conflictData.newShop.id,
        },
      ]);
    }
    setConflictData(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === itemId);
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const remaining = prev.filter((i) => i.menuItem.id !== itemId);
        if (remaining.length === 0) {
          setShopId(null);
          setShopName(null);
          setShopImage(null);
        }
        return remaining;
      }

      return prev.map((i) =>
        i.menuItem.id === itemId ? { ...i, quantity: newQty } : i
      );
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.menuItem.id !== itemId);
      if (remaining.length === 0) {
        setShopId(null);
        setShopName(null);
        setShopImage(null);
      }
      return remaining;
    });
  };

  const clearCart = () => {
    setItems([]);
    setShopId(null);
    setShopName(null);
    setShopImage(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        shopId,
        shopName,
        shopImage,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        conflictData,
        resolveConflict,
      }}
    >
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
