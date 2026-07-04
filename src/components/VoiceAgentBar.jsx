import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { buildAgentPrompt } from '../services/agentPromptBuilder';
import './VoiceAgentBar.css';

const VoiceAgentBar = () => {
  const { language } = useLanguage();
  const { 
    cart, 
    addToCart, 
    removeCartItem, 
    changeQty, 
    clearCart, 
    tableNumber,
    setIsCartOpen,
    setActiveCategory
  } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: 'Listening for your order...' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(SpeechRecognition ? new SpeechRecognition() : null);
  const isProcessingRef = useRef(false);

  // Fetch Menu globally once
  useEffect(() => {
    async function fetchMenu() {
      try {
        const catRes = await fetch('/api/v1/public/menu/categories');
        const dbCategories = await catRes.json();
        const itemRes = await fetch('/api/v1/public/menu/items');
        const dbItems = await itemRes.json();
        
        const formattedCategories = [
          { id: 'all', name: 'All Menu' },
          ...dbCategories.map(c => ({ id: String(c.id), name: c.name }))
        ];

        const formattedItems = dbItems.map(item => ({
          id: Number(item.id),
          name: item.name,
          tamilName: item.name,
          price: Number(item.price),
          category: String(item.category_id)
        }));

        setMenuCategories(formattedCategories);
        setMenuItems(formattedItems);
      } catch (err) {
        console.error("Agent failed to load menu data:", err);
      }
    }
    fetchMenu();
  }, []);

  // Setup Continuous Recognition
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'Tamil' ? 'ta-IN' : 'en-IN';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      if (isProcessingRef.current) return;
      const transcript = event.results[0][0].transcript;
      setChatHistory(prev => [...prev, { role: 'user', text: transcript }]);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart listening unless we are currently processing a command or speaking
      if (!isProcessingRef.current && !window.speechSynthesis.speaking) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    // Auto start on mount
    try {
      recognition.start();
    } catch (e) {}

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [language]);

  const speakText = (text) => {
    if (isSpeakerMuted) {
      resumeListening();
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      if (language === 'Tamil') {
        const tamilVoice = voices.find(v => v.lang.startsWith('ta') && v.name.toLowerCase().includes('female')) || voices.find(v => v.lang.startsWith('ta'));
        if (tamilVoice) utterance.voice = tamilVoice;
        utterance.lang = 'ta-IN';
      } else {
        const indVoice = voices.find(v => (v.lang === 'en-IN' || v.name.includes('India')) && (v.name.includes('Sangeeta') || v.name.includes('Rishi') || v.name.includes('Female')));
        if (indVoice) utterance.voice = indVoice;
        utterance.lang = 'en-IN';
      }

      utterance.rate = 1.0;
      
      utterance.onend = () => {
        resumeListening();
      };
      utterance.onerror = () => {
        resumeListening();
      };

      try {
        if (recognitionRef.current) recognitionRef.current.abort();
      } catch(e) {}

      window.speechSynthesis.speak(utterance);
    } else {
      resumeListening();
    }
  };

  const resumeListening = () => {
    isProcessingRef.current = false;
    setTimeout(() => {
      if (recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }, 300);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleVoiceCommand = async (text) => {
    if (!text.trim()) return;
    
    isProcessingRef.current = true;
    setIsLoading(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    const systemPrompt = buildAgentPrompt({
      currentPage: location.pathname,
      language,
      cart,
      menuCategories,
      menuItems,
      tableNumber
    });

    const apiHistory = chatHistory.filter(msg => msg.role !== 'model' || msg.text !== 'Listening for your order...').map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));
    
    // Add current user prompt
    apiHistory.push({ role: 'user', parts: [{ text }] });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: apiHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        let rawResponse = data.candidates[0].content.parts[0].text;
        rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const aiResponse = JSON.parse(rawResponse);
        const botSpeech = aiResponse.speech || "Understood.";
        
        setChatHistory(prev => [...prev, { role: 'model', text: botSpeech }]);
        speakText(botSpeech);
        
        // Execute actions
        if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
          aiResponse.actions.forEach(actionObj => executeAction(actionObj));
        } else if (aiResponse.action) {
          executeAction(aiResponse);
        }
      }
    } catch (error) {
      console.warn("AI API failed:", error);
      const fallbackMsg = "Sorry, I missed that.";
      setChatHistory(prev => [...prev, { role: 'model', text: fallbackMsg }]);
      speakText(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = (actionObj) => {
    const { type, action, parameters = {} } = actionObj;
    const actionName = type || action;

    if (actionName === 'ADD_ITEM' && parameters.name) {
      const itemName = parameters.name.toLowerCase();
      const quantity = parameters.quantity || 1;
      const foundItem = menuItems.find(i => 
        i.name.toLowerCase() === itemName || 
        i.name.toLowerCase().includes(itemName)
      );
      if (foundItem) {
        addToCart(foundItem, quantity);
        setIsCartOpen(true);
      }
    } 
    else if (actionName === 'REMOVE_ITEM' && parameters.name) {
      const itemName = parameters.name.toLowerCase();
      const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
      if (foundItem) removeCartItem(foundItem.id);
    } 
    else if (actionName === 'CLEAR_CART') {
      clearCart();
    } 
    else if (actionName === 'UPDATE_QUANTITY' && parameters.name) {
      const itemName = parameters.name.toLowerCase();
      const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
      if (foundItem) {
        changeQty(foundItem.id, parameters.operation === 'increase' ? 1 : -1);
      }
    } 
    else if (actionName === 'OPEN_CART') {
      setIsCartOpen(true);
    } 
    else if (actionName === 'CLOSE_CART') {
      setIsCartOpen(false);
    } 
    else if (actionName === 'OPEN_CATEGORY' && parameters.name) {
      const catName = parameters.name.toLowerCase();
      const foundCat = menuCategories.find(c => c.name.toLowerCase().includes(catName));
      if (foundCat) {
        setActiveCategory(foundCat.id);
        if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
           navigate('/dine-in');
        }
      }
    } 
    else if (actionName === 'CHECKOUT_NOW' || actionName === 'PLACE_ORDER') {
      setIsCartOpen(false);
      navigate(location.pathname.includes('takeaway') ? '/takeaway-checkout' : '/checkout');
    }
    else if (actionName === 'DOWNLOAD_INVOICE') {
      document.dispatchEvent(new CustomEvent('download-invoice'));
    }
    else if (actionName === 'PAYMENT_METHOD' && parameters.method) {
      document.dispatchEvent(new CustomEvent('select-payment', { detail: { method: parameters.method } }));
    }
  };

  const toggleMute = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    if (!isSpeakerMuted && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  // Do not show voice bar on Invoice or Success pages as per standard, or if you want it everywhere keep it
  // Actually, requirement says "Global Voice Assistant... Pages: Home, Menu, Cart, Checkout, Payment, Order Success, Order History. Voice assistant must NEVER disappear."
  
  return (
    <div className={`voice-agent-bar-container ${isListening ? 'listening' : ''}`}>
      <div className="vab-header">
        <div className="vab-status">
          <div className="pulse"></div>
          {isListening ? 'Microphone Active' : 'Processing...'}
        </div>
        <div className="vab-controls">
          <button className={`vab-btn ${isSpeakerMuted ? 'muted' : ''}`} onClick={toggleMute} title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}>
            <i className={`fa-solid ${isSpeakerMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
          </button>
        </div>
      </div>
      
      <div className="vab-content">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`vab-message ${msg.role === 'user' ? 'user' : 'bot'}`}>
            <div className="vab-icon">
              <i className={`fa-solid ${msg.role === 'user' ? 'fa-microphone' : 'fa-robot'}`}></i>
            </div>
            <div className="vab-text">{msg.role === 'user' ? `"${msg.text}"` : msg.text}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="vab-message bot">
            <div className="vab-icon"><i className="fa-solid fa-robot"></i></div>
            <div className="vab-text">
              <div className="vab-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default VoiceAgentBar;
