import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Agent from './pages/Agent'
import DineIn from './pages/DineIn'
import TakeAway from './pages/TakeAway'
import Invoice from './pages/Invoice'

import { LanguageProvider } from './context/LanguageContext'

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/dine-in" element={<DineIn />} />
          <Route path="/take-away" element={<TakeAway />} />
          <Route path="/invoice" element={<Invoice />} />
        </Routes>
      </Router>
    </LanguageProvider>
  )
}

export default App
