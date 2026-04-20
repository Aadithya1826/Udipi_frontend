import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MenuItemModal from '../components/MenuItemModal'
import '../styles/pages.css'

const allMenuData = {
  'Breakfast & Dinner': [
    { item: 'Idly (2)', price: 40.00 },
    { item: 'Sambar Idly (2)', price: 60.00 },
    { item: 'Spl. Mini Sambar Idly', price: 65.00 },
    { item: 'Vadai', price: 30.00 },
    { item: 'Pongal', price: 70.00 },
    { item: 'Sambar Vadai (1)', price: 40.00 },
    { item: 'Curd Vadai (1)', price: 40.00 },
    { item: 'Spl. Vada', price: 35.00 },
    { item: 'Poori Masala', price: 80.00 },
    { item: 'Special Soda Dosai', price: 70.00 },
    { item: 'Special Masala Dosai', price: 80.00 },
    { item: 'Rava Dosai', price: 85.00 },
    { item: 'Idiyappam with Kurma', price: 70.00 },
    { item: 'Podi Idly', price: 65.00 },
    { item: 'Idly Vadacurry', price: 60.00 },
    { item: 'Dosa Vadacurry', price: 80.00 },
    { item: 'Poori Vadacurry', price: 90.00 },
    { item: 'Idiyappam Vadacurry', price: 75.00 },
    { item: 'Kuli Paniyaram', price: 60.00 },
    { item: 'Appam (1)', price: 40.00 },
  ],
  'B&D Specials': [
    { item: 'Gobi Mushroom Dosai', price: 135.00 },
    { item: 'Paneer Dosai', price: 135.00 },
    { item: 'Gobi Masala Dosai', price: 135.00 },
    { item: 'Dimond Dosai', price: 135.00 },
    { item: 'Mushroom Masala Dosai', price: 135.00 },
    { item: 'Paneer Mushroom Masala Dosai', price: 135.00 },
    { item: 'Chilly Paneer Dosai', price: 135.00 },
  ],
  'Evening Snacks': [
    { item: 'Bajji (4)', price: 40.00 },
    { item: 'Bonda (2)', price: 35.00 },
    { item: 'Chola Poori', price: 80.00 },
    { item: 'Chilly Parota', price: 175.00 },
    { item: 'Kaima Idly (2)', price: 165.00 },
  ],
  'Dosa Varieties': [
    { item: 'Onion Dosai', price: 45.00 },
    { item: 'Onion Rava Dosai', price: 45.00 },
    { item: 'Onion Masala Dosai', price: 45.00 },
    { item: 'Ghee Dosai', price: 45.00 },
    { item: 'Ghee Roast Masala Dosai', price: 75.00 },
    { item: 'Paper Roast', price: 75.00 },
    { item: 'Plain Uthappam', price: 75.00 },
    { item: 'Onion Uthappam', price: 75.00 },
    { item: 'Tomato Uthappam', price: 75.00 },
    { item: 'Peas Uthappam', price: 75.00 },
    { item: 'Coconut Uthappam', price: 75.00 },
    { item: 'Parota Veg. Kuruma', price: 75.00 },
    { item: 'Chappathi Kuruma', price: 75.00 },
    { item: 'Mini Tiffen', price: 75.00 },
    { item: 'Kara Dosai', price: 75.00 },
    { item: 'Veg. Dosai', price: 75.00 },
    { item: 'Podi Dosai', price: 75.00 },
    { item: 'Raagi Dosa (1 pc)', price: 75.00 },
    { item: 'Cholam Dosa (1 pc)', price: 75.00 },
    { item: 'Kambu Dosa (1 pc)', price: 75.00 },
    { item: 'Wheat Dosa (1 pc)', price: 75.00 },
    { item: 'Set Dosa (2 pcs) with Vadacurry', price: 75.00 },
    { item: 'Neer Dosa with Jaggery & Coconut', price: 75.00 },
    { item: 'Mysore Masala Dosa', price: 75.00 },
  ],
  'Rice Varieties': [
    { item: 'Schezwan Fried Rice', price: 175.00 },
    { item: 'Schezwan Mushroom Rice', price: 180.00 },
    { item: 'Schezwan Paneer Rice', price: 180.00 },
    { item: 'Schezwan Gobi Rice', price: 180.00 },
    { item: 'Schezwan Noodles', price: 165.00 },
    { item: 'Schezwan Mushroom Noodles', price: 180.00 },
    { item: 'Schezwan Gobi Noodles', price: 180.00 },
  ],
  'Hot Beverages': [
    { item: 'Coffee', price: 35.00 },
    { item: 'Milk', price: 35.00 },
    { item: 'Boost / Horlicks', price: 40.00 },
    { item: 'Tea', price: 35.00 },
  ],
  'Soups': [
    { item: 'Tomato Soup', price: 65.00 },
    { item: 'Onion Soup', price: 65.00 },
    { item: 'Veg. Soup', price: 65.00 },
    { item: 'Green Peas Soup', price: 65.00 },
    { item: 'Sweet Corn Soup', price: 65.00 },
    { item: 'Sweet Corn Veg. Soup', price: 65.00 },
    { item: 'Mushroom Soup', price: 65.00 },
  ],
  'Lunch': [
    { item: 'Unlimited Meals', price: 125.00 },
    { item: 'Parcel Meals', price: 130.00 },
    { item: 'Curd Rice', price: 60.00 },
    { item: 'Sambar Rice', price: 60.00 },
    { item: 'Quick Lunch', price: 120.00 },
    { item: 'Variety Rice', price: 60.00 },
    { item: 'Brinji Kuruma', price: 60.00 },
    { item: 'Lemon Rice', price: 60.00 },
    { item: 'Puli Rice', price: 60.00 },
  ],
  // ===== North Indian Menu =====
  'Salads': [
    { item: 'Tomato Salad', price: 65.00 },
    { item: 'Veg. Salad', price: 65.00 },
    { item: 'Cucumber Salad', price: 65.00 },
    { item: 'Fruit Salad', price: 115.00 },
    { item: 'Onion Salad', price: 65.00 },
  ],
  'Tandoori Breads': [
    { item: 'Nan', price: 30.00 },
    { item: 'Veg. Nan', price: 40.00 },
    { item: 'Stuffed Nan', price: 160.00 },
    { item: 'Butter Nan', price: 165.00 },
    { item: 'Paneer Nan', price: 170.00 },
    { item: 'Kashmiri Nan', price: 170.00 },
    { item: 'Jeera Nan', price: 160.00 },
    { item: 'Roti', price: 200.00 },
    { item: 'Butter Roti', price: 180.00 },
    { item: 'Kulcha', price: 180.00 },
    { item: 'Masala Kulcha', price: 180.00 },
    { item: 'Stuffed Paratha', price: 180.00 },
    { item: 'Aloo Paratha', price: 170.00 },
    { item: 'Plain Paratha', price: 185.00 },
    { item: 'Pudina Paratha', price: 170.00 },
    { item: 'Peas Paratha', price: 185.00 },
    { item: 'Pulkha', price: 185.00 },
  ],
  'Tandoori Sides': [
    { item: 'Green Peas Masala', price: 160.00 },
    { item: 'Kaju Masala', price: 160.00 },
    { item: 'Mushroom Masala', price: 160.00 },
    { item: 'Mushroom Fry', price: 160.00 },
    { item: 'Mushroom Manchurian', price: 160.00 },
    { item: 'Mushroom Pepper Salt', price: 160.00 },
    { item: 'Mixed Veg Kuruma', price: 160.00 },
    { item: 'Navarathna Kuruma', price: 160.00 },
  ],
  'Starters': [
    { item: 'Papad', price: 185.00 },
    { item: 'Masala Fry Papad', price: 185.00 },
    { item: 'Gobi-65', price: 185.00 },
    { item: 'Finger Chips', price: 170.00 },
    { item: 'Paneer-65', price: 180.00 },
    { item: 'Mushroom-65', price: 185.00 },
  ],
  'Paneer Dishes': [
    { item: 'Paneer Mutter', price: 185.00 },
    { item: 'Paneer Butter Masala', price: 185.00 },
    { item: 'Paneer Koftha', price: 185.00 },
    { item: 'Paneer Manchurian', price: 175.00 },
    { item: 'Paneer Masala', price: 160.00 },
    { item: 'Paneer Fry', price: 160.00 },
    { item: 'Paneer Mushroom Masala', price: 160.00 },
    { item: 'Paneer Tikka Masala', price: 160.00 },
    { item: 'Paneer Capsicum Masala', price: 160.00 },
  ],
  'Veg Curries': [
    { item: 'Malai Koftha', price: 160.00 },
    { item: 'Veg. Koftha', price: 160.00 },
    { item: 'Veg. Curry', price: 160.00 },
    { item: 'Veg. Chilly Fry', price: 160.00 },
    { item: 'Veg. Manchurian', price: 160.00 },
    { item: 'Stuffed Tomato', price: 160.00 },
    { item: 'Stuffed Capsicum', price: 160.00 },
    { item: 'Tomato Onion Fry', price: 160.00 },
  ],
  'Noodles': [
    { item: 'Veg. Noodles', price: 150.00 },
    { item: 'Veg. Fried Noodles', price: 170.00 },
    { item: 'Mushroom Noodles', price: 175.00 },
    { item: 'Singapore Noodles', price: 190.00 },
    { item: 'Veg. American Chopse', price: 190.00 },
    { item: 'Veg. Chinese Chopse', price: 190.00 },
  ],
  'NI Rice & Pulav': [
    { item: 'Veg. Biryani / Onion Raitha', price: 100.00 },
    { item: 'Veg. Fried Rice', price: 150.00 },
    { item: 'Peas Fried Rice', price: 160.00 },
    { item: 'Gobi Fried Rice', price: 160.00 },
    { item: 'Paneer Fried Rice', price: 165.00 },
    { item: 'Mushroom Fried Rice', price: 165.00 },
    { item: 'Garlic Fried Rice', price: 165.00 },
    { item: 'Veg. Pulav / Onion Raitha', price: 110.00 },
    { item: 'Gobi Pulav', price: 160.00 },
    { item: 'Paneer Pulav', price: 165.00 },
    { item: 'Jeera Pulav', price: 165.00 },
    { item: 'Ghee Pulav', price: 165.00 },
    { item: 'Peas Pulav', price: 165.00 },
    { item: 'Kashmiri Pulav', price: 190.00 },
    { item: 'Cashewnut Pulav', price: 190.00 },
    { item: 'Kaju Paneer Pulav', price: 190.00 },
  ],
  'Raitha': [
    { item: 'Onion Raitha', price: 65.00 },
    { item: 'Veg. Raitha', price: 65.00 },
    { item: 'Tomato Raitha', price: 65.00 },
    { item: 'Extra Curd', price: 35.00 },
  ],
  'Aloo & Gobi': [
    { item: 'Aloo Fry', price: 165.00 },
    { item: 'Aloo Gobi', price: 165.00 },
    { item: 'Aloo Mutter', price: 165.00 },
    { item: 'Aloo Paneer', price: 170.00 },
    { item: 'Aloo Tikka Masala', price: 170.00 },
    { item: 'Aloo Capsicum', price: 170.00 },
    { item: 'Bindi Fry', price: 170.00 },
    { item: 'Bindi Masala', price: 170.00 },
    { item: 'Baby Corn Mushroom Masala', price: 175.00 },
    { item: 'Channa Masala', price: 160.00 },
    { item: 'Channa Paneer', price: 175.00 },
    { item: 'Gobi Paneer', price: 180.00 },
    { item: 'Gobi Mushroom Fry', price: 180.00 },
    { item: 'Gobi Masala', price: 165.00 },
    { item: 'Gobi Paneer Masala', price: 180.00 },
    { item: 'Gobi Mutter', price: 175.00 },
    { item: 'Gobi Tikka Masala', price: 175.00 },
    { item: 'Gobi Chilly Fry', price: 160.00 },
    { item: 'Gobi Mushroom Masala', price: 180.00 },
    { item: 'Gobi Manchurian', price: 160.00 },
  ],
}

