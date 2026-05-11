import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import AIAssistantOverlay from '../components/AIAssistantOverlay'
import { fetchCategories, fetchItems, formatMenuData } from '../services/menuService'
import '../styles/pages.css'
import '../styles/dinein.css'


function MenuCard({ item, qty, onAdd, onInc, onDec }) {
  const { t, language } = useLanguage()
  const [imgError, setImgError] = useState(false)
  return (
    <div className="fg-card">
      <div className="fg-card-image-wrap">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="fg-card-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="di-card-emoji-wrap">
            <span className="di-card-emoji">{item.emoji || '🍽️'}</span>
          </div>
        )}
      </div>

      <div className="fg-card-content">
        <h3 className="fg-card-title">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</h3>
        <p className="fg-card-desc">{language === 'Tamil' && item.tamilDesc ? item.tamilDesc : item.description}</p>
      </div>

      <div className="fg-card-footer">
        <span className="fg-card-price">Rs. {item.price}</span>
        <div className={`fg-card-status ${item.available ? 'avail' : 'unavail'}`}>
          <span className="fg-card-dot" />
          {item.available ? t('available') : t('notAvailable')}
        </div>
      </div>

      <div className="fg-card-controls">
        <div className="fg-qty-container">
          <button onClick={() => onDec(item.id)} className="fg-qty-btn minus" disabled={qty === 0}>
            <span>−</span>
          </button>
          <div className="fg-qty-display"><span>{qty}</span></div>
          <button onClick={() => item.available ? (qty === 0 ? onAdd(item) : onInc(item.id)) : null} className="fg-qty-btn plus" disabled={!item.available}>
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DineIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useLanguage()
  const {
    cart,
    setCart,
    addToCart,
    changeQty,
    updateNote,
    totalItems,
    subtotal: totalAmount
  } = useCart()

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [topHeight] = useState(100)
  const [cardScale] = useState(1.0)

  const [menuCategories, setMenuCategories] = useState([{ id: 'all', name: 'All Menu', image: '/all menu.png' }])
  const [menuItems, setMenuItems] = useState({ all: [] })
  const [loading, setLoading] = useState(true)

  const getQty = id => cart.find(c => c.id === id)?.quantity ?? 0
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsCartOpen(false)
    })
    
    // Fetch menu data from backend
    async function fetchMenuData() {
      try {
        const catRes = await fetch('http://localhost:5000/api/categories');
        const dbCategories = await catRes.json();
        
        const itemRes = await fetch('http://localhost:5000/api/items');
        const dbItems = await itemRes.json();

        const formattedCategories = [
          { id: 'all', name: 'All Menu', image: '/all menu.png' },
          ...dbCategories.map(c => ({
            id: String(c.id),
            name: c.name,
            image: '/cat_dosa.png' // Default placeholder image
          }))
        ];

        const formattedItems = {};
        const allItems = [];
        
        dbItems.forEach(item => {
          const catId = String(item.category_id);
          const formattedItem = {
            id: Number(item.id),
            name: item.name,
            tamilName: item.name, // Fallback to english if tamil not available
            price: Number(item.price),
            image: item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`) : null,
            description: item.description,
            tamilDesc: item.description,
            available: item.is_available,
            emoji: '🍽️'
          };

          if (!formattedItems[catId]) {
            formattedItems[catId] = [];
          }
          formattedItems[catId].push(formattedItem);
          allItems.push(formattedItem);
        });

        formattedItems.all = allItems.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        setMenuCategories(formattedCategories);
        setMenuItems(formattedItems);
      } catch (err) {
        console.error("Error fetching menu data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenuData();
  }, [])
  const baseItems = menuItems[activeCategory] ?? menuItems.all
  const displayItems = searchQuery.trim()
    ? baseItems.filter(i => {
      const name = language === 'Tamil' && i.tamilName ? i.tamilName : i.name;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    : baseItems

  return (
    <div className="app-container">
      <div className="background-image" />
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} />

      <main className="di-main">
        <div className="di-seg-top">
          <div className="di-topbar">
            <div className="di-search-wrap">
              <input className="di-search-input" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <i className="fa-solid fa-magnifying-glass di-search-icon" />
            </div>
            <div className="di-topbar-right">
              <button className="di-filter-btn"><i className="fa-solid fa-sliders" /></button>
              <button className="di-new-order-btn" onClick={() => { setCart([]); setSearchQuery(''); setIsCartOpen(false); }}>
                <i className="fa-solid fa-plus" />
                {t('newOrder')}
              </button>
            </div>
          </div>

          <div className="di-tabs-wrap">
            {menuCategories.map(cat => (
              <button key={cat.id} className={`di-tab ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                <img src={cat.image} alt={t(cat.name)} className="di-tab-img" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                <span>{language === 'Tamil' && cat.tamilName ? cat.tamilName : t(cat.name)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="di-seg-bottom">
          <div className="di-section-header">
            <h2 className="di-section-title">
              {t(menuCategories.find(c => c.id === activeCategory)?.name || 'Menu')}
              <span className="di-section-count">{displayItems.length} {t('items')}</span>
            </h2>
          </div>
          <div className="di-grid di-grid-5" style={{ '--card-scale': cardScale }}>
            {displayItems.length === 0
              ? <div className="di-empty">No items found.</div>
              : displayItems.map(item => (
                <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addToCart} onInc={id => changeQty(id, 1)} onDec={id => changeQty(id, -1)} />
              ))
            }
          </div>
        </div>

        {totalItems > 0 && !isCartOpen && (
          <button className="di-view-cart-btn" onClick={() => { setIsCartOpen(true) }}>
            <i className="fa-solid fa-cart-shopping" />
            <span>{t('viewCart')}</span>
            <span className="di-cart-badge">{totalItems}</span>
          </button>
        )}
      </main>

      {/* Cart sidebar (Floating) - Moved outside di-main for z-index layering */}
      {isCartOpen && (
        <div className="di-sidebar di-cart-mode active">
          <div className="di-cart-header">
            <div className="di-cart-header-left">
              <span className="di-cart-title">{t('cart') || 'Cart'}</span>
              <span className="di-cart-table-pill">{t('tableNo')} 06 <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
            </div>
            <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>
          <div className="di-cart-order-id"># Order ID : 2002</div>

          <div className="di-order-type-tabs">
            <button className="di-ot-tab active" style={{ width: '100%' }}><i className="fa-solid fa-utensils" /> {t('dineIn')}</button>
          </div>

          <div className="di-cart-items">
            {cart.length === 0
              ? <p className="di-cart-empty">Cart is empty. Add items from the menu.</p>
              : cart.map(item => (
                <div key={item.id} className="di-cart-item-container">
                  <button className="di-cart-remove-circle" onClick={() => setCart(p => p.filter(c => c.id !== item.id))}>✕</button>
                  <div className="di-cart-item-body">
                    <div className="di-cart-item-thumb">
                      {item.image ? <img src={item.image} alt={item.name} /> : <span className="di-cart-thumb-emoji">{item.emoji || '🍽️'}</span>}
                    </div>
                    <div className="di-cart-item-details">
                      <p className="di-cart-item-name">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</p>
                      <p className="di-cart-serves">{t('serves')} : 1</p>
                      <p className="di-cart-item-price">Rs. {item.price}</p>
                    </div>
                    <div className="di-cart-item-right">
                      <p className="di-cart-total-label">Total</p>
                      <p className="di-cart-total-amount">{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="di-cart-gst">+ GST</p>
                      <div className="di-cart-stepper">
                        <button className="di-cart-qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                        <span className="di-cart-qty-num">{item.quantity}</span>
                        <button className="di-cart-qty-btn plus" onClick={() => changeQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="di-cart-note-wrap">
                    <input className="di-cart-note-input" placeholder="Please, Just a little bit spicy only...." value={item.note || ''} onChange={e => updateNote(item.id, e.target.value)} />
                  </div>
                </div>
              ))
            }
          </div>

          <div className="di-cart-footer">
            <button className="di-add-more-btn" onClick={() => setIsCartOpen(false)}>
              <i className="fa-solid fa-plus" /> {t('addMore')}
            </button>
            <button className="di-place-order-btn" disabled={cart.length === 0} onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>
              {t('confirmOrder')}
            </button>
          </div>
        </div>
      )}

      <AIAssistantOverlay
        navigate={navigate}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        menuItems={Object.entries(menuItems).flatMap(([catId, items]) => items.map(item => ({ ...item, category: catId })))}
        menuCategories={menuCategories}
      />
    </div>
  )
}
