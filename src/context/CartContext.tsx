'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CartItemData {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    product: {
      id: string;
      title: string;
      slug: string;
      images: { url: string; altText: string }[];
    };
  };
}

export interface CartData {
  id: string;
  items: CartItemData[];
  discountCode: string | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  itemCount: number;
}

interface CartContextType {
  cart: CartData | null;
  cartCount: number;
  isCartOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  applyDiscount: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeDiscount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to add item to cart' };
      }
      await refreshCart();
      setIsCartOpen(true);
      return { success: true };
    } catch {
      return { success: false, message: 'Network error adding item' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to update quantity' };
      }
      await refreshCart();
      return { success: true };
    } catch {
      return { success: false, message: 'Network error updating cart' };
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, message: data.error || 'Failed to remove item' };
      }
      await refreshCart();
      return { success: true };
    } catch {
      return { success: false, message: 'Network error removing item' };
    } finally {
      setIsLoading(false);
    }
  };

  const applyDiscount = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid discount code' };
      }
      await refreshCart();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Failed to verify discount' };
    } finally {
      setIsLoading(false);
    }
  };

  const removeDiscount = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/cart/discount', { method: 'DELETE' });
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove discount', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cart?.itemCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isCartOpen,
        isLoading,
        openCart,
        closeCart,
        toggleCart,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        applyDiscount,
        removeDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
