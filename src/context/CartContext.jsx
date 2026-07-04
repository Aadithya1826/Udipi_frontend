import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const location = useLocation();
  const isTakeaway = location.pathname.includes('takeaway') || location.pathname.includes('take-away');
  const cartKey = isTakeaway ? 'takeaway' : 'dinein';

  const [tableNumber, setTableNumber] = useState(() => {
    let tableParam = new URLSearchParams(window.location.search).get('table');
    if (!tableParam && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      tableParam = new URLSearchParams(hashQuery).get('table');
    }
    if (tableParam) {
      const cleanTable = tableParam.replace(/\D/g, '');
      localStorage.setItem('active_table_number', cleanTable);
      return cleanTable;
    }
    const saved = localStorage.getItem('active_table_number') || '06';
    return saved.replace(/\D/g, '');
  });

  useEffect(() => {
    let tableParam = new URLSearchParams(location.search).get('table');
    if (!tableParam && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      tableParam = new URLSearchParams(hashQuery).get('table');
    }
    if (tableParam) {
      const cleanTable = tableParam.replace(/\D/g, '');
      localStorage.setItem('active_table_number', cleanTable);
      setTableNumber(cleanTable);
    }
  }, [location.search, location.hash]);

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

  const addToCart = (item, initialQuantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + initialQuantity } : c
        );
      }
      return [...prev, { ...item, quantity: initialQuantity, note: '' }];
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

  const updateItemQuantity = (id, quantity) => {
    if (quantity < 0) return;
    setCart((prev) => {
      if (quantity === 0) {
        return prev.filter((c) => c.id !== id);
      }
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) => (c.id === id ? { ...c, quantity } : c));
      }
      return prev;
    });
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

  const clearAllCarts = () => {
    setCarts({ dinein: [], takeaway: [] });
  };

  const totalItems = cart.length;
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const serviceCharge = 0;
  const gst = 0;
  const totalAmount = subtotal;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        changeQty,
        updateItemQuantity,
        removeCartItem,
        updateNote,
        clearCart,
        clearAllCarts,
        totalItems,
        subtotal,
        serviceCharge,
        gst,
        totalAmount,
        tableNumber,
        setTableNumber,
        isCartOpen,
        setIsCartOpen,
        activeCategory,
        setActiveCategory
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
