import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import AIAssistantOverlay from '../components/AIAssistantOverlay';
import { useCart } from '../context/CartContext';
import '../styles/checkout.css';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    changeQty,
    removeCartItem,
    updateNote,
    totalItems,
    subtotal,
    serviceCharge,
    gst,
    totalAmount
  } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    table: '6',
    instructions: 'lless spicy,No Onions'
  });

  useEffect(() => {
    setIsCartOpen(false);
  }, []);

  // Modal state
  const [modal, setModal] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const showModal = (message) => {
    setModal({ show: true, message });
  };

  const closeModal = () => {
    setModal({ show: false, message: '' });
  };

  const handlePayment = () => {
    if (!formData.name.trim()) {
      showModal('Please enter your name');
      return;
    }
    if (!formData.phone.trim()) {
      showModal('Please enter your phone number');
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      showModal('Please enter a valid 10-digit phone number');
      return;
    }
    // Navigate to Payment page, passing only form data as cart is global
    setIsCartOpen(false);
    navigate('/payment', {
      state: { formData }
    });
  };

  return (
    <div className="checkout-page">
      {/* Blurred BG */}
      <div className="checkout-bg" />

      {/* Shared Header */}
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} showDateTime={true} />

      {/* Floating card */}
      <main className="checkout-main">
        <div className="checkout-card">
          {/* Back link */}
          <Link to="/dine-in" className="checkout-back-link">
            ← Back to Menu
          </Link>

          <div className="checkout-body">
            {/* ── LEFT: Form ── */}
            <div className="checkout-form-section">
              <h1 className="checkout-title">Checkout</h1>
              <p className="checkout-order-type">Dine In Order</p>

              <p className="checkout-section-label">Customer details</p>

              <div className="checkout-field">
                <label htmlFor="name">FULL NAME*</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Jon"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="phone">PHONE NUMBER*</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="10 digit number"
                  maxLength="10"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="table">TABLE NO*</label>
                <input
                  type="text"
                  id="table"
                  value={formData.table}
                  className="co-filled"
                  readOnly
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="instructions">SPECIAL INSTRUCTIONS</label>
                <textarea
                  id="instructions"
                  placeholder="e.g. less spicy, No Onions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="checkout-summary-section">
              <p className="checkout-summary-title">Order Summary</p>

              <div className="checkout-items-list">
                {cart.length === 0 ? (
                  <p className="checkout-empty">No items in cart</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.id} className="checkout-order-item">
                        <div className="checkout-item-info">
                          <p className="checkout-item-name">{item.name}</p>
                          <p className="checkout-item-desc">
                            {item.description || 'Crispy, lacy semolina crepes infused with sautéed onions, green chillies.'}
                          </p>
                        </div>
                        <span className="checkout-item-price">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                      <Link
                        to="/dine-in"
                        style={{
                          color: '#ff4e00',
                          textDecoration: 'none',
                          fontWeight: '700',
                          fontSize: '14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-plus-circle"></i> Add More Food
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Billing */}
              <div className="checkout-billing">
                <div className="checkout-billing-row">
                  <span>Sub total</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="checkout-billing-row">
                  <span>Service Charge (5%)</span>
                  <span>Rs. {serviceCharge.toFixed(2)}</span>
                </div>
                <div className="checkout-billing-row">
                  <span>GST (18%)</span>
                  <span>Rs. {gst.toFixed(2)}</span>
                </div>
                <div className="checkout-billing-row">
                  <span>Service Charge (0)</span>
                  <span>Rs. 0</span>
                </div>
                <div className="checkout-billing-row co-total">
                  <span>Total :</span>
                  <span>Rs. {totalAmount.toFixed(2)}</span>
                </div>

                <button className="checkout-pay-btn" onClick={handlePayment}>
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Validation Modal ── */}
      {modal.show && (
        <div className="co-modal-overlay" onClick={closeModal}>
          <div className="co-modal" onClick={e => e.stopPropagation()}>
            <div className="co-modal-icon">⚠️</div>
            <p className="co-modal-message">{modal.message}</p>
            <button className="co-modal-ok" onClick={closeModal}>OK</button>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <button className="co-view-cart-btn" onClick={() => setIsCartOpen(true)}>
          <i className="fa-solid fa-cart-shopping" />
          <span>View Cart</span>
          <span className="co-cart-badge">{totalItems}</span>
        </button>
      )}

      {/* Cart sidebar (Floating) - Exact Design Match */}
      <div className={`di-sidebar di-cart-mode ${isCartOpen ? 'active' : ''}`}>
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
          <button className="di-ot-tab"><i className="fa-solid fa-bag-shopping" /> Take Away</button>
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
          <Link
            to="/dine-in"
            className="di-add-more-btn"
            style={{ textDecoration: 'none' }}
          >
            <i className="fa-solid fa-plus" /> Add More Food
          </Link>
          <button className="di-place-order-btn" onClick={() => setIsCartOpen(false)}>
            Close & Continue
          </button>
        </div>

      </div>




      <AIAssistantOverlay />
    </div>
  );
};

export default Checkout;
