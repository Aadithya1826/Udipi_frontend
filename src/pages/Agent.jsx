import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/pages.css'

function Agent() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

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
          <div className="chat-messages">
            <div className="message bot-message">
              <p>Hello! Welcome to Data Udipi. How can I help you today?</p>
            </div>
          </div>
          
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="chat-input"
            />
            <button className="send-btn">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Home
        </button>
      </main>
    </div>
  )
}

export default Agent
