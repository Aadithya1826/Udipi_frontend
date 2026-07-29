import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import './AIAssistantOverlay.css';
import agentwaiterLogoImg from '../assets/images/agentwaiter_logo.png';
import waiterImg from '../assets/images/waiter.png';

const findBestMenuItemMatch = (queryName, itemsList) => {
  if (!queryName || !itemsList || itemsList.length === 0) return null;

  const clean = (str) => (str || '')
    .toLowerCase()
    .replace(/th/g, 't')
    .replace(/\s*\(\d+.*?\)/g, '') // remove portion markers like (2), (1 pc), (2 pcs)
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let qClean = clean(queryName);
  if (!qClean) return null;

  // Handle common phonetic/misspelling/synonym mappings for Naan & Roti
  const naanSynonyms = ['non', 'nons', 'naan', 'naans', 'nans', 'nan', 'butter naan', 'butter naans', 'tandoori naan', 'roti', 'rotis'];
  if (naanSynonyms.includes(qClean)) {
    const naanMatch = itemsList.find(i => clean(i.name).includes('naan'));
    if (naanMatch) return naanMatch;
  }

  // Handle common papad / appalam synonyms
  const papadSynonyms = ['pappad', 'pappads', 'papad', 'papads', 'papadd', 'papadum', 'appalam', 'masala fry papad', 'fry papad'];
  if (papadSynonyms.includes(qClean)) {
    const papadMatch = itemsList.find(i => clean(i.name).includes('papad') || clean(i.name).includes('appalam'));
    if (papadMatch) return papadMatch;
  }

  // 1. Direct exact match on cleaned item name (or tamilName)
  let directMatch = itemsList.find(i =>
    clean(i.name) === qClean || (i.tamilName && clean(i.tamilName) === qClean)
  );
  if (directMatch) return directMatch;

  // Try singular version if query ends with 's' (e.g. 'naans' -> 'naan', 'dosas' -> 'dosa')
  const qStemmed = (qClean.length > 3 && qClean.endsWith('s') && !qClean.endsWith('ss') && qClean !== 'noodles') ? qClean.slice(0, -1) : qClean;
  if (qStemmed !== qClean) {
    let stemmedMatch = itemsList.find(i =>
      clean(i.name) === qStemmed || (i.tamilName && clean(i.tamilName) === qStemmed)
    );
    if (stemmedMatch) return stemmedMatch;
  }

  const hasWordMatch = (tStr, qStr) => {
    if (!tStr || !qStr) return false;
    const tWords = clean(tStr).split(/\s+/);
    const qWords = clean(qStr).split(/\s+/);
    return qWords.some(qw => qw.length >= 3 && tWords.some(tw => tw === qw || (tw.length >= 3 && (tw.startsWith(qw) || qw.startsWith(tw)))));
  };

  // 2. Exact word boundary / phrase match
  let candidates = itemsList.filter(i => {
    const cName = clean(i.name);
    const cTamil = i.tamilName ? clean(i.tamilName) : '';
    return cName === qClean || cTamil === qClean || (hasWordMatch(cName, qClean) && (cName.includes(qClean) || qClean.includes(cName) || cName.includes(qStemmed) || qStemmed.includes(cName)));
  });

  if (candidates.length > 0) {
    const qHasSpl = qClean.includes('spl') || qClean.includes('special') || qClean.includes('mini');

    candidates.sort((a, b) => {
      const aClean = clean(a.name);
      const bClean = clean(b.name);

      if (aClean === qClean || aClean === qStemmed) return -1;
      if (bClean === qClean || bClean === qStemmed) return 1;

      if (!qHasSpl) {
        const aSpl = aClean.includes('spl') || aClean.includes('special') || aClean.includes('mini');
        const bSpl = bClean.includes('spl') || bClean.includes('special') || bClean.includes('mini');
        if (!aSpl && bSpl) return -1;
        if (aSpl && !bSpl) return 1;
      }

      return aClean.length - bClean.length;
    });

    return candidates[0];
  }

  // 3. Fallback word overlap score
  let bestItem = null;
  let maxScore = 0;

  const scoreItem = (target, q) => {
    const tClean = clean(target);
    if (!tClean || !q) return 0;
    const tWords = tClean.split(' ');
    const qWords = q.split(' ');
    let matches = 0;
    qWords.forEach(qw => {
      if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) matches++;
    });
    return matches / qWords.length;
  };

  itemsList.forEach(i => {
    const score = Math.max(scoreItem(i.name, qClean), scoreItem(i.tamilName, qClean));
    if (score > maxScore) {
      maxScore = score;
      bestItem = i;
    }
  });

  if (maxScore >= 0.5) {
    return bestItem;
  }

  return null;
};

