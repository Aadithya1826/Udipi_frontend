import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { buildAgentPrompt } from '../services/agentPromptBuilder';
import './AIAssistantOverlay.css';

const AIAssistantOverlay = () => {
  const { language, t } = useLanguage();
  const { cart, setCart, addToCart, changeQty, updateItemQuantity, removeCartItem, updateNote, tableNumber, clearCart, isCartOpen, setIsCartOpen, setActiveCategory } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

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

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
        // speakText(greeting); // Removed initial voice reply as requested
        sessionStorage.setItem('ai_has_greeted', 'true');
      }, 1500);

      if (recognition.current) {
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = language === 'Tamil' ? 'ta-IN' : 'en-IN';
      }

      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', stopSpeech);
        window.removeEventListener('touchstart', stopSpeech);
      };
    }

    // Always update recognition language if it changes
    if (recognition.current) {
      recognition.current.lang = language === 'Tamil' ? 'ta-IN' : 'en-IN';
    }

    return () => {
      window.removeEventListener('mousedown', stopSpeech);
      window.removeEventListener('touchstart', stopSpeech);
    };
  }, [language, location.pathname]);

  const handleSendMessageRef = useRef(null);
  
  // We will assign this ref below after handleSendMessage is defined.

  useEffect(() => {
    if (recognition.current) {
      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        setIsListening(false);
      };
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsOpen(true); // Auto open when user speaks
        if (handleSendMessageRef.current) {
           handleSendMessageRef.current(transcript);
        }
      };
      
      // Auto-start listening immediately
      try {
        recognition.current.start();
      } catch (e) {
        console.warn("Could not auto-start recognition", e);
      }
    }
  }, []);

  // Handle continuous listening
  useEffect(() => {
    if (recognition.current) {
      recognition.current.onend = () => {
        setIsListening(false);
      };
      
      let timeoutId;
      if (isVoiceMode && !isLoading && !isSpeaking && !window.speechSynthesis.speaking && !isListening) {
        // Add a small delay to avoid rapid fire restarts on "no-speech" errors
        timeoutId = setTimeout(() => {
          try {
            recognition.current.start();
          } catch (e) {
            // Ignore if already started
          }
        }, 300);
      }
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isSpeaking, isVoiceMode, isListening]);

  const toggleListen = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      try { recognition.current?.stop(); } catch(e){}
    } else {
      setIsVoiceMode(true);
      try { recognition.current?.start(); } catch(e){}
    }
  };

  const speakText = (text) => {
    if (isMuted) return; // Skip TTS if muted
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

      // Manually set isSpeaking
      setIsSpeaking(true);

      // Ensure microphone is explicitly STOPPED before speaking to prevent self-feedback loop
      if (recognition.current) {
        try {
          recognition.current.abort(); // Use abort instead of stop to immediately kill it without firing onresult
        } catch (e) {}
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
         setIsSpeaking(false);
      }

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

    // --- LOCAL INTENT ENGINE: IS THIS NAVIGATION? ---
    // YES -> Execute immediately
    // NO -> Send to Gemini
    
    // 1. Cart Navigation
    if (normalizedText.match(/(open|view|show|go to)\s*(cart|basket)/i) || normalizedText.includes('கார்ட்டைக் காட்டு')) {
      setIsCartOpen(true);
      const msg = language === 'Tamil' ? "நிச்சயமாக, இதோ உங்கள் கார்ட்." : "Sure, here is your cart.";
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
      speakText(msg);
      setIsLoading(false);
      return;
    }
    if (normalizedText.match(/(close|hide)\s*(cart|basket)/i) || normalizedText.includes('கார்ட்டை மறை')) {
      setIsCartOpen(false);
      const msg = language === 'Tamil' ? "கார்ட் மூடப்பட்டது." : "Okay, I've hidden the cart.";
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
      speakText(msg);
      setIsLoading(false);
      return;
    }

    // 1.5 Scroll & General Navigation
    if (normalizedText.match(/scroll\s*down|go\s*down|page\s*down/i)) {
      window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
      setIsLoading(false);
      return;
    }
    if (normalizedText.match(/scroll\s*up|go\s*up|page\s*up/i)) {
      window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
      setIsLoading(false);
      return;
    }
    if (normalizedText.match(/go\s*home|home\s*page/i)) {
      const msg = language === 'Tamil' ? "முகப்பு பக்கத்திற்கு செல்கிறோம்." : "Going to home page.";
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
      speakText(msg);
      setTimeout(() => { setIsOpen(false); navigate('/'); }, 1000);
      setIsLoading(false);
      return;
    }
    if (normalizedText.match(/new\s*order|start\s*over|cancel\s*order/i)) {
      clearCart();
      const msg = language === 'Tamil' ? "புதிய ஆர்டரைத் தொடங்குகிறோம்." : "Starting a new order.";
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
      speakText(msg);
      setTimeout(() => {
        setIsOpen(false);
        navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
      }, 1000);
      setIsLoading(false);
      return;
    }

    // 2. Checkout Navigation
    if (normalizedText.match(/(checkout|pay|payment|bill|place order|confirm order)/i) && !normalizedText.match(/(add|remove)/i)) {
      if (cart.length === 0) {
        const msg = language === 'Tamil' ? "உங்கள் கார்ட் காலியாக உள்ளது. தயவுசெய்து முதலில் ஆர்டர் செய்யவும்." : "Your cart is empty. Please add items to your order first.";
        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setIsLoading(false);
        return;
      }

      setIsCartOpen(false);
      setIsOpen(false);

      if (location.pathname.includes('payment') && normalizedText.match(/(place order|confirm order|pay|payment)/i)) {
         const msg = language === 'Tamil' ? "ஆர்டர் செய்யப்படுகிறது." : "Placing your order.";
         setMessages(prev => [...prev, { role: 'model', content: msg }]);
         speakText(msg);
         setTimeout(() => {
            document.dispatchEvent(new CustomEvent('confirm-place-order'));
         }, 1000);
         setIsLoading(false);
         return;
      }

      if (location.pathname.includes('checkout')) {
         const msg = language === 'Tamil' ? "பணம் செலுத்தும் பக்கத்திற்கு செல்கிறோம்." : "Proceeding to payment.";
         setMessages(prev => [...prev, { role: 'model', content: msg }]);
         speakText(msg);
         setTimeout(() => {
            document.dispatchEvent(new CustomEvent('continue-to-payment'));
         }, 1000);
         setIsLoading(false);
         return;
      }

      const isPaymentIntent = normalizedText.match(/(pay|payment|bill)/i);
      const msgText = isPaymentIntent ? "Proceeding to payment." : "Taking you to checkout.";
      const msg = language === 'Tamil' ? "பணம் செலுத்தும் பக்கத்திற்கு செல்கிறோம்." : msgText;
      setMessages(prev => [...prev, { role: 'model', content: msg }]);
      speakText(msg);
      setTimeout(() => {
        navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-checkout' : '/checkout');
      }, 1000);
      setIsLoading(false);
      return;
    }



    // 3. Category Navigation (e.g. "go to salad", "open dosa varieties")
    const navMatch = normalizedText.match(/(?:open|go to|show|view|navigate to|take me to)\s+(.+)/i);
    if (navMatch) {
      const requestedCat = navMatch[1].trim().toLowerCase().replace(/th/g, 't').replace(/s$/, '');
      const displayCategories = menuCategories.filter(cat => cat.id !== 'all');
      
      const specificCat = displayCategories.find(c => {
         const cName = c.name.toLowerCase().replace(/th/g, 't').replace(/s$/, '');
         return requestedCat.includes(cName) || cName.includes(requestedCat) || requestedCat === c.id;
      });

      if (specificCat) {
        setActiveCategory(specificCat.id);
        setIsOpen(false);
        if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
           navigate('/dine-in');
        }
        const msg = language === 'Tamil' ? `${specificCat.name} மெனுவை திறக்கிறேன்.` : `Opening ${specificCat.name} menu.`;
        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setIsLoading(false);
        return;
      }
    }

    // --- Voice Command: Detect Phone Number (10 digits) ---
    const digits = normalizedText.replace(/\D/g, '');
    if (digits.length === 10) {
      // We don't have local form data, let Gemini handle or just assume it's for checkout.
    }

    // --- Voice Command: Detect Name ---
    const nameMatch = normalizedText.match(/(?:my name is|i am|this is|name is)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
       // Let Gemini handle it.
    }

    // --- Voice Command: Payment Selection ---
    if (normalizedText.match(/(cash|upi|online|card|paytm|gpay|phonepe)/i)) {
      const method = normalizedText.match(/(cash)/i) ? 'Cash' : 'UPI';
      document.dispatchEvent(new CustomEvent('select-payment', { detail: { method } }));
      const confirmMsg = language === 'Tamil' ? `${method} தேர்ந்தெடுக்கப்பட்டது. தயவுசெய்து 'ஆர்டர் செய்' என்று கூறவும்.` : `Selected ${method}. Say 'Place order' to confirm.`;
      setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
      speakText(confirmMsg);
      setIsLoading(false);
      return;
    }

    // --- NO LOCAL NAVIGATION MATCH -> SEND TO GEMINI ---

    let effectivePage = location.pathname;
    if (document.querySelector('.os-track-container')) {
      effectivePage = '/live-order-status';
    }

    const systemPrompt = buildAgentPrompt({
      currentPage: effectivePage,
      language,
      cart,
      menuCategories: menuCategories || [],
      menuItems: menuItems || [],
      tableNumber
    });

    try {
      const apiMessages = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.raw || m.content }]
      }));
      apiMessages.push({ role: 'user', parts: [{ text }] });

      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: apiMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Backend returned error:", response.status, errText);
        throw new Error("API Error: " + errText);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        let rawResponse = data.candidates[0].content.parts[0].text;
        rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let aiResponse;
        try {
          aiResponse = JSON.parse(rawResponse);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          aiResponse = { 
            speech: language === 'Tamil' ? "மன்னிக்கவும், எனக்கு சரியாக புரியவில்லை. மீண்டும் கூற முடியுமா?" : "Sorry, I missed that. Could you please repeat?", 
            action: null 
          };
        }

        let botText = aiResponse.speech || "Sure!";

        let itemsAddedInThisTurn = false;

        const executeAction = (actionObj) => {
          const action = actionObj.type || actionObj.action;
          const params = actionObj.parameters || {};

          if (action === 'ADD_ITEM' && params.name) {
            const itemName = params.name.toLowerCase();
            const quantity = params.quantity || 1;
            
            const matchScore = (target, query) => {
               if (!target) return 0;
               const targetWords = target.toLowerCase().split(/\s+/);
               const queryWords = query.split(/\s+/);
               let matches = 0;
               queryWords.forEach(qw => {
                 if (targetWords.some(tw => tw.includes(qw) || qw.includes(tw))) matches++;
               });
               return matches / queryWords.length;
            };

            let foundItem = menuItems?.find(i => 
              i.name.toLowerCase() === itemName || 
              i.name.toLowerCase().includes(itemName) || 
              itemName.includes(i.name.toLowerCase()) ||
              (i.tamilName && i.tamilName.toLowerCase().includes(itemName))
            );

            // Fallback to fuzzy match if not found directly
            if (!foundItem && menuItems) {
               let bestMatch = null;
               let highestScore = 0;
               menuItems.forEach(i => {
                  const score = Math.max(matchScore(i.name, itemName), matchScore(i.tamilName, itemName));
                  if (score > highestScore) {
                     highestScore = score;
                     bestMatch = i;
                  }
               });
               if (highestScore >= 0.5) { // At least 50% of the words match
                  foundItem = bestMatch;
               }
            }
            if (foundItem) {
               itemsAddedInThisTurn = true;
               for (let i = 0; i < quantity; i++) {
                 addToCart(foundItem);
               }
               setIsCartOpen(true);
               setTimeout(() => {
                 setIsCartOpen(false);
               }, 2000);
            } else {
               return language === 'Tamil' ? `மன்னிக்கவும், ${params.name} மெனுவில் கிடைக்கவில்லை.` : `Sorry, I couldn't find ${params.name} on the menu.`;
            }
          } else if (action === 'REMOVE_ITEM' && params.name) {
             const itemName = params.name.toLowerCase();
             const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
             if (foundItem) {
                removeCartItem(foundItem.id);
             } else {
                return language === 'Tamil' ? `உங்கள் கார்ட்டில் ${params.name} இல்லை.` : `${params.name} is not in your cart.`;
             }
          } else if (action === 'CLEAR_CART') {
             clearCart();
          } else if (action === 'UPDATE_QUANTITY' && params.name) {
             const itemName = params.name.toLowerCase();
             const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
             if (foundItem) {
               if (params.quantity !== undefined) {
                 updateItemQuantity(foundItem.id, params.quantity);
               } else {
                 changeQty(foundItem.id, params.operation === 'increase' ? 1 : -1);
               }
             }
          } else if (action === 'OPEN_CART') {
             setIsCartOpen(true);
          } else if (action === 'CLOSE_CART') {
             setIsCartOpen(false);
          } else if (action === 'OPEN_CATEGORY' && (params.category || params.name)) {
            const catName = (params.category || params.name).toLowerCase().replace(/th/g, 't').replace(/s$/, ''); // Handle raitha/raita, plural/singular
            const foundCat = menuCategories?.find(c => {
               const cName = c.name.toLowerCase().replace(/th/g, 't').replace(/s$/, '');
               return cName.includes(catName) || catName.includes(cName);
            });
            
            if (foundCat) {
               setActiveCategory(foundCat.id);
               // Removed setIsOpen(false) to keep bot open
               if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
                  navigate('/dine-in');
               }
            } else if (catName.includes('menu') || catName.includes('all')) {
               setActiveCategory('all');
               if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
                  navigate('/dine-in');
               }
            }
          } else if (action === 'SHOW_ITEM' && params.name) {
            const itemName = params.name.toLowerCase().replace(/th/g, 't');
            const foundItem = menuItems?.find(i => {
               const iName = i.name.toLowerCase().replace(/th/g, 't');
               const tName = i.tamilName ? i.tamilName.toLowerCase().replace(/th/g, 't') : '';
               return iName.includes(itemName) || itemName.includes(iName) || tName.includes(itemName);
            });
            if (foundItem) {
               setActiveCategory(foundItem.category); // switch to the tab containing the item
               // Removed setIsOpen(false) to keep bot open
               if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
                  navigate('/dine-in');
               }
            }
          } else if (action === 'TRACK_ORDER') {
            setIsOpen(false);
            if (location.pathname.includes('success')) {
              document.dispatchEvent(new CustomEvent('track-order-mode'));
            } else {
              const target = location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-order-success' : '/order-success';
              navigate(target, { state: { autoTrack: true } });
            }
          } else if (action === 'SHOW_MENU' || action === 'MENU_PAGE') {
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          } else if (action === 'CHECKOUT_NOW' || action === 'PLACE_ORDER') {
            if (cart.length === 0 && !itemsAddedInThisTurn) {
              const msg = language === 'Tamil' ? "உங்கள் கார்ட் காலியாக உள்ளது. தயவுசெய்து முதலில் ஆர்டர் செய்யவும்." : "Your cart is empty. Please add items to your order first.";
              setMessages(prev => [...prev, { role: 'model', content: msg }]);
              speakText(msg);
              return;
            }
            setIsCartOpen(false);
            setIsOpen(false);
            if (location.pathname.includes('payment')) {
               document.dispatchEvent(new CustomEvent('confirm-place-order'));
            } else if (location.pathname.includes('checkout')) {
               document.dispatchEvent(new CustomEvent('continue-to-payment'));
            } else {
               navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-checkout' : '/checkout');
            }
          } else if (action === 'DOWNLOAD_INVOICE') {
            document.dispatchEvent(new CustomEvent('download-invoice'));
          } else if (action === 'PAYMENT_METHOD' && params.method) {
            document.dispatchEvent(new CustomEvent('select-payment', { detail: { method: params.method } }));
          } else if (action === 'UPDATE_NAME') {
            const nameToUpdate = params.name || params.fullName || params.customerName;
            if (nameToUpdate) {
              document.dispatchEvent(new CustomEvent('update-name', { detail: { name: nameToUpdate } }));
            }
          } else if (action === 'UPDATE_PHONE') {
            const phoneToUpdate = params.phone || params.number || params.phoneNumber || params.mobile;
            if (phoneToUpdate) {
              document.dispatchEvent(new CustomEvent('update-phone', { detail: { phone: phoneToUpdate } }));
            }
          } else if (action === 'SCROLL_DOWN') {
            window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
          } else if (action === 'SCROLL_UP') {
            window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
          } else if (action === 'NEW_ORDER') {
            clearCart();
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          } else if (action === 'GO_HOME') {
            setIsOpen(false);
            navigate('/');
          }
        };

        let actionErrors = [];
        if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
          aiResponse.actions.forEach(actionObj => {
             const err = executeAction(actionObj);
             if (err) actionErrors.push(err);
          });
        } else if (aiResponse.action) {
          const err = executeAction(aiResponse);
          if (err) actionErrors.push(err);
        }

        if (actionErrors.length > 0) {
           botText = actionErrors.join(" ");
        }

        setMessages(prev => [...prev, { role: 'model', content: botText, raw: rawResponse }]);
        speakText(botText);
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.warn("AI API failed:", error);
      // Fallback to error message
      const fallbackMsg = language === 'Tamil' ? "மன்னிக்கவும், நெட்வொர்க் பிரச்சனை. மீண்டும் முயற்சிக்கவும்." : "Sorry, I'm having trouble connecting. Please try again.";
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', content: fallbackMsg }]);
        speakText(fallbackMsg);
        setIsLoading(false);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, cart]);

  const toggleSidebar = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (recognition.current && !isListening) {
        try {
          recognition.current.start();
        } catch (e) {
          console.warn("Could not start mic on click:", e);
        }
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Fixed Trigger Button */}
      {!isOpen && (
        <div
          className="ai-trigger-btn"
          onClick={toggleSidebar}
          title="Talk to Voice Agent"
        >
          <div className="ai-trigger-avatar-wrap">
            <img src="/agentwaiter logo.png" alt="Agent" style={{ pointerEvents: 'none', userSelect: 'none' }} />
          </div>
          <div className="ai-trigger-text-wrap">
            <span className="ai-trigger-title">
              {language === 'Tamil' ? 'செஃப்பிடம் பேசுங்கள்' : 'Talk to Chef'}
            </span>
            <span className="ai-trigger-subtitle">
              {language === 'Tamil' ? '⬇ பேச தட்டவும்' : '⬇ Tap to speak'}
            </span>
          </div>
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

            {messages.length === 0 ? (
              <div className="ai-greeting-center">
                <h2>Hi! I'm your Voice Agent.</h2>
                <p>How can I help you today?</p>
              </div>
            ) : (
              messages.filter(Boolean).map((msg, i) => (
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

          {/* ── Interaction Footer / Place Order ── */}
          <div className="ai-footer-original" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="ai-input-pill-original">
              <button 
                type="button" 
                className={`ai-toggle-mode-btn ${isVoiceMode ? 'voice-mode' : 'text-mode'}`} 
                onClick={toggleListen}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: isVoiceMode ? '#ffebee' : '#f0f0f0',
                  color: isVoiceMode ? '#ff4e00' : '#666',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s, color 0.2s'
                }}
                title={isVoiceMode ? "Switch to Text Mode" : "Switch to Voice Mode"}
              >
                <i className={`fa-solid ${isVoiceMode ? 'fa-keyboard' : 'fa-microphone'}`}></i>
              </button>

              <button 
                type="button" 
                className="ai-mute-btn-bottom" 
                onClick={() => {
                  setIsMuted(prev => !prev);
                  if (!isMuted) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: isMuted ? '#f0f0f0' : '#ffebee',
                  color: isMuted ? '#666' : '#ff4e00',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s, color 0.2s'
                }}
                title={isMuted ? "Unmute Assistant" : "Mute Assistant"}
              >
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
              </button>

              <input
                type="text"
                placeholder={isVoiceMode ? "Listening..." : "Type your message..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isVoiceMode}
                style={{
                  flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '0 4px', outline: 'none', fontSize: '14px'
                }}
              />

              <button 
                type="button" 
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={isVoiceMode && inputText.trim().length === 0}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: isVoiceMode || inputText.trim().length > 0 ? '#1b873f' : '#e0e0e0',
                  color: '#fff',
                  cursor: isVoiceMode && inputText.trim().length === 0 ? 'default' : 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s'
                }}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default AIAssistantOverlay;
