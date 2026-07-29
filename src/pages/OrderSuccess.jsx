import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AIAssistantOverlay from '../components/AIAssistantOverlay';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ordersuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart, tableNumber } = useCart();
  const { language } = useLanguage();
  const {
    cartData = [],
    subtotal = 0,
    total = 0,
    gst = 0,
    formData = {},
    paymentMethod = 'Cash',
    orderId: dbOrderId = null,
    autoTrack = false,
  } = location.state || {};

  const [isTrackMode, setIsTrackMode] = useState(false);
  const [trackStep, setTrackStep] = useState(1); // 1: Received, 2: Preparing, 3: Ready, 4: Served
  const [dbStatus, setDbStatus] = useState(null);
  const [fetchedOrder, setFetchedOrder] = useState(null);
  const [isFinalScreen, setIsFinalScreen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Clear cart, set payment_done stage, & prevent browser back button
  useEffect(() => {
    clearCart();
    sessionStorage.setItem('chatbot_flow_stage', 'payment_done');
    if (autoTrack) setIsTrackMode(true);
    const handleTrackEvent = () => setIsTrackMode(true);
    document.addEventListener('track-order-mode', handleTrackEvent);

    // Prevent going back after order success
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('track-order-mode', handleTrackEvent);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [autoTrack]);

  // Transition to final thank you screen immediately after being served
  useEffect(() => {
    if (trackStep === 4) {
      setIsFinalScreen(true);
    }
  }, [trackStep]);

  const localActiveId = localStorage.getItem('active_order_id');
  const lastSessionId = sessionStorage.getItem('last_placed_order_id');
  const [activeOrderId, setActiveOrderId] = useState(dbOrderId || localActiveId || lastSessionId);

  // Save active order id to session storage to prevent dummy order on refresh/back
  useEffect(() => {
    if (activeOrderId) {
      sessionStorage.setItem('last_placed_order_id', activeOrderId);
    }
  }, [activeOrderId]);

  // If no dbOrderId is provided, try to fetch the active order for this table
  useEffect(() => {
    if (!activeOrderId && tableNumber) {
      const fetchTableOrder = async () => {
        try {
          const res = await fetch(`/api/v1/public/orders/table/${tableNumber}`);
          if (res.ok) {
            const data = await res.json();
            const retrievedId = data.orderId || data.order_id || data.id;
            setActiveOrderId(retrievedId);
            setDbStatus(data.status);
            setIsTrackMode(true);
          }
        } catch (err) {
          console.warn("No active order for table found");
        }
      };
      fetchTableOrder();
    }
  }, [activeOrderId, tableNumber]);

  // Poll real-time order status from backend
  useEffect(() => {
    if (!activeOrderId) return;

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setDbStatus(data.order?.status || data.status);
          if (data.order && data.items) {
            setFetchedOrder(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch order status from server:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isTrackMode, activeOrderId]);

  // Map database status to corresponding stepper timeline index
  useEffect(() => {
    if (!dbStatus) return;

    if (dbStatus === 'PENDING' || dbStatus === 'CONFIRMED') {
      setTrackStep(1);
    } else if (dbStatus === 'PREPARING') {
      setTrackStep(2);
    } else if (dbStatus === 'READY') {
      setTrackStep(3);
    } else if (dbStatus === 'SERVED' || dbStatus === 'COMPLETED') {
      setTrackStep(4);
    } else if (dbStatus === 'CANCELLED') {
      setTrackStep(0);
    }
    
    if (dbStatus === 'SERVED' || dbStatus === 'COMPLETED' || dbStatus === 'CANCELLED') {
      localStorage.removeItem('active_order_id');
      localStorage.removeItem('active_order_type');
      localStorage.removeItem('active_table_number');
      sessionStorage.removeItem('ai_has_greeted');
      sessionStorage.removeItem('chatbot_flow_stage');
      sessionStorage.removeItem('last_placed_order_id');
    }
  }, [dbStatus]);

  // Automatic Order Status Voice Announcements
  useEffect(() => {
    if (!isTrackMode) return;

    let speechText = '';
    if (trackStep === 1) speechText = language === 'Tamil' ? "உங்கள் ஆர்டர் பெறப்பட்டது." : "Your order has been received.";
    else if (trackStep === 2) speechText = language === 'Tamil' ? "உங்கள் உணவு தயாராகிக்கொண்டிருக்கிறது." : "Your food is now being prepared.";
    else if (trackStep === 3) speechText = language === 'Tamil' ? "உங்கள் உணவு பரிமாற தயாராக உள்ளது." : "Your order is ready to be served.";
    else if (trackStep === 4) speechText = language === 'Tamil' ? "உங்கள் உணவு பரிமாறப்பட்டது. மகிழுங்கள்." : "Your order has been served. Enjoy your meal.";

    if (speechText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = language === 'Tamil' ? 'ta-IN' : 'en-IN';
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }, [trackStep, isTrackMode, language]);

  const orderId = activeOrderId
    ? (String(activeOrderId).startsWith('ORD-') ? activeOrderId : `ORD-${String(activeOrderId).padStart(6, '0')}`)
    : `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleCallStaff = () => {
    const tableStr = formData.table || tableNumber || '06';
    setToastMessage(
      language === 'Tamil'
        ? `🛎️ ஊழியர் மேஜை ${tableStr}-க்கு வரவழைக்கப்பட்டார்!`
        : `🛎️ Staff notified for Table ${tableStr}! Someone will be with you shortly.`
    );
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const translate = (en, ta) => (language === 'Tamil' ? ta : en);
  const displayCartData = cartData.length > 0 ? cartData : (fetchedOrder?.items || []);
  const displayTotal = total > 0 ? total : (fetchedOrder?.order?.total_amount || 0);
  const isLoadingOrder = cartData.length === 0 && !fetchedOrder;
  const totalItemsCount = isLoadingOrder ? "..." : displayCartData.reduce((acc, item) => acc + item.quantity, 0);

  const getStatusHeadline = () => {
    if (dbStatus === 'CANCELLED') return translate('Cancelled', 'இரத்து செய்யப்பட்டது');
    if (trackStep === 1) return translate('Order Received', 'ஆர்டர் பெறப்பட்டது');
    if (trackStep === 2) return translate('Preparing', 'தயாரிக்கப்படுகிறது');
    if (trackStep === 3) return translate('Ready to Serve', 'பரிமாற தயார்');
    return translate('Served at Table', 'மேஜையில் பரிமாறப்பட்டது');
  };

  const getStatusSubline = () => {
    if (dbStatus === 'CANCELLED') return translate('This order has been cancelled.', 'இந்த ஆர்டர் இரத்து செய்யப்பட்டது.');
    if (trackStep === 1) return translate("We've received your order.", 'உங்கள் ஆர்டர் பெறப்பட்டது.');
    if (trackStep === 2) return translate('Chef is cooking your meal', 'செஃப் உணவைத் தயாரிக்கிறார்');
    if (trackStep === 3) return translate('Plating up now', 'இப்போது தட்டுகளில் வைக்கப்படுகிறது');
    return translate('Enjoy your meal!', 'உங்கள் உணவை சுவையுங்கள்!');
  };

  const getProgressBarWidth = () => {
    if (dbStatus === 'CANCELLED') return '0%';
    if (trackStep === 1) return '15%';
    if (trackStep === 2) return '45%';
    if (trackStep === 3) return '75%';
    return '100%';
  };

  const getConnectorHeight = () => {
    if (trackStep <= 1) return '0px';
    if (trackStep === 2) return '42px';
    if (trackStep === 3) return '94px';
    return '146px';
  };

  return (
    <div className="os-page">
      <div className="os-bg" />
      <Header 
        tableNumber={tableNumber} 
        showFullHeader={true} 
        useTitleImage={true} 
        showDateTime={true} 
        disableNavigation={!isFinalScreen} 
      />

      <main className="os-main">
        {isFinalScreen ? (
          /* FINAL SCREEN: THANK YOU */
          <div className="os-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
            <div className="os-tick-wrap" style={{ width: '120px', height: '120px', margin: '0 auto 20px' }}>
              <svg className="os-checkmark" viewBox="0 0 52 52" style={{ width: '120px', height: '120px' }}>
                <circle className="os-check-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="os-check-path" fill="none" d="M14 27 l7 7 l17-17" />
              </svg>
            </div>
            <h1 className="os-title" style={{ fontSize: '36px', marginBottom: '12px' }}>
              {translate('Thank You!', 'நன்றி!')}
            </h1>
            <p className="os-subtitle" style={{ fontSize: '18px', color: '#555', marginBottom: '36px' }}>
              {translate('Visit again!', 'மீண்டும் வருக!')}
            </p>

            <div className="os-actions" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <button className="os-home-btn" onClick={() => {
                sessionStorage.removeItem('chatbot_flow_stage');
                sessionStorage.removeItem('last_placed_order_id');
                navigate('/');
              }}>
                <i className="fa-solid fa-house" /> {translate('Back to Home', 'முகப்பு')}
              </button>
              <button className="os-download-btn" onClick={() => {
                navigate('/invoice', {
                  state: {
                    orderId,
                    cartData: displayCartData,
                    subtotal,
                    gst,
                    finalTotal: displayTotal,
                    mobileNumber: formData.phone || 'WALK-IN',
                    paymentMethod
                  }
                });
              }}>
                <i className="fa-solid fa-download" /> {translate('Download Bill', 'ரசீது')}
              </button>
            </div>
          </div>
        ) : !isTrackMode ? (
          /* SCREEN 1: ORDER SUCCESS CONFIRMATION */
          <div className="os-card">
            <div className="os-tick-wrap">
              <svg className="os-checkmark" viewBox="0 0 52 52">
                <circle className="os-check-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="os-check-path" fill="none" d="M14 27 l7 7 l17-17" />
              </svg>
            </div>

            <h1 className="os-title">{translate('Order Placed!', 'ஆர்டர் செய்யப்பட்டது!')}</h1>
            <p className="os-subtitle">
              {translate('Our chef is preparing your meal with love.', 'எங்கள் செஃப் உங்கள் உணவை அன்புடன் தயாரித்து வருகிறார்.')}
            </p>

            {/* Details Box */}
            <div className="os-meta">
              <div className="os-meta-item">
                <span className="os-meta-label">{translate('Order ID', 'ஆர்டர் ஐடி')}</span>
                <span className="os-meta-value">{orderId}</span>
              </div>
              <div className="os-meta-item">
                <span className="os-meta-label">{translate('Table', 'மேஜை')}</span>
                <span className="os-meta-value">
                  {formData.table || tableNumber || '06'} . {translate('Dine in', 'உண்ணுதல்')}
                </span>
              </div>
              <div className="os-meta-item">
                <span className="os-meta-label">{translate('Items', 'பொருட்கள்')}</span>
                <span className="os-meta-value">{totalItemsCount}</span>
              </div>
              <div className="os-meta-item">
                <span className="os-meta-label">{translate('Paid', 'செலுத்தப்பட்டது')}</span>
                <span className="os-meta-value os-total">{isLoadingOrder ? "..." : `Rs. ${Number(displayTotal).toFixed(0)}`}</span>
              </div>
            </div>

            {/* Estimated Time Badge */}
            <div className="os-est-badge">
              <i className="fa-regular fa-clock" />
              <span>
                {translate('Estimated Time · 15 - 20 min', 'மதிப்பிடப்பட்ட நேரம் · 15 - 20 நிமிடம்')}
              </span>
            </div>

            {/* Track Order Button */}
            <button className="os-track-btn" onClick={() => setIsTrackMode(true)}>
              {translate('Track Order', 'ஆர்டரைக் கண்காணிக்கவும்')}
            </button>
          </div>
        ) : (
          /* SCREENS 2, 3, 4: LIVE ORDER TRACKING */
          <div className="os-card os-track-container">
            <h2 className="os-track-title">{translate('Track Order', 'ஆர்டரைக் கண்காணிக்கவும்')}</h2>

            {/* Live Status Card */}
            <div className="os-live-status-card">
              <div className="os-card-header">
                <span className="os-card-order-id">{translate('Order ID', 'ஆர்டர் ஐடி')}: {orderId}</span>
                <span className="os-live-badge">
                  <span className="os-live-dot" style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }} />
                  {translate('Live', 'நேரடி')}
                </span>
              </div>
              <div className="os-card-body">
                <h3 className="os-status-headline">{getStatusHeadline()}</h3>
                <p className="os-status-subline">{getStatusSubline()}</p>
              </div>
              <div className="os-progress-container">
                <div className="os-progress-bar" style={{ width: getProgressBarWidth() }} />
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="os-timeline">
              <div className="os-timeline-connector" style={{ height: getConnectorHeight() }} />

              {/* Step 1: Order Received */}
              <div className={`os-timeline-step ${trackStep >= 1 ? 'completed' : ''}`}>
                <div className="os-step-icon">
                  <i className="fa-solid fa-check" />
                </div>
                <div className="os-step-details">
                  <span className="os-step-title">{translate('Order Received', 'ஆர்டர் பெறப்பட்டது')}</span>
                  <span className="os-step-desc">{translate("We've got your order", 'ஆர்டரைப் பெற்றுக்கொண்டோம்')}</span>
                </div>
              </div>

              {/* Step 2: Preparing */}
              <div className={`os-timeline-step ${trackStep > 2 ? 'completed' : trackStep === 2 ? 'active' : ''}`}>
                <div className="os-step-icon">
                  <i className="fa-solid fa-utensils" />
                </div>
                <div className="os-step-details">
                  <span className="os-step-title">{translate('Preparing', 'தயாரிக்கப்படுகிறது')}</span>
                  <span className="os-step-desc">{translate('Chef is cooking your meal', 'செஃப் உணவைத் தயாரிக்கிறார்')}</span>
                </div>
              </div>

              {/* Step 3: Ready to Serve */}
              <div className={`os-timeline-step ${trackStep > 3 ? 'completed' : trackStep === 3 ? 'active' : ''}`}>
                <div className="os-step-icon">
                  <i className="fa-solid fa-bell" />
                </div>
                <div className="os-step-details">
                  <span className="os-step-title">{translate('Ready to Serve', 'பரிமாற தயார்')}</span>
                  <span className="os-step-desc">{translate('Plating up now', 'இப்போது தட்டுகளில் வைக்கப்படுகிறது')}</span>
                </div>
              </div>

              {/* Step 4: Served at Table */}
              <div className={`os-timeline-step ${trackStep === 4 ? 'active' : ''}`}>
                <div className="os-step-icon">
                  <i className="fa-solid fa-bowl-food" />
                </div>
                <div className="os-step-details">
                  <span className="os-step-title">{translate('Served at Table', 'மேஜையில் பரிமாறப்பட்டது')}</span>
                  <span className="os-step-desc">{translate('Enjoy your meal!', 'உங்கள் உணவை சுவையுங்கள்!')}</span>
                </div>
              </div>
            </div>

            {/* Order Summary Box */}
            {displayCartData.length > 0 && (
              <div className="os-summary-card">
                <h4 className="os-summary-title">{translate('Your Order', 'உங்கள் ஆர்டர்')}</h4>
                {displayCartData.map(item => (
                  <div key={item.id} className="os-summary-row">
                    <span>{item.quantity} x {item.name}</span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="os-summary-total">
                  <span>{translate('Total :', 'மொத்தம் :')}</span>
                  <span>Rs. {Number(displayTotal).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="os-track-actions">
              <button className="os-btn-call" onClick={handleCallStaff} style={{ width: '100%' }}>
                <i className="fa-solid fa-bell" /> {translate('Call Staff', 'ஊழியரை அழைக்கவும்')}
              </button>
              {/* Order More button removed until order is completed */}
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      <div className={`os-toast-notif ${showToast ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default OrderSuccess;
