import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Agent from './pages/Agent'
import DineIn from './pages/DineIn'
import TakeAway from './pages/TakeAway'
import Invoice from './pages/Invoice'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import OrderSuccess from './pages/OrderSuccess'
import TakeAwayCheckout from './pages/TakeAwayCheckout'
import TakeAwayPayment from './pages/TakeAwayPayment'
import TakeAwayOrderSuccess from './pages/TakeAwayOrderSuccess'
import TakeAwayInvoice from './pages/TakeAwayInvoice'
import { CartProvider } from './context/CartContext'

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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/takeaway-checkout" element={<TakeAwayCheckout />} />
        <Route path="/takeaway-payment" element={<TakeAwayPayment />} />
        <Route path="/takeaway-order-success" element={<TakeAwayOrderSuccess />} />
        <Route path="/takeaway-invoice" element={<TakeAwayInvoice />} />
      </Routes>
      </CartProvider>
    </Router>
  )
}

export default App
