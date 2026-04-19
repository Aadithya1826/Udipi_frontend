import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MenuItemModal from '../components/MenuItemModal'
import '../styles/pages.css'

const takeawayPackages = [
  { 
    id: 1, 
    name: 'Breakfast Box', 
    description: 'Idly, Vada, Pongal with Sambar & Chutney',
    items: 3, 
    price: 120,
    image: '/cat-breakfast.png'
  },
  { 
    id: 2, 
    name: 'Dosa Combo', 
    description: 'Masala Dosa, Rava Dosa with sides',
    items: 4, 
    price: 160,
    image: '/cat-dosa.png'
  },
  { 
    id: 3, 
    name: 'Lunch Thali', 
    description: 'Full meals with rice, sambar, rasam & more',
    items: 6, 
    price: 130,
    image: '/cat-lunch.png'
  },
  { 
    id: 4, 
    name: 'North Indian Combo', 
    description: 'Nan, Paneer Butter Masala & Pulav',
    items: 3, 
    price: 250,
    image: '/cat-northindian.png'
  },
  { 
    id: 5, 
    name: 'Snack Pack', 
    description: 'Bajji, Bonda, Chola Poori & Tea',
    items: 4, 
    price: 180,
    image: '/cat-snacks.png'
  },
  { 
    id: 6, 
    name: 'Party Feast', 
    description: 'Biryani, Noodles, Gobi 65 & more',
    items: 8, 
    price: 499,
    image: '/cat-rice.png'
  },
]

function TakeAway() {
  const navigate = useNavigate()
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  const handleAddToCart = (cartItem) => {
    console.log('Added to cart:', cartItem)
    // TODO: Implement add to cart functionality
    alert(`${cartItem.item.name} x${cartItem.quantity} added to cart!`)
    handleCloseModal()
  }

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>Take Away</h1>
          <p>Order for takeaway and enjoy at home</p>
        </div>

        <div className="takeaway-grid">
          {takeawayPackages.map(pkg => (
            <div key={pkg.id} className="takeaway-card" onClick={() => handleItemClick(pkg)}>
              <div className="takeaway-card-img">
                <img src={pkg.image} alt={pkg.name} />
                <div className="takeaway-card-overlay"></div>
                <span className="takeaway-items-badge">{pkg.items} Items</span>
              </div>
              <div className="takeaway-card-body">
                <h3>{pkg.name}</h3>
                <p className="takeaway-desc">{pkg.description}</p>
                <div className="takeaway-card-footer">
                  <span className="takeaway-price">₹{pkg.price}</span>
                  <button className="order-btn" onClick={(e) => e.stopPropagation()}>Order Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && selectedItem && (
          <MenuItemModal 
            item={{item: selectedItem.name, price: selectedItem.price, description: selectedItem.description}}
            category="Take Away"
            onClose={handleCloseModal}
            onAddToCart={handleAddToCart}
          />
        )}

        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Home
        </button>
      </main>
    </div>
  )
}

export default TakeAway
