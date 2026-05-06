import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './context/LanguageContext'
import { CartProvider } from './context/CartContext'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
