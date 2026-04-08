import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/home.css'

function Home() {
  const [tableNumber, setTableNumber] = useState('06')
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber={tableNumber} />

      <main className="main-content">
        <h2 className="welcome-text">Welcome To</h2>
        <div className="main-title">
          <img src="/Dataudupi Title.png" alt="Data Udipi" className="title-image" />
        </div>
        <p className="subtitle">40 YEARS OF EXCELLENCE IN SOUTH INDIAN VEGETARIAN CUISINE</p>

        <div className="order-section">
          <h3 className="order-text">Order Here :</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => navigate('/agent')}>
              <img src="/agent-logo.png" alt="Agent Icon" className="btn-icon-img" />
              <span>Talk to Agent</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/dine-in')}>
              <img src="/dinein-logo.png" alt="Dine In Icon" className="btn-icon-img" />
              <span>Dine In</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/take-away')}>
              <img src="/takeaway-logo.png" alt="Take Away Icon" className="btn-icon-img" />
              <span>Take Away</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Home
