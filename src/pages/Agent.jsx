import React, { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import '../styles/pages.css'

function Agent() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        "Hello! Welcome to Data Udipi. I'm your AI assistant. You can speak or tap to place your order. Would you like to start ordering?",
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMessages = [...messages, { role: 'user', content: inputText }]
    setMessages(newMessages)
    setInputText('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            'Got it! I can help you with menu suggestions, order placement, and table service details.',
        },
      ])
    }, 700)
  }

  const toggleListen = () => {
    setIsListening((prev) => !prev)
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  return (
    <div className="app-container">
      <div className="background-image"></div>

      <Header tableNumber="06" showFullHeader={true} />

      <main className="page-content">
        <div className="page-title-section">
          <h1>Talk to Agent</h1>
          <p>Get assistance from our restaurant agent</p>
        </div>

        <div className="agent-chat-area">
          <div className="chat-card">
            <div className="chat-card-header">
              <div>
                <span className="status-pill">Agent Online</span>
                <span className="chat-subtitle">Table 06 · Dine-in</span>
              </div>
              <button className="mic-btn" onClick={toggleListen}>
                <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((messageItem, index) => (
                <div
                  key={index}
                  className={`message ${messageItem.role === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-bubble">
                    <p>{messageItem.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              <button className={`speaker-btn ${isMuted ? 'muted' : ''}`} onClick={toggleMute}>
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
              </button>

              <input
                type="text"
                placeholder="Type a message or ask for recommendations"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="chat-input-box"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />

              <button className="send-btn" onClick={handleSendMessage}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Agent
