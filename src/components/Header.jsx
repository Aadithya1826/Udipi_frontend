import React, { useState, useEffect } from 'react'
import '../styles/components.css'

function Header({ tableNumber = '06', showFullHeader = false }) {
  const [currentLang, setCurrentLang] = useState('English')
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      setCurrentDate(dateStr)
      setCurrentTime(timeStr)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className={`header ${showFullHeader ? 'full-header' : ''}`}>
      {/* Table Indicator */}
      <div className="table-indicator">
        <span className="table-text">Table no :</span>
        <div className="table-number">{tableNumber}</div>
      </div>

      {/* Logo Sign */}
      <div className="logo-sign">
        <img src="/udupi-banner.png" alt="Data Udipi Logo" className="banner-image" />
      </div>

      {/* Language Selector */}
      <div className="language-selector">
        <button 
          className="lang-btn"
          onClick={() => setShowLangDropdown(!showLangDropdown)}
        >
          <span className="lang-icon">A<i className="fa-solid fa-arrow-right-arrow-left"></i></span> 
          <span>Languages</span>
        </button>
        {showLangDropdown && (
          <div className="lang-dropdown show">
            <div 
              className="lang-option" 
              onClick={() => { setCurrentLang('English'); setShowLangDropdown(false); }}
            >
              English
            </div>
            <div 
              className="lang-option"
              onClick={() => { setCurrentLang('Tamil'); setShowLangDropdown(false); }}
            >
              Tamil
            </div>
          </div>
        )}
      </div>

      {/* Date-Time (for full header) */}
      {showFullHeader && (
        <div className="date-time-box">
          <i className="fa-regular fa-calendar"></i>
          <span>{currentDate}</span>
          <div className="divider"></div>
          <i className="fa-regular fa-clock"></i>
          <span>{currentTime}</span>
        </div>
      )}
    </header>
  )
}

export default Header