const AIAssistantOverlay = () => {
  const { language, setLanguage, t } = useLanguage();
  const { cart, setCart, addToCart, changeQty, updateItemQuantity, removeCartItem, updateNote, tableNumber, clearCart, clearAllCarts, isCartOpen, setIsCartOpen, setActiveCategory } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

  useEffect(() => {
    if (isCartOpen && isOpen) {
      setIsOpen(false);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (isOpen && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [isOpen]);

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
          price: isNaN(Number(item.price)) ? 0 : Number(item.price),
          category: String(item.category_id)
        }));

        setMenuCategories(formattedCategories);
        setMenuItems(formattedItems);
      } catch (err) {
        console.error("Agent failed to load menu data:", err);
      }
    }
    fetchMenu();
  }, [location.pathname]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition Setup
  // MediaRecorder Setup for Audio Processing via Gemini
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const shouldListenRef = useRef(isVoiceMode);
  const lastAddedTurnIdRef = useRef(0);
  const currentTurnIdRef = useRef(0);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const forceMediaRecorderRef = useRef(false);

  useEffect(() => {
    if (navigator.brave && navigator.brave.isBrave) {
      navigator.brave.isBrave().then(isBrave => {
        if (isBrave) forceMediaRecorderRef.current = true;
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const stopSpeech = () => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    };
    window.addEventListener('mousedown', stopSpeech);
    window.addEventListener('touchstart', stopSpeech);

    const hasGreeted = sessionStorage.getItem('ai_has_greeted');
    const isDineIn = location.pathname === '/' || location.pathname === '/dine-in';

    if (isDineIn && !hasGreeted) {
      const timer = setTimeout(() => {
        const greeting = language === 'Tamil'
          ? "வணக்கம்! டேட்டா உடுப்பிக்கு உங்களை வரவேற்கிறோம். எங்களின் புதிய சைவ உணவுகளைப் பார்த்து மகிழுங்கள். உங்களுக்கு ஏதேனும் உதவி தேவைப்பட்டால் சொல்லுங்கள்."
          : "Vanakkam! Welcome to Data Udipi. Explore our freshly prepared vegetarian dishes. Let me know if you need any help.";
        setMessages([{ role: 'model', content: greeting }]);
        sessionStorage.setItem('ai_has_greeted', 'true');
      }, 1500);
      return () => { clearTimeout(timer); window.removeEventListener('mousedown', stopSpeech); window.removeEventListener('touchstart', stopSpeech); };
    }
    return () => { window.removeEventListener('mousedown', stopSpeech); window.removeEventListener('touchstart', stopSpeech); };
  }, [language, location.pathname]);

  const handleSendMessageRef = useRef(null);

  useEffect(() => {
    shouldListenRef.current = isVoiceMode && !document.hidden && !isLoading && !isSpeaking && !window.speechSynthesis.speaking;
    if (shouldListenRef.current && !isListening) {
      const timeoutId = setTimeout(() => startListening(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isVoiceMode, isLoading, isSpeaking, isListening]);

  const startListening = async () => {
    if (isListening) return;

    // 1. PRIMARY ENGINE: Web Speech API (Chrome, Edge, Safari, Mobile Browsers)
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

    if (SpeechRecognition && !forceMediaRecorderRef.current) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'Tamil' ? 'ta-IN' : 'en-IN';

        let capturedText = '';

        recognition.onstart = () => {
          setIsListening(true);
          isRecognizingRef.current = true;
          setIsOpen(true);
        };

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              capturedText += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const liveText = capturedText || interim;
          if (liveText) {
            setInputText(liveText);
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition notice:", event.error);
          isRecognizingRef.current = false;
          setIsListening(false);
          if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            forceMediaRecorderRef.current = true;
            if (isVoiceMode) {
              setTimeout(() => {
                startListening();
              }, 100);
            } else {
              setIsVoiceMode(false);
            }
          }
        };

        recognition.onend = () => {
          isRecognizingRef.current = false;
          setIsListening(false);
          const textToSubmit = capturedText.trim() || inputText.trim();
          if (textToSubmit && handleSendMessageRef.current) {
            handleSendMessageRef.current(textToSubmit);
          }
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn("SpeechRecognition start failed, switching to MediaRecorder fallback:", err);
      }
    }

    // 2. FALLBACK ENGINE: MediaRecorder + Web Audio VAD
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (hasSpokenRef.current) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result.split(',')[1];
            if (handleSendMessageRef.current) {
              handleSendMessageRef.current(null, base64Audio);
            }
          };
        } else {
          setIsListening(false);
        }
      };

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -50;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      hasSpokenRef.current = false;
      let silenceStart = Date.now();

      const detectSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;

        if (average > 8) { // Higher threshold to ignore background noise
          hasSpokenRef.current = true;
          silenceStart = Date.now();
        } else {
          if (hasSpokenRef.current && (Date.now() - silenceStart > 2000)) { // 2s pause
            stopListening(true);
            return;
          }
          if (!hasSpokenRef.current && (Date.now() - silenceStart > 10000)) {
            stopListening(false);
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(detectSilence);
      };

      detectSilence();
      mediaRecorder.start();
      setIsListening(true);
      setIsOpen(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setIsListening(false);
      setIsVoiceMode(false);
    }
  };

  const stopListening = (shouldProcess = false) => {
    if (recognitionRef.current && isRecognizingRef.current) {
      try {
        if (shouldProcess) recognitionRef.current.stop();
        else recognitionRef.current.abort();
      } catch (e) { }
      isRecognizingRef.current = false;
      setIsListening(false);
      return;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!shouldProcess) hasSpokenRef.current = false;
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopListening(false);
      else if (isVoiceMode && !isSpeaking && !isLoading) startListening();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isVoiceMode, isSpeaking, isLoading]);

  const toggleListen = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      stopListening(false);
    } else {
      setIsVoiceMode(true);
      startListening();
    }
  };

  const speakText = (text) => {
    if (isMuted) return; // Skip TTS if muted
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();

      const langMap = { 'English': 'en-IN', 'Tamil': 'ta-IN', 'Hindi': 'hi-IN', 'Malayalam': 'ml-IN', 'Telugu': 'te-IN', 'Kannada': 'kn-IN' };
      const targetLang = langMap[language] || 'en-IN';
      const targetPrefix = targetLang.split('-')[0];

      if (language === 'Tamil') {
        const tamilVoice = voices.find(v =>
          v.lang.startsWith('ta') && (
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('valluvar') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('sangeeta') ||
            v.name.toLowerCase().includes('vani') ||
            v.name.toLowerCase().includes('latha')
          )
        ) || voices.find(v => v.lang.startsWith('ta'));

        if (tamilVoice) utterance.voice = tamilVoice;
        utterance.lang = 'ta-IN';
        utterance.pitch = 1.0;
        utterance.rate = 0.95; // Smooth natural local Tamil speech flow
      } else if (language !== 'English') {
        const regionalVoice = voices.find(v =>
          v.lang.startsWith(targetPrefix) && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural'))
        ) || voices.find(v => v.lang.startsWith(targetPrefix));

        if (regionalVoice) utterance.voice = regionalVoice;
        utterance.lang = targetLang;
        utterance.pitch = 1.0;
        utterance.rate = 0.95;
      } else {
        const requestedVoice = voices.find(v => {
          const n = v.name.toLowerCase();
          return n.includes('charon') || n.includes('achird') || n.includes('sulafat') || n.includes('aoede');
        });

        if (requestedVoice) {
          utterance.voice = requestedVoice;
          const vName = requestedVoice.name.toLowerCase();
          if (vName.includes('sulafat')) {
            utterance.pitch = 1.0;
            utterance.rate = 0.95;
          } else if (vName.includes('aoede')) {
            utterance.pitch = 1.25;
            utterance.rate = 1.05;
          } else if (vName.includes('charon')) {
            utterance.pitch = 0.95;
            utterance.rate = 1.0;
          } else {
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
          }
        } else {
          const friendlyFemaleVoice = voices.find(v => {
            const n = v.name.toLowerCase();
            return n.includes('female') || n.includes('sangeeta') || n.includes('natural') || n.includes('google us english') || n.includes('google uk english female') || n.includes('zira') || n.includes('samantha');
          }) || voices.find(v => v.lang.startsWith('en'));
          if (friendlyFemaleVoice) utterance.voice = friendlyFemaleVoice;
          utterance.lang = 'en-IN';
          utterance.pitch = 1.05;
          utterance.rate = 0.95;
        }
      }

      const textLower = text.toLowerCase();
      if (textLower.includes('welcome') || textLower.includes('hello') || textLower.includes('hi') || textLower.includes('vanakkam')) {
        utterance.rate = 0.95; // Greetings
      } else if (textLower.includes('bill') || textLower.includes('total') || textLower.includes('rs') || textLower.includes('₹') || textLower.includes('rupee')) {
        utterance.rate = 0.95; // Bill amount
      } else if (textLower.includes('important') || textLower.includes('sorry') || textLower.includes('apologize') || textLower.includes('unfortunately')) {
        utterance.rate = 0.9; // Important/Apology
      } else {
        utterance.rate = 1.0; // Normal conversation
      }
      utterance.pitch = 1.1;

      // Manually set isSpeaking
      setIsSpeaking(true);

      // Ensure microphone is explicitly STOPPED before speaking to prevent self-feedback loop
      try {
        stopListening(false);
      } catch (e) { }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      }

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    }
  };

  const executeDirectOrderOrPrompt = async (rawText, parsedActions = []) => {
    const text = (rawText || '').toLowerCase();

    // 0a. Handle Clear Cart / Reset Order commands explicitly
    if (text.match(/\b(clear\s*cart|empty\s*cart|clear\s*all|new\s*order|start\s*over|cancel\s*order|reset\s*cart)\b/i)) {
      clearAllCarts();
      clearCart();
      sessionStorage.removeItem('customer_name');
      sessionStorage.removeItem('customer_phone');
      sessionStorage.removeItem('payment_method');
      sessionStorage.removeItem('order_type');
      const speech = language === 'Tamil' ? "உங்கள் கார்ட் காலியாக்கப்பட்டது. புதிய ஆர்டரை தொடங்கலாம்." : "I've cleared your cart. You can start a new order!";
      setMessages(prev => [...prev, { role: 'model', content: speech }]);
      speakText(speech);
      return { completed: true, handled: true };
    }

    // 0b. Exempt Navigation & General Commands from Progressive Checkout Hijacking
    if (text.match(/\b(go\s*home|home|home\s*page|go\s*to\s*home|open\s*menu|show\s*menu|menu|menu\s*page|view\s*cart|open\s*cart|close\s*cart|hide\s*cart|track\s*order)\b/i)) {
      return { handled: false };
    }

    // 1. Extract Items & Quantities
    const itemsToAdd = [];
    if (Array.isArray(parsedActions)) {
      parsedActions.forEach(act => {
        const aType = act.type || act.action;
        const p = act.parameters || {};
        if (aType === 'ADD_ITEM' && p.name) {
          itemsToAdd.push({ name: p.name, quantity: p.quantity || 1 });
        }
      });
    }

    const NON_FOOD_WORDS = new Set([
      'session', 'sessions', 'something', 'items', 'item', 'food', 'dishes', 'dish',
      'details', 'page', 'screen', 'checkout', 'payment', 'order', 'number',
      'phone', 'name', 'mode', 'cash', 'upi', 'online', 'card', 'table',
      'takeaway', 'dinein', 'dine-in', 'parcel', 'please', 'help', 'view', 'navigate',
      'yes', 'no', 'ok', 'okay', 'sure', 'go', 'to', 'for', 'my', 'is', 'the',
      'each', 'per', 'portion', 'portions', 'plate', 'plates', 'piece', 'pieces', 'nos', 'no',
      'download', 'bill', 'invoice', 'mail', 'buddy', 'track', 'status'
    ]);

    const normalizeSpeechAndNumbers = (str) => {
      if (!str) return '';
      return str
        .replace(/\*{2,}/g, 'mushroom')
        .replace(/\bshroom\b/gi, 'mushroom')
        .replace(/\bmusroom\b/gi, 'mushroom')
        .replace(/\b(naal|naalu|nangu|naangu|four)\b/gi, '4')
        .replace(/\b(onnu|ondru|one)\b/gi, '1')
        .replace(/\b(rendu|irandu|two)\b/gi, '2')
        .replace(/\b(moonu|moondru|three)\b/gi, '3')
        .replace(/\b(anju|ainthu|five)\b/gi, '5')
        .replace(/\b(aaru|aaroo|six)\b/gi, '6')
        .replace(/\b(ezhu|seven)\b/gi, '7')
        .replace(/\b(ettu|eight)\b/gi, '8')
        .replace(/\b(onbadhu|ompadhu|nine)\b/gi, '9')
        .replace(/\b(pathu|ten)\b/gi, '10')
        .replace(/\b(a|an)\b/gi, '1');
    };

    // Clean possessive apostrophes & normalize word numbers/speech censorship
    const cleanedTextForItems = normalizeSpeechAndNumbers(text).replace(/'s\b/gi, 's').replace(/'/g, '');

    const itemRegex = /(\d+)\s+([a-zA-Z\s]+?)(?=\s*(?:and|,|my name|phone|number|mode|cash|upi|for|takeaway|dine-in|parcel|$))/gi;
    let mMatch;
    while ((mMatch = itemRegex.exec(cleanedTextForItems)) !== null) {
      const qty = parseInt(mMatch[1], 10);
      const rawName = mMatch[2].trim();
      if (rawName && !rawName.match(/^(my|name|phone|number|is|mode|cash|upi|order|please)$/i)) {
        if (!itemsToAdd.some(i => i.name.toLowerCase() === rawName.toLowerCase())) {
          itemsToAdd.push({ name: rawName, quantity: qty });
        }
      }
    }

    if (itemsToAdd.length === 0 && menuItems && menuItems.length > 0) {
      const cleanInput = cleanedTextForItems.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ');
      menuItems.forEach(item => {
        const cleanItemName = item.name.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ');
        if (cleanInput.includes(cleanItemName) && !itemsToAdd.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
          const itemMatchRegex = new RegExp(`(\\d+)\\s+${cleanItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
          const qMatch = cleanedTextForItems.match(itemMatchRegex);
          const extractedQty = qMatch ? parseInt(qMatch[1], 10) : 1;
          itemsToAdd.push({ name: item.name, quantity: extractedQty });
        }
      });
    }

    let addedCount = 0;
    let failedItemNames = [];
    const newlyAddedCartItems = [];

    if (itemsToAdd.length > 0 && lastAddedTurnIdRef.current !== currentTurnIdRef.current) {
      lastAddedTurnIdRef.current = currentTurnIdRef.current;
      itemsToAdd.forEach(item => {
        let itemName = item.name.toLowerCase().trim();
        let quantity = item.quantity || 1;

        itemName = itemName.replace(/\s+(each|per|portion|portions|plate|plates|piece|pieces|nos|no)$/i, '').trim();

        const words = itemName.split(/\s+/);
        const allNonFood = words.every(w => NON_FOOD_WORDS.has(w));
        if (allNonFood) {
          return; // Ignore non-food speech artifacts like "session" or "items"
        }

        const regionalItemMap = {
          'parcel meals': 'parcel meal',
          'parcel meal': 'parcel meal',
          'meals': 'parcel meal',
          'meal': 'parcel meal',
          'mulvada': 'vadai',
          'mul vada': 'vadai',
          'medu vada': 'vadai',
          'medu vadai': 'vadai',
          'pappad': 'masala fry papad',
          'pappads': 'masala fry papad',
          'papad': 'masala fry papad',
          'papads': 'masala fry papad',
          'papadd': 'masala fry papad',
          'papadum': 'masala fry papad',
          'appalam': 'masala fry papad',
          'masala papad': 'masala fry papad',
          'fry papad': 'masala fry papad',
          'kofta': 'veg. koftha',
          'koftas': 'veg. koftha',
          'veg kofta': 'veg. koftha',
          'veg koftas': 'veg. koftha',
          'koftha': 'veg. koftha',
          'kofthas': 'veg. koftha',
          'veg koftha': 'veg. koftha',
          'veg kofthas': 'veg. koftha',
          'tomato raita': 'veg raitha',
          'onion tomato raita': 'veg raitha',
          'onion raita': 'veg raitha',
          'raita': 'veg raitha',
          'raitha': 'veg raitha',
          'veg raita': 'veg raitha',
          'veg raitha': 'veg raitha',
          'non': 'butter naan',
          'nons': 'butter naan',
          'nan': 'butter naan',
          'nans': 'butter naan',
          'naan': 'butter naan',
          'naans': 'butter naan',
          'butter naans': 'butter naan',
          'tandoori naan': 'butter naan',
          'roti': 'butter naan',
          'rotis': 'butter naan',
          'mosaranna': 'curd rice',
          'thayir sadham': 'curd rice',
          'thayir sadam': 'curd rice',
          'perugu annam': 'curd rice',
          'kaapi': 'coffee',
          'chaya': 'tea',
          'chai': 'tea',
          'sappathi': 'chappathi kuruma',
          'chappathi': 'chappathi kuruma',
          'poori': 'poori masala',
          'podi dosa': 'podi dosai',
          'session noodles': 'schezwan noodles',
          'session noodle': 'schezwan noodles',
          'sessions noodles': 'schezwan noodles',
          'sessions noodle': 'schezwan noodles',
          'session': 'schezwan noodles',
          'sessions': 'schezwan noodles',
          'sezhwan noodles': 'schezwan noodles',
          'sezhwan noodle': 'schezwan noodles',
          'sezhwan': 'schezwan noodles',
          'shezwan noodles': 'schezwan noodles',
          'shezwan noodle': 'schezwan noodles',
          'shezwan': 'schezwan noodles',
          'sezhuan noodles': 'schezwan noodles',
          'sezhuan': 'schezwan noodles',
          'shezuan noodles': 'schezwan noodles',
          'shezuan': 'schezwan noodles',
          'sichuan noodles': 'schezwan noodles',
          'sichuan noodle': 'schezwan noodles',
          'sichuan': 'schezwan noodles',
          'szechuan noodles': 'schezwan noodles',
          'szechuan noodle': 'schezwan noodles',
          'szechuan': 'schezwan noodles',
          'secuan noodles': 'schezwan noodles',
          'secuan noodle': 'schezwan noodles',
          'secuan': 'schezwan noodles',
          'sechuan noodles': 'schezwan noodles',
          'sechuan noodle': 'schezwan noodles',
          'sechuan': 'schezwan noodles',
          'schwan noodles': 'schezwan noodles',
          'schwan': 'schezwan noodles',
          'samabar idly': 'sambar idly',
          'samabar idli': 'sambar idly',
          'samabar': 'sambar',
          'sambar idli': 'sambar idly'
        };
        if (regionalItemMap[itemName]) itemName = regionalItemMap[itemName];

        const foundItem = findBestMenuItemMatch(itemName, menuItems);

        if (foundItem) {
          addToCart(foundItem, quantity);
          newlyAddedCartItems.push({ id: foundItem.id, name: foundItem.name, price: foundItem.price, quantity });
          addedCount++;
        } else {
          console.warn(`Item not found in restaurant menu: ${item.name}`);
          failedItemNames.push(item.name);
        }
      });
    }

    if (itemsToAdd.length > 0 && failedItemNames.length > 0) {
      const notClearSpeech = language === 'Tamil'
        ? `மன்னிக்கவும், உங்களின் சில உணவுகள் (${failedItemNames.join(', ')}) தெளிவாக இல்லை. தயவுசெய்து மீண்டும் கூற முடியுமா?`
        : `Sorry, I couldn't understand part of your order (${failedItemNames.join(', ')}). Could you please repeat that item clearly?`;
      setMessages(prev => [...prev, { role: 'model', content: notClearSpeech }]);
      speakText(notClearSpeech);
      return { completed: true, handled: true };
    }

    let currentName = sessionStorage.getItem('customer_name') || '';

    if (currentName.match(/\b(download|bill|invoice|mail|buddy|track|status|checkout|payment|home|cart|parcel)\b/i)) {
      currentName = '';
      sessionStorage.removeItem('customer_name');
    }

    const namePrefixMatch = text.match(/(?:my name is|i am|this is|name is|i just|just|myself)\s+([a-zA-Z\s]+?)(?=\s*(?:and|,|\.|phone|mobile|number|mode|cash|upi|$))/i);

    if (namePrefixMatch) {
      const extracted = namePrefixMatch[1].trim();
      if (!extracted.match(/\b(download|bill|invoice|mail|buddy|track|status|checkout|payment|home|cart|parcel)\b/i)) {
        currentName = extracted;
      }
    } else if (!currentName) {
      const cleanWord = text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
      const words = cleanWord.split(/\s+/);
      const isFoodOrNav = words.some(w => {
        const lw = w.toLowerCase();
        return NON_FOOD_WORDS.has(lw) || (menuItems || []).some(m => m.name.toLowerCase().includes(lw));
      });

      if (!isFoodOrNav && words.length >= 1 && words.length <= 4 && cleanWord.length >= 2 && !cleanWord.match(/\d/) && !cleanWord.match(/\b(download|bill|invoice|mail|buddy|track|status|checkout|payment|home|cart|parcel)\b/i)) {
        currentName = cleanWord;
      }
    }

    if (currentName) {
      // Clean conversational filler words (e.g. "akash actually" -> "akash")
      currentName = currentName
        .replace(/\b(actually|basically|please|bro|dude|sir|maam|here|only|no|yeah|its|it's|btw|by the way)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (currentName && !currentName.match(/\b(download|bill|invoice|mail|buddy|track|status|checkout|payment|home|cart|parcel)\b/i)) {
        sessionStorage.setItem('customer_name', currentName);
        document.dispatchEvent(new CustomEvent('update-name', { detail: { name: currentName } }));
      } else {
        currentName = '';
        sessionStorage.removeItem('customer_name');
      }
    }

    let currentPhone = sessionStorage.getItem('customer_phone') || '';
    const rawDigits = text.replace(/\D/g, '');
    const phoneMatch = text.match(/(?:phone|mobile|number|cell)?\s*(?:is)?\s*(\d{10})/i);
    if (phoneMatch) {
      currentPhone = phoneMatch[1];
      sessionStorage.setItem('customer_phone', currentPhone);
      document.dispatchEvent(new CustomEvent('update-phone', { detail: { phone: currentPhone } }));
    } else if (rawDigits.length >= 10) {
      currentPhone = rawDigits.slice(-10);
      sessionStorage.setItem('customer_phone', currentPhone);
      document.dispatchEvent(new CustomEvent('update-phone', { detail: { phone: currentPhone } }));
    }

    let currentPayment = sessionStorage.getItem('payment_method') || '';
    if (text.match(/\b(cash)\b/i)) {
      currentPayment = 'Cash';
      sessionStorage.setItem('payment_method', 'Cash');
      document.dispatchEvent(new CustomEvent('select-payment', { detail: { method: 'Cash' } }));
    } else if (text.match(/\b(upi|online|card|gpay|phonepe|paytm)\b/i)) {
      currentPayment = 'UPI';
      sessionStorage.setItem('payment_method', 'UPI');
      document.dispatchEvent(new CustomEvent('select-payment', { detail: { method: 'UPI' } }));
    }

    let currentOrderType = sessionStorage.getItem('order_type') || '';
    if (text.match(/\b(parcel|takeaway|take-away|pack|packing|packet|to go)\b/i)) {
      currentOrderType = 'takeaway';
      sessionStorage.setItem('order_type', 'takeaway');
    } else if (text.match(/\b(dine-in|dine in|dinein|table|eat in|here|seating)\b/i)) {
      currentOrderType = 'dine_in';
      sessionStorage.setItem('order_type', 'dine_in');
    }

    // Synchronize newly added items with local cart state to prevent stale closure reads
    const activeCartItemsMap = new Map();
    (cart || []).forEach(item => activeCartItemsMap.set(item.id, { ...item }));
    newlyAddedCartItems.forEach(item => {
      if (activeCartItemsMap.has(item.id)) {
        const existing = activeCartItemsMap.get(item.id);
        existing.quantity = (Number(existing.quantity) || 0) + item.quantity;
      } else {
        activeCartItemsMap.set(item.id, { ...item });
      }
    });

    const activeCartItems = Array.from(activeCartItemsMap.values());
    const activeItemsToReport = newlyAddedCartItems.length > 0 ? newlyAddedCartItems : (activeCartItems.length > 0 ? activeCartItems : itemsToAdd);
    let itemSummary = activeItemsToReport.map(i => `${i.quantity || 1} ${i.name}`).join(', ');
    if (failedItemNames.length > 0 && newlyAddedCartItems.length > 0) {
      itemSummary += ` (Note: ${failedItemNames.join(', ')} is not on our menu)`;
    }

    // 3. INTELLIGENT DECISION ENGINE & PROGRESSIVE STEP FLOW
    const isConfirmationUtterance = text.match(/\b(confirm|yes|ok|okay|sure|place order|proceed|correct|yeah|ஆமாம்|உறுதி)\b/i);
    const wantsToCheckout = text.match(/\b(checkout|pay|payment|bill|place order|confirm order|finish|i am done|im done|done)\b/i) || location.pathname.includes('checkout') || location.pathname.includes('payment');
    
    // Check if the user just provided details proactively in this utterance
    const justProvidedDetails = text.match(/(?:my name is|i am|this is|name is|i just|just|myself|phone|mobile|number|cell|cash|upi|online|card|gpay|phonepe|paytm)/i);

    if (activeCartItems.length > 0 || itemsToAdd.length > 0) {
      if (!currentOrderType) {
        if (location.pathname === '/') {
          const promptSpeech = language === 'Tamil'
            ? `நீங்கள் இங்கேயே சாப்பிட (Dine-in) விரும்புகிறீர்களா, அல்லது பார்சல் (Takeaway) வேண்டுமா?`
            : `Would you like to order for Dine-in or Takeaway?`;
          setMessages(prev => [...prev, { role: 'model', content: promptSpeech }]);
          speakText(promptSpeech);
          return { handled: true };
        } else {
          currentOrderType = location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? 'takeaway' : 'dine_in';
          sessionStorage.setItem('order_type', currentOrderType);
        }
      }
      const isTakeaway = currentOrderType === 'takeaway';

      // If we just got the order type on the home page, navigate and show the cart/menu!
      if (location.pathname === '/' && currentOrderType && !wantsToCheckout && !justProvidedDetails) {
         navigate(isTakeaway ? '/take-away' : '/dine-in');
         const addedSpeech = language === 'Tamil' ? `உணவுகளை சேர்த்துள்ளேன். வேறு என்ன வேண்டும்?` : `I've added the items. What else would you like?`;
         setMessages(prev => [...prev, { role: 'model', content: addedSpeech }]);
         speakText(addedSpeech);
         
         if (newlyAddedCartItems.length > 0) {
             setIsCartOpen(true);
             setTimeout(() => setIsCartOpen(false), 4000);
         }
         return { handled: true };
      }

      // If they just added an item, but don't want to checkout yet, acknowledge it and let them browse.
      if (!wantsToCheckout && !justProvidedDetails && !isConfirmationUtterance) {
          if (newlyAddedCartItems.length > 0) {
             const addedSpeech = language === 'Tamil' ? `உணவுகளை சேர்த்துள்ளேன். வேறு என்ன வேண்டும்?` : `I've added the items. What else would you like?`;
             setMessages(prev => [...prev, { role: 'model', content: addedSpeech }]);
             speakText(addedSpeech);
             setIsCartOpen(true);
             setTimeout(() => setIsCartOpen(false), 4000);
             return { handled: true };
          }
      }

      // STEP 1: Ask for Name if missing
      if (!currentName) {
        const promptSpeech = language === 'Tamil'
          ? `உங்களின் ஆர்டரைத் தொடர தயவுசெய்து உங்கள் பெயரை சொல்லவும்.`
          : `To process your order, please tell me your full name.`;
        setMessages(prev => [...prev, { role: 'model', content: promptSpeech }]);
        speakText(promptSpeech);
        if (!location.pathname.includes('checkout') && !location.pathname.includes('payment')) {
          navigate(isTakeaway ? '/takeaway-checkout' : '/checkout');
        }
        return { handled: true };
      }

      // STEP 2: Ask for Phone Number if missing
      if (!currentPhone) {
        const promptSpeech = language === 'Tamil'
          ? `நன்றி ${currentName}! தயவுசெய்து உங்கள் 10-இலக்க தொலைபேசி எண்ணை சொல்லவும்.`
          : `Thank you ${currentName}! Please tell me your 10-digit phone number.`;
        setMessages(prev => [...prev, { role: 'model', content: promptSpeech }]);
        speakText(promptSpeech);
        if (!location.pathname.includes('checkout') && !location.pathname.includes('payment')) {
          navigate(isTakeaway ? '/takeaway-checkout' : '/checkout');
        }
        return { handled: true };
      }

      // STEP 3: Ask for Payment Method if missing
      if (!currentPayment) {
        const paymentRoute = isTakeaway ? '/takeaway-payment' : '/payment';
        const promptSpeech = language === 'Tamil'
          ? `நன்றி ${currentName}! உங்கள் ஆர்டருக்கு Cash mode அல்லது UPI mode எந்த முறையில் செலுத்த விரும்புகிறீர்கள்?`
          : `Thank you ${currentName}! Would you like to pay using Cash mode or UPI mode?`;
        setMessages(prev => [...prev, { role: 'model', content: promptSpeech }]);
        speakText(promptSpeech);
        if (!location.pathname.includes('payment')) {
          navigate(paymentRoute, { state: { formData: { name: currentName, phone: currentPhone } } });
        }
        return { handled: true };
      }

      // STEP 4: Name, Phone, and Payment Method are all present. CONFIRM ORDER SUMMARY FIRST!
      const isAlreadyConfirmed = sessionStorage.getItem('order_pending_confirmation') === 'true' && isConfirmationUtterance;

      if (!isAlreadyConfirmed) {
        sessionStorage.setItem('order_pending_confirmation', 'true');
        const sub = activeItemsToReport.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
        const confirmSpeech = language === 'Tamil'
          ? `உங்கள் ஆர்டர்: ${itemSummary}. மொத்தம்: ₹${sub}. பெயர்: ${currentName}, தொலைபேசி எண்: ${currentPhone}, செலுத்தும் முறை: ${currentPayment}. இந்த ஆர்டரை உறுதி செய்து பெறவா?`
          : `Here is your order: ${itemSummary} (Total: ₹${sub}). Customer: ${currentName}, Phone: ${currentPhone}, Mode: ${currentPayment}. Shall I confirm and place this order?`;

        setMessages(prev => [...prev, { role: 'model', content: confirmSpeech }]);
        speakText(confirmSpeech);
        return { handled: true };
      }

      // STEP 5: CUSTOMER CONFIRMED ORDER -> SUBMIT TO BACKEND & NAVIGATE TO LIVE TRACKING!
      sessionStorage.removeItem('order_pending_confirmation');
      const targetTable = isTakeaway ? 'TakeAway' : (tableNumber || '06');
      const sub = activeItemsToReport.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

      const orderPayload = {
        table_number: targetTable,
        payment_method: currentPayment,
        phone: currentPhone,
        cart: activeItemsToReport.map(item => ({
          id: item.id,
          quantity: item.quantity || 1,
          price: item.price || 0,
          note: item.note || ''
        })),
        subtotal: sub,
        gst: 0,
        service_charge: 0,
        total_amount: sub
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        const resData = await res.json();
        const dbId = resData.dbOrderId || resData.order_id || resData.id;
        const generatedOrderId = resData.orderId || (dbId ? `ORD-${String(dbId).padStart(6, '0')}` : `ORD-${Math.floor(100000 + Math.random() * 900000)}`);

        sessionStorage.setItem('last_placed_order_id', generatedOrderId);
        clearAllCarts();
        sessionStorage.removeItem('customer_name');
        sessionStorage.removeItem('customer_phone');
        sessionStorage.removeItem('payment_method');
        sessionStorage.removeItem('order_type');
        setIsCartOpen(false);
        setIsOpen(false);

        const targetRoute = isTakeaway ? '/takeaway-order-success' : '/order-success';

        const speechText = language === 'Tamil'
          ? `நன்றி ${currentName}! உங்களின் ஆர்டர் (${generatedOrderId}) வெற்றிகரமாக பெறப்பட்டது. நேரடி டிராக்கிங் தொடங்குகிறது.`
          : `Thank you ${currentName}! Your order (${generatedOrderId}) has been placed successfully via ${currentPayment} mode. Tracking your order now.`;

        setMessages(prev => [...prev, { role: 'model', content: speechText }]);
        speakText(speechText);

        setTimeout(() => {
          navigate(targetRoute, {
            state: {
              orderId: generatedOrderId,
              cartData: activeItemsToReport,
              subtotal: sub,
              gst: 0,
              total: sub,
              formData: { name: currentName, phone: currentPhone },
              paymentMethod: currentPayment,
              autoTrack: true
            }
          });
        }, 1000);
        return { completed: true };
      } catch (err) {
        console.error("Order placement error:", err);
      }
    }

    return { completed: false, handled: false };
  };

  const handleSendMessage = async (text = inputText, audioBase64 = null) => {
    if (!audioBase64 && !text.trim()) return;
    const lowerText = text ? text.toLowerCase() : '';

    // Phonetic/Misspelling & Regional Synonym Mapping
    const phoneticMap = {
      'pappad': 'masala fry papad',
      'pappads': 'masala fry papad',
      'papad': 'masala fry papad',
      'papads': 'masala fry papad',
      'papadd': 'masala fry papad',
      'papadum': 'masala fry papad',
      'appalam': 'masala fry papad',
      'masala papad': 'masala fry papad',
      'fry papad': 'masala fry papad',
      'kofta': 'veg. koftha',
      'koftas': 'veg. koftha',
      'veg kofta': 'veg. koftha',
      'veg koftas': 'veg. koftha',
      'koftha': 'veg. koftha',
      'kofthas': 'veg. koftha',
      'tomato raita': 'veg raitha',
      'onion tomato raita': 'veg raitha',
      'onion raita': 'veg raitha',
      'raita': 'veg raitha',
      '***** noodles': 'mushroom noodles',
      '***** noodle': 'mushroom noodles',
      'shroom noodles': 'mushroom noodles',
      'musroom noodles': 'mushroom noodles',
      'non': 'butter naan',
      'nons': 'butter naan',
      'nan': 'butter naan',
      'nans': 'butter naan',
      'naan': 'butter naan',
      'naans': 'butter naan',
      'butter naans': 'butter naan',
      'tandoori naan': 'butter naan',
      'roti': 'butter naan',
      'rotis': 'butter naan',
      'italy': 'idly',
      'samabar idly': 'sambar idly',
      'samabar idli': 'sambar idly',
      'samabar': 'sambar',
      'sambar idli': 'sambar idly',
      'sambal': 'sambar',
      'dose': 'dosa',
      'vada': 'vadai',
      'gajraitha': 'veg raitha',
      'order part': 'order pannu',
      'part': 'pannu',
      'yeh baadi': 'vadai',
      'mosaranna': 'curd rice',
      'thayir sadham': 'curd rice',
      'thayir sadam': 'curd rice',
      'perugu annam': 'curd rice',
      'curd sadham': 'curd rice',
      'kaapi': 'coffee',
      'chaya': 'tea',
      'chai': 'tea',
      'sappathi': 'chappathi kuruma',
      'chappathi': 'chappathi kuruma',
      'thayir vadai': 'curd vadai',
      'sambar vadai': 'sambar vadai',
      'chola poori': 'chola poori',
      'poori sagu': 'poori masala',
      'podi dosa': 'podi dosai',
      'session noodles': 'schezwan noodles',
      'session noodle': 'schezwan noodles',
      'sessions noodles': 'schezwan noodles',
      'sessions noodle': 'schezwan noodles',
      'session': 'schezwan noodles',
      'sessions': 'schezwan noodles',
      'sezhwan noodles': 'schezwan noodles',
      'sezhwan noodle': 'schezwan noodles',
      'sezhwan': 'schezwan noodles',
      'shezwan noodles': 'schezwan noodles',
      'shezwan noodle': 'schezwan noodles',
      'shezwan': 'schezwan noodles',
      'sezhuan noodles': 'schezwan noodles',
      'sezhuan': 'schezwan noodles',
      'shezuan noodles': 'schezwan noodles',
      'shezuan': 'schezwan noodles',
      'sichuan noodles': 'schezwan noodles',
      'sichuan noodle': 'schezwan noodles',
      'sichuan': 'schezwan noodles',
      'szechuan noodles': 'schezwan noodles',
      'szechuan noodle': 'schezwan noodles',
      'szechuan': 'schezwan noodles',
      'secuan noodles': 'schezwan noodles',
      'secuan noodle': 'schezwan noodles',
      'secuan': 'schezwan noodles',
      'sechuan noodles': 'schezwan noodles',
      'sechuan noodle': 'schezwan noodles',
      'sechuan': 'schezwan noodles',
      'schwan noodles': 'schezwan noodles',
      'schwan': 'schezwan noodles',
      'chuan': 'schezwan noodles'
    };

    let normalizedText = lowerText.replace(/\*{2,}/g, 'mushroom').replace(/\bshroom\b/gi, 'mushroom').replace(/\bmusroom\b/gi, 'mushroom');
    Object.entries(phoneticMap).forEach(([wrong, right]) => {
      const safeWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isSpecial = /[.*+?^${}()|[\]\\]/.test(wrong);
      const pattern = isSpecial ? safeWrong : `\\b${safeWrong}\\b`;
      normalizedText = normalizedText.replace(new RegExp(pattern, 'gi'), right);
    });

    const messageId = Date.now();
    currentTurnIdRef.current = messageId;
    const userMessage = { id: messageId, role: 'user', content: normalizedText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Try direct order execution or progressive order prompt first!
    if (!audioBase64) {
      const orderFlowResult = await executeDirectOrderOrPrompt(normalizedText);
      if (orderFlowResult.completed || orderFlowResult.handled) {
        setIsLoading(false);
        return;
      }
    }

    // Category matching helper
    const findCategoryMatch = (query) => {
      if (!query || !menuCategories || menuCategories.length === 0) return null;

      // If the query contains quantity numbers or ordering verbs (e.g. "10 mushroom noodles", "i need 10", "add 2 dosa"), it is an item order, NOT a category view!
      const hasOrderIntent = query.match(/\b(add|order|want|get|buy|need|bring|pack|\d+)\b/i);
      if (hasOrderIntent) return null;

      // Clean query by removing common filler / navigation words
      const cleanQ = query.toLowerCase()
        .replace(/\b(open|go to|show|view|navigate to|take me to|category|categories|varieties|list|all|items|item|menu|please)\b/gi, '')
        .trim()
        .replace(/th/g, 't')
        .replace(/s$/, '');

      if (!cleanQ) return null;

      const categorySynonyms = {
        'raitha': ['raitha', 'raita', 'रायता', 'ராய்தா'],
        'salad': ['salad', 'salads', 'சாலட்', 'सलाड'],
        'dosa': ['dosa', 'dosai', 'dose', 'தோசை', 'दोष', 'ದೋಸೆ', 'dosa varieties', 'dosas'],
        'hot beverages': ['beverage', 'beverages', 'drink', 'drinks', 'coffee', 'tea', 'kaapi', 'chaya', 'பானங்கள்', 'ஹார்ட் பெவரேஜஸ்'],
        'soups': ['soup', 'soups', 'சூப்'],
        'starters': ['starter', 'starters', 'tandoori starters', 'ஸ்டார்ட்டர்ஸ்'],
        'breads': ['bread', 'breads', 'roti', 'naan', 'rotis', 'naans', 'ரொட்டி', 'தந்தூரி ரொட்டி'],
        'side dishes': ['side dish', 'side dishes', 'curry', 'curries', 'gravy'],
        'rice': ['rice', 'rice varieties', 'biryani', 'pulav', 'fried rice', 'சாதம்', 'ரைஸ்'],
        'noodles': ['noodles', 'noodle', 'chinese', 'நூடூல்ஸ்'],
        'breakfast & dinner': ['breakfast', 'dinner', 'tiffen', 'tiffin', 'காலை உணவு', 'இரவு உணவு'],
        'snacks': ['snacks', 'snack', 'evening snacks', 'ஸ்நாக்ஸ்'],
        'lunch': ['lunch', 'meals', 'meal', 'மதிய உணவு', 'சாப்பாடு']
      };

      const displayCategories = menuCategories.filter(cat => cat.id !== 'all');

      // 1. Direct exact match against DB categories
      let direct = displayCategories.find(c => {
        const cName = c.name.toLowerCase().replace(/th/g, 't').replace(/s$/, '');
        return cName === cleanQ;
      });
      if (direct) return direct;

      // 2. Exact match against synonym dictionary
      for (const [catKey, syns] of Object.entries(categorySynonyms)) {
        if (syns.some(s => s.toLowerCase().replace(/th/g, 't').replace(/s$/, '') === cleanQ)) {
          const match = displayCategories.find(c => c.name.toLowerCase().includes(catKey.split(' ')[0]));
          if (match) return match;
        }
      }
      return null;
    };

    // --- LOCAL INTENT ENGINE: IS THIS NAVIGATION OR CATEGORY VIEW? ---
    if (!audioBase64) {
      // 0.5 Live Order Tracking Intent
      if (normalizedText.match(/\b(track|tracking|order status|status of order|where is my order|check order|order update|food status)\b/i)) {
        const lastOrderId = sessionStorage.getItem('last_placed_order_id');
        const isTakeaway = location.pathname.includes('takeaway') || location.pathname.includes('take-away') || sessionStorage.getItem('order_type') === 'takeaway';
        const targetRoute = isTakeaway ? '/takeaway-order-success' : '/order-success';

        let statusMsg = language === 'Tamil' ? "உங்களின் நேரடி ஆர்டர் டிராக்கிங் பக்கத்திற்கு செல்கிறோம்." : "Taking you to live order status tracking page.";

        if (lastOrderId) {
          try {
            const res = await fetch(`/api/orders/${lastOrderId}`);
            if (res.ok) {
              const data = await res.json();
              const status = data.order?.status || 'CONFIRMED';
              statusMsg = language === 'Tamil'
                ? `உங்களின் ஆர்டர் (${lastOrderId}) நிலை: ${status}. நேரடி டிராக்கிங் பார்க்கிறீர்கள்.`
                : `Your order (${lastOrderId}) status is: ${status}. Opening live tracking for you.`;
            }
          } catch (e) { }
        }

        setMessages(prev => [...prev, { role: 'model', content: statusMsg }]);
        speakText(statusMsg);
        setTimeout(() => {
          setIsCartOpen(false);
          setIsOpen(false);
          navigate(targetRoute, { state: { orderId: lastOrderId, autoTrack: true } });
        }, 1000);
        setIsLoading(false);
        return;
      }

      // 0.6 Bill Download / Invoice View Intent
      if (normalizedText.match(/\b(download\s*(my)?\s*bill|download\s*(my)?\s*invoice|get\s*(my)?\s*bill|get\s*(my)?\s*invoice|show\s*(my)?\s*bill|view\s*(my)?\s*bill|print\s*bill|mail\s*buddy|download\s*my\s*mail)\b/i)) {
        const speech = language === 'Tamil'
          ? "நிச்சயமாக! உங்களின் ரசீது பதிவிறக்கம் செய்யப்படுகிறது."
          : "Sure! Downloading your bill now.";

        setMessages(prev => [...prev, { role: 'model', content: speech }]);
        speakText(speech);

        if (!location.pathname.includes('invoice')) {
          navigate('/invoice', { state: { autoDownload: true } });
        }
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('download-invoice'));
          document.dispatchEvent(new CustomEvent('trigger-download-bill'));
        }, 800);

        setIsLoading(false);
        return { completed: true, handled: true };
      }

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
      // Linear Step-by-Step Back Navigation Rule
      if (normalizedText.match(/\b(go\s*back|back|previous\s*page|previous\s*screen|back\s*page|take\s*me\s*back)\b/i)) {
        let targetRoute = '/';
        let msg = language === 'Tamil' ? "முந்தைய பக்கத்திற்கு செல்கிறோம்." : "Going to previous page.";

        if (location.pathname.includes('invoice')) {
          targetRoute = location.pathname.includes('takeaway') ? '/takeaway-order-success' : '/order-success';
          msg = language === 'Tamil' ? "ஆர்டர் நிலை பக்கத்திற்கு செல்கிறோம்." : "Returning to Order Status page.";
        } else if (location.pathname.includes('order-success')) {
          targetRoute = location.pathname.includes('takeaway') ? '/takeaway-payment' : '/payment';
          msg = language === 'Tamil' ? "கட்டண பக்கத்திற்கு செல்கிறோம்." : "Returning to Payment page.";
        } else if (location.pathname.includes('payment')) {
          targetRoute = location.pathname.includes('takeaway') ? '/takeaway-checkout' : '/checkout';
          msg = language === 'Tamil' ? "செக்அவுட் பக்கத்திற்கு செல்கிறோம்." : "Returning to Checkout page.";
        } else if (location.pathname.includes('checkout')) {
          targetRoute = location.pathname.includes('takeaway') ? '/take-away' : '/dine-in';
          msg = language === 'Tamil' ? "மெனு பக்கத்திற்கு செல்கிறோம்." : "Returning to Menu page.";
        } else if (location.pathname.includes('dine-in') || location.pathname.includes('take-away') || location.pathname.includes('takeaway')) {
          targetRoute = '/';
          msg = language === 'Tamil' ? "முகப்பு பக்கத்திற்கு செல்கிறோம்." : "Returning to Home page.";
        }

        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setTimeout(() => { setIsOpen(false); navigate(targetRoute); }, 500);
        setIsLoading(false);
        return;
      }

      const isHomeMatch = (
        normalizedText.trim() === 'home' ||
        normalizedText.match(/^(go\s*(to)?\s*home|home\s*page|head\s*home|take\s*me\s*home|main\s*page|main\s*screen|back\s*to\s*home|home\s*screen|வீடு|முகப்பு|घर|இல்லம்)$/i) ||
        normalizedText.match(/\b(go\s*(to)?\s*home|take\s*me\s*home|head\s*home|back\s*to\s*home)\b/i) ||
        (normalizedText.length <= 12 && normalizedText.match(/\b(home|முகப்பு|வீடு|घर)\b/i))
      );
      if (isHomeMatch) {
        const msg = language === 'Tamil' ? "முகப்பு பக்கத்திற்கு செல்கிறோம்." : "Going to home page.";
        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setTimeout(() => { setIsOpen(false); navigate('/'); }, 500);
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
      if (normalizedText.match(/(checkout|pay|payment|bill|place order|confirm order)/i) && !normalizedText.match(/(add|remove|download)/i)) {
        if (cart.length === 0) {
          const msg = language === 'Tamil' ? "Unga cart empty ah irukku. Thayavu seithu mudhalil order seiyavum." : "Your cart is empty. Please add items to your order first.";
          setMessages(prev => [...prev, { role: 'model', content: msg }]);
          speakText(msg);
          setIsLoading(false);
          return;
        }

        setIsCartOpen(false);
        setIsOpen(false);

        if (location.pathname.includes('payment')) {
          if (normalizedText.match(/(go to payment|navigate to payment)/i)) {
            const msg = language === 'Tamil' ? "Neengal yerkkanave payment pakkathil ulleergal." : "You are already on the payment page.";
            setMessages(prev => [...prev, { role: 'model', content: msg }]);
            speakText(msg);
            setIsLoading(false);
            return;
          }

          if (normalizedText.match(/(place order|confirm order|pay|ok|done|cash|upi|online|card|paytm|gpay|phonepe)/i)) {
            const isPaymentMethod = normalizedText.match(/(cash|upi|online|card|paytm|gpay|phonepe)/i);
            let method;
            if (isPaymentMethod) {
              method = normalizedText.match(/(cash)/i) ? 'Cash' : 'UPI';
              document.dispatchEvent(new CustomEvent('select-payment', { detail: { method } }));
            }

            const msg = language === 'Tamil' ? "Order seiyappadugirathu." : "Placing your order.";
            setMessages(prev => [...prev, { role: 'model', content: msg }]);
            speakText(msg);
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('confirm-place-order', { detail: { method } }));
            }, 1000);
            setIsLoading(false);
            return;
          }
        }

        if (location.pathname.includes('checkout')) {
          const nameInput = document.querySelector('input[name="name"]');
          const phoneInput = document.querySelector('input[name="phone"]');

          if (nameInput && phoneInput && (!nameInput.value.trim() || !/^\d{10}$/.test(phoneInput.value.replace(/\D/g, '')))) {
            const msg = language === 'Tamil' ? "Thayavu seithu ungal peyar matrum 10-digit phone number-ai mudhalil kooravum." : "Please tell me your valid name and 10-digit phone number first.";
            setMessages(prev => [...prev, { role: 'model', content: msg }]);
            speakText(msg);
            setIsLoading(false);
            return;
          }

          const msg = language === 'Tamil' ? "Payment pakkathirku selgirom." : "Proceeding to payment.";
          setMessages(prev => [...prev, { role: 'model', content: msg }]);
          speakText(msg);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('continue-to-payment'));
          }, 1000);
          setIsLoading(false);
          return;
        }

        const msg = language === 'Tamil' ? "Mudhalil checkout seiyavum." : "Taking you to checkout first.";
        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setTimeout(() => {
          navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-checkout' : '/checkout');
        }, 1000);
        setIsLoading(false);
        return;
      }

      // Smart Customer Greeting Memory Handler
      const isGreeting = normalizedText.match(/^(hi|hello|hey|vanakkam|namaste|good morning|good evening)\b/i);
      if (isGreeting) {
        const hasBeenGreeted = sessionStorage.getItem('customer_has_been_greeted') === 'true';
        if (!hasBeenGreeted) {
          sessionStorage.setItem('customer_has_been_greeted', 'true');
          const greetMsg = language === 'Tamil'
            ? "வணக்கம்! டேட்டா உடுப்பி உணவகத்திற்கு வரவேற்கிறோம். இன்று உங்களுக்கு என்ன உணவுகள் வேண்டும்?"
            : "Hello! Welcome to Data Udupi Restaurant. What would you like to order today?";
          setMessages(prev => [...prev, { role: 'model', content: greetMsg }]);
          speakText(greetMsg);
          setIsLoading(false);
          return;
        } else {
          const promptMsg = language === 'Tamil' ? "சொல்லுங்கள், வேறு என்ன வேண்டும்?" : "Yes! How else can I help with your order?";
          setMessages(prev => [...prev, { role: 'model', content: promptMsg }]);
          speakText(promptMsg);
          setIsLoading(false);
          return;
        }
      }

      // Tanglish & Tamil Menu Query Intent ("enna enna items", "enna eruku", "menu kaattu")
      const isMenuQuery = normalizedText.match(/\b(enna\s*enna\s*items|enna\s*eruku|enna\s*irukku|menu\s*kaattu|menu\s*kaattunga|what\s*items|all\s*items|show\s*menu|open\s*menu|list\s*items)\b/i);

      if (isMenuQuery) {
        if (language !== 'Tamil') setLanguage('Tamil');
        const overviewSpeech = "Namma menu-la Dosa, Idly, Schezwan Noodles, Veg. Koftha, Masala Dosa, Curd Rice, Beverages ellam irukku! Ungalukku enna venum?";

        setMessages(prev => [...prev, { role: 'model', content: overviewSpeech }]);
        speakText(overviewSpeech);
        if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
          navigate('/dine-in');
        }
        setIsLoading(false);
        return { completed: true, handled: true };
      }

      // 3. Category Overview & Navigation
      const isOrderVerb = normalizedText.match(/\b(add|order|want|get|buy|need|bring|pack|\d+)\b/i);
      const catMatch = findCategoryMatch(normalizedText);

      if (catMatch && !isOrderVerb) {
        setActiveCategory(catMatch.id);
        if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
          navigate('/dine-in');
        }

        const itemsInCat = (menuItems || []).filter(item => item.category_id === catMatch.id || (item.category && item.category.toLowerCase().includes(catMatch.name.toLowerCase())));
        const catOverviewList = itemsInCat.length > 0 ? itemsInCat.slice(0, 5).map(i => i.name).join(', ') : '';

        let msg = '';
        if (language === 'Tamil') {
          msg = catOverviewList
            ? `${catMatch.name} பிரிவில் ${catOverviewList} உள்ளன. இதில் ஏதேனும் சேர்க்க விரும்புகிறீர்களா?`
            : `${catMatch.name} வகைகளை காண்பிக்கிறேன். உங்களின் தேர்வை கூறவும்.`;
        } else {
          msg = catOverviewList
            ? `Under ${catMatch.name}, we have ${catOverviewList}. Would you like to add any of these to your order?`
            : `Showing ${catMatch.name} items. What would you like to add to your order?`;
        }

        setMessages(prev => [...prev, { role: 'model', content: msg }]);
        speakText(msg);
        setIsLoading(false);
        return;
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

      // --- Voice Command: Payment Selection (Only selection, no confirmation) ---
      if (normalizedText.match(/(cash|upi|online|card|paytm|gpay|phonepe)/i)) {
        const method = normalizedText.match(/(cash)/i) ? 'Cash' : 'UPI';
        document.dispatchEvent(new CustomEvent('select-payment', { detail: { method } }));

        if (location.pathname.includes('payment') && (method === 'UPI' || normalizedText.match(/(ok|place|confirm|done)/i))) {
          // Auto confirm for online payment or if they said ok
          const confirmMsg = language === 'Tamil' ? "Order seiyappadugirathu." : "Placing your order.";
          setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
          speakText(confirmMsg);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('confirm-place-order', { detail: { method } }));
          }, 1000);
        } else {
          const confirmMsg = language === 'Tamil' ? `${method} thernthedukkappattathu. Thayavu seithu 'Place order' endru kooravum.` : `Selected ${method}. Say 'Place order' to confirm.`;
          setMessages(prev => [...prev, { role: 'model', content: confirmMsg }]);
          speakText(confirmMsg);
        }
        setIsLoading(false);
        return;
      }

    }
    // --- NO LOCAL NAVIGATION MATCH -> SEND TO GEMINI ---

    let effectivePage = location.pathname;
    if (document.querySelector('.os-track-container')) {
      effectivePage = '/live-order-status';
    }

    const pageNames = {
      '/': 'Home Landing Page',
      '/dine-in': 'Dine-In Menu Page',
      '/take-away': 'Takeaway Menu Page',
      '/checkout': 'Checkout Page (Dine-in)',
      '/takeaway-checkout': 'Checkout Page (Takeaway)',
      '/payment': 'Payment Page (Dine-in)',
      '/takeaway-payment': 'Payment Page (Takeaway)',
      '/order-success': 'Order Success & Live Order Tracking Page',
      '/takeaway-order-success': 'Takeaway Order Success Page',
      '/invoice': 'Invoice Page'
    };

    const mode = effectivePage === '/' ? 'home_assistant' : 'voice_assistant';
    const context = {
      currentPage: effectivePage,
      pageName: pageNames[effectivePage] || effectivePage,
      language,
      cartItemCount: cart.length,
      cartTotal: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      tableNumber
    };

    try {
      const apiMessages = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.raw || m.content }]
      }));
      if (audioBase64) {
        apiMessages.push({ role: 'user', parts: [{ inlineData: { mimeType: 'audio/webm', data: audioBase64 } }] });
      } else {
        apiMessages.push({ role: 'user', parts: [{ text }] });
      }

      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          context,
          contents: apiMessages,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
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
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
          console.warn("AI response blocked or empty:", candidate);
          throw new Error("AI response was empty or blocked by safety filters.");
        }
        let rawResponse = candidate.content.parts[0].text;
        const startIndex = rawResponse.indexOf('{');
        const endIndex = rawResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          rawResponse = rawResponse.substring(startIndex, endIndex + 1);
        } else {
          rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        let aiResponse;
        try {
          rawResponse = rawResponse.replace(/,\s*([\]}])/g, '$1'); // Fix trailing commas
          aiResponse = JSON.parse(rawResponse);
        } catch (e) {
          try {
            let repaired = rawResponse;
            const quoteCount = (repaired.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) repaired += '"';
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';
            for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';
            aiResponse = JSON.parse(repaired);
          } catch (e2) {
            console.error("Failed to parse JSON response:", e, e2, rawResponse);

            // Robust regex fallback to extract 'speech' & 'transcript' even if JSON is truncated
            const speechMatch = rawResponse.match(/"speech"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/i);
            const transcriptMatch = rawResponse.match(/"transcript"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/i);

            if (speechMatch && speechMatch[1]) {
              aiResponse = {
                speech: speechMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' '),
                transcript: transcriptMatch ? transcriptMatch[1] : null,
                intent: true,
                actions: []
              };
            } else if (rawResponse && !rawResponse.startsWith('{') && rawResponse.length > 5) {
              aiResponse = { speech: rawResponse, action: null };
            } else {
              aiResponse = {
                speech: language === 'Tamil' ? "Mannikkavum, enakku sariyaga puriyavillai. Meendum koora mudiyuma?" : "Sorry, I missed that. Could you please repeat?",
                action: null
              };
            }
          }
        }

        let botText = aiResponse.speech || "Sure!";
        if (aiResponse.transcript) {
          const trLower = aiResponse.transcript.toLowerCase();
          setInputText(aiResponse.transcript);
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: aiResponse.transcript } : m));

          const trCatMatch = findCategoryMatch(trLower);
          if (trCatMatch && !trLower.match(/(cart|basket|order|add|pay|checkout|buy)/i)) {
            setActiveCategory(trCatMatch.id);
            if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) navigate('/dine-in');
            botText = language === 'Tamil' ? `${trCatMatch.name} வகைகளை காண்பிக்கிறேன்.` : `Showing ${trCatMatch.name} items.`;
            aiResponse.intent = false; // Prevent Gemini action fallback
          }

          if (trLower.match(/(open|view|show|go to)\s*(cart|basket)/i) || trLower.includes('கார்ட்டைக் காட்டு')) {
            setIsCartOpen(true); botText = language === 'Tamil' ? "நிச்சயமாக, இதோ உங்கள் கார்ட்." : "Sure, here is your cart.";
          } else if (trLower.match(/(close|hide)\s*(cart|basket)/i) || trLower.includes('கார்ட்டை மறை')) {
            setIsCartOpen(false); botText = language === 'Tamil' ? "கார்ட் மூடப்பட்டது." : "Okay, I've hidden the cart.";
          } else if (trLower.match(/scroll\s*down|go\s*down|page\s*down/i)) {
            window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' }); botText = "Scrolling down.";
          } else if (trLower.match(/scroll\s*up|go\s*up|page\s*up/i)) {
            window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' }); botText = "Scrolling up.";
          } else if (trLower.match(/go\s*home|home\s*page|home\s*ku\s*po|home\s*ponga|முகப்பு|ஹோம்/i)) {
            setTimeout(() => { setIsOpen(false); navigate('/'); }, 1000); botText = language === 'Tamil' ? "முகப்பு பக்கத்திற்குச் செல்கிறோம்." : "Going home.";
          } else if (trLower.match(/new\s*order|start\s*over|cancel\s*order/i)) {
            clearCart(); setTimeout(() => { setIsOpen(false); navigate('/dine-in'); }, 1000); botText = "Starting new order.";
          } else if (trLower.match(/(checkout|pay|payment|bill|place order|confirm order)/i) && !trLower.match(/(add|remove|download)/i)) {
            if (cart.length === 0) {
              botText = language === 'Tamil' ? "Unga cart empty ah irukku. Thayavu seithu mudhalil order seiyavum." : "Your cart is empty. Please add items to your order first.";
            } else {
              setIsCartOpen(false);
              setIsOpen(false);
              if (location.pathname.includes('payment')) {
                if (trLower.match(/(go to payment|navigate to payment)/i)) {
                  botText = language === 'Tamil' ? "Neengal yerkkanave payment pakkathil ulleergal." : "You are already on the payment page.";
                } else if (trLower.match(/(place order|confirm order|pay|ok|done|cash|upi|online|card|paytm|gpay|phonepe)/i)) {
                  const isPaymentMethod = trLower.match(/(cash|upi|online|card|paytm|gpay|phonepe)/i);
                  let method;
                  if (isPaymentMethod) {
                    method = trLower.match(/(cash)/i) ? 'Cash' : 'UPI';
                    document.dispatchEvent(new CustomEvent('select-payment', { detail: { method } }));
                  }
                  botText = language === 'Tamil' ? "Order seiyappadugirathu." : "Placing your order.";
                  setTimeout(() => { document.dispatchEvent(new CustomEvent('confirm-place-order', { detail: { method } })); }, 1000);
                }
              } else if (location.pathname.includes('checkout')) {
                botText = language === 'Tamil' ? "Payment pakkathirku selgirom." : "Proceeding to payment.";
                setTimeout(() => { document.dispatchEvent(new CustomEvent('continue-to-payment')); }, 1000);
              } else {
                botText = language === 'Tamil' ? "Mudhalil checkout seiyavum." : "Taking you to checkout first.";
                setTimeout(() => { navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-checkout' : '/checkout'); }, 1000);
              }
            }
            aiResponse.intent = false; // Prevent Gemini action fallback
          }
        }




        let itemsAddedInThisTurn = false;

        const executeAction = (actionObj) => {
          const action = actionObj.type || actionObj.action;
          const params = actionObj.parameters || {};

          let updatedName = false;
          let updatedPhone = false;

          const nameToUpdate = params.fullName || params.customerName || (action === 'UPDATE_NAME' ? params.name : null);
          if (nameToUpdate) {
            document.dispatchEvent(new CustomEvent('update-name', { detail: { name: nameToUpdate } }));
            updatedName = true;
          }

          const phoneToUpdate = params.phone || params.number || params.phoneNumber || params.mobile;
          if (phoneToUpdate) {
            const cleanedPhone = String(phoneToUpdate).replace(/\D/g, '');
            if (/^\d{10}$/.test(cleanedPhone)) {
              document.dispatchEvent(new CustomEvent('update-phone', { detail: { phone: cleanedPhone } }));
              updatedPhone = true;
            } else if (action === 'UPDATE_PHONE') {
              return language === 'Tamil' ? "Thayavu seithu sariyana 10-digit phone number-ai kooravum." : "Please provide a valid 10-digit Indian phone number.";
            }
          }

          if (action === 'ADD_ITEM' && params.name) {
            let itemName = String(params.name).toLowerCase().trim();
            let quantity = 1;

            if (params.quantity !== undefined && params.quantity !== null) {
              const parsed = parseInt(params.quantity, 10);
              if (!isNaN(parsed) && parsed > 0) {
                quantity = parsed;
              }
            }

            // Extract quantity if included in item name (e.g. "10 mushroom noodles", "2 coffee")
            const qtyInNameMatch = itemName.match(/^(\d+)\s+(.+)/);
            if (qtyInNameMatch) {
              quantity = parseInt(qtyInNameMatch[1], 10);
              itemName = qtyInNameMatch[2].trim();
            }

            // Clean common prefix verbs
            itemName = itemName.replace(/^(add|order|want|get|buy|need)\s+/i, '').trim();

            // Regional transliteration map for ADD_ITEM
            const regionalItemMap = {
              'non': 'butter naan',
              'nons': 'butter naan',
              'nan': 'butter naan',
              'nans': 'butter naan',
              'naan': 'butter naan',
              'naans': 'butter naan',
              'butter naans': 'butter naan',
              'tandoori naan': 'butter naan',
              'roti': 'butter naan',
              'rotis': 'butter naan',
              'mosaranna': 'curd rice',
              'thayir sadham': 'curd rice',
              'thayir sadam': 'curd rice',
              'perugu annam': 'curd rice',
              'curd sadham': 'curd rice',
              'kaapi': 'coffee',
              'chaya': 'tea',
              'chai': 'tea',
              'sappathi': 'chappathi kuruma',
              'chappathi': 'chappathi kuruma',
              'thayir vadai': 'curd vadai (1)',
              'sambar vadai': 'sambar vadai (1)',
              'poori': 'poori masala',
              'podi dosa': 'podi dosai',
              'mini tiffin': 'mini tiffen',
              'samabar idly': 'sambar idly',
              'samabar idli': 'sambar idly',
              'samabar': 'sambar',
              'sambar idli': 'sambar idly',
              'session noodles': 'schezwan noodles',
              'session noodle': 'schezwan noodles',
              'sessions noodles': 'schezwan noodles',
              'sessions noodle': 'schezwan noodles',
              'session': 'schezwan noodles',
              'sessions': 'schezwan noodles',
              'sezhwan noodles': 'schezwan noodles',
              'sezhwan noodle': 'schezwan noodles',
              'sezhwan': 'schezwan noodles',
              'shezwan noodles': 'schezwan noodles',
              'shezwan noodle': 'schezwan noodles',
              'shezwan': 'schezwan noodles',
              'sezhuan noodles': 'schezwan noodles',
              'sezhuan': 'schezwan noodles',
              'shezuan noodles': 'schezwan noodles',
              'shezuan': 'schezwan noodles',
              'sichuan noodles': 'schezwan noodles',
              'sichuan noodle': 'schezwan noodles',
              'sichuan': 'schezwan noodles',
              'szechuan noodles': 'schezwan noodles',
              'szechuan noodle': 'schezwan noodles',
              'szechuan': 'schezwan noodles',
              'secuan noodles': 'schezwan noodles',
              'secuan noodle': 'schezwan noodles',
              'secuan': 'schezwan noodles',
              'sechuan noodles': 'schezwan noodles',
              'sechuan noodle': 'schezwan noodles',
              'sechuan': 'schezwan noodles',
              'schwan noodles': 'schezwan noodles',
              'schwan': 'schezwan noodles'
            };
            if (regionalItemMap[itemName]) {
              itemName = regionalItemMap[itemName];
            }

            const foundItem = findBestMenuItemMatch(itemName, menuItems);

            // CATEGORY GUARD: Only trigger category view if NO menu item matched AND user query didn't specify quantity or add verb
            if (!foundItem) {
              const catCheck = findCategoryMatch(itemName);
              if (catCheck) {
                setActiveCategory(catCheck.id);
                if (!location.pathname.includes('dine-in') && !location.pathname.includes('take-away')) {
                  navigate('/dine-in');
                }
                return language === 'Tamil' ? `${catCheck.name} வகைகளை காண்பிக்கிறேன்.` : `Showing ${catCheck.name} items.`;
              }
              return language === 'Tamil' ? `மன்னிக்கவும், ${params.name} உணவக மெனுவில் இல்லை.` : `Sorry, ${params.name} is not available on our menu.`;
            }

            if (foundItem) {
              itemsAddedInThisTurn = true;
              addToCart(foundItem, quantity);
              setIsCartOpen(true);
              setTimeout(() => {
                setIsCartOpen(false);
              }, 4000);
            }
          } else if (action === 'REMOVE_ITEM' && params.name) {
            const itemName = params.name.toLowerCase();
            const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
            if (foundItem) {
              removeCartItem(foundItem.id);
            } else {
              return language === 'Tamil' ? `Ungal cart-il ${params.name} illai.` : `${params.name} is not in your cart.`;
            }
          } else if (action === 'CLEAR_CART') {
            clearCart();
          } else if (action === 'UPDATE_QUANTITY' && params.name) {
            const itemName = params.name.toLowerCase();
            const foundItem = cart.find(i => i.name.toLowerCase().includes(itemName));
            if (foundItem) {
              if (params.quantity !== undefined && params.quantity !== null) {
                const parsedQty = parseInt(params.quantity, 10);
                if (!isNaN(parsedQty) && parsedQty >= 0) {
                  updateItemQuantity(foundItem.id, parsedQty);
                }
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
              return iName === itemName || iName.includes(itemName) || tName.includes(itemName);
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
              return language === 'Tamil' ? "Unga cart empty ah irukku. Thayavu seithu mudhalil order seiyavum." : "Your cart is empty. Please add items to your order first.";
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
          } else if (action === 'DOWNLOAD_INVOICE' || action === 'DOWNLOAD_BILL') {
            document.dispatchEvent(new CustomEvent('download-invoice'));
          } else if (action === 'GENERATE_BILL') {
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('download-invoice'));
            }, 2000);
          } else if (action === 'PAYMENT_METHOD' && params.method) {
            document.dispatchEvent(new CustomEvent('select-payment', { detail: { method: params.method } }));
          } else if (action === 'UPDATE_NAME' || action === 'UPDATE_PHONE') {
            // Already handled at the start of executeAction
          } else if (action === 'SCROLL_DOWN') {
            const scrollContainer = document.querySelector('.di-grid') || document.querySelector('.checkout-container') || document.querySelector('.main-content') || window;
            scrollContainer.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
          } else if (action === 'SCROLL_UP') {
            const scrollContainer = document.querySelector('.di-grid') || document.querySelector('.checkout-container') || document.querySelector('.main-content') || window;
            scrollContainer.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
          } else if (action === 'NEW_ORDER') {
            clearCart();
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          } else if (action === 'NEW_ORDER') {
            clearCart();
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          } else if (action === 'GO_HOME' || action === 'OPEN_HOME' || action === 'NAVIGATE_HOME' || action === 'GO_TO_HOME' || action === 'HOME' || action === 'CLICK_HOME') {
            setIsOpen(false);
            navigate('/');
          } else if (action === 'CLICK_DINE_IN' || action === 'GO_DINE_IN') {
            document.dispatchEvent(new CustomEvent('open-qr-scanner'));
            navigate('/dine-in');
          } else if (action === 'CLICK_TAKEAWAY' || action === 'GO_TAKEAWAY') {
            clearCart();
            navigate('/take-away');
          } else if (action === 'OPEN_MENU' || action === 'SHOW_MENU' || action === 'MENU_PAGE' || action === 'GO_MENU') {
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/take-away' : '/dine-in');
          } else if (action === 'GO_PAYMENT' || action === 'PAYMENT_PAGE') {
            if (cart.length === 0) {
              return language === 'Tamil' ? "Unga cart empty ah irukku. Thayavu seithu mudhalil order seiyavum." : "Your cart is empty. Please add items to your order first.";
            }
            setIsCartOpen(false);
            setIsOpen(false);
            navigate(location.pathname.includes('takeaway') || location.pathname.includes('take-away') ? '/takeaway-payment' : '/payment');
          } else if (action === 'PROCEED_TO_PAYMENT') {
            const nameInput = document.querySelector('input[name="name"]');
            const phoneInput = document.querySelector('input[name="phone"]');

            const hasName = updatedName || (nameInput && nameInput.value.trim());
            const hasPhone = updatedPhone || (phoneInput && /^\d{10}$/.test(phoneInput.value.replace(/\D/g, '')));

            if (!hasName || !hasPhone) {
              return language === 'Tamil' ? "Thayavu seithu ungal peyar matrum phone number-ai kooravum." : "Please provide your name and phone number.";
            } else {
              document.dispatchEvent(new CustomEvent('continue-to-payment'));
            }
          } else if (action === 'CHANGE_LANGUAGE') {
            if (params.language) {
              const langMatch = params.language.toLowerCase();
              if (langMatch.includes('tamil')) setLanguage('Tamil');
              else if (langMatch.includes('english')) setLanguage('English');
              else setLanguage(params.language); // Fallback
            }
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

        const postFlow = await executeDirectOrderOrPrompt(normalizedText, aiResponse.actions || (aiResponse.action ? [aiResponse] : []));
        if (postFlow.completed || postFlow.handled) {
          setIsLoading(false);
          return;
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

      let fallbackMsg;
      if (error.message && (error.message.includes("AI response") || error.message.includes("No response"))) {
        fallbackMsg = language === 'Tamil' ? "தயவுசெய்து மீண்டும் கூற முடியுமா?" : "Could you please repeat that item or command clearly?";
      } else {
        fallbackMsg = language === 'Tamil' ? "தயவுசெய்து மீண்டும் முயற்சி செய்யவும்." : "Please try your command again.";
      }

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
      setIsVoiceMode(false);
    } else {
      setIsOpen(false);
      if (isVoiceMode) {
        setIsVoiceMode(false);
        stopListening(false);
      }
    }
  };

  const renderWaveSymbol = (isWhite = false) => (
    <div className={`ai-voice-wave-symbol ${isWhite ? 'white' : ''}`}>
      <span className="wave-bar"></span>
      <span className="wave-bar"></span>
      <span className="wave-bar"></span>
      <span className="wave-bar"></span>
      <span className="wave-bar"></span>
    </div>
  );

  return (
    <>
      {/* Fixed Trigger Button */}
      {!isOpen && (
        <div
          className={`ai-trigger-btn ${isListening ? 'is-listening' : ''}`}
          onClick={toggleSidebar}
          title="Talk to Voice Agent"
        >
          <div className="ai-trigger-avatar-wrap">
            <img src={agentwaiterLogoImg} alt="Agent" style={{ pointerEvents: 'none', userSelect: 'none' }} />
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
      <div className={["ai-sidebar-overlay", isOpen ? 'active' : ''].join(' ')}>
        <div className="ai-sidebar-content-original">
          {/* ── Frosted Hero Section ── */}
          <div className="ai-hero-frosted-original" style={{ height: isVoiceMode ? '270px' : '110px', transition: 'height 0.3s ease' }}>
            <header className="ai-unified-header">
              <span>Talk To Your Agent</span>
              <button className="ai-close-x" onClick={toggleSidebar}>&times;</button>
            </header>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', zIndex: 10 }}>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '25px', padding: '4px' }}>
                <button
                  onClick={() => { setIsVoiceMode(false); stopListening(false); }}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', border: 'none',
                    background: !isVoiceMode ? '#fff' : 'transparent',
                    color: !isVoiceMode ? '#ff4e00' : '#fff',
                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
                    fontSize: '13px'
                  }}>
                  <i className="fa-solid fa-keyboard" style={{ marginRight: '6px' }}></i> Typing
                </button>
                <button
                  onClick={() => { setIsVoiceMode(true); }}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', border: 'none',
                    background: isVoiceMode ? '#ff4e00' : 'transparent',
                    color: '#fff',
                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
                    fontSize: '13px'
                  }}>
                  <i className="fa-solid fa-microphone" style={{ marginRight: '6px' }}></i> Voice Agent
                </button>
              </div>
            </div>

            {/* Mascot and Waveform - Only in Voice Mode */}
            {isVoiceMode && (
              <div className="ai-namaste-wrap-original">
                <div className="ai-waveform-bg">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="ai-wave-line" />
                  ))}
                </div>
                <img src={waiterImg} alt="Waiter Namaste" className="ai-mascot-namaste-original" />
              </div>
            )}
          </div>

          <div className="ai-chat-messages" style={{
            flex: 1,
            minHeight: 0,
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
                    width: '36px',
                    height: '36px',
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
                      : <img src={waiterImg} alt="Waiter" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
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
                              {cat.image && <img src={cat.image} alt={cat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '5px', objectFit: 'cover' }} />}
                              <div style={{ fontSize: '12px', fontWeight: '600' }}>{cat.name}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '8px', color: '#ff4e00', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-arrow-left"></i> See menu list in the left column
                        </div>
                      </div>
                    ) : (
                      msg.content || (msg.role === 'user' ? renderWaveSymbol(false) : '')
                    )}
                  </div>
                </div>
              )))}

            {isListening && (
              <div className="ai-msg-container user" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                flexDirection: 'row-reverse',
                animation: 'aiMsgIn 0.3s ease-out'
              }}>
                <div className="ai-msg-icon" style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#ff4e00', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexShrink: 0
                }}>
                  <i className="fa-solid fa-microphone" style={{ color: 'white', fontSize: '14px' }}></i>
                </div>
                <div className="ai-msg-bubble listening-wave-bubble" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderWaveSymbol(false)}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="ai-msg-container model" style={{ display: 'flex', gap: '12px', animation: 'aiMsgIn 0.3s ease-out' }}>
                <div className="ai-msg-icon" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <img src={waiterImg} alt="Waiter" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
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
                title={isVoiceMode ? "Stop Listening" : "Switch to Voice Mode"}
              >
                <i className={`fa-solid ${isVoiceMode ? 'fa-microphone' : 'fa-keyboard'}`}></i>
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
                  color: isMuted ? '#999' : '#ff4e00',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s, color 0.2s'
                }}
                title={isMuted ? "Unmute Assistant" : "Mute Assistant"}
              >
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
              </button>

              {isListening ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#ff4e00' }}>Listening</span>
                  {renderWaveSymbol(false)}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={isVoiceMode ? "Listening..." : "Type your message..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{
                    flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '0 4px', outline: 'none', fontSize: '14px'
                  }}
                />
              )}

              <button
                type="button"
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={inputText.trim().length === 0}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: inputText.trim().length > 0 ? '#ff4e00' : '#e0e0e0',
                  color: '#fff',
                  cursor: inputText.trim().length === 0 ? 'default' : 'pointer',
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
