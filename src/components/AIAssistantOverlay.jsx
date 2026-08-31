// AIAssistantOverlay — Voice Agent primary ordering journey controller
// Voice transport: Vapi (@vapi-ai/web)
// All business logic remains in existing stores/contexts — no backend changes.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoiceAgent } from '../context/VoiceAgentContext';
import { useCart } from '../context/CartContext';
import './AIAssistantOverlay.css';
import { useVapiAssistant, CALL_STATUS } from '../hooks/useVapiAssistant';
import { derivePageContext } from '../utils/voiceAgentUtils';
import { isVapiConfigured, getVapiConfigError, muteVapiCall, sendVapiMessage } from '../services/vapiService';

const agentwaiterLogoImg = `/assets/images/agentwaiter_logo.png`;

// ── Wave animation helper ─────────────────────────────────────────────────────
const WaveSymbol = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px' }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{
        width: '3px',
        height: active ? '100%' : '4px',
        background: '#ff4e00',
        borderRadius: '3px',
        animation: active ? `waveBarBounce 0.5s infinite alternate ease-in-out ${i*0.1}s` : 'none',
        transition: 'height 0.2s'
      }} />
    ))}
  </div>
);

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="ai-msg-bubble" style={{
    background: 'white', padding: '12px 18px', borderRadius: '18px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0'
  }}>
    <span className="dot-typing" />
  </div>
);

const isInternalMessage = (content) => {
  if (!content) return false;
  const lower = content.toLowerCase();
  return (
    lower.includes('[system') ||
    lower.includes('[debug') ||
    lower.includes('[mcp') ||
    lower.includes('[internal') ||
    lower.includes('system note') ||
    lower.includes('[context update]')
  );
};

// ── Derive micState from Vapi call status ─────────────────────────────────────
function deriveMicState(callStatus, isSpeaking, isListening) {
  if (callStatus === CALL_STATUS.CONNECTING) return 'PROCESSING';
  if (callStatus === CALL_STATUS.ENDING)     return 'PROCESSING';
  if (isSpeaking)                            return 'SPEAKING';
  if (isListening && callStatus === CALL_STATUS.ACTIVE) return 'LISTENING';
  return 'IDLE';
}