const categoryImages = {
  'Breakfast & Dinner': '/cat-breakfast.png',
  'B&D Specials': '/cat-specials.png',
  'Evening Snacks': '/cat-snacks.png',
  'Dosa Varieties': '/cat-dosa.png',
  'Rice Varieties': '/cat-rice.png',
  'Hot Beverages': '/cat-beverages.png',
  'Soups': '/cat-soups.png',
  'Lunch': '/cat-lunch.png',
  'Salads': '/cat-soups.png',
  'Tandoori Breads': '/cat-northindian.png',
  'Tandoori Sides': '/cat-northindian.png',
  'Starters': '/cat-snacks.png',
  'Paneer Dishes': '/cat-northindian.png',
  'Veg Curries': '/cat-northindian.png',
  'Noodles': '/cat-rice.png',
  'NI Rice & Pulav': '/cat-rice.png',
  'Raitha': '/cat-soups.png',
  'Aloo & Gobi': '/cat-northindian.png',
}

const categories = Object.keys(allMenuData)

// Group categories visually
const southIndianCats = ['Breakfast & Dinner', 'B&D Specials', 'Evening Snacks', 'Dosa Varieties', 'Rice Varieties', 'Hot Beverages', 'Soups', 'Lunch']
const northIndianCats = ['Salads', 'Tandoori Breads', 'Tandoori Sides', 'Starters', 'Paneer Dishes', 'Veg Curries', 'Noodles', 'NI Rice & Pulav', 'Raitha', 'Aloo & Gobi']

