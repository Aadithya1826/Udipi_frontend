import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/pages.css'

function DineIn() {
  const navigate = useNavigate()
  const [selectedItems, setSelectedItems] = useState([])

  const menuItems = [
    { id: 1, name: 'Masala Dosa', price: 250, category: 'Breakfast' },
    { id: 2, name: 'Idli', price: 120, category: 'Breakfast' },
    { id: 3, name: 'Vada', price: 80, category: 'Breakfast' },
    { id: 4, name: 'Biryani', price: 320, category: 'Lunch' },
    { id: 5, name: 'Sambar Rice', price: 180, category: 'Lunch' },
  ]

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>Dine In</h1>
          <p>Browse our menu and place your order</p>
        </div>

        <div className="menu-grid">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item">
              <h3>{item.name}</h3>
              <p className="category">{item.category}</p>
              <p className="price">₹{item.price}</p>
              <button className="add-btn">Add to Order</button>
            </div>
          ))}
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Home
        </button>
      </main>
    </div>
  )
}

export default DineIn
