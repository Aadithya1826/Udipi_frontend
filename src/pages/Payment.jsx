import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';

import '../styles/payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cart,
    changeQty,
    updateItemQuantity,
    removeCartItem,
    updateNote,
    totalItems,
    subtotal,
    serviceCharge,
    gst,
    totalAmount: total,
    tableNumber,
    isCartOpen,
    setIsCartOpen
  } = useCart();
  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [isPollingCash, setIsPollingCash] = useState(false);

  const { formData: rawFormData = {}, autoConfirmMethod } = location.state || {};
  const formData = {
    name: rawFormData.name || sessionStorage.getItem('customer_name') || '',
    phone: rawFormData.phone || sessionStorage.getItem('customer_phone') || ''
  };

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/dine-in', { replace: true });
    }
  }, [cart, navigate]);

  useEffect(() => {
    setIsCartOpen(false);
    
    if (autoConfirmMethod) {
      setSelectedMethod(autoConfirmMethod);
      setTimeout(() => {
        handleConfirm(autoConfirmMethod);
      }, 500);
    }
    
    const handleSelectPayment = (e) => {
      if (e.detail && e.detail.method) {
        const method = e.detail.method === 'Cash' ? 'Cash' : 'UPI';
        setSelectedMethod(method);
      }
    };
    const handleConfirmOrder = (e) => {
      let currentMethod = 'Cash';
      if (e && e.detail && e.detail.method) {
        currentMethod = e.detail.method;
      } else {
        const pmElement = document.querySelector('.payment-method-card.selected .pm-name');
        currentMethod = pmElement && pmElement.innerText.includes('Online') ? 'UPI' : 'Cash';
      }
      handleConfirm(currentMethod);
    };
    
    document.addEventListener('select-payment', handleSelectPayment);
    document.addEventListener('confirm-place-order', handleConfirmOrder);
    
    return () => {
      setIsCartOpen(false);
      document.removeEventListener('select-payment', handleSelectPayment);
      document.removeEventListener('confirm-place-order', handleConfirmOrder);
    };
  }, []);

  const handleConfirm = async (methodOverride) => {
    const methodToUse = typeof methodOverride === 'string' ? methodOverride : selectedMethod;
    setIsCartOpen(false);

    if (methodToUse === 'Cash') {
      const orderData = {
        table_number: tableNumber,
        payment_method: 'Cash',
        phone: formData.phone || '',
        cart: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          note: item.note || ''
        })),
        subtotal: subtotal,
        gst: gst,
        service_charge: serviceCharge,
        total_amount: total
      };

      try {
        const res = await fetch(`/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        const data = await res.json();
        const dbId = data.dbOrderId || data.order_id || data.id;
        const generatedOrderId = data.orderId || (dbId ? `ORD-${String(dbId).padStart(6, '0')}` : `ORD-${Math.floor(100000 + Math.random() * 900000)}`);

        if (dbId) {
          localStorage.setItem('active_order_id', generatedOrderId);
          localStorage.setItem('active_order_type', 'dine-in');
          localStorage.setItem('active_table_number', tableNumber || '06');
          navigate('/order-success', {
            state: {
              orderId: generatedOrderId,
              cartData: cart,
              subtotal, gst, total, formData, paymentMethod: 'Cash'
            }
          });
        } else {
          localStorage.setItem('active_order_id', generatedOrderId);
          localStorage.setItem('active_order_type', 'dine-in');
          localStorage.setItem('active_table_number', tableNumber || '06');
          navigate('/order-success', {
            state: {
              orderId: generatedOrderId,
              cartData: cart,
              subtotal, gst, total, formData, paymentMethod: 'Cash'
            }
          });
        }
      } catch (err) {
        console.error('Order placement error:', err);
        navigate('/order-success', {
          state: {
            orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            cartData: cart,
            subtotal, gst, total, formData, paymentMethod: 'Cash'
          }
        });
      }
      return;
    }

    // Razorpay Integration
    const orderData = {
      table_number: tableNumber || '06',
      payment_method: 'Razorpay',
      phone: formData.phone || '',
      cart: cart.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        note: item.note || ''
      })),
      subtotal: subtotal,
      gst: gst,
      service_charge: serviceCharge,
      total_amount: total
    };

    try {
      // 1. Create order in our DB first
      const orderRes = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const orderResult = await orderRes.json();
      const dbId = orderResult.dbOrderId || orderResult.order_id || orderResult.id;
      const generatedOrderId = orderResult.orderId || (dbId ? `ORD-${String(dbId).padStart(6, '0')}` : `ORD-${Math.floor(100000 + Math.random() * 900000)}`);

      // 2. Load Razorpay script
      const res = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        throw new Error('Razorpay SDK failed to load');
      }

      // 3. Fetch Razorpay Key ID and Create Razorpay order on backend
      let razorpayKeyId = '';
      try {
        const keyRes = await fetch(`/api/razorpay-key`);
        const keyData = await keyRes.json();
        razorpayKeyId = keyData.key_id;
      } catch (keyErr) {
        console.error('Failed to fetch Razorpay key from backend:', keyErr);
      }

      const rzpOrderRes = await fetch(`/api/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      const rzpOrder = await rzpOrderRes.json();

      if (!rzpOrder.success) {
        console.warn(rzpOrder.message || 'Failed to create Razorpay order on backend. Falling back to direct client checkout.');
      }

      if (!razorpayKeyId) {
        throw new Error('Razorpay Key ID is not configured on the backend');
      }

      // 4. Open Razorpay Checkout modal
      const options = {
        key: razorpayKeyId,
        amount: rzpOrder.success ? rzpOrder.order.amount : total * 100,
        currency: rzpOrder.success ? rzpOrder.order.currency : 'INR',
        name: 'Data Udipi',
        description: 'Food Order Payment',
        image: '',
        ...(rzpOrder.success && { order_id: rzpOrder.order.id }),
        handler: async function (response) {
          localStorage.setItem('active_order_id', generatedOrderId);
          localStorage.setItem('active_order_type', 'dine-in');
          localStorage.setItem('active_table_number', tableNumber || '06');
          // On successful payment
          navigate('/order-success', {
            state: {
              orderId: generatedOrderId,
              cartData: cart,
              subtotal, gst, total, formData, paymentMethod: 'Razorpay'
            }
          });
        },
        prefill: {
          contact: formData.phone || ''
        },
        theme: {
          color: '#ff4e00'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        navigate('/payment-failed', { state: { total, isTakeAway: false, formData, cart } });
      });
      rzp.open();

    } catch (err) {
      console.error('Payment error:', err);
      navigate('/payment-failed', { state: { total, isTakeAway: false, formData, cart } });
    }
  };

  // UPI payment string (not used for display anymore but kept for any other references if needed)
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dataudipi@upi%26pn=DataUdipi%26am=${total.toFixed(2)}%26cu=INR`;

  return (
    <div className="payment-page">
      <div className="payment-bg" />
      <Header tableNumber={tableNumber} showFullHeader={true} useTitleImage={true} showDateTime={true} />

      <main className="payment-main">
        <div className="payment-card">
          <Link to="/checkout" state={location.state} className="payment-back-link">
            ← Back to Checkout
          </Link>

          <h2 className="payment-title">Payment</h2>
          <p className="payment-subtitle">Choose Your Payment Method</p>

          <div className="payment-methods">
            <div
              className={`payment-method-card ${selectedMethod === 'Cash' ? 'selected' : ''}`}
              onClick={() => {
                setSelectedMethod('Cash');
              }}
            >
              <div className="pm-icon-wrap">
                <i className="fa-solid fa-money-bill-wave"></i>
              </div>
              <div>
                <p className="pm-name">Cash</p>
                <p className="pm-desc">Pay at the counter</p>
              </div>
            </div>
            <div
              className={`payment-method-card ${selectedMethod === 'UPI' ? 'selected' : ''}`}
              onClick={() => {
                setSelectedMethod('UPI');
              }}
            >
              <div className="pm-icon-wrap">
                <i className="fa-solid fa-mobile-screen-button"></i>
              </div>
              <div>
                <p className="pm-name">Online Payment</p>
                <p className="pm-desc">GPay, PhonePe, Cards, UPI</p>
              </div>
            </div>
          </div>

          <div className="payment-billing">
            <div className="pb-row">
              <span>Sub total</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="pb-row pb-total">
              <span>Total :</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          {/* CTA */}
          <button id="payment-confirm-btn" className="payment-confirm-btn" onClick={handleConfirm}>
            Confirm & Place Order
          </button>
        </div>
      </main>

      {totalItems > 0 && (
        <button className="pm-view-cart-btn" onClick={() => setIsCartOpen(true)}>
          <i className="fa-solid fa-cart-shopping" />
          <span>View Cart</span>
          <span className="pm-cart-badge">{totalItems}</span>
        </button>
      )}

      {/* Cart sidebar (Floating) - Exact Design Match */}
      {isCartOpen && (
        <div className="di-sidebar di-cart-mode active">
          <div className="di-cart-header">
            <div className="di-cart-header-left">
              <span className="di-cart-title">Cart</span>
              <span className="di-cart-table-pill">Table No : {tableNumber} <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
            </div>
            <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>
          <div className="di-cart-order-id"># New Order</div>

          <div className="di-order-type-tabs">
            <button className="di-ot-tab active"><i className="fa-solid fa-utensils" /> Dine In</button>
            <button className="di-ot-tab" onClick={() => navigate('/take-away')}><i className="fa-solid fa-bag-shopping" /> Take Away</button>
          </div>

          <div className="di-cart-items">
            {cart.length === 0
              ? <p className="di-cart-empty">Cart is empty. Add items from the menu.</p>
              : cart.map(item => (
                <div key={item.id} className="di-cart-item-container">
                  <button className="di-cart-remove-circle" onClick={() => removeCartItem(item.id)}>✕</button>
                  <div className="di-cart-item-body">
                    <div className="di-cart-item-thumb">
                      {item.image ? <img src={item.image} alt={item.name} /> : <span className="di-cart-thumb-emoji">{item.emoji || '🍽️'}</span>}
                    </div>
                    <div className="di-cart-item-details">
                      <p className="di-cart-item-name">{item.name}</p>
                      <p className="di-cart-serves">Serves : 1</p>
                      <p className="di-cart-item-price">Rs. {item.price}</p>
                    </div>
                    <div className="di-cart-item-right">
                      <p className="di-cart-total-label">Total</p>
                      <p className="di-cart-total-amount">{(item.price * item.quantity).toFixed(2)}</p>
                      <div className="di-cart-stepper">
                        <button className="di-cart-qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                        <input 
                          className="di-cart-qty-num"
                          type="text"
                          inputMode="numeric"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val === '') {
                              updateItemQuantity(item.id, '');
                              return;
                            }
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 0) {
                              updateItemQuantity(item.id, num);
                            }
                          }}
                          onBlur={(e) => {
                            if (item.quantity === '' || parseInt(item.quantity, 10) === 0) {
                              updateItemQuantity(item.id, 0);
                            }
                          }}
                          style={{
                            width: '40px',
                            border: 'none',
                            textAlign: 'center',
                            background: 'transparent',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            color: 'inherit',
                            outline: 'none'
                          }}
                        />
                        <button className="di-cart-qty-btn plus" onClick={() => changeQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="di-cart-note-wrap">
                    <input className="di-cart-note-input" placeholder="Please, Just a little bit spicy only...." value={item.note || ''} onChange={e => updateNote(item.id, e.target.value)} />
                  </div>
                </div>
              ))
            }
          </div>

          <div className="di-cart-footer">
            <button className="di-add-more-btn" onClick={() => navigate('/dine-in')}>
              <i className="fa-solid fa-plus" /> Add More Food
            </button>
            <button className="di-place-order-btn" onClick={() => setIsCartOpen(false)}>
              Close & Continue
            </button>
          </div>
        </div>
      )}

      {isPollingCash && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}>
          <div className="spinner" style={{
            border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #ff4e00',
            borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ marginBottom: '10px' }}>Waiting for Cash Payment...</h3>
          <p>Please pay at the counter. The order will be placed once payment is confirmed.</p>
        </div>
      )}


    </div>
  );
};

export default Payment;
