import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import './AIAssistantOverlay.css';

const AIAssistantOverlay = ({ navigate, menuItems = [], menuCategories = [], isCartOpen, setIsCartOpen, onPhoneUpdate }) => {
  const { language, t } = useLanguage();
  const { cart, setCart, addToCart, changeQty, removeCartItem, updateNote, tableNumber } = useCart();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null);

  useEffect(() => {
    // --- Interruptible Speech ---
    // Stop speaking if the user clicks or interacts with anything else
    const stopSpeech = () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
    window.addEventListener('mousedown', stopSpeech);
    window.addEventListener('touchstart', stopSpeech);

    // --- Greeting Logic (Only on first load/refresh of Dine-In) ---
    const hasGreeted = sessionStorage.getItem('ai_has_greeted');
    const isDineIn = location.pathname === '/' || location.pathname === '/dine-in';

    if (isDineIn && !hasGreeted) {
      const timer = setTimeout(() => {
        const greeting = language === 'Tamil'
          ? "வணக்கம்! டேட்டா உடுப்பிக்கு உங்களை வரவேற்கிறோம். எங்களின் புதிய சைவ உணவுகளைப் பார்த்து மகிழுங்கள். உங்களுக்கு ஏதேனும் உதவி தேவைப்பட்டால் சொல்லுங்கள்."
          : "Vanakkam! Welcome to Data Udipi. Explore our freshly prepared vegetarian dishes. Let me know if you need any help.";

        setMessages([{ role: 'model', content: greeting }]);
        speakText(greeting);
        sessionStorage.setItem('ai_has_greeted', 'true');
      }, 1500);

      if (recognition.current) {
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = language === 'Tamil' ? 'ta-IN' : 'en-US';
      }

      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', stopSpeech);
        window.removeEventListener('touchstart', stopSpeech);
      };
    }

    // Always update recognition language if it changes
    if (recognition.current) {
      recognition.current.lang = language === 'Tamil' ? 'ta-IN' : 'en-US';
    }

    return () => {
      window.removeEventListener('mousedown', stopSpeech);
      window.removeEventListener('touchstart', stopSpeech);
    };
  }, [language, location.pathname]);

  useEffect(() => {
    if (recognition.current) {
      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
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
  }, []);

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
        const normalize = (s) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ").trim();
        let normalizedSearchName = normalize(itemName);

        let foundItem = menuItems?.find(i =>
          normalize(i.name).includes(normalizedSearchName) ||
          (i.tamilName && normalize(i.tamilName).includes(normalizedSearchName))
        );

        if (foundItem) {
          addToCart(foundItem);
          // If qty > 1, we might need to handle it. addToCart currently adds 1.
          // Let's stick to the existing behavior or update addToCart.
          // For now, let's use setCart for specific qty if needed, or just call addToCart multiple times.
          if (qty > 1) {
            for (let i = 1; i < qty; i++) addToCart(foundItem);
          }

          const confirmMsg = getRandomResponse(language === 'Tamil' && foundItem.tamilName ? foundItem.tamilName : foundItem.name);
          setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
          speakText(confirmMsg);
          setIsLoading(false);
          return;
        }
      }
    }

    // --- Voice Command: Detect Phone Number (10 digits) ---
    // Extract all digits from the text
    const digits = normalizedText.replace(/\D/g, '');
    if (digits.length === 10 && onPhoneUpdate) {
      onPhoneUpdate(digits);
      const confirmMsg = language === 'Tamil'
        ? `சரி, உங்கள் மொபைல் எண் ${digits}-ஐப் பதிவு செய்துவிட்டேன்.`
        : `Got it! I've entered ${digits.split('').join(' ')} as your phone number.`;
      setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
      speakText(confirmMsg);
      setIsLoading(false);
      return;
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

    const systemPrompt = "You are a restaurant ordering assistant for Data Udipi.\n" +
    "Your job is to classify any user input into one of these intents:\n" +
    "- Greeting\n" +
    "- Confirmation (yes/ok/sure variations)\n" +
    "- Negative (no/not now variations)\n" +
    "- Menu Query (food items like dosa, idly, rice, beverages)\n" +
    "- Payment\n" +
    "- Fallback (anything outside restaurant scope)\n\n" +
    "Rules:\n" +
    "1. Always detect the intent, even if the wording is unusual.\n" +
    "2. Use conversation state to decide the response:\n" +
    "   - GREETING + Confirmation -> Show menu specials.\n" +
    "   - MENU_SELECTION + Confirmation -> Ask for next item.\n" +
    "   - ORDER_CONFIRMATION + Negative -> Move to payment.\n" +
    "   - PAYMENT + Confirmation -> Trigger checkout.\n" +
    "3. If intent confidence is low -> Use fallback response:\n" +
    "   \"I can help with our menu and orders. Would you like to see our specials?\"\n" +
    "4. Never repeat the same response for 'yes' blindly — adapt based on state.\n\n" +
    "MENU KNOWLEDGE:\n" +
    menuContext + "\n\n" +
    "GLOBAL BEHAVIOR:\n" +
    "- Greet with \"Vanakkam!\" at the start.\n" +
    "- If the user mentions an item but doesn't say to add it, ask: \"Would you like me to add [Item] to your cart?\"\n" +
    "- Smart Suggestions: Suggest Filter Coffee with Dosa, or Ghee Podi Idly.\n" +
    "- Phonetic Awareness: Be extremely flexible with pronunciations (e.g., \"sambal Italy\" -> \"Sambar Idly\").\n" +
    "- If the user confirms they want to order an item, add it by including the exact token: [ADD_ITEM: Exact Item Name]\n" +
    "- If the user explicitly asks to checkout, say \"Sure! Taking you to the checkout page now.\" and include the exact token: [CHECKOUT_NOW]\n" +
    "- If the user explicitly asks to see the menu, say \"Taking you to the menu.\" and include the exact token: [SHOW_MENU]\n\n" +
    "LANGUAGE INSTRUCTIONS:\n" +
    "- The current application language is " + language + ".\n" +
    "- CRITICAL: If language is 'Tamil', you are a TAMIL WAITER (Lady Voice). You MUST respond ONLY in Tamil, even if the user speaks to you in English.\n" +
    "- If language is 'English', you are a premium restaurant steward. You MUST respond ONLY in English.\n" +
    "- DO NOT provide translations or bilingual text. Stick to the chosen language: " + language + ".\n" +
    "- Use polite, natural phrases and correct food names for the active language.\n\n" +
    "CART CONTEXT: " + cartContext;

    try {
      const apiMessages = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      apiMessages.push({ role: 'user', parts: [{ text }] });

      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: apiMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 500,
          }
        })
      });

      if (!response.ok) throw new Error("API Offline or Key Missing");

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        let botText = data.candidates[0].content.parts[0].text;

        // Handle Action Tokens
        if (botText.includes('[ADD_ITEM:')) {
          const addMatch = botText.match(/\[ADD_ITEM:\s*([^\]]+)\]/i);
          if (addMatch) {
            const itemName = addMatch[1].trim().toLowerCase();
            let foundItem = menuItems?.find(i => 
              i.name.toLowerCase().includes(itemName) || 
              (i.tamilName && i.tamilName.toLowerCase().includes(itemName))
            );
            if (foundItem) addToCart(foundItem);
          }
          botText = botText.replace(/\[ADD_ITEM:[^\]]+\]/gi, '').trim();
        }

        if (botText.includes('[SHOW_MENU]')) {
          botText = botText.replace('[SHOW_MENU]', '').trim();
          setTimeout(() => {
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          }, 1500);
        }

        if (botText.includes('[CHECKOUT_NOW]')) {
          botText = botText.replace('[CHECKOUT_NOW]', '').trim();
          setTimeout(() => {
            setIsCartOpen(false);
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-checkout' : '/checkout');
          }, 1500);
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
  }, [messages, isLoading, cart]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const quickActions = [
    { text: "Show me popular items", icon: "fa-solid fa-user-check" },
    { text: "Add 2 Masala Dosa to my cart", icon: "fa-solid fa-user-check" },
    { text: "What are today's specials?", icon: "fa-solid fa-user-check" },
    { text: "Talk to waiter", icon: "fa-solid fa-user-check" }
  ];

  return (
    <>
      {/* Fixed Trigger Button */}
      {!isOpen && (
        <div
          className="ai-trigger-btn"
          onMouseEnter={() => {
            const hoverMsg = language === 'Tamil'
              ? "வணக்கம்! நான் உங்கள் குரல் உதவியாளர். உங்களுக்கு இன்று நான் எப்படி உதவ முடியும்?"
              : "Hi! I'm your Voice Agent. How can I help you today?";
            speakText(hoverMsg);
          }}
          onMouseLeave={() => window.speechSynthesis.cancel()}
          onClick={toggleSidebar}
          style={{
            top: '120px',
            right: '20px',
            cursor: 'pointer'
          }}
          title="Talk to Voice Agent"
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
        </div>
      )}

      {/* "Original" Style AI Sidebar */}
      <div className={["ai-sidebar-overlay", isOpen ? 'active' : '', "moved-down"].join(' ')}>
        <div className="ai-sidebar-content-original">
          {/* ── Frosted Hero Section ── */}
          <div className="ai-hero-frosted-original">
            <header className="ai-unified-header">
              <span>Talk To Your Agent</span>
              <button className="ai-close-x" onClick={toggleSidebar}>&times;</button>
            </header>

            <div className="ai-namaste-wrap-original">
              <div className="ai-waveform-bg">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="ai-wave-line" />
                ))}
              </div>
              <img src="/waiter.png" alt="Waiter Namaste" className="ai-mascot-namaste-original" />
            </div>
          </div>

          <div className="ai-chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '10px 25px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <style>{".ai-chat-messages::-webkit-scrollbar { display: none; }"}</style>
            {/* ── My Orders Section (Now Integrated inside Chat area) ── */}
            {cart.length > 0 && (
              <div className="ai-orders-section" style={{ padding: '20px 0' }}>
                <div className="ai-orders-header">
                  <span className="ai-orders-title">My Orders</span>
                  <span className="ai-table-pill">Table No : {tableNumber} <i className="fa-solid fa-chevron-down" /></span>
                </div>

                <div className="ai-order-tabs">
                  {location.pathname === '/' || location.pathname === '/dine-in' ? (
                    <button className="ai-tab-btn active" style={{ width: '100%' }}><i className="fa-solid fa-utensils" /> Dine In</button>
                  ) : (
                    <button className="ai-tab-btn active" style={{ width: '100%' }}><i className="fa-solid fa-bag-shopping" /> Take Away</button>
                  )}
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
                <div key={i} className={["ai-msg-container", msg?.role].join(' ')} style={{
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
              <button className={["ai-mic-small", isListening ? 'listening' : ''].join(' ')} onClick={toggleListen}>
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
