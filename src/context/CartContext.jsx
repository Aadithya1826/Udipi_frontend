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
    localStorage.removeItem('udipi_carts_v2');
    const saved = sessionStorage.getItem('udipi_carts_session_v1');
    return saved ? JSON.parse(saved) : { dinein: [], takeaway: [] };
  });

  useEffect(() => {
    sessionStorage.setItem('udipi_carts_session_v1', JSON.stringify(carts));
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
    const q = isNaN(Number(initialQuantity)) ? 1 : Number(initialQuantity);
    const updateHelper = (prevList) => {
      const existing = prevList.find((c) => c.id === item.id);
      if (existing) {
        return prevList.map((c) =>
          c.id === item.id ? { ...c, quantity: (Number(c.quantity) || 0) + q } : c
        );
      }
      return [...prevList, { ...item, quantity: q, note: '' }];
    };

    setCarts((prev) => {
      const isOnHome = location.pathname === '/' || location.pathname === '';
      if (isOnHome || (!prev.dinein?.length && !prev.takeaway?.length)) {
        return {
          dinein: updateHelper(prev.dinein || []),
          takeaway: updateHelper(prev.takeaway || [])
        };
      }
      const currentCart = prev[cartKey] || [];
      const updatedCart = updateHelper(currentCart);
      const otherKey = cartKey === 'dinein' ? 'takeaway' : 'dinein';
      const otherCart = (!prev[otherKey] || prev[otherKey].length === 0) ? updatedCart : prev[otherKey];
      return { ...prev, [cartKey]: updatedCart, [otherKey]: otherCart };
    });
  };

  const syncCartToOtherMode = (targetMode) => {
    const targetKey = String(targetMode).toLowerCase().includes('takeaway') || String(targetMode).toLowerCase().includes('take-away') ? 'takeaway' : 'dinein';
    const sourceKey = targetKey === 'takeaway' ? 'dinein' : 'takeaway';
    setCarts(prev => {
      const sourceCart = prev[sourceKey] || [];
      const currentTarget = prev[targetKey] || [];
      return {
        ...prev,
        [targetKey]: sourceCart.length > 0 ? [...sourceCart] : currentTarget
      };
    });
  };

  const changeQty = (id, delta) => {
    const d = isNaN(Number(delta)) ? 0 : Number(delta);
    setCarts((prev) => {
      const updater = (list) => (list || [])
        .map((c) => (c.id === id ? { ...c, quantity: Math.max(0, (Number(c.quantity) || 0) + d) } : c))
        .filter((c) => c.quantity > 0);
      return { dinein: updater(prev.dinein), takeaway: updater(prev.takeaway) };
    });
  };

  const updateItemQuantity = (id, quantity) => {
    const q = isNaN(Number(quantity)) ? -1 : Number(quantity);
    if (q < 0) return;
    setCarts((prev) => {
      const updater = (list) => {
        if (q === 0) return (list || []).filter((c) => c.id !== id);
        return (list || []).map((c) => (c.id === id ? { ...c, quantity: q } : c));
      };
      return { dinein: updater(prev.dinein), takeaway: updater(prev.takeaway) };
    });
  };

  const removeCartItem = (id) => {
    setCarts((prev) => ({
      dinein: (prev.dinein || []).filter((c) => c.id !== id),
      takeaway: (prev.takeaway || []).filter((c) => c.id !== id)
    }));
  };

  const updateNote = (id, note) => {
    setCarts((prev) => ({
      dinein: (prev.dinein || []).map((c) => (c.id === id ? { ...c, note } : c)),
      takeaway: (prev.takeaway || []).map((c) => (c.id === id ? { ...c, note } : c))
    }));
  };

  const clearCart = () => {
    setCarts({ dinein: [], takeaway: [] });
  };

  const clearAllCarts = () => {
    setCarts({ dinein: [], takeaway: [] });
  };

  const totalItems = cart.length;
  const subtotal = cart.reduce((s, c) => s + (Number(c.price) || 0) * (Number(c.quantity) || 0), 0);
  const serviceCharge = 0;
  const gst = 0;
  const totalAmount = subtotal;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  useEffect(() => {
    const checkActive = () => {
      setHasActiveOrder(!!localStorage.getItem('active_order_id'));
    };
    checkActive();
    window.addEventListener('storage', checkActive);
    return () => window.removeEventListener('storage', checkActive);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        syncCartToOtherMode,
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
        setActiveCategory,
        hasActiveOrder
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
