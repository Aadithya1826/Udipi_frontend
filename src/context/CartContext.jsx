import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);


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
