import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AIAssistantOverlay from '../components/AIAssistantOverlay';
import { useCart } from '../context/CartContext';
import '../styles/ordersuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const {
    cartData = [],
    subtotal = 0,
    total = 0,
    gst = 0,
    formData = {},
    paymentMethod = 'Cash',
  } = location.state || {};

  const [countdown, setCountdown] = useState(10);

  // Clear cart on mount
  useEffect(() => {
    clearCart();
  }, []);

  // Auto-redirect to Invoice after 10 s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/invoice', {
            state: {
              cartData,
              subtotal,
              gst,
              finalTotal: total,
              mobileNumber: formData.phone || 'WALK-IN',
              paymentMethod
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, cartData, subtotal, total, gst, formData, paymentMethod]);

  // Generate a random order ID
  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="os-page">
      <div className="os-bg" />
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} showDateTime={true} />

      <main className="os-main">
        <div className="os-card">

          {/* Tick animation */}
          <div className="os-tick-wrap">
            <svg className="os-checkmark" viewBox="0 0 52 52">
              <circle className="os-check-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="os-check-path" fill="none" d="M14 27 l7 7 l17-17" />
            </svg>
          </div>

          <h1 className="os-title">Order Placed!</h1>
          <p className="os-subtitle">Your order has been confirmed successfully.</p>

          {/* Order meta */}
          <div className="os-meta">
            <div className="os-meta-item">
              <span className="os-meta-label">Order ID</span>
              <span className="os-meta-value">{orderId}</span>
            </div>
            <div className="os-meta-item">
              <span className="os-meta-label">Table</span>
              <span className="os-meta-value">No. {formData.table || '06'}</span>
            </div>
            <div className="os-meta-item">
              <span className="os-meta-label">Payment</span>
              <span className="os-meta-value os-badge">{paymentMethod}</span>
            </div>
            <div className="os-meta-item">
              <span className="os-meta-label">Total Paid</span>
              <span className="os-meta-value os-total">Rs. {Number(total).toFixed(2)}</span>
            </div>
          </div>

          {/* Items ordered */}
          {cartData.length > 0 && (
            <div className="os-items">
              <p className="os-items-title">Items Ordered</p>
              {cartData.map(item => (
                <div key={item.id} className="os-item-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chef mascot */}
          <img
            src="/chef_mascot.png"
            alt="Chef"
            className="os-mascot"
            onError={e => e.target.style.display = 'none'}
          />

          <p className="os-message">
            🍽️ Our chef is already preparing your delicious meal!
          </p>

          <div className="os-actions">
            <button className="os-home-btn" onClick={() => navigate('/')}>
              🏠 Back to Home
            </button>
            <button className="os-download-btn" onClick={() => {
              navigate('/invoice', {
                state: {
                  cartData,
                  subtotal,
                  gst,
                  finalTotal: total,
                  mobileNumber: formData.phone || 'WALK-IN',
                  paymentMethod
                }
              });
            }}>
              📥 Download Bill
            </button>
          </div>

          <p className="os-countdown">
            Redirecting to E-Invoice in <strong>{countdown}s</strong>…
          </p>
        </div>
      </main>
      <AIAssistantOverlay />
    </div>
  );
};

export default OrderSuccess;
