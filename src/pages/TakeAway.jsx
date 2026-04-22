import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import MenuItemModal from '../components/MenuItemModal'
import '../styles/pages.css'

const takeawayPackages = [
  { 
    id: 1, 
    name: 'Breakfast Box', 
    tamilName: 'காலை உணவுப் பெட்டி',
    description: 'Idly, Vada, Pongal with Sambar & Chutney',
    tamilDescription: 'இட்லி, வடை, பொங்கல் சாம்பார் மற்றும் சட்னியுடன்',
    items: 3, 
    price: 120,
    image: '/cat-breakfast.png'
  },
  { 
    id: 2, 
    name: 'Dosa Combo', 
    tamilName: 'தோசை காம்போ',
    description: 'Masala Dosa, Rava Dosa with sides',
    tamilDescription: 'மசாலா தோசை, ரவா தோசை பக்க உணவுகளுடன்',
    items: 4, 
    price: 160,
    image: '/cat-dosa.png'
  },
  { 
    id: 3, 
    name: 'Lunch Thali', 
    tamilName: 'மதிய உணவுத் தட்டு',
    description: 'Full meals with rice, sambar, rasam & more',
    tamilDescription: 'சாதம், சாம்பார், ரசம் மற்றும் பலவற்றுடன் கூடிய முழு உணவு',
    items: 6, 
    price: 130,
    image: '/cat-lunch.png'
  },
  { 
    id: 4, 
    name: 'North Indian Combo', 
    tamilName: 'வட இந்திய காம்போ',
    description: 'Nan, Paneer Butter Masala & Pulav',
    tamilDescription: 'நான், பன்னீர் பட்டர் மசாலா மற்றும் புலாவ்',
    items: 3, 
    price: 250,
    image: '/cat-northindian.png'
  },
  { 
    id: 5, 
    name: 'Snack Pack', 
    tamilName: 'சிற்றுண்டிப் பொதி',
    description: 'Bajji, Bonda, Chola Poori & Tea',
    tamilDescription: 'பஜ்ஜி, போண்டா, சோலா பூரி மற்றும் டீ',
    items: 4, 
    price: 180,
    image: '/cat-snacks.png'
  },
  { 
    id: 6, 
    name: 'Party Feast', 
    tamilName: 'பார்ட்டி விருந்து',
    description: 'Biryani, Noodles, Gobi 65 & more',
    tamilDescription: 'பிரியாணி, நூடுல்ஸ், கோபி 65 மற்றும் பல',
    items: 8, 
    price: 499,
    image: '/cat-rice.png'
  },
]

function TakeAway() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
    const itemName = language === 'Tamil' ? cartItem.item.tamilName : cartItem.item.name;
    alert(`${itemName} x${cartItem.quantity} added to cart!`)
    handleCloseModal()
  }

  return (
    <div className="app-container">
      <div className="background-image"></div>
      
      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>{t('takeAway')}</h1>
          <p>{t('quickSelection')}</p>
        </div>

        <div className="takeaway-grid">
          {takeawayPackages.map(pkg => (
            <div key={pkg.id} className="takeaway-card" onClick={() => handleItemClick(pkg)}>
              <div className="takeaway-card-img">
                <img src={pkg.image} alt={pkg.name} />
                <div className="takeaway-card-overlay"></div>
                <span className="takeaway-items-badge">{pkg.items} {t('items')}</span>
              </div>
              <div className="takeaway-card-body">
                <h3>{language === 'Tamil' ? pkg.tamilName : pkg.name}</h3>
                <p className="takeaway-desc">{language === 'Tamil' ? pkg.tamilDescription : pkg.description}</p>
                <div className="takeaway-card-footer">
                  <span className="takeaway-price">₹{pkg.price}</span>
                  <button className="order-btn" onClick={(e) => e.stopPropagation()}>{t('add')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && selectedItem && (
          <MenuItemModal 
            item={{
              item: language === 'Tamil' ? selectedItem.tamilName : selectedItem.name, 
              price: selectedItem.price, 
              description: language === 'Tamil' ? selectedItem.tamilDescription : selectedItem.description
            }}
            category={t('takeAway')}
            onClose={handleCloseModal}
            onAddToCart={handleAddToCart}
          />
        )}

        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> {t('backToHome')}
        </button>
      </main>
    </div>
  )
}

export default TakeAway
