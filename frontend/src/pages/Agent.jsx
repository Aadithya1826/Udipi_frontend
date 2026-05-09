import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import Invoice from './Invoice'
import { fetchCategories, fetchItems, formatMenuData } from '../services/menuService'
import '../styles/pages.css'

function Agent() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [messages, setMessages] = useState([
    { role: 'model', content: t('hello') }
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMutedState] = useState(false)
  const isMutedRef = useRef(false)

  const setIsMuted = (val) => {
    setIsMutedState(val)
    isMutedRef.current = val
    if (val && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const menuTopRef = useRef(null)
  const [micToast, setMicToast] = useState('')
  const [menuCategories, setMenuCategories] = useState([{ id: 'all', name: 'All Menu', image: '/all menu.png' }]);
  const [menuItems, setMenuItems] = useState({ all: [] });
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dbCats, dbItems] = await Promise.all([fetchCategories(), fetchItems()]);
        const { categories, itemsMap, allItems } = formatMenuData(dbCats, dbItems);
        setMenuCategories(categories);
        setMenuItems(itemsMap);
        setAllItems(allItems);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);


  const [showMenu, setShowMenu] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' for categories, 'list' for items

  // Cart State Management from Context
  const {
    cart,
    setCart,
    addToCart,
    changeQty,
    removeCartItem,
    totalItems,
    subtotal: totalAmount
  } = useCart()

  // Checkout & Mobile Flow State
  const [isAwaitingMobile, setIsAwaitingMobile] = useState(false)
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [finalInvoiceData, setFinalInvoiceData] = useState(null)

  const messagesEndRef = useRef(null)

  // Autoscroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (showMenu && menuTopRef.current) {
      // Scroll to the top of the menu instead of the bottom of the chat
      setTimeout(() => {
        menuTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      scrollToBottom()
    }
  }, [messages, showMenu, activeCategory, viewMode])

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'English' ? 'en-US' : 'ta-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setMicToast(language === 'English' ? 'Listening...' : 'கேட்கிறது...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setMicToast('Speech captured!');
      // Short delay to let user see their text before sending
      setTimeout(() => {
        handleSendMessage(transcript);
        setMicToast('');
      }, 800);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setMicToast('Mic error. Please try again.');
      setTimeout(() => setMicToast(''), 2000);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (micToast === 'Listening...') setMicToast('');
    };
  }

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  const speakText = (text) => {
    if (isMutedRef.current || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Set language for voice synthesis
    utterance.lang = language === 'English' ? 'en-US' : 'ta-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  const handleSendMessage = async (textToSubmit = inputText) => {
    if (!textToSubmit.trim()) return;

    const lowerText = textToSubmit.toLowerCase();

    // Task 2: Check for menu items in the text
    const normalize = (s) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ").trim();
    const normalizedInput = normalize(lowerText);
    
    const foundItem = allItems.find(item => {
      const itemName = normalize(item.name).replace(/\d+$/, '').trim(); // Remove portions like 2 at the end
      return normalizedInput.includes(itemName) || (item.tamilName && normalize(item.tamilName).includes(normalizedInput));
    });

    if (foundItem) {
      handleAddToCart(foundItem);
      setInputText('');
      return;
    }

    if (isAwaitingPayment) {
      if (lowerText === 'done' || lowerText.includes('done')) {
        setIsAwaitingPayment(false);
        
        navigate('/invoice', { 
          state: { 
            cartData: finalInvoiceData?.cartData || [],
            subtotal: finalInvoiceData?.subtotal || 0,
            gst: finalInvoiceData?.gst || 0,
            finalTotal: finalInvoiceData?.finalTotal || 0,
            mobileNumber: mobileNumber
          } 
        });
        return;
      }
    }

    if (isAwaitingMobile) {
      if (lowerText === 'done' || lowerText.includes('done')) {
        if (mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber)) {
          setIsAwaitingMobile(false);
          setIsAwaitingPayment(true);
          setMessages([{ role: 'model', type: 'qr_prompt' }]);
          speakText(`${t('qrPrompt')} ${t('scanToPay')} ${t('paymentComplete')}`);
        } else {
          setMessages([...messages, { role: 'user', content: textToSubmit }, { role: 'model', content: "Invalid mobile number" }]);
          speakText(t('invalidMobile'));
        }
        setInputText('');
        return;
      }

      // Extract numbers spoken if they aren't "done"
      const extractedNums = textToSubmit.replace(/\D/g, '');
      if (extractedNums.length > 0) {
        setMobileNumber(prev => (prev + extractedNums).slice(0, 10));
        setInputText('');
        return;
      }
    }

    const isCheckoutPending = messages.length > 0 && messages[messages.length - 1].type === 'checkout';

    if (lowerText === 'yes' && isCheckoutPending) {
      setIsAwaitingMobile(true);
      setMobileNumber('');
      setMessages([{ role: 'model', type: 'mobile_prompt' }]);
      speakText(`${t('enterMobile')} ${t('paymentComplete')}`);
      setInputText('');
      return;
    }

    if ((lowerText === 'yes' || lowerText === 'checkout confirmed') && cart.length > 0) {
      handleCheckout();
      setInputText('');
      return;
    }

    const userMessage = { role: 'user', content: textToSubmit }
    const updatedMessages = [...messages, userMessage]

    // Direct check for "show menu" to bypass API connection issues
    if (textToSubmit.toLowerCase().includes('show menu')) {
      setShowMenu(true)
      setViewMode('grid')
      const localResponse = "Certainly! Here are our menu categories. You can click on any category to explore the items."
      setMessages([...updatedMessages, { role: 'model', content: localResponse }])
      speakText(localResponse)
      setInputText('')
      return; // Skip API call and loading state
    }

    // Regular API flow
    setMessages(updatedMessages)
    setInputText('')
    setIsLoading(true)

    try {
      // Calling our internal backend proxy instead of Google directly
      const apiUrl = '/api/chat'

      const apiMessages = updatedMessages
        .filter(msg => msg.content && typeof msg.content === 'string')
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

      // Gemini requires the conversation to end with a 'user' message
      if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role === 'model') {
        apiMessages.push({
          role: 'user',
          parts: [{ text: textToSubmit }]
        });
      }

      const payload = {
        systemInstruction: {
          parts: [{ text: `You are a friendly and polite AI assistant for Data Udipi, a well-known authentic Indian vegetarian restaurant. Your role is to help customers explore the menu and place their orders smoothly. Always respond in ${language}. Keep responses warm, courteous, and concise (1–2 sentences). You may suggest popular items such as Dosas, Idlis, Vadas, Meals, and Filter Coffee when relevant. If a customer asks to view the menu or available options, kindly inform them that you are showing the menu and include the token [SHOW_MENU] in your response.` }]
        },
        contents: apiMessages
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Chat API error:", data)
        throw new Error(data.error?.message || `API Error: ${response.status}`)
      }

      if (data.candidates && data.candidates.length > 0) {
        let botResponse = data.candidates[0].content.parts[0].text

        // Check for menu trigger
        if (botResponse.includes('[SHOW_MENU]')) {
          setShowMenu(true)
          setViewMode('grid')
          botResponse = botResponse.replace('[SHOW_MENU]', '').trim()
        }

        // Direct check for "review order" via Gemini payload interpretation
        if (botResponse.toLowerCase().includes('review order') || botResponse.toLowerCase().includes('shall we proceed for checkout')) {
          setShowMenu(false)
          setMessages(prev => [...prev, { role: 'model', type: 'review' }])
          speakText(t('proceedToPayment'))
          return;
        }

        setMessages(prev => [...prev, { role: 'model', content: botResponse }])
        speakText(botResponse)
      } else {
        console.error("Gemini API - no candidates in response:", data)
        throw new Error('Invalid response from AI')
      }
    } catch (error) {
      console.error("Detailed failure from Gemini:", error)
      const customerFriendlyError = language === 'English' ? "I'm sorry, I'm having a bit of trouble connecting to the system. Please try asking again in a moment." : "மன்னிக்கவும், கணினியுடன் இணைப்பதில் எனக்குச் சிறு சிக்கல் உள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் கேட்கவும்.";
      setMessages(prev => [...prev, { role: 'model', content: customerFriendlyError }])
      speakText(customerFriendlyError);
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id)

    if (category.id !== 'all' && menuItems[category.id]) {
      setViewMode('list')
    } else {
      setViewMode('grid')
    }

    setMessages(prev => [
      ...prev,
      { role: 'model', content: `Showing ${category.name} menu` }
    ])
  }

  // Cart Functions using Context
  const handleAddToCart = (item) => {
    addToCart(item)

    // Instant local AI feedback without roundtrip
    setMessages(prev => [
      ...prev,
      { role: 'model', content: `Added ${item.name} to your order! Say 'review order' to see your summary, or keep adding more.` }
    ])
    speakText(`Added ${item.name} to your order!`)
  }

  const updateCartQty = (itemId, delta) => {
    changeQty(itemId, delta)
  }


  const handleCheckout = () => {
    const subtotal = totalAmount;
    const service = subtotal * 0.05;
    const gst = subtotal * 0.05;
    const finalTotal = subtotal + service + gst;

    const checkoutData = {
      cartData: [...cart],
      subtotal,
      service,
      gst,
      finalTotal
    };

    setFinalInvoiceData(checkoutData);

    setShowMenu(false);
    setMessages([
      {
        role: 'model',
        type: 'checkout',
        ...checkoutData
      }
    ]);

    setCart([]); // Clear cart after freezing data to message
    speakText(t('proceedToPayment'));
  }

  const handleMobileDigit = (digit) => {
    if (mobileNumber.length >= 10) return;
    setMobileNumber(prev => prev + digit);
  }

  const handleMobileDelete = () => {
    setMobileNumber(prev => prev.slice(0, -1));
  }

  // Listeners moved to handleSendMessage hooks directly where API bypass is needed.

  return (
    <div className="app-container">
      <div className="background-image"></div>
      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} />



      <main className="agent-page-content">
        <div className="agent-chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'model' ? 'bot-message' : 'user-message'}`}>
                {msg.role === 'model' ? (
                  <>
                    <div className="message-icon bot-icon"><img src="/agentwaiter logo.png" alt="bot" /></div>

                    {msg.type === 'review' ? (
                      <div className="review-card" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <h3 className="title">{t('reviewOrder')}</h3>

                        <div className="review-card-items-list">
                          {cart.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '15px 0' }}>Your cart is empty.</p>
                          ) : (
                            cart.map(item => (
                              <div key={item.id} className="item-card">
                                <div className="item-top">
                                  <div>
                                    <div className="item-name">
                                      {item.name}
                                      {item.available && <span className="badge">● Available</span>}
                                    </div>
                                    <div className="item-desc">
                                      {item.description}
                                    </div>
                                  </div>
                                  <div className="price">Rs. {item.price * item.quantity}</div>
                                </div>
                                <div className="qty-row">
                                  <button className="qty-btn minus" onClick={() => updateCartQty(item.id, -1)}>−</button>
                                  <span className="qty">{item.quantity}</span>
                                  <button className="qty-btn plus" onClick={() => updateCartQty(item.id, 1)}>+</button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <button className="add-more" onClick={() => {
                          setShowMenu(true)
                          setMessages(prev => [...prev, { role: 'model', content: t('addMore') }])
                        }}>{t('addMore')}</button>

                        {cart.length > 0 && (
                          <button className="checkout-btn" onClick={() => {
                            handleCheckout();
                          }}>{t('confirmOrder')} (Rs. {totalAmount})</button>
                        )}

                        <p className="footer-text">
                          Shall we proceed for check out? Say just yes.
                        </p>
                      </div>
                    ) : msg.type === 'checkout' ? (
                      <div className="checkout-card" id="checkoutCard" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <h3 className="title">Check out</h3>

                        <div id="itemsContainer">
                          {msg.cartData.map((item, i) => (
                            <div key={i} className="co-item">
                              <div className="co-item-top">
                                <div>
                                  <div className="co-item-name">{item.name}</div>
                                  <div className="co-item-desc">{item.description}</div>
                                  <div className="co-qty">Qty : {item.quantity}</div>
                                </div>
                                <div className="co-price">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="co-bill">
                          <div className="co-row"><span>{t('subtotal')}</span><span id="subtotal">Rs. {msg.subtotal.toFixed(2)}</span></div>
                          <div className="co-row"><span>{t('serviceCharge')} (5%)</span><span id="service">Rs. {msg.service.toFixed(2)}</span></div>
                          <div className="co-row"><span>{t('gst')} (5%)</span><span id="gst">Rs. {msg.gst.toFixed(2)}</span></div>
                          <div className="co-row"><span>{t('serviceCharge')} (0)</span><span>Rs. 0.00</span></div>

                          <div className="co-divider"></div>

                          <div className="co-row co-total">
                            <span>{t('total')} :</span>
                            <span id="total">Rs. {msg.finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="co-footer">
                          {t('proceedToPayment')}
                        </p>
                      </div>
                    ) : msg.type === 'mobile_prompt' ? (
                      <div className="mobile-card" style={{ margin: '0 10px', maxWidth: '400px', width: '100%' }}>
                        <p className="title">{t('enterMobile')}</p>

                        <div className="display">
                          {mobileNumber.split("").join(" ")}
                          {mobileNumber.length === 0 ? " " : ""}
                          {Array.from({ length: 10 - mobileNumber.length }).map((_, i) => "_ ").join("").trim()}
                        </div>

                        <div className="keypad">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handleMobileDigit(num)}>{num}</button>
                          ))}
                          <button onClick={() => handleMobileDigit(0)} className="zero">0</button>
                          <button onClick={handleMobileDelete} className="delete">⌫</button>
                        </div>

                        <p className="footer" style={{ fontSize: '13px', color: '#666', marginTop: '15px' }}>{t('paymentComplete')}</p>
                      </div>
                    ) : msg.type === 'qr_prompt' ? (
                      <div className="qr-card" style={{ margin: '0 10px', maxWidth: '420px', width: '100%' }}>
                        <p className="title">{t('qrPrompt')}</p>

                        <div className="qr-container">
                          <div className="corner tl"></div>
                          <div className="corner tr"></div>
                          <div className="corner bl"></div>
                          <div className="corner br"></div>

                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=DummyPayment123" alt="QR Code" />
                        </div>

                        <p className="scan-text" style={{ marginTop: '15px', color: '#ff3b00', fontWeight: 600 }}>{t('scanToPay')}</p>
                      </div>
                    ) : (
                      <div className="message-bubble">{msg.content}</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="message-bubble">{msg.content}</div>
                    <div className="message-icon user-icon"><i className="fa-solid fa-user"></i></div>
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message listening-message">
                <div className="message-icon bot-icon"><img src="/agentwaiter logo.png" alt="bot" /></div>
                <div className="message-content">
                  <div className="message-bubble">...</div>
                  <div className="listening-indicator">
                    <span className="dot gray"></span><span className="dot gray"></span><span className="dot gray"></span> Thinking...
                  </div>
                </div>
              </div>
            )}
            {showMenu && (
              <div className="message bot-message" ref={menuTopRef}>
                <div className="menu-categories-container">
                  {viewMode === 'grid' ? (
                    <div className="menu-container">
                      {menuCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className={`menu-card ${activeCategory === cat.id ? 'active' : ''}`}
                          onClick={() => handleCategoryClick(cat)}
                        >
                          <div className="menu-img">
                            <img src={cat.image} alt={cat.name} />
                          </div>
                          <div className="menu-name">{t(cat.name)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="horizontal-categories">
                        {menuCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                          >
                            <img src={cat.image} alt={cat.name} className="cat-pill-img" />
                            <span>{cat.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="menu-list-header">
                        <h3 className="menu-list-title">
                          {menuCategories.find(c => c.id === activeCategory)?.name}
                        </h3>
                        <button className="back-to-categories-btn" onClick={() => setViewMode('grid')}>
                          Back to Categories
                        </button>
                      </div>
                      <div className="menu-items-display">
                        {(menuItems[activeCategory] || []).map((item) => (
                          <div key={item.id} className="menu-item-card">
                            <div className="menu-item-header">
                              <span className="menu-item-name">{item.name}</span>
                              {item.available && (
                                <span className="available-badge">
                                  <span className="available-dot"></span>
                                  <span className="available-text">Available</span>
                                </span>
                              )}
                            </div>

                            <p className="menu-item-desc">
                              {item.description}
                            </p>

                            <div className="menu-item-footer">
                              <div className="menu-item-tags">
                                {item.tags.map((tag, i) => (
                                  <span key={i} className="menu-tag">{tag}</span>
                                ))}
                              </div>

                              <div className="menu-item-price-row">
                                <span className="menu-item-price">Rs. {item.price}</span>
                                {cart.find(c => c.id === item.id) ? (
                                  <div className="in-menu-qty-control">
                                    <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>−</button>
                                    <span className="qty">{cart.find(c => c.id === item.id).quantity}</span>
                                    <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                                  </div>
                                ) : (
                                  <button className="add-btn" onClick={() => handleAddToCart(item)}>
                                    +
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mic Feedback Toast */}
          {micToast && (
            <div style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              zIndex: 100,
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.3s ease'
            }}>
              {micToast}
            </div>
          )}

          <div className="chat-input-wrapper">
            <div className="chat-input-box" style={{ padding: '0 10px' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? "Listening..." : "Type or speak your order..."}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '10px',
                  fontSize: '1.05rem'
                }}
              />
              <button
                className={`mic-btn ${isListening ? 'pulse-anim' : ''}`}
                onClick={toggleListen}
                style={{ background: isListening ? '#ec1c24' : '#ff4e00', marginLeft: '10px' }}
              >
                <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
              <button
                className="mic-btn"
                onClick={() => handleSendMessage()}
                style={{ marginLeft: '10px', background: '#1a7a3b' }}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            <button
              className="mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              style={{ color: isMuted ? '#ec1c24' : '#666' }}
            >
              <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
            </button>
          </div>

          {/* Bottom Fixed Summary Bar - Only show when cart has items */}
          {cart.length > 0 && (
            <div className={`order-summary-bar ${!showMenu ? 'visible' : ''}`} onClick={() => {
              setShowMenu(false)
              setMessages(prev => [...prev, { role: 'user', content: 'Review my order' }, { role: 'model', type: 'review' }])
              speakText("Shall we proceed for checkout? Say just yes.")
            }}>
              <div className="left">
                <div className="icon">🧾</div>
                <span>{totalItems} Item{totalItems !== 1 ? 's' : ''} – Tap to Review</span>
              </div>
              <div className="right">Rs.{totalAmount}</div>
            </div>
          )}

        </div>
      </main>



    </div>
  )
}

export default Agent
