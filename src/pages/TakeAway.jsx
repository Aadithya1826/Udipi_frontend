import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/pages.css'

function TakeAway() {
  const navigate = useNavigate()

  const packages = [
    { id: 1, name: 'Breakfast Box', items: 3, price: 450 },
    { id: 2, name: 'Lunch Combo', items: 4, price: 699 },
    { id: 3, name: 'Premium Feast', items: 6, price: 999 },
  ]

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>Take Away</h1>
          <p>Order for takeaway and enjoy at home</p>
        </div>

        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.id} className="package-card">
              <h3>{pkg.name}</h3>
              <p className="items-count">{pkg.items} Items</p>
              <p className="price">₹{pkg.price}</p>
              <button className="order-btn">Order Now</button>
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

export default TakeAway
