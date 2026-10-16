'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  // Active tombstones protect removed items from being resurrected by out-of-order server responses
  const removedTombstones = useRef<Map<string, number>>(new Map());
  // Backups for rolling back optimistic removals in case of network or server failure
  const rollbackBackups = useRef<Map<string, { item: CartItemData; previousCart: CartData }>>(new Map());
  const pendingRemovalCount = useRef<number>(0);

  // Helper to filter out any tombstoned items from a server-returned cart
  const filterOutTombstonedItems = useCallback((serverCart: CartData): CartData => {
    const now = Date.now();
    for (const [id, exp] of removedTombstones.current.entries()) {
      if (exp <= now) {
        removedTombstones.current.delete(id);
      }
    }

    if (removedTombstones.current.size === 0) {
      return serverCart;
    }

    const filteredItems = serverCart.items.filter((item) => {
      const expId = removedTombstones.current.get(item.id);
      const expVariant = removedTombstones.current.get(item.variantId);
      const isTombstoned = (expId && expId > now) || (expVariant && expVariant > now);
      return !isTombstoned;
    });

    if (filteredItems.length === serverCart.items.length) {
      return serverCart;
    }

    let subtotal = 0;
    let itemCount = 0;
    for (const item of filteredItems) {
      subtotal += item.variant.price * item.quantity;
      itemCount += item.quantity;
    }

    let discountAmount = 0;
    if (serverCart.discountCode && serverCart.discountAmount > 0 && serverCart.subtotal > 0 && subtotal > 0) {
      const discountRate = serverCart.discountAmount / serverCart.subtotal;
      discountAmount = Math.round(subtotal * discountRate);
    }

    return {
      ...serverCart,
      items: filteredItems,
      subtotal,
      itemCount,
      discountAmount,
      total: Math.max(0, subtotal - discountAmount),
    };
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(filterOutTombstonedItems(data));
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterOutTombstonedItems]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = async (variantId: string, quantity = 1) => {
    // Clear any tombstone for this variantId so re-adding works immediately
    for (const [key] of removedTombstones.current.entries()) {
      if (key === variantId) {
        removedTombstones.current.delete(key);
      }
    }

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
    if (quantity < 1) {
      return removeItem(itemId);
    }

    const previousCart = cart;

    // Optimistically update local cart state immediately
    setCart((prev) => {
      if (!prev) return prev;
      const targetItem = prev.items.find((i) => i.id === itemId || i.variantId === itemId);
      if (!targetItem) return prev;
      const diff = quantity - targetItem.quantity;
      const updatedItems = prev.items.map((i) =>
        i.id === targetItem.id ? { ...i, quantity } : i
      );
      const newSubtotal = Math.max(0, prev.subtotal + diff * targetItem.variant.price);
      let newDiscount = 0;
      if (prev.discountCode && prev.discountAmount > 0 && prev.subtotal > 0) {
        const discountRate = prev.discountAmount / prev.subtotal;
        newDiscount = Math.round(newSubtotal * discountRate);
      }
      return {
        ...prev,
        items: updatedItems,
        itemCount: Math.max(0, prev.itemCount + diff),
        subtotal: newSubtotal,
        discountAmount: newDiscount,
        total: Math.max(0, newSubtotal - newDiscount),
      };
    });

    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (previousCart) setCart(previousCart);
        return { success: false, message: data.error || 'Failed to update quantity' };
      }
      if (data.cart) {
        setCart(filterOutTombstonedItems(data.cart));
      }
      return { success: true };
    } catch {
      if (previousCart) setCart(previousCart);
      return { success: false, message: 'Network error updating cart' };
    }
  };

  const removeItem = async (itemId: string) => {
    if (!cart) return { success: true };

    const targetItem = cart.items.find((i) => i.id === itemId || i.variantId === itemId);
    if (!targetItem) {
      return { success: true };
    }

    const targetId = targetItem.id;
    const targetVariantId = targetItem.variantId;

    // Record rollback backup
    rollbackBackups.current.set(targetId, { item: targetItem, previousCart: cart });

    // Set tombstones with 15-second TTL to prevent resurrection by out-of-order server responses
    const expiry = Date.now() + 15000;
    removedTombstones.current.set(targetId, expiry);
    removedTombstones.current.set(targetVariantId, expiry);
    pendingRemovalCount.current += 1;

    // Optimistically remove from local cart state immediately (0ms delay)
    setCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.filter(
        (i) => i.id !== targetId && i.variantId !== targetVariantId
      );
      const removedSubtotal = targetItem.quantity * targetItem.variant.price;
      const newSubtotal = Math.max(0, prev.subtotal - removedSubtotal);
      let newDiscount = 0;
      if (prev.discountCode && prev.discountAmount > 0 && prev.subtotal > 0 && newSubtotal > 0) {
        const discountRate = prev.discountAmount / prev.subtotal;
        newDiscount = Math.round(newSubtotal * discountRate);
      }
      return {
        ...prev,
        items: updatedItems,
        itemCount: Math.max(0, prev.itemCount - targetItem.quantity),
        subtotal: newSubtotal,
        discountAmount: newDiscount,
        total: Math.max(0, newSubtotal - newDiscount),
      };
    });

    // Execute DELETE in background without global isLoading lock
    try {
      const res = await fetch(`/api/cart/items/${targetId}`, {
        method: 'DELETE',
      });
      pendingRemovalCount.current = Math.max(0, pendingRemovalCount.current - 1);

      if (!res.ok) {
        // Rollback on server failure
        removedTombstones.current.delete(targetId);
        removedTombstones.current.delete(targetVariantId);
        const backup = rollbackBackups.current.get(targetId);
        rollbackBackups.current.delete(targetId);

        if (backup) {
          setCart((prev) => {
            if (!prev) return backup.previousCart;
            const alreadyThere = prev.items.some((i) => i.id === targetId || i.variantId === targetVariantId);
            if (alreadyThere) return prev;
            const restoredItems = [backup.item, ...prev.items];
            const restoredSubtotal = prev.subtotal + backup.item.quantity * backup.item.variant.price;
            let restoredDiscount = 0;
            if (prev.discountCode && prev.discountAmount > 0) {
              const rate = prev.discountAmount / (prev.subtotal || 1);
              restoredDiscount = Math.round(restoredSubtotal * rate);
            }
            return {
              ...prev,
              items: restoredItems,
              itemCount: prev.itemCount + backup.item.quantity,
              subtotal: restoredSubtotal,
              discountAmount: restoredDiscount,
              total: Math.max(0, restoredSubtotal - restoredDiscount),
            };
          });
        }
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.error || 'Failed to remove item' };
      }

      // Deletion confirmed on server
      rollbackBackups.current.delete(targetId);
      const data = await res.json().catch(() => ({}));

      // Apply server cart calculations while respecting active tombstones
      if (data.cart) {
        setCart(filterOutTombstonedItems(data.cart));
      }

      return { success: true };
    } catch {
      pendingRemovalCount.current = Math.max(0, pendingRemovalCount.current - 1);
      // Rollback on network failure
      removedTombstones.current.delete(targetId);
      removedTombstones.current.delete(targetVariantId);
      const backup = rollbackBackups.current.get(targetId);
      rollbackBackups.current.delete(targetId);

      if (backup) {
        setCart((prev) => {
          if (!prev) return backup.previousCart;
          const alreadyThere = prev.items.some((i) => i.id === targetId || i.variantId === targetVariantId);
          if (alreadyThere) return prev;
          const restoredItems = [backup.item, ...prev.items];
          const restoredSubtotal = prev.subtotal + backup.item.quantity * backup.item.variant.price;
          let restoredDiscount = 0;
          if (prev.discountCode && prev.discountAmount > 0) {
            const rate = prev.discountAmount / (prev.subtotal || 1);
            restoredDiscount = Math.round(restoredSubtotal * rate);
          }
          return {
            ...prev,
            items: restoredItems,
            itemCount: prev.itemCount + backup.item.quantity,
            subtotal: restoredSubtotal,
            discountAmount: restoredDiscount,
            total: Math.max(0, restoredSubtotal - restoredDiscount),
          };
        });
      }

      return { success: false, message: 'Network error removing item' };
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
