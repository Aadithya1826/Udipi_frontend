import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import '../styles/components.css'

function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <div className="mascot-container">
        <img src="/chef_mascot.png" alt="Chef Mascot" className="chef-mascot" />
      </div>
    </footer>
  )
}

export default Footer
