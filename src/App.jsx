import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Agent from './pages/Agent'
import DineIn from './pages/DineIn'
import TakeAway from './pages/TakeAway'
import Invoice from './pages/Invoice'

import Payment from './pages/Payment'
import OrderSuccess from './pages/OrderSuccess'
import PaymentFailed from './pages/PaymentFailed'

import TakeAwayPayment from './pages/TakeAwayPayment'
import TakeAwayOrderSuccess from './pages/TakeAwayOrderSuccess'
import Checkout from './pages/Checkout'
import PrivacyPolicy from './pages/PrivacyPolicy'
import { CartProvider } from './context/CartContext'
import { VoiceAgentProvider } from './context/VoiceAgentContext'
import AIAssistantOverlay from './components/AIAssistantOverlay'
import ActiveOrderGuard from './components/ActiveOrderGuard'
import ActiveOrderBanner from './components/ActiveOrderBanner'

function ActiveOrderRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const activeOrderId = localStorage.getItem('active_order_id');
    const activeOrderType = localStorage.getItem('active_order_type');
    const tableNumber = localStorage.getItem('active_table_number') || '06';

    if (activeOrderId) {
      const isSuccessPage = location.pathname === '/order-success' || location.pathname === '/takeaway-order-success' || location.pathname === '/privacy-policy' || location.pathname === '/privacy';
      if (!isSuccessPage) {
        if (activeOrderType === 'takeaway') {
          navigate('/takeaway-order-success', { replace: true, state: { autoTrack: true, orderId: activeOrderId } });
        } else {
          navigate('/order-success', { replace: true, state: { autoTrack: true, orderId: activeOrderId, tableNumber } });
        }
      }
    }
  }, [location.pathname, navigate]);

  return null;
}

function PrivacyCornerBadge() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only display Privacy Policy link on the Home page
  if (location.pathname !== '/home' && location.pathname !== '/') {
    return null;
  }

  return (
    <div
      onClick={() => navigate('/privacy-policy')}
      className="privacy-corner-badge"
      title="DATA UDIPI Privacy Policy"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/privacy-policy')}
    >
      <i className="fa-solid fa-shield-halved privacy-corner-icon"></i>
      <span>Privacy Policy</span>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <VoiceAgentProvider>
        <CartProvider>
          <ActiveOrderRedirector />
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Agent />} />
            <Route path="/dine-in" element={<DineIn />} />
            <Route path="/take-away" element={<TakeAway />} />
            <Route path="/invoice" element={<Invoice />} />
          <Route path="/checkout" element={<ActiveOrderGuard><Checkout isTakeaway={false} /></ActiveOrderGuard>} />
          <Route path="/payment" element={<ActiveOrderGuard><Payment /></ActiveOrderGuard>} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />

          <Route path="/takeaway-checkout" element={<ActiveOrderGuard><Checkout isTakeaway={true} /></ActiveOrderGuard>} />
          <Route path="/takeaway-payment" element={<ActiveOrderGuard><TakeAwayPayment /></ActiveOrderGuard>} />
          <Route path="/takeaway-order-success" element={<TakeAwayOrderSuccess />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
        <ActiveOrderBanner />
        <AIAssistantOverlay />
        <PrivacyCornerBadge />
        </CartProvider>
      </VoiceAgentProvider>
    </Router>
  )
}


export default App

