import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ActiveOrderBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderType, setActiveOrderType] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);

  const checkActiveOrder = () => {
    setActiveOrderId(localStorage.getItem('active_order_id'));
    setActiveOrderType(localStorage.getItem('active_order_type'));
    setTableNumber(localStorage.getItem('active_table_number'));
  };

  useEffect(() => {
    checkActiveOrder();
    // Also check when location changes in case it was cleared
    window.addEventListener('storage', checkActiveOrder);
    return () => window.removeEventListener('storage', checkActiveOrder);
  }, [location.pathname]);

  // Don't show the banner on the tracking pages themselves
  const hidePaths = ['/order-success', '/takeaway-order-success', '/invoice'];
  if (!activeOrderId || hidePaths.includes(location.pathname)) return null;

  const handleTrackClick = () => {
    if (activeOrderType === 'takeaway') {
      navigate('/takeaway-order-success', { state: { autoTrack: true, orderId: activeOrderId } });
    } else if (activeOrderType === 'dine-in') {
      navigate('/order-success', { state: { autoTrack: true, orderId: activeOrderId, tableNumber: tableNumber || '06' } });
    } else if (activeOrderType === 'agent') {
      navigate('/invoice', { state: { orderId: activeOrderId, autoDownload: false } });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px', // Above the AIAssistant bubble and mobile navigation
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#ff4e00',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '50px',
      boxShadow: '0 4px 15px rgba(255, 78, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      zIndex: 9999,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontFamily: 'inherit'
    }} onClick={handleTrackClick}>
      <span><i className="fa-solid fa-bell"></i> You have an active order ({activeOrderId})</span>
      <button style={{
        background: 'white',
        color: '#ff4e00',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '20px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>Track</button>
    </div>
  );
};

export default ActiveOrderBanner;
