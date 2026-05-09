import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/home.css'

function Home() {
  const [tableNumber, setTableNumber] = useState('06')
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="app-container home-page-container">
      <div className="background-image"></div>
      <Header tableNumber="06" showFullHeader={true} useTitleImage={false} showDateTime={false} />
      
      <main className="main-content">
        <h2 className="welcome-text">{t('welcome')}</h2>
        <div className="main-title">
          <img src="/Dataudupi-Title.png" alt="Data Udipi" className="title-image" />
        </div>
        <p className="subtitle">{t('excellence')}</p>

        <div className="order-section">
          <h3 className="order-text">{t('orderHere')}</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => navigate('/agent')}>
              <img src="/agent-logo.png" alt="Agent Icon" className="btn-icon-img" />
              <span>{t('talkToAgent')}</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/dine-in')}>
              <img src="/dinein-logo.png" alt="Dine In Icon" className="btn-icon-img" />
              <span>{t('dineIn')}</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/take-away')}>
              <img src="/takeaway-logo.png" alt="Take Away Icon" className="btn-icon-img" />
              <span>{t('takeAway')}</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Home
