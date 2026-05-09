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
    removeCartItem,
    updateNote,
    totalItems,
    subtotal,
    serviceCharge,
    gst,
    totalAmount: total
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('Cash');

  const { formData = {} } = location.state || {};

  useEffect(() => {
    setIsCartOpen(false);
    return () => {
      setIsCartOpen(false);
    };
  }, []);

  const handleConfirm = async () => {
    setIsCartOpen(false);

    if (selectedMethod === 'Cash') {
      const orderData = {
        table_number: '06',
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
        await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }).catch(err => console.warn('Backend not available:', err));

        navigate('/order-success', {
          state: {
            orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            cartData: cart,
            subtotal, gst, total, formData, paymentMethod: 'Cash'
          }
        });
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

    try {
      const res = await fetch('http://localhost:5000/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      const data = await res.json();
      if (!data.success) throw new Error('Could not create order');
      const order = data.order;

      const options = {
        key: 'rzp_test_SmoY5KI2TTBkAS',
        amount: order.amount,
        currency: order.currency,
        name: 'Data Udipi',
        description: 'Food Order Payment',
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            const orderData = {
              table_number: '06',
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

            await fetch('http://localhost:5000/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            }).catch(err => console.warn('Backend not available:', err));

            navigate('/order-success', {
              state: {
                orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                cartData: cart,
                subtotal, gst, total, formData, paymentMethod: 'Razorpay'
              }
            });
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: {
          contact: formData.phone || '',
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert('Payment Failed: ' + response.error.description);
      });
      rzp1.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      alert('Could not open payment gateway. Please try again.');
    }
  };

  // UPI payment string
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dataudipi@upi%26pn=DataUdipi%26am=${total.toFixed(2)}%26cu=INR`;

  return (
    <div className="payment-page">
      <div className="payment-bg" />
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} showDateTime={true} />

      <main className="payment-main">
        <div className="payment-card">
          <Link to="/checkout" state={location.state} className="payment-back-link">
            ← Back to checkout
          </Link>

          <h2 className="payment-title">Payment</h2>
          <p className="payment-subtitle">Choose Your Payment Method</p>

          <div className="payment-methods">
            <div
              className={`payment-method-card ${selectedMethod === 'Cash' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('Cash')}
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
              onClick={() => setSelectedMethod('UPI')}
            >
              <div className="pm-icon-wrap">
                <i className="fa-solid fa-mobile-screen-button"></i>
              </div>
              <div>
                <p className="pm-name">UPI</p>
                <p className="pm-desc">GPay, phone pe, Paytym</p>
              </div>
            </div>
          </div>

          {selectedMethod === 'Cash' ? (
            <div className="payment-billing">
              <div className="pb-row">
                <span>Sub total</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="pb-row">
                <span>Service Charge (5%)</span>
                <span>Rs. {serviceCharge.toFixed(2)}</span>
              </div>
              <div className="pb-row">
                <span>GST (18%)</span>
                <span>Rs. {gst.toFixed(2)}</span>
              </div>
              <div className="pb-row">
                <span>Service Charge (0)</span>
                <span>Rs. 0</span>
              </div>
              <div className="pb-row pb-total">
                <span>Total :</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="pm-qr-display-area active" style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <div className="pm-qr-card" style={{ width: '100%', padding: '10px', background: '#fff', border: 'none', alignItems: 'center' }}>
                <div className="pm-qr-wrapper" style={{ margin: '0 auto', padding: '20px', boxShadow: 'none', position: 'relative' }}>
                  <div className="qr-corner top-left" style={{ width: '40px', height: '40px', top: '-10px', left: '-10px', borderWidth: '1.5px 0 0 1.5px', borderColor: '#333' }}></div>
                  <div className="qr-corner top-right" style={{ width: '40px', height: '40px', top: '-10px', right: '-10px', borderWidth: '1.5px 1.5px 0 0', borderColor: '#333' }}></div>
                  <div className="qr-corner bottom-left" style={{ width: '40px', height: '40px', bottom: '-10px', left: '-10px', borderWidth: '0 0 1.5px 1.5px', borderColor: '#333' }}></div>
                  <div className="qr-corner bottom-right" style={{ width: '40px', height: '40px', bottom: '-10px', right: '-10px', borderWidth: '0 1.5px 1.5px 0', borderColor: '#333' }}></div>
                  <img src={upiQrUrl} alt="UPI QR Code" className="pm-qr-img" style={{ width: '220px', height: '220px' }} />
                  <div className="qr-logo-overlay" style={{ background: '#fff', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '2px solid #3399cc' }}>
                    <img src="https://cdn.simpleicons.org/razorpay/3399cc" alt="Razorpay" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
                <p className="pm-qr-label" style={{ marginTop: '30px', fontSize: '20px', letterSpacing: '1px' }}>SCAN HERE TO PAY!</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button className="payment-confirm-btn" onClick={handleConfirm}>
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
              <span className="di-cart-table-pill">Table No : 06 <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
            </div>
            <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>
          <div className="di-cart-order-id"># Order ID : 2002</div>

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
                      <p className="di-cart-gst">+ GST</p>
                      <div className="di-cart-stepper">
                        <button className="di-cart-qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                        <span className="di-cart-qty-num">{item.quantity}</span>
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




    </div>
  );
};

export default Payment;