const AIAssistantOverlay = () => {
  // Text input mode (voice is Vapi; typing is still available as fallback)
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [inputText, setInputText]     = useState('');

  const location  = useLocation();
  const navigate  = useNavigate();

  const {
    agentState,
    setFlowStage,
    setCustomerInfo,
    setOrderType,
    setTableNumber,
    setOrderPlaced,
    setOrderStatus,
    setDetectedLanguage,
    startOrderTracking,
    detectLanguage,
    setMessages,
    setIsGreeted,
    updateFromRoute,
    isAgentOpen: isOpen,
    setIsAgentOpen: setIsOpen,
  } = useVoiceAgent();

  const messages = agentState.messages || [];

  const {
    cart,
    addToCart,
    removeCartItem,
    isCartOpen,
    setIsCartOpen,
    setTableNumber: setCartTableNumber,
    subtotal,
    totalAmount,
    setActiveCategory,
    updateItemQuantity,
  } = useCart();

  // ── Vapi hook ─────────────────────────────────────────────────────────────
  const {
    callStatus,
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    transcript,
    error: vapiError,
    startAssistant,
    stopAssistant,
    toggleAssistant,
    isConfigured,
  } = useVapiAssistant();

  // ── Derived mic state for UI (identical to old states) ───────────────────
  const micState = deriveMicState(callStatus, isSpeaking, isListening);

  const sidebarRef     = useRef(null);
  const messagesEndRef = useRef(null);
  const checkoutTimerRef = useRef(null);

  // ── Synchronize route with context state ──────────────────────────────────
  useEffect(() => {
    updateFromRoute(location.pathname);
  }, [location.pathname, updateFromRoute]);

  // ── Close agent when cart opens ───────────────────────────────────────────
  useEffect(() => {
    if (isCartOpen) {
      setIsOpen(false);
    }
  }, [isCartOpen]);

  // ── Auto-open and greet (first visit) ────────────────────────────────────
  // With Vapi, the greeting is handled by the Vapi assistant itself when the
  // call starts. We just open the overlay and start the call.
  useEffect(() => {
    const isSuccessPage = location.pathname.includes('order-success');
    if (!agentState.isGreeted && !isSuccessPage) {
      setIsGreeted(true);
      setIsOpen(true);
      setIsVoiceMode(true);
      // Small delay so the UI renders before call starts
      const t = setTimeout(() => {
        if (isConfigured) {
          startAssistant();
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [agentState.isGreeted, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll messages ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, micState]);

  // ── Sync Vapi transcript into VoiceAgentContext messages ─────────────────
  // (The hook already calls setMessages; this keeps the display up to date.)
  // No extra work needed here — transcript is managed in the hook.

  // ── Listen for order status updates ──────────────────────────────────────
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      const status = e.detail?.status;
      if (status) {
        setOrderStatus(status);
        // Open the overlay to surface the update
        setIsOpen(true);
      }
    };
    document.addEventListener('order-status-update', handleStatusUpdate);
    return () => document.removeEventListener('order-status-update', handleStatusUpdate);
  }, [setOrderStatus, setIsOpen]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (checkoutTimerRef.current) clearTimeout(checkoutTimerRef.current);
    };
  }, []);

  // ── Text-chat send (typing fallback) ──────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    
    // Start assistant if not connected
    if (!isConnected && !isConnecting && isConfigured) {
      startAssistant();
    }
    
    // Add user message to conversation display immediately
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Send to Vapi
    sendVapiMessage({
      type: 'add-message',
      message: {
        role: 'user',
        content: text
      }
    });
  };

  // ── Toggle sidebar ────────────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      // Stop Vapi call when overlay is closed
      if (isConnected || isConnecting) {
        stopAssistant();
      }
    } else {
      setIsOpen(true);
      if (isVoiceMode && isConfigured) {
        // Small delay so overlay finishes animating open
        setTimeout(() => startAssistant(), 300);
      }
    }
  }, [isOpen, isConnected, isConnecting, isVoiceMode, isConfigured, startAssistant, stopAssistant, setIsOpen]);

  // ── Switch between voice and typing mode ─────────────────────────────────
  const handleToggleMode = () => {
    if (isVoiceMode) {
      // Switch to typing — mute the mic instead of stopping
      setIsVoiceMode(false);
      muteVapiCall(true);
    } else {
      // Switch to voice — unmute
      setIsVoiceMode(true);
      muteVapiCall(false);
      if (isConfigured && !isConnected && !isConnecting) {
        setTimeout(() => startAssistant(), 100);
      }
    }
  };

  // ── Don't render on the voice-agent page ──────────────────────────────────
  if (location.pathname === '/agent') return null;

  // ── Config error banner text ──────────────────────────────────────────────
  const configError = !isConfigured ? getVapiConfigError() : null;
  const displayError = vapiError || configError;

  // ── Status label for voice input display ─────────────────────────────────
  const voicePlaceholder =
    micState === 'PROCESSING'   ? 'Connecting...' :
    micState === 'SPEAKING'     ? 'Agent is responding...' :
    micState === 'LISTENING'    ? 'Listening... Speak now' :
    displayError                ? displayError :
                                  'Tap mic to speak';

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <div
          className={`ai-trigger-btn ${(micState === 'LISTENING' || micState === 'RECORDING') ? 'is-listening' : ''}`}
          onClick={toggleSidebar}
          title="Talk to Voice Agent"
        >
          <div className="ai-trigger-avatar-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', width: '100%', height: '100%', overflow: 'hidden' }}>
            <img src={agentwaiterLogoImg} alt="Agent Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="ai-trigger-text-wrap">
            <span className="ai-trigger-title">Talk to Your Agent</span>
            <span className="ai-trigger-subtitle">⬇ Tap to speak</span>
          </div>
          <div className="ai-hover-tooltip">
            <div className="tooltip-line1">Hi! I&apos;m your Voice Agent.</div>
            <div className="tooltip-line2">I&apos;ll guide your entire order!</div>
          </div>
        </div>
      )}

      {/* Main sidebar */}
      <div ref={sidebarRef} className={['ai-sidebar-overlay', isOpen ? 'active' : ''].join(' ')}>
        <div className="ai-sidebar-content-original">

          {/* Hero section */}
          <div className="ai-hero-frosted-original" style={{ height: isVoiceMode ? '270px' : '110px', transition: 'height 0.3s ease' }}>
            <header className="ai-unified-header">
              <span>Talk To Your Agent</span>
              <button className="ai-close-x" onClick={toggleSidebar}>&times;</button>
            </header>

            {/* Mascot / waveform */}
            {isVoiceMode && (
              <div className="ai-namaste-wrap-original">
                <div className="ai-waveform-bg">
                  {Array.from({ length: 15 }).map((_, i) => <div key={i} className="ai-wave-line" />)}
                </div>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', zIndex: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.9)', background: '#fff' }}>
                  <img src={agentwaiterLogoImg} alt="Agent Waiter Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            )}
          </div>

          {/* Configuration warning banner */}
          {displayError && (
            <div style={{
              margin: '8px 16px 0',
              padding: '10px 14px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#856404',
            }}>
              ⚠ {displayError}
            </div>
          )}

          {/* Messages */}
          <div className="ai-chat-messages" style={{
            flex: 1, minHeight: 0, overflowY: 'auto', scrollBehavior: 'smooth',
            padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '14px',
            scrollbarWidth: 'none',
          }}>
            <style>{'.ai-chat-messages::-webkit-scrollbar { display: none; }'}</style>

            {messages.filter(msg => msg && msg.content && !isInternalMessage(msg.content)).length === 0 ? (
              <div className="ai-greeting-center">
                <h2>Hi! I&apos;m your Voice Agent.</h2>
                <p>I&apos;ll guide you through your entire order!</p>
              </div>
            ) : (
              messages
                .filter(msg => msg && msg.content && !isInternalMessage(msg.content))
                .map((msg, i) => (
                  <div key={i}
                    className={['ai-msg-container', msg.role].join(' ')}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      animation: 'aiMsgIn 0.3s ease-out',
                    }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.role === 'user' ? '#ff4e00' : 'white',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden',
                    }}>
                      {msg.role === 'user'
                        ? <i className="fa-solid fa-user-check" style={{ color: 'white', fontSize: '14px' }} />
                        : <img src={agentwaiterLogoImg} alt="Agent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                    </div>
                    <div className="ai-msg-bubble" style={{
                      background: 'white', color: '#333', padding: '12px 18px',
                      borderRadius: '18px', maxWidth: '78%', fontSize: '14.5px',
                      fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      border: '1px solid #f0f0f0',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
            )}

            {/* Connecting / processing indicator */}
            {(micState === 'PROCESSING') && (
              <div className="ai-msg-container model" style={{ display: 'flex', gap: '12px', animation: 'aiMsgIn 0.3s ease-out' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden',
                }}>
                  <img src={agentwaiterLogoImg} alt="Agent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <TypingDots />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer input */}
          <div className="ai-footer-original" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ai-input-pill-original">
              {/* Mic / Keyboard Toggle Button */}
              <button
                type="button"
                id="voice-mode-toggle-btn"
                onClick={handleToggleMode}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isVoiceMode ? '#ffebee' : '#f0f0f0',
                  color: isVoiceMode ? '#ff4e00' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: '6px'
                }}
                title={isVoiceMode ? 'Switch to typing mode' : 'Switch to voice mode'}
              >
                <i className={`fa-solid ${isVoiceMode ? 'fa-keyboard' : 'fa-microphone'}`} />
              </button>

              {/* Input / Listening indicator */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
                {isVoiceMode ? (
                  <>
                    <input
                      type="text"
                      placeholder={voicePlaceholder}
                      value=""
                      readOnly
                      style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '0 4px', outline: 'none', fontSize: '13px', color: micState === 'PROCESSING' || micState === 'SPEAKING' ? '#888' : '#000' }}
                    />
                    {(micState === 'RECORDING' || micState === 'SPEAKING' || micState === 'LISTENING') && (
                      <WaveSymbol active={micState === 'RECORDING' || micState === 'SPEAKING' || micState === 'LISTENING'} />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '0 4px', outline: 'none', fontSize: '14px' }}
                  />
                )}
              </div>

              {/* Send / Mic button */}
              <button
                type="button"
                id="voice-send-btn"
                onClick={isVoiceMode ? toggleAssistant : handleSend}
                disabled={isVoiceMode ? (!isConfigured) : (inputText.trim().length === 0)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isVoiceMode
                    ? (isConnected ? '#ff4e00' : (isConnecting ? '#ffa07a' : (isConfigured ? '#ff4e00' : '#e0e0e0')))
                    : (inputText.trim().length > 0 ? '#ff4e00' : '#e0e0e0'),
                  color: '#fff',
                  cursor: isVoiceMode ? (isConfigured ? 'pointer' : 'default') : (inputText.trim().length > 0 ? 'pointer' : 'default'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title={isVoiceMode ? (isConnected ? 'Stop voice call' : 'Start voice call') : 'Send message'}
              >
                {isVoiceMode
                  ? <i className={`fa-solid ${isConnected ? 'fa-stop' : 'fa-microphone'}`} />
                  : <i className="fa-solid fa-paper-plane" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistantOverlay;
