import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import '../styles/components.css'
const chefMascotImg = `/assets/images/chef_mascot.png`;

function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <div className="mascot-container">
        <img src={chefMascotImg} alt="Chef Mascot" className="chef-mascot" />
      </div>
      <div className="footer-links-container">
        <Link to="/privacy-policy" className="footer-privacy-link">Privacy Policy</Link>
        <span className="footer-divider">•</span>
        <span className="footer-copyright">© {new Date().getFullYear()} DATA UDIPI</span>
      </div>
    </footer>
  )
}

export default Footer
