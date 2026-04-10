import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/pages.css'

function Agent() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! Welcome to Data Udipi. I'm your AI assistant. You can speak or tap to place your order. Would you like to start ordering?" }
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
  const menuCategories = [
    { id: 'all', name: 'All Menu', icon: '🥘' },
    { id: 'breakfast', name: 'Breakfast', icon: '🍳' },
    { id: 'lunch', name: 'Lunch', icon: '🍱' },
    { id: 'dinner', name: 'Dinner', icon: '🍽️' },
    { id: 'dosa', name: 'Dosa Items', icon: '🥞' },
    { id: 'idli', name: 'Idli Vada', icon: '⚪' },
    { id: 'rice', name: 'Rice Varieties', icon: '🍚' },
    { id: 'soups', name: 'Soups', icon: '🍜' },
    { id: 'snacks', name: 'Evening Snacks', icon: '🥨' },
    { id: 'beverages', name: 'Hot Beverages', icon: '☕' },
    { id: 'south_indian', name: 'South Indian', icon: '🍛' },
    { id: 'north_indian', name: 'North Indian', icon: '🥘' },
    { id: 'salads', name: 'Salads', icon: '🥗' },
    { id: 'raitha', name: 'Raitha', icon: '🥣' },
    { id: 'noodles', name: 'Noodles', icon: '🍝' },
    { id: 'tandoori_breads', name: 'Tandoori Breads', icon: '🫓' },
    { id: 'tandoori_starters', name: 'Tandoori Starters', icon: '🍗' },
    { id: 'tandoori_sides', name: 'Tandoori Sides', icon: '🍯' },
  ]

  const menuItems = {
    dosa: [
      { id: 1, name: 'Rava Dosa', price: 60, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Crispy'], available: true },
      { id: 2, name: 'Onion Rava Dosa', price: 100, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Onion'], available: true },
      { id: 3, name: 'Ghee Dosa', price: 90, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Ghee roast'], available: true },
      { id: 4, name: 'Podi Rava Dosa', price: 110, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Ghee'], available: true },
      { id: 5, name: 'Masala Dosa', price: 100, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Potato'], available: true },
      { id: 6, name: 'Panner Dosa', price: 120, description: 'Crispy, lacy semolina crepes infused with sautéed onions, green chilies.', tags: ['Breakfast', 'Protein'], available: true },
    ]
  }

  const [showMenu, setShowMenu] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' for categories, 'list' for items
  const messagesEndRef = useRef(null)

  // Autoscroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
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
    // Optional: tweak voice, rate, pitch
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  const handleSendMessage = async (textToSubmit = inputText) => {
    if (!textToSubmit.trim()) return;

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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const apiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`

      if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY is not defined in environment variables")
        throw new Error("API configuration missing")
      }

      const payload = {
        systemInstruction: {
          parts: [{ text: "You are an AI restaurant assistant for Data Udipi, a popular authentic Indian vegetarian restaurant. Your role is to help customers order food. Be polite, very concise (1-2 sentences), and reference items like Dosas, Idlis, Vadas, Meals, Filter Coffee, etc. If the user asks to see the menu or choices, mention you are showing the menu and include the token [SHOW_MENU] in your response." }]
        },
        contents: updatedMessages.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
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
        console.error("Gemini API error:", data)
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

        setMessages(prev => [...prev, { role: 'model', content: botResponse }])
        speakText(botResponse)
      } else {
        console.error("Gemini API - no candidates in response:", data)
        throw new Error('Invalid response from AI')
      }
    } catch (error) {
      console.error("Detailed failure from Gemini:", error)
      setMessages(prev => [...prev, { role: 'model', content: `I'm sorry, I'm having trouble connecting: ${error.message}. Please try again.` }])
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
    handleSendMessage(`I'd like to see the ${category.name} menu`)
  }

  return (
    <div className="app-container">
      <div className="background-image"></div>

      <Header tableNumber="06" showFullHeader={true} useTitleImage={true} />

      <main className="agent-page-content">
        <div className="agent-top-mascot-area">
          <div className="agent-mascot-wrapper">
            <img src="/waiter.png" alt="Chef Mascot" className="agent-mascot-img" />
            <div className="mascot-tagline" style={{ marginTop: '10px' }}>Deliciously Vegetarian</div>
          </div>
        </div>

        <div className="agent-chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'model' ? 'bot-message' : 'user-message'}`}>
                {msg.role === 'model' ? (
                  <>
                    <div className="message-icon bot-icon"><img src="/agentwaiter logo.png" alt="bot" /></div>
                    <div className="message-bubble">{msg.content}</div>
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
              <div className="message bot-message">
                <div className="menu-categories-container">
                  {viewMode === 'grid' ? (
                    <div className="menu-categories-grid" id="menuGrid">
                      {menuCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className={`category-card ${activeCategory === cat.id ? 'active' : ''}`}
                          onClick={() => handleCategoryClick(cat)}
                          data-category={cat.id}
                        >
                          <div className="category-icon">{cat.icon}</div>
                          <div className="category-name">{cat.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="horizontal-categories">
                        {menuCategories.slice(0, 7).map((cat) => (
                          <div 
                            key={cat.id} 
                            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                          >
                            <span className="icon">{cat.icon}</span> {cat.name}
                          </div>
                        ))}
                      </div>
                      <div className="menu-items-display">
                        {(menuItems[activeCategory] || []).map((item) => (
                          <div key={item.id} className="item-card">
                            <div className="item-info">
                              <div className="item-header">
                                <span className="item-name">{item.name}</span>
                                {item.available && <span className="availability-badge available">Available</span>}
                              </div>
                              <p className="item-description">{item.description}</p>
                              <div className="item-tags">
                                {item.tags.map((tag, i) => (
                                  <span key={i} className="tag">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="price-section">
                              <span className="item-price">Rs. {item.price}</span>
                              <button className="plus-btn"><i className="fa-solid fa-plus"></i></button>
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
                className="mic-btn"
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
        </div>
      </main>
    </div>
  )
}

export default Agent
