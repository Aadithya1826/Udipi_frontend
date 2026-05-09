import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const location = useLocation();
  const isTakeaway = location.pathname.includes('takeaway') || location.pathname.includes('take-away');
  const cartKey = isTakeaway ? 'takeaway' : 'dinein';

  const [carts, setCarts] = useState(() => {
    const saved = localStorage.getItem('udipi_carts_v2');
    return saved ? JSON.parse(saved) : { dinein: [], takeaway: [] };
  });

  useEffect(() => {
    localStorage.setItem('udipi_carts_v2', JSON.stringify(carts));
  }, [carts]);

  const cart = carts[cartKey] || [];

  const setCart = (newCartOrUpdater) => {
    setCarts((prev) => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = typeof newCartOrUpdater === 'function' ? newCartOrUpdater(currentCart) : newCartOrUpdater;
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeCartItem = (id) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const updateNote = (id, note) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, note } : c))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const serviceCharge = subtotal * 0.05;
  const gst = subtotal * 0.18;
  const totalAmount = subtotal + serviceCharge + gst;

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        changeQty,
        removeCartItem,
        updateNote,
        clearCart,
        totalItems,
        subtotal,
        serviceCharge,
        gst,
        totalAmount,
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
