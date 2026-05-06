import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import '../styles/components.css'

function Header({ tableNumber = '06', showFullHeader = false, useTitleImage = false, showDateTime = true }) {
  const { language, setLanguage, t } = useLanguage()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const dateStr = now.toLocaleDateString(language === 'English' ? 'en-US' : 'ta-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const timeStr = now.toLocaleTimeString(language === 'English' ? 'en-US' : 'ta-IN', {
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
  }, [language])

  return (
    <header className={`header ${showFullHeader ? 'full-header' : ''}`}>
      {/* Table Indicator */}
      <div className="table-indicator">
        <span className="table-text">{t('tableNo')}</span>
        <div className="table-number">{tableNumber}</div>
      </div>

      {/* Logo Sign */}
      <div className={`logo-sign ${useTitleImage ? 'title-mode' : ''}`}>
        <img
          src={useTitleImage ? "/Dataudupi-Title.png" : "/udupi-banner.png"}
          alt="Data Udipi Logo"
          className={useTitleImage ? "title-image-header" : "banner-image"}
        />
      </div>

      {/* Right Side Elements */}
      <div className="header-right">
        <div className="header-top-right">
          {/* Date-Time (for full header) */}
          {showFullHeader && showDateTime && (
            <div className="date-time-box">
              <i className="fa-regular fa-calendar"></i>
              <span>{currentDate}</span>
              <div className="divider"></div>
              <i className="fa-regular fa-clock"></i>
              <span>{currentTime}</span>
            </div>
          )}

          {/* Language Selector */}
          <div className="language-selector">
            <button
              className="lang-btn"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
            >
              <span className="lang-icon">A<i className="fa-solid fa-arrow-right-arrow-left"></i></span>
              <span>{t('languages')}</span>
            </button>
            {showLangDropdown && (
              <div className="lang-dropdown show">
                <div
                  className="lang-option"
                  onClick={() => { setLanguage('English'); setShowLangDropdown(false); }}
                >
                  English
                </div>
                <div
                  className="lang-option"
                  onClick={() => { setLanguage('Tamil'); setShowLangDropdown(false); }}
                >
                  Tamil
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
