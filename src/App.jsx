import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import TakeAwayInvoice from './pages/TakeAwayInvoice'
import Checkout from './pages/Checkout'
import { CartProvider } from './context/CartContext'
import AIAssistantOverlay from './components/AIAssistantOverlay'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/dine-in" element={<DineIn />} />
        <Route path="/take-away" element={<TakeAway />} />
        <Route path="/invoice" element={<Invoice />} />

        <Route path="/checkout" element={<Checkout isTakeaway={false} />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        <Route path="/takeaway-checkout" element={<Checkout isTakeaway={true} />} />
        <Route path="/takeaway-payment" element={<TakeAwayPayment />} />
        <Route path="/takeaway-order-success" element={<TakeAwayOrderSuccess />} />
        <Route path="/takeaway-invoice" element={<TakeAwayInvoice />} />
      </Routes>
      <AIAssistantOverlay />
      </CartProvider>
    </Router>
  )
}

export default App
