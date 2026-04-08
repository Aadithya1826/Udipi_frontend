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

    // Add user message
    const newMessages = [...messages, { role: 'user', content: textToSubmit }]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)

    try {
      const apiKey = 'AIzaSyBzzNyzdUhabWl9sRDwMK-PA3JR6JdfP68'
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

      const payload = {
        systemInstruction: {
          parts: [{ text: "You are an AI restaurant assistant for Data Udipi, a popular authentic Indian vegetarian restaurant. Your role is to help customers order food. Be polite, very concise (1-2 sentences), and reference items like Dosas, Idlis, Vadas, Meals, Filter Coffee, etc." }]
        },
        contents: newMessages.map(msg => ({
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

      if (data.candidates && data.candidates.length > 0) {
        const botResponse = data.candidates[0].content.parts[0].text
        setMessages(prev => [...prev, { role: 'model', content: botResponse }])
        speakText(botResponse)
      } else {
        throw new Error('Invalid response from AI')
      }
    } catch (error) {
      console.error("Failed to fetch from Gemini:", error)
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I seem to be having connection issues. Please try again." }])
    } finally {
      setIsLoading(false)
    }
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
