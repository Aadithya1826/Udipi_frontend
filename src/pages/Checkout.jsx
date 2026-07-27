import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import '../styles/checkout.css';
import { useLanguage } from '../context/LanguageContext';
const Checkout = ({ isTakeaway }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const {
    cart,
    subtotal,
    totalAmount: total,
    tableNumber,
    changeQty,
    updateItemQuantity,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  const [formData, setFormData] = useState(() => ({
    name: location.state?.formData?.name || sessionStorage.getItem('customer_name') || '',
    phone: location.state?.formData?.phone || sessionStorage.getItem('customer_phone') || ''
  }));
  
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Redirect back if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate(isTakeaway ? '/take-away' : '/dine-in');
    }
  }, [cart, navigate, isTakeaway]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
      
      if (hasAttemptedSubmit) {
        if (!/^\d{10}$/.test(onlyNums)) {
          setPhoneError(language === 'Tamil' ? 'தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.');
        } else {
          setPhoneError('');
        }
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (hasAttemptedSubmit && name === 'name') {
      if (!value.trim()) {
        setNameError(language === 'Tamil' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      } else {
        setNameError('');
      }
    }
  };

  const handleBlur = (e) => {
    if (e.target.name === 'phone') {
      if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
        setPhoneError(language === 'Tamil' ? 'தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.');
      } else {
        setPhoneError('');
      }
    }
    if (e.target.name === 'name') {
      if (!formData.name.trim()) {
        setNameError(language === 'Tamil' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      } else {
        setNameError('');
      }
    }
  };

  useEffect(() => {
    const handleUpdateName = (e) => {
      if (e.detail && e.detail.name) {
        setFormData(prev => ({ ...prev, name: e.detail.name }));
      }
    };
    const handleUpdatePhone = (e) => {
      if (e.detail && e.detail.phone) {
        const cleanedPhone = String(e.detail.phone).replace(/\D/g, '');
        if (/^\d{10}$/.test(cleanedPhone)) {
          setFormData(prev => ({ ...prev, phone: cleanedPhone }));
        }
      }
    };

    const handleContinueToPayment = (e) => {
      setFormData(currentFormData => {
        setHasAttemptedSubmit(true);
        let valid = true;
        
        if (!currentFormData.name.trim()) {
          setNameError(language === 'Tamil' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
          valid = false;
        } else {
          setNameError('');
        }
        
        if (!/^\d{10}$/.test(currentFormData.phone)) {
          setPhoneError(language === 'Tamil' ? 'தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.');
          valid = false;
        } else {
          setPhoneError('');
        }
        
        if (!valid) {
          return currentFormData;
        }
        
        const paymentRoute = isTakeaway ? '/takeaway-payment' : '/payment';
        navigate(paymentRoute, {
          state: {
            ...(location.state || {}),
            formData: currentFormData,
            autoConfirmMethod: e?.detail?.autoConfirm ? e.detail.method : undefined
          }
        });
        return currentFormData;
      });
    };

    document.addEventListener('update-name', handleUpdateName);
    document.addEventListener('update-phone', handleUpdatePhone);
    document.addEventListener('continue-to-payment', handleContinueToPayment);

    return () => {
      document.removeEventListener('update-name', handleUpdateName);
      document.removeEventListener('update-phone', handleUpdatePhone);
      document.removeEventListener('continue-to-payment', handleContinueToPayment);
    };
  }, [navigate, isTakeaway, location.state, language]);

  const handleContinue = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setHasAttemptedSubmit(true);
    let valid = true;
    
    if (!formData.name.trim()) {
      setNameError(language === 'Tamil' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.' : 'Please enter your full name.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setPhoneError(language === 'Tamil' ? 'தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid phone number.');
      valid = false;
    } else {
      setPhoneError('');
    }

    if (!valid) {
      return;
    }
    const paymentRoute = isTakeaway ? '/takeaway-payment' : '/payment';
    navigate(paymentRoute, {
      state: {
        ...(location.state || {}),
        formData: formData
      }
    });
  };

  const backLink = isTakeaway ? '/take-away' : '/dine-in';

  return (
    <div className="app-container">
      <div className="background-image" />
      <Header tableNumber={isTakeaway ? '06' : tableNumber} showFullHeader={true} useTitleImage={true} hideTableIndicator={isTakeaway} />

      <main className="checkout-main">
        <div className="checkout-container">
          {/* Left Column: Customer Details */}
          <div className="checkout-left">
            <Link to={backLink} className="checkout-back-link">
              <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.8rem' }} /> Back to Menu
            </Link>

            <h1 className="checkout-title">Checkout</h1>
            <p className="checkout-subtitle">{isTakeaway ? 'Take Away Order' : 'Dine In Order'}</p>

            <h3 className="checkout-section-title">Customer details</h3>

            <div className="checkout-form">
              <div className={`form-group ${nameError ? 'has-error' : ''}`}>
                <label>Full Name*</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {nameError && <i className="fa-solid fa-circle-exclamation error-icon"></i>}
                </div>
                {nameError && <span className="error-message">{nameError}</span>}
              </div>

              <div className={`form-group ${phoneError ? 'has-error' : ''}`}>
                <label>Phone Number*</label>
                <div className="input-wrapper">
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder="10 digit number" 
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength="10"
                    required
                  />
                  {phoneError && <i className="fa-solid fa-circle-exclamation error-icon"></i>}
                </div>
                {phoneError && <span className="error-message">{phoneError}</span>}
              </div>

              <div className="form-group">
                <label>Table No*</label>
                <input 
                  type="text" 
                  value={isTakeaway ? 'TakeAway' : (tableNumber || '6')}
                  readOnly
                  disabled
                />
              </div>

            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="checkout-right">
            <h3 className="order-summary-title">Order Summary</h3>

            <div className="os-items-list">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="os-item">
                  <div className="os-item-info">
                    <div className="os-item-name">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name} x {item.quantity}</div>
                    <div className="os-item-desc">{language === 'Tamil' && item.tamilDesc ? item.tamilDesc : item.description}</div>
                  </div>
                  <div className="os-item-price">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="os-billing-details">
              <div className="os-bill-row">
                <span>Sub total</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="os-bill-row os-total">
                <span>Total :</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="checkout-actions">
              <button className="os-continue-btn" onClick={handleContinue}>
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button className="pm-view-cart-btn" onClick={() => setIsCartOpen(true)}>
          <i className="fa-solid fa-cart-shopping" />
          <span>View Cart</span>
          <span className="pm-cart-badge">{cart.length}</span>
        </button>
      )}

      {/* Cart sidebar (Floating) */}
      {isCartOpen && (
        <div className="di-sidebar di-cart-mode active">
          <div className="di-cart-header">
            <div className="di-cart-header-left">
              <span className="di-cart-title">Cart</span>
              <span className="di-cart-table-pill">Table No : {isTakeaway ? 'TakeAway' : tableNumber} <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
            </div>
            <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="di-cart-items">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="di-cart-item-container">
                <div className="di-cart-item-body">
                  <div className="di-cart-item-thumb">
                    {item.image ? <img src={item.image} alt={item.name} /> : <div style={{width:'100%', height:'100%', background:'#eee'}}></div>}
                  </div>
                  <div className="di-cart-item-details">
                    <h4 className="di-cart-item-name">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</h4>
                    <p className="di-cart-serves">{t('serves')} : 1</p>
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
                          const val = e.target.value.replace(/[^0-9]/g, '');
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
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: '1rem',
                          color: '#333',
                          outline: 'none'
                        }}
                      />
                      <button className="di-cart-qty-btn plus" onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="di-cart-footer">
            <button className="di-place-order-btn" onClick={() => setIsCartOpen(false)}>
              Close Cart
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default Checkout;
