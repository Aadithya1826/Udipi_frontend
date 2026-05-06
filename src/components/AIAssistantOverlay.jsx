import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import './AIAssistantOverlay.css';

const AIAssistantOverlay = ({ navigate, menuItems = [], menuCategories = [], isCartOpen, setIsCartOpen }) => {
  const { language, t } = useLanguage();
  const { cart, setCart, addToCart, changeQty, removeCartItem, updateNote } = useCart();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Persist position in localStorage
  const savedPos = JSON.parse(localStorage.getItem('ai-assistant-pos')) || { x: window.innerWidth - 120, y: window.innerHeight - 150 };
  const [position, setPosition] = useState(savedPos);

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ active: false, x: 0, y: 0 });
  const [canMove, setCanMove] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null);

  useEffect(() => {
    // Entry Greeting
    const timer = setTimeout(() => {
      let greeting = "";
      if (location.pathname.includes('checkout')) {
        greeting = t('checkoutPrompt');
      } else if (location.pathname.includes('payment')) {
        greeting = t('paymentPrompt');
      } else if (location.pathname.includes('order-success')) {
        greeting = t('successPrompt');
      } else {
        greeting = language === 'Tamil' 
          ? "வணக்கம்! டேட்டா உடுப்பிக்கு உங்களை வரவேற்கிறோம். எங்களின் புதிய சைவ உணவுகளைப் பார்த்து மகிழுங்கள். உங்களுக்கு ஏதேனும் உதவி தேவைப்பட்டால் சொல்லுங்கள்."
          : "Vanakkam! Welcome to Data Udipi. Explore our freshly prepared vegetarian dishes. Let me know if you need any help.";
      }
      
      // Reset messages with the context-aware greeting
      setMessages([{ role: 'model', content: greeting }]);
      speakText(greeting);
    }, 1000);

    if (recognition.current) {
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = language === 'Tamil' ? 'ta-IN' : 'en-US';

      recognition.current.onstart = () => {
        setIsListening(true);
      };
      recognition.current.onend = () => {
        setIsListening(false);
      };
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };
      recognition.current.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        setIsListening(false);
      };
    }
    return () => clearTimeout(timer);
  }, [language, location.pathname]); // Depend on language and location to update greeting and recognition lang

  const toggleListen = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      
      if (language === 'Tamil') {
        // Try to find a female Tamil voice
        const tamilVoice = voices.find(v => 
          (v.lang.startsWith('ta')) && 
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('sangeeta') || v.name.toLowerCase().includes('vani') || v.name.toLowerCase().includes('latha'))
        ) || voices.find(v => v.lang.startsWith('ta'));
        
        if (tamilVoice) utterance.voice = tamilVoice;
        utterance.lang = 'ta-IN';
      } else {
        // Try to find a premium Indian voice
        const indVoice = voices.find(v => 
          (v.lang === 'en-IN' || v.name.includes('India')) && 
          (v.name.includes('Sangeeta') || v.name.includes('Rishi'))
        );
        if (indVoice) utterance.voice = indVoice;
        utterance.lang = 'en-IN';
      }

      utterance.rate = 1.0; 
      utterance.pitch = 1.1; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const lowerText = text.toLowerCase();
    
    // Phonetic/Misspelling Correction
    const phoneticMap = {
      'italy': 'idly',
      'sambal': 'sambar',
      'dose': 'dosa',
      'vada': 'vadai'
    };
    
    let normalizedText = lowerText;
    Object.entries(phoneticMap).forEach(([wrong, right]) => {
      normalizedText = normalizedText.replace(new RegExp(wrong, 'g'), right);
    });

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Category-specific requests: "show me breakfast", "what's for lunch", etc.
    const showMatch = normalizedText.match(/(?:show|list|see|get|what is in)\s+(.+)/i);
    if (showMatch || normalizedText.includes('menu') || normalizedText.includes('categories')) {
      const requestedCat = showMatch ? showMatch[1].trim().toLowerCase() : '';
      
      // Filter out the 'all' category
      const displayCategories = menuCategories.filter(cat => cat.id !== 'all');
      // Check if they asked for a specific category name
      const specificCat = displayCategories.find(c => requestedCat.includes(c.name.toLowerCase()) || requestedCat === c.id);

      if (specificCat) {
        const botResponse = `Great choice! Here are the items in our ${specificCat.name} section:`;
        setMessages(prev => [...prev, {
          role: 'model',
          type: 'item_list',
          content: botResponse,
          items: menuItems?.filter(i => i.category === specificCat.id) || [] 
        }]);
        speakText(botResponse);
        setIsLoading(false);
        return;
      }

      const botResponse = "Of course! Here are all our menu categories for you to explore:";
      setMessages(prev => [...prev, {
        role: 'model',
        type: 'category_list',
        content: botResponse,
        items: displayCategories
      }]);
      speakText(botResponse);
      setIsLoading(false);
      return;
    }

    // Basic Mock Responses for demo if API fails
    const getMockResponse = (input) => {
      const low = input.toLowerCase();
      if (language === 'Tamil') {
        if (low.includes('வணக்கம்') || low.includes('ஹலோ')) return "வணக்கம்! டேட்டா உடுப்பிக்கு உங்களை வரவேற்கிறோம். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?";
        if (low.includes('சிறப்பு')) return "இன்றைய சிறப்பு உணவுகள் நெய் ரோஸ்ட் மசாலா தோசை மற்றும் ஃபில்டர் காபி! நீங்கள் முயற்சிக்க விரும்புகிறீர்களா?";
        if (low.includes('பிரபலமான')) return "எங்கள் உணவகத்தில் மினி சாம்பார் இட்லி மற்றும் ஸ்பெஷல் மசாலா தோசை மிகவும் பிரபலமானவை.";
        return "அருமை! நான் உங்களுக்கு எங்களின் சிறப்பு இட்லி அல்லது தோசை வகைகளை கண்டுபிடிக்க உதவட்டுமா?";
      }
      if (low.includes('hi') || low.includes('hello')) return "Namaste! Welcome to Data Udipi. How can I help you with your order today?";
      if (low.includes('specials')) return "Today's specials are our Ghee Roast Masala Dosa and filtered South Indian Coffee! Would you like to try it?";
      if (low.includes('popular')) return "Our most popular items are the Mini Sambar Idly and the Special Masala Dosa.";
      return "That sounds delicious! I can help you find the best South Indian dishes. Would you like to see our special dosas or idlies?";
    };

    const engagingResponses = language === 'Tamil' ? [
      "ஆஹா {item}, சிறந்த தேர்வு! இன்னும் சிலவற்றை சேர்க்க விரும்புகிறீர்களா?",
      "அருமை! {item} அனைவருக்கும் பிடித்த ஒன்று. வேறு ஏதேனும் வேண்டுமா?",
      "சுவையானது! {item} மிகவும் ருசியாக இருக்கும். உங்களுக்காக வேறு எதையாவது சேர்க்கட்டுமா?",
      "சிறந்த தேர்வு! {item} தயாராகிக்கொண்டிருக்கிறது. அடுத்து என்ன?",
      "அற்புதம்! நான் {item}-ஐச் சேர்த்துவிட்டேன். எங்களின் சிறப்பு பானங்களையும் முயற்சிக்க விரும்புகிறீர்களா?"
    ] : [
      "Wow {item}, that's a great choice! Would you like to add more?",
      "Excellent pick! {item} is a crowd favorite. Anything else?",
      "Yum! {item} is delicious. Should I add something else for you?",
      "Great choice! {item} is being prepared. What's next?",
      "Fantastic! I've added {item}. Would you like to try our special drinks too?"
    ];

    const getRandomResponse = (item) => {
      const res = engagingResponses[Math.floor(Math.random() * engagingResponses.length)];
      return res.replace('{item}', item);
    };

    const cartContext = cart.length > 0
      ? `Current cart: ${cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}.`
      : "The user's cart is currently empty.";

    const addKeywords = ['add', 'order', 'get', 'want', 'buy', 'have', 'need'];
    const removeKeywords = ['remove', 'delete', 'cancel', 'take off', 'drop'];
    
    let isAdd = addKeywords.some(k => normalizedText.includes(k));
    let isRemove = removeKeywords.some(k => normalizedText.includes(k));

    const numberMap = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'a': 1, 'an': 1 };
    
    if (isAdd) {
      // Try to extract quantity and item name
      const addMatch = normalizedText.match(/(?:add|order|get|want|buy|have|need)\s+(\d+|one|two|three|four|five|a|an)?\s*(.+)/i);
      if (addMatch) {
        let qtyRaw = addMatch[1] ? addMatch[1].toLowerCase() : '1';
        let qty = numberMap[qtyRaw] || parseInt(qtyRaw) || 1;
        let itemName = addMatch[2].replace(/in cart|to cart|please/g, '').trim();
        
        let foundItem = menuItems?.find(i => 
          i.name.toLowerCase().includes(itemName.toLowerCase()) || 
          (i.tamilName && i.tamilName.toLowerCase().includes(itemName.toLowerCase()))
        );

        if (foundItem) {
          addToCart(foundItem);
          // If qty > 1, we might need to handle it. addToCart currently adds 1.
          // Let's stick to the existing behavior or update addToCart.
          // For now, let's use setCart for specific qty if needed, or just call addToCart multiple times.
          if (qty > 1) {
            for(let i=1; i < qty; i++) addToCart(foundItem);
          }

          const confirmMsg = getRandomResponse(language === 'Tamil' && foundItem.tamilName ? foundItem.tamilName : foundItem.name);
          setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
          speakText(confirmMsg);
          setIsLoading(false);
          return;
        }
      }
    }

    if (isRemove) {
      const removeMatch = normalizedText.match(/(?:remove|delete|cancel|take off|drop)\s+(.+)/i);
      if (removeMatch) {
        let itemName = removeMatch[1].trim();
        let itemToRemove = cart.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

        if (itemToRemove) {
          removeCartItem(itemToRemove.id);
          const confirmMsg = language === 'Tamil' 
            ? `சரி, உங்கள் கார்ட்டிலிருந்து ${itemToRemove.tamilName || itemToRemove.name}-ஐ நீக்கிவிட்டேன். வேறு ஏதேனும்?`
            : `Okay, I've removed ${itemToRemove.name} from your cart. Anything else?`;
          setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
          speakText(confirmMsg);
          setIsLoading(false);
          return;
        }
      }
    }

    // --- Voice Command: Open Cart ---
    if (normalizedText.includes('open cart') || normalizedText.includes('view cart') || normalizedText.includes('show cart') || normalizedText.includes('கார்ட்டைக் காட்டு')) {
      setIsCartOpen(true);
      const confirmMsg = language === 'Tamil' ? "நிச்சயமாக, இதோ உங்கள் கார்ட்." : "Sure, here is your cart.";
      setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
      speakText(confirmMsg);
      setIsLoading(false);
      return;
    }

    // --- Voice Command: Close Cart ---
    if (normalizedText.includes('close cart') || normalizedText.includes('hide cart') || normalizedText.includes('கார்ட்டை மறை')) {
      setIsCartOpen(false);
      const confirmMsg = language === 'Tamil' ? "சரி, கார்ட்டை மறைத்துவிட்டேன்." : "Okay, I've hidden the cart.";
      setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
      speakText(confirmMsg);
      setIsLoading(false);
      return;
    }

    // --- GREEDY ITEM SCAN FALLBACK ---
    // If no explicit add/remove was handled, scan the whole text for any item name or keyword
    let mentionedItem = null;
    const words = normalizedText.split(/\s+/).filter(w => w.length > 3);
    
    // First pass: look for exact name matches within the text
    menuItems?.forEach(item => {
      if (normalizedText.includes(item.name.toLowerCase()) || (item.tamilName && normalizedText.includes(item.tamilName.toLowerCase()))) {
        mentionedItem = item;
      }
    });

    // Second pass: if no exact name match, look for keyword matches (e.g., "dosa" matching "Onion Rava Dosa")
    if (!mentionedItem) {
      menuItems?.forEach(item => {
        const itemNameLower = item.name.toLowerCase();
        const tamilNameLower = item.tamilName ? item.tamilName.toLowerCase() : '';
        if (words.some(word => itemNameLower.includes(word) || (tamilNameLower && tamilNameLower.includes(word)))) {
          mentionedItem = item;
        }
      });
    }

    if (mentionedItem) {
      addToCart(mentionedItem);

      const baseResponse = getRandomResponse(language === 'Tamil' && mentionedItem.tamilName ? mentionedItem.tamilName : mentionedItem.name);
      // Smart Suggestion
      let suggestion = "";
      if (mentionedItem.name.toLowerCase().includes('dosa')) {
        suggestion = language === 'Tamil' 
          ? " தோசையுடன் எங்களின் ஃபில்டர் காபி மிகவும் நன்றாக இருக்கும். முயற்சிக்கிறீர்களா?"
          : " A Filter Coffee would pair beautifully with your dosa. Would you like to try it?";
      } else if (mentionedItem.name.toLowerCase().includes('idly')) {
        suggestion = language === 'Tamil'
          ? " அடுத்து எங்களின் நெய் பொடி இட்லியை முயற்சிக்க விரும்புகிறீர்களா?"
          : " Would you like to try our Ghee Podi Idly next?";
      }
      
      const confirmMsg = baseResponse + suggestion;
      setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
      speakText(confirmMsg);
      setIsLoading(false);
      return;
    }

    const menuContext = `
    AVAILABLE CATEGORIES: ${menuCategories.map(c => c.name).join(', ')}.
    POPULAR ITEMS: 
    - South Indian: Idly, Sambar Idly, Pongal, Mini Sambar Idly
    - Dosai Specials: Gobi Mushroom Dosai, Paneer Dosai, Mysore Masala Dosa
    - Dosa Varieties: Ghee Roast, Paper Roast, Onion Uthappam
    - Lunch: Unlimited Meals, Sambar Rice, Curd Rice
    - Chinese: Schezwan Fried Rice, Noodles
    - Beverages: Filter Coffee, Tea, Boost
    - Starters: Gobi-65, Finger Chips
    - North Indian: Paneer Butter Masala, Butter Nan, Malai Koftha
    `;

    const systemPrompt = `You are the Voice AI Assistant for Data Udipi, a world-class premium vegetarian restaurant.
    ROLE: Continuous, intelligent restaurant host who assists the customer throughout their entire journey.
    PERSONALITY: Warm, welcoming, knowledgeable, premium restaurant steward with a friendly South Indian touch.
    TONE: Polite, enthusiastic, natural Indian-accented English. Short, meaningful sentences.

    MENU KNOWLEDGE:
    ${menuContext}

    GLOBAL BEHAVIOR:
    - Greet with "Vanakkam!" at the start.
    - Guide browsing and answer menu questions clearly.
    - Acknowledge additions positively: "Great choice! I've added [Item] to your order."
    - Real-time Awareness: You know the cart has ${cart.length} items totaling Rs. ${cart.reduce((s, i) => s + i.price * i.quantity, 0)}.
    - Smart Suggestions: Suggest Filter Coffee with Dosa, or Ghee Podi Idly.
    - Phonetic Awareness: Be extremely flexible with pronunciations (e.g., "sambal Italy" -> "Sambar Idly").
    - Assist during checkout and thank them at the end.

    LANGUAGE INSTRUCTIONS:
    - The current application language is ${language}.
    - CRITICAL: If language is 'Tamil', you are a TAMIL WAITER (Lady Voice). You MUST respond ONLY in Tamil, even if the user speaks to you in English.
    - If language is 'English', you are a premium restaurant steward. You MUST respond ONLY in English.
    - DO NOT provide translations or bilingual text. Stick to the chosen language: ${language}.
    - Use polite, natural phrases and correct food names for the active language.

    CART CONTEXT: ${cartContext}
    `;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        })
      });

      if (!response.ok) throw new Error("API Offline or Key Missing");

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        let botText = data.candidates[0].content.parts[0].text;

        // Handle Action Tokens
        if (botText.includes('[SHOW_MENU]')) {
          botText = botText.replace('[SHOW_MENU]', '').trim();
          // Logic to show menu (e.g. via parent state if passed, or just a message)
          console.log("AI requested to show menu");
        }

        setMessages(prev => [...prev, { role: 'model', content: botText }]);
        speakText(botText);
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.warn("AI API failed, using mock response:", error);
      // Fallback to mock response so the user sees something
      const mockResponse = getMockResponse(text);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', content: mockResponse }]);
        speakText(mockResponse);
        setIsLoading(false);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('ai-assistant-pos', JSON.stringify(position));
  }, [position]);

  const toggleSidebar = () => {
    if (canMove || isDragging) return;
    setIsOpen(!isOpen);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setCanMove(true);
  };

  // Draggable logic
  useEffect(() => {
    const handleMove = (e) => {
      if (offsetRef.current.active && canMove) {
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startPosRef.current.x;
        const dy = clientY - startPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 2) {
          setIsDragging(true);
        }

        if (isDragging || distance > 2) {
          let newX = clientX - offsetRef.current.x;
          let newY = clientY - offsetRef.current.y;

          // Bounds checking
          const padding = 10;
          newX = Math.max(padding, Math.min(newX, window.innerWidth - 100));
          newY = Math.max(padding, Math.min(newY, window.innerHeight - 100));

          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleEnd = () => {
      if (offsetRef.current.active) {
        offsetRef.current.active = false;
        if (isDragging) {
          setCanMove(false); // Lock it back after drag
          setTimeout(() => setIsDragging(false), 100);
        }
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    if (offsetRef.current.active && canMove) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, canMove]);

  const onMouseDown = (e) => {
    if (e.button !== 0 || !canMove) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    offsetRef.current = {
      active: true,
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const quickActions = [
    { text: "Show me popular items", icon: "fa-solid fa-user-check" },
    { text: "Add 2 Masala Dosa to my cart", icon: "fa-solid fa-user-check" },
    { text: "What are today's specials?", icon: "fa-solid fa-user-check" },
    { text: "Talk to waiter", icon: "fa-solid fa-user-check" }
  ];

  return (
    <>
      {/* Draggable Trigger Button */}
      {!isOpen && (
        <div
          className={`ai-trigger-btn ${canMove ? 'move-mode' : ''}`}
          onMouseDown={onMouseDown}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={() => {
            const hoverMsg = language === 'Tamil' 
              ? "வணக்கம்! நான் உங்கள் குரல் உதவியாளர். உங்களுக்கு இன்று நான் எப்படி உதவ முடியும்?"
              : "Hi! I'm your Voice Agent. How can I help you today?";
            speakText(hoverMsg);
          }}
          onMouseLeave={() => window.speechSynthesis.cancel()}
          onTouchStart={(e) => {
            if (!canMove) return;
            const touch = e.touches[0];
            onMouseDown({
              preventDefault: () => { },
              clientX: touch.clientX,
              clientY: touch.clientY,
              button: 0
            });
          }}
          onClick={toggleSidebar}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            left: 0,
            top: 0,
            cursor: canMove ? (isDragging ? 'grabbing' : 'move') : 'pointer',
            touchAction: 'none',
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
          }}
          title={canMove ? "Drag to move" : "Double-click to unlock movement"}
        >
          <img src="/agentwaiter logo.png" alt="Agent" style={{ pointerEvents: 'none', userSelect: 'none' }} />
          <div className="ai-hover-tooltip">
            <div className="tooltip-line1">
              {language === 'Tamil' ? 'வணக்கம்! நான் உங்கள் குரல் உதவியாளர்.' : "Hi! I'm your Voice Agent."}
            </div>
            <div className="tooltip-line2">
              {language === 'Tamil' ? 'இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?' : 'How can I help you today?'}
            </div>
          </div>
          {canMove && <div className="ai-move-indicator">MOVABLE</div>}
        </div>
      )}

      {/* "Original" Style AI Sidebar */}
      <div className={`ai-sidebar-overlay ${isOpen ? 'active' : ''} moved-down`}>
        <div className="ai-sidebar-content-original">
          {/* ── Frosted Hero Section ── */}
          <div className="ai-hero-frosted-original">
            <header className="ai-unified-header">
              <span>Talk To Your Agent</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: 0.7 }}
                  >
                    Clear Chat
                  </button>
                )}
                <button className="ai-close-x" onClick={toggleSidebar}>&times;</button>
              </div>
            </header>

            <div className="ai-namaste-wrap-original">
              <div className="ai-waveform-bg">
                <div className="ai-wave-line"></div>
                <div className="ai-wave-line"></div>
                <div className="ai-wave-line"></div>
                <div className="ai-wave-line"></div>
                <div className="ai-wave-line"></div>
              </div>
              <img src="/waiter.png" alt="Waiter Namaste" className="ai-mascot-namaste-original" />
            </div>
          </div>

          <div className="ai-chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 25px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            scrollbarWidth: 'none'
          }}>
            {/* ── My Orders Section (Now Integrated inside Chat area) ── */}
            {cart.length > 0 && (
              <div className="ai-orders-section" style={{ padding: '20px 0' }}>
                <div className="ai-orders-header">
                  <span className="ai-orders-title">My Orders</span>
                  <span className="ai-table-pill">Table No : 06 <i className="fa-solid fa-chevron-down" /></span>
                </div>

                <div className="ai-order-tabs">
                  <button className="ai-tab-btn active"><i className="fa-solid fa-utensils" /> Dine In</button>
                  <button className="ai-tab-btn"><i className="fa-solid fa-bag-shopping" /> Take Away</button>
                </div>

                <div className="ai-cart-summary">
                  {cart.map(item => (
                    <div key={item.id} className="ai-cart-card">
                      <button className="ai-card-remove" onClick={() => removeCartItem(item.id)}>✕</button>
                      <div className="ai-card-left">
                        <div className="ai-card-thumb">
                          {item.image ? <img src={item.image} alt={item.name} /> : <span>🍽️</span>}
                        </div>
                        <div className="ai-card-info">
                          <p className="ai-card-name">{language === 'Tamil' && item.tamilName ? item.tamilName : item.name}</p>
                          <p className="ai-card-serves">{t('serves')} : 1</p>
                          <p className="ai-card-price">Rs. {item.price}</p>
                        </div>
                      </div>
                      <div className="ai-card-right">
                        <p className="ai-card-total-label">Total</p>
                        <p className="ai-card-total-val">{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="ai-card-gst">+ GST</p>
                        <div className="ai-card-stepper">
                          <button onClick={() => changeQty(item.id, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => changeQty(item.id, 1)}>+</button>
                        </div>
                      </div>
                      <div className="ai-card-note">
                          <input placeholder="Please, Just a little bit spicy only...." value={item.note || ''} onChange={(e) => {
                            updateNote(item.id, e.target.value);
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && cart.length === 0 ? (
              <div className="ai-greeting-center">
                <h2>Hi! I'm your Voice Agent.</h2>
                <p>How can I help you today?</p>
              </div>
            ) : (
              (cart.length > 0 ? (messages.length > 0 ? [messages[messages.length - 1]] : []) : messages).filter(Boolean).map((msg, i) => (
                <div key={i} className={`ai-msg-container ${msg?.role}`} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  animation: 'aiMsgIn 0.3s ease-out'
                }}>
                  {/* Icon */}
                  <div className="ai-msg-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: msg.role === 'user' ? '#ff4e00' : 'white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {msg.role === 'user'
                      ? <i className="fa-solid fa-user-check" style={{ color: 'white', fontSize: '14px' }}></i>
                      : <img src="/agentwaiter logo.png" alt="Waiter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    }
                  </div>
  
                  {/* Bubble */}
                  <div className="ai-msg-bubble" style={{
                    background: 'white',
                    color: '#333',
                    padding: '12px 18px',
                    borderRadius: '18px',
                    maxWidth: '75%',
                    fontSize: '15px',
                    fontWeight: '500',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    position: 'relative',
                    border: '1px solid #f0f0f0'
                  }}>
                    {msg.type === 'category_list' ? (
                    <div className="ai-category-content">
                      <p style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '700' }}>{msg.content}</p>
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                        {msg.items.map((cat, idx) => (
                          <div key={idx} style={{
                            minWidth: '100px',
                            background: '#f8f8f8',
                            padding: '10px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            border: '1px solid #eee'
                          }}>
                            <img src={cat.image} alt={cat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '5px', objectFit: 'cover' }} />
                            <div style={{ fontSize: '12px', fontWeight: '600' }}>{cat.name}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', color: '#ff4e00', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-arrow-left"></i> See menu list in the left column
                      </div>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            )))}
            {isLoading && (
              <div className="ai-msg-container model" style={{ display: 'flex', gap: '12px', animation: 'aiMsgIn 0.3s ease-out' }}>
                <div className="ai-msg-icon" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justify: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <img src="/agentwaiter logo.png" alt="Waiter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="ai-msg-bubble" style={{ background: 'white', padding: '12px 18px', borderRadius: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <span className="dot-typing"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Actions (Only show if no messages) ── */}
          {messages.length === 0 && (
            <div className="ai-quick-actions-original">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="ai-action-pill-original"
                  onClick={() => handleSendMessage(action.text)}
                >
                  <span className="ai-action-icon-wrap">
                    <i className={action.icon}></i>
                  </span>
                  {action.text}
                </button>
              ))}
            </div>
          )}

          {/* ── Interaction Footer / Place Order ── */}
          <div className="ai-footer-original" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {cart.length > 0 && (
              <button className="ai-place-order-big" onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>
                Place Order <i className="fa-solid fa-arrow-right" />
              </button>
            )}
            
            <div className="ai-input-pill-original">
              <input
                type="text"
                placeholder="Tap To Speak Or Just Hey...."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className={`ai-mic-small ${isListening ? 'listening' : ''}`} onClick={toggleListen}>
                <i className="fa-solid fa-microphone-lines"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default AIAssistantOverlay;