function DineIn() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const currentItems = allMenuData[activeCategory] || []
  const isNorthIndian = northIndianCats.includes(activeCategory)

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
    // You can dispatch action to cart context or state management here
    alert(`${cartItem.item.item} x${cartItem.quantity} added to cart!`)
    handleCloseModal()
  }

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>Dine In</h1>
          <p>Browse our menu and place your order</p>
        </div>

        {/* South Indian Section */}
        <div className="dinein-section-label">🍛 South Indian</div>
        <div className="dinein-category-tabs">
          {southIndianCats.map(cat => (
            <button
              key={cat}
              className={`dinein-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <img src={categoryImages[cat]} alt={cat} className="dinein-tab-img" />
              {cat}
            </button>
          ))}
        </div>

        {/* North Indian Section */}
        <div className="dinein-section-label">🍲 North Indian</div>
        <div className="dinein-category-tabs">
          {northIndianCats.map(cat => (
            <button
              key={cat}
              className={`dinein-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <img src={categoryImages[cat]} alt={cat} className="dinein-tab-img" />
              {cat}
            </button>
          ))}
        </div>

        <div className="dinein-active-label">
          {isNorthIndian && <span className="dinein-badge ni">North Indian</span>}
          {!isNorthIndian && <span className="dinein-badge si">South Indian</span>}
          <span className="dinein-badge-name">{activeCategory}</span>
          <span className="dinein-badge-count">{currentItems.length} items</span>
        </div>

        <div className="dinein-items-list">
          {currentItems.map((menuItem, idx) => (
            <div key={idx} className="dinein-item-row" onClick={() => handleItemClick(menuItem)}>
              <div className="dinein-item-info">
                <span className="dinein-item-name">{menuItem.item}</span>
              </div>
              <div className="dinein-item-price-area">
                <span className="dinein-item-price">₹{menuItem.price.toFixed(0)}</span>
                <button className="add-btn">Add</button>
              </div>
            </div>
          ))}
        </div>

        {showModal && selectedItem && (
          <MenuItemModal 
            item={selectedItem}
            category={activeCategory}
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

export default DineIn
