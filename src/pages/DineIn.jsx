import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
// Menu data is fetched directly below
import '../styles/pages.css'
import '../styles/dinein.css'
import '../styles/home.css'

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !navigator.mediaDevices.getUserMedia.isPatched) {
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const stream = await originalGetUserMedia(constraints);
    window.activeCameraStreams = window.activeCameraStreams || new Set();
    window.activeCameraStreams.add(stream);
    return stream;
  };
  navigator.mediaDevices.getUserMedia.isPatched = true;
}

function MenuCard({ item, qty, onAdd, onInc, onDec, onUpdateQty, hasActiveOrder }) {
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
        <h3 className="fg-card-title">
          {item.itemCode && <span className="item-code-badge">[{item.itemCode}] </span>}
          {language === 'Tamil' && item.tamilName ? item.tamilName : item.name}
        </h3>
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
        {hasActiveOrder ? (
          <div className="fg-qty-container" style={{ opacity: 0.5 }}>
            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Active Order In Progress</span>
          </div>
        ) : (
          <div className="fg-qty-container">
            <button onClick={() => onDec(item.id)} className="fg-qty-btn minus" disabled={qty === 0}>
              <span>−</span>
            </button>
            <div className="fg-qty-display">
              <input
                type="text"
                inputMode="numeric"
                value={qty === 0 ? '' : qty}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    if (qty > 0) onUpdateQty(item.id, 0);
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 0) {
                    if (qty === 0 && num > 0) {
                      onAdd(item, num);
                    } else {
                      onUpdateQty(item.id, num);
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    onUpdateQty(item.id, 0);
                  }
                }}
                placeholder="0"
                style={{
                  width: '100%',
                  border: 'none',
                  textAlign: 'center',
                  background: 'transparent',
                  fontWeight: '600',
                  fontFamily: 'inherit',
                  fontSize: '1.2rem',
                  color: '#333',
                  outline: 'none'
                }}
              />
            </div>
            <button onClick={() => item.available ? (qty === 0 ? onAdd(item) : onInc(item.id)) : null} className="fg-qty-btn plus" disabled={!item.available}>
              <span>+</span>
            </button>
          </div>
        )}
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
    updateItemQuantity,
    updateNote,
    isCartOpen,
    setIsCartOpen,
    totalItems,
    subtotal: totalAmount,
    tableNumber,
    activeCategory,
    setActiveCategory,
    setTableNumber,
    hasActiveOrder
  } = useCart()

  const [searchQuery, setSearchQuery] = useState('')

  const [topHeight] = useState(100)
  const [cardScale] = useState(1.0)

  const [menuCategories, setMenuCategories] = useState([{ id: 'all', name: 'All Menu', image: null }])
  const [menuItems, setMenuItems] = useState({ all: [] })
  const [loading, setLoading] = useState(true)

  const getQty = id => cart.find(c => c.id === id)?.quantity ?? 0
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [filterOption, setFilterOption] = useState('all')
  const [sortOption, setSortOption] = useState('default')
  const filterDropdownRef = useRef(null)

  const [showScanner, setShowScanner] = useState(false)
  const [manualTable, setManualTable] = useState('')
  const [scannerError, setScannerError] = useState('')
  const qrCodeInstanceRef = useRef(null)

  const stopAllCameraTracks = () => {
    if (window.activeCameraStreams) {
      window.activeCameraStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      window.activeCameraStreams.clear();
    }
    try {
      const videos = document.querySelectorAll('video')
      videos.forEach(video => {
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach(track => {
            track.stop()
          })
          video.srcObject = null
        }
      })
    } catch (e) {
      console.error("Error manually stopping camera tracks:", e)
    }
  }

  const handleCloseScanner = async () => {
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on close:", err)
      }
      qrCodeInstanceRef.current = null
    }
    setShowScanner(false)
  }

  const parseTableFromQR = (data) => {
    try {
      if (data.includes('?')) {
        const queryString = data.split('?')[1]
        const params = new URLSearchParams(queryString)
        const tableVal = params.get('table')
        if (tableVal) {
          return formatTableNumber(tableVal)
        }
      }
    } catch (e) {
      console.error("Error parsing QR URL:", e)
    }
    return formatTableNumber(data)
  }

  const formatTableNumber = (val) => {
    const clean = val.trim().toUpperCase()
    if (/^T-\d+$/.test(clean)) {
      return clean.replace('T-', '')
    }
    if (/^T\d+$/.test(clean)) {
      return clean.replace('T', '').padStart(2, '0')
    }
    const digits = clean.replace(/\D/g, '')
    if (digits) {
      return digits.padStart(2, '0')
    }
    return '06'
  }

  const handleScanSuccess = async (decodedText) => {
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on success:", err)
      }
      qrCodeInstanceRef.current = null
    }
    const tableNum = parseTableFromQR(decodedText)
    setTableNumber(tableNum)
    localStorage.setItem('active_table_number', tableNum)
    setShowScanner(false)
  }

  const handleManualSubmit = async () => {
    if (!manualTable.trim()) {
      alert("Please enter a valid table number.")
      return
    }
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on manual submit:", err)
      }
      qrCodeInstanceRef.current = null
    }
    const tableNum = formatTableNumber(manualTable)
    setTableNumber(tableNum)
    localStorage.setItem('active_table_number', tableNum)
    setShowScanner(false)
  }

  useEffect(() => {
    let active = true
    let html5QrCode = null

    if (showScanner) {
      const timer = setTimeout(() => {
        if (!active) return

        try {
          html5QrCode = new Html5Qrcode("qr-reader")
          qrCodeInstanceRef.current = html5QrCode

          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              if (active) {
                handleScanSuccess(decodedText)
              }
            },
            () => { }
          ).then(() => {
            if (!active && html5QrCode) {
              stopAllCameraTracks()
              if (html5QrCode.isScanning) {
                html5QrCode.stop()
                  .then(() => {
                    html5QrCode.clear()
                  })
                  .catch(err => console.error("Stop failed on late cleanup:", err))
              } else {
                stopAllCameraTracks()
              }
            }
          }).catch((err) => {
            if (active) {
              console.error("Camera start error:", err)
              setScannerError("Could not access camera. Please enter table number manually.")
            }
          })
        } catch (e) {
          console.error("Scanner setup error:", e)
          setScannerError("Scanner initialization failed. Please use manual entry.")
        }
      }, 300)

      return () => {
        clearTimeout(timer)
        active = false
        stopAllCameraTracks()
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              html5QrCode.stop()
                .then(() => {
                  html5QrCode.clear()
                })
                .catch(err => console.error("Scanner stop error:", err))
            }
          } catch (e) {
            console.error("Scanner cleanup error:", e)
          }
        }
      }
    }
  }, [showScanner])
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsCartOpen(false)
    })

    // Fetch menu data from backend
    async function fetchMenuData() {
      try {
        const catRes = await fetch('/api/v1/public/menu/categories');
        const dbCategories = await catRes.json();

        const itemRes = await fetch('/api/v1/public/menu/items');
        const dbItems = await itemRes.json();

        const catIdMap = {};
        const uniqueCategories = [];
        const seenNames = new Map();

        for (const cat of dbCategories) {
          const normName = cat.name.trim().toLowerCase();
          if (!seenNames.has(normName)) {
            seenNames.set(normName, cat.id);
            uniqueCategories.push(cat);
            catIdMap[cat.id] = cat.id;
          } else {
            catIdMap[cat.id] = seenNames.get(normName);
          }
        }

        const formattedCategories = [
          { id: 'all', name: 'All Menu', image: null },
          ...uniqueCategories.map(c => ({
            id: String(c.id),
            name: c.name,
            image: c.image_url || null
          }))
        ];

        const formattedItems = {};
        const allItems = [];

        dbItems.forEach(item => {
          const rawCatId = item.category_id;
          const catId = String(catIdMap[rawCatId] || rawCatId);
          const formattedItem = {
            id: Number(item.id),
            itemCode: item.item_code || String(item.id),
            name: item.name,
            tamilName: item.name, // Fallback to english if tamil not available
            price: Number(item.price),
            image: item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL || ''}${item.image_url}`) : null,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showAllItems, setShowAllItems] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setShowAllItems(false)
  }, [activeCategory])

  const baseItems = menuItems[activeCategory] ?? menuItems.all

  // Apply search, filters and sorting
  let processedItems = [...baseItems]
  if (searchQuery.trim()) {
    processedItems = processedItems.filter(i => {
      const name = language === 'Tamil' && i.tamilName ? i.tamilName : i.name;
      const code = i.itemCode ? i.itemCode.toLowerCase() : '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || code.includes(query);
    })
  }
  if (filterOption === 'available') {
    processedItems = processedItems.filter(i => i.available)
  }
  if (sortOption === 'price-asc') {
    processedItems.sort((a, b) => a.price - b.price)
  } else if (sortOption === 'price-desc') {
    processedItems.sort((a, b) => b.price - a.price)
  }

  const displayItems = (isMobile && !showAllItems) ? processedItems.slice(0, 6) : processedItems

  return (
    <div className="app-container">
      <div className="background-image" />
      <Header tableNumber={tableNumber} showFullHeader={true} useTitleImage={true} onTableClick={() => setShowScanner(true)} />

      <main className="di-main">
        <div className="di-seg-top">
          <div className="di-topbar">
            <div className="di-search-wrap">
              <input
                className="di-search-input"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const query = searchQuery.trim().toLowerCase();
                    if (!query) return;

                    let itemToAdd = processedItems.find(i => i.itemCode && i.itemCode.toLowerCase() === query);
                    if (!itemToAdd && processedItems.length === 1) {
                      itemToAdd = processedItems[0];
                    }

                    if (itemToAdd && itemToAdd.available && !hasActiveOrder) {
                      const qty = getQty(itemToAdd.id);
                      if (qty === 0) {
                        addToCart(itemToAdd);
                      } else {
                        changeQty(itemToAdd.id, 1);
                      }
                      setSearchQuery('');
                    }
                  }
                }}
              />
              <i className="fa-solid fa-magnifying-glass di-search-icon" />
            </div>
            <div className="di-topbar-right" ref={filterDropdownRef} style={{ position: 'relative' }}>
              <button
                className={`di-filter-btn ${showFilterDropdown ? 'active' : ''} ${(filterOption !== 'all' || sortOption !== 'default') ? 'applied' : ''}`}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <i className="fa-solid fa-sliders" />
                {(filterOption !== 'all' || sortOption !== 'default') && (
                  <span className="filter-active-dot" />
                )}
              </button>
              <button className="di-new-order-btn" onClick={() => { setCart([]); setSearchQuery(''); setIsCartOpen(false); }} disabled={hasActiveOrder}>
                <i className="fa-solid fa-plus" />
                {t('newOrder')}
              </button>

              {showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <div className="filter-dropdown-section">
                    <h4>{language === 'Tamil' ? 'வடிகட்டு' : 'Filter'}</h4>
                    <button className={`filter-opt-btn ${filterOption === 'all' ? 'selected' : ''}`} onClick={() => { setFilterOption('all'); setShowFilterDropdown(false); }}>
                      {language === 'Tamil' ? 'அனைத்தும்' : 'All Items'}
                    </button>
                    <button className={`filter-opt-btn ${filterOption === 'available' ? 'selected' : ''}`} onClick={() => { setFilterOption('available'); setShowFilterDropdown(false); }}>
                      {language === 'Tamil' ? 'கிடைப்பவை மட்டும்' : 'Available Only'}
                    </button>
                  </div>
                  <div className="filter-dropdown-divider" />
                  <div className="filter-dropdown-section">
                    <h4>{language === 'Tamil' ? 'விலை வாரியாக' : 'Sort by Price'}</h4>
                    <button className={`filter-opt-btn ${sortOption === 'default' ? 'selected' : ''}`} onClick={() => { setSortOption('default'); setShowFilterDropdown(false); }}>
                      {language === 'Tamil' ? 'இயல்புநிலை' : 'Default'}
                    </button>
                    <button className={`filter-opt-btn ${sortOption === 'price-asc' ? 'selected' : ''}`} onClick={() => { setSortOption('price-asc'); setShowFilterDropdown(false); }}>
                      {language === 'Tamil' ? 'குறைவிலிருந்து அதிகம்' : 'Low to High'}
                    </button>
                    <button className={`filter-opt-btn ${sortOption === 'price-desc' ? 'selected' : ''}`} onClick={() => { setSortOption('price-desc'); setShowFilterDropdown(false); }}>
                      {language === 'Tamil' ? 'அதிகத்திலிருந்து குறைவு' : 'High to Low'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="di-tabs-wrap">
            {menuCategories.map(cat => (
              <button key={cat.id} className={`di-tab ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                {cat.image && <img src={cat.image} alt={t(cat.name)} className="di-tab-img" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />}
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
                <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addToCart} onInc={id => changeQty(id, 1)} onDec={id => changeQty(id, -1)} onUpdateQty={updateItemQuantity} hasActiveOrder={hasActiveOrder} />
              ))
            }
          </div>
          {isMobile && processedItems.length > 6 && (
            <div className="di-show-more-wrap" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
              <button
                className="di-show-more-btn"
                onClick={() => setShowAllItems(!showAllItems)}
                style={{
                  background: '#ff3400',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '30px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(255, 52, 0, 0.2)'
                }}
              >
                {showAllItems ? (
                  <>
                    {language === 'Tamil' ? 'குறைவாகக் காட்டு' : 'Show Less'}{' '}
                    <i className="fa-solid fa-chevron-up" style={{ marginLeft: '6px' }} />
                  </>
                ) : (
                  <>
                    {language === 'Tamil' ? 'மேலும் காட்டு' : 'Show More'}{' '}
                    <i className="fa-solid fa-chevron-down" style={{ marginLeft: '6px' }} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {totalItems > 0 && !isCartOpen && !hasActiveOrder && (
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
              <span className="di-cart-table-pill" onClick={() => setShowScanner(true)} style={{ cursor: 'pointer' }}>{t('tableNo')} {tableNumber} <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem' }} /></span>
            </div>
            <button className="di-cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>
          <div className="di-cart-order-id"># New Order</div>

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
                      <div className="di-cart-stepper">
                        <button className="di-cart-qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                        <input
                          className="di-cart-qty-num"
                          type="text"
                          inputMode="numeric"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val === '') {
                              updateItemQuantity(item.id, '');
                              return;
                            }
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 0) {
                              updateItemQuantity(item.id, num);
                            }
                          }}
                          onBlur={(e) => {
                            if (item.quantity === '' || parseInt(item.quantity, 10) === 0) {
                              updateItemQuantity(item.id, 0);
                            }
                          }}
                          style={{
                            width: '40px',
                            border: 'none',
                            textAlign: 'center',
                            background: 'transparent',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            color: 'inherit',
                            outline: 'none'
                          }}
                        />
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



      {showScanner && (
        <div className="scanner-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="scanner-modal-content">
            <button className="scanner-modal-close" onClick={handleCloseScanner}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h4 className="scanner-modal-title">Change the table number</h4>
            <p className="scanner-modal-subtitle">Align the QR code on your table to change table</p>

            <div className="qr-reader-container">
              <div id="qr-reader"></div>
              <div className="qr-scanner-viewfinder">
                <div className="viewfinder-box">
                  <div className="scan-laser"></div>
                </div>
              </div>
            </div>

            {scannerError && (
              <div className="scanner-error-msg">{scannerError}</div>
            )}

            <div className="scanner-manual-card">
              <h5 className="manual-card-title">Unable to scan?</h5>
              <p className="manual-card-subtitle">Enter the table number manually from your table card</p>
              <div className="manual-input-group">
                <input
                  type="text"
                  className="manual-table-input"
                  placeholder="Table No. (e.g. 05)"
                  value={manualTable}
                  onChange={(e) => setManualTable(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button className="manual-table-btn" onClick={handleManualSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
