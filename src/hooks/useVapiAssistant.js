/**
 * useVapiAssistant.js
 *
 * React hook that wires the Vapi service singleton into Data Udipi React state.
 *
 * Responsibilities:
 * - Start / stop / toggle Vapi call
 * - Track call status, speaking, listening states
 * - Handle Vapi message events → route tool calls through vapiToolDispatcher
 * - Collect transcripts from Vapi events
 * - Sync live context changes to Vapi during active calls
 * - Clean up event listeners on unmount
 *
 * BACKEND UNTOUCHED: this hook only coordinates Vapi SDK ↔ existing frontend.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  isVapiConfigured,
  getVapiConfigError,
  startVapiCall,
  stopVapiCall,
  sendVapiMessage,
  subscribeVapiEvents,
} from '../services/vapiService';
import { buildVapiContext, buildVapiContextUpdate } from '../utils/vapiContextBuilder';
import { dispatchVapiTool } from '../utils/vapiToolDispatcher';
import { useVoiceAgent } from '../context/VoiceAgentContext';
import { useCart } from '../context/CartContext';

// ── Call status enum ──────────────────────────────────────────────────────────
// 'idle' | 'connecting' | 'active' | 'ending'
export const CALL_STATUS = {
  IDLE:       'idle',
  CONNECTING: 'connecting',
  ACTIVE:     'active',
  ENDING:     'ending',
};

// Throttle interval for mid-call context sync updates (ms)
const CONTEXT_SYNC_THROTTLE = 4000;

export function useVapiAssistant() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Data Udipi contexts
  const {
    agentState,
    setCustomerInfo,
    setFlowStage,
    setOrderType,
    setTableNumber,
    setOrderStatus,
    startOrderTracking,
    setMessages,
    setIsAgentOpen,
    isAgentOpen,
    detectLanguage,
    setDetectedLanguage,
  } = useVoiceAgent();

  const {
    cart,
    addToCart,
    removeCartItem,
    updateItemQuantity,
    setIsCartOpen,
    totalAmount,
    setActiveCategory,
    setTableNumber: setCartTableNumber,
  } = useCart();

  // ── Local hook state ──────────────────────────────────────────────────────
  const [callStatus, setCallStatus]   = useState(CALL_STATUS.IDLE);
  const [isSpeaking, setIsSpeaking]   = useState(false);   // assistant is speaking
  const [isListening, setIsListening] = useState(false);   // user turn
  const [transcript, setTranscript]   = useState([]);      // [{role, text}]
  const [error, setError]             = useState(null);

  // Guard: prevents overlapping calls
  const isStartingRef     = useRef(false);
  // Track cleanup function returned by subscribeVapiEvents
  const cleanupListeners  = useRef(null);
  // Track last context sync time for throttling
  const lastSyncRef       = useRef(0);
  // Track previous cart/state for change detection
  const prevCartRef       = useRef(null);
  const prevOrderTypeRef  = useRef(null);
  const prevPageRef       = useRef(null);
  const prevOrderStatusRef = useRef(null);

  // ── Build deps object for the tool dispatcher ─────────────────────────────
  const buildDeps = useCallback(() => ({
    cart,
    addToCart,
    removeCartItem,
    updateItemQuantity,
    setIsCartOpen,
    agentState,
    setCustomerInfo,
    setFlowStage,
    setOrderType,
    setTableNumber,
    setCartTableNumber,
    setOrderStatus,
    startOrderTracking,
    setIsAgentOpen,
    navigate,
    setActiveCategory,
  }), [
    cart, addToCart, removeCartItem, updateItemQuantity, setIsCartOpen,
    agentState, setCustomerInfo, setFlowStage, setOrderType, setTableNumber,
    setCartTableNumber, setOrderStatus, startOrderTracking, setIsAgentOpen,
    navigate, setActiveCategory,
  ]);

  // ── Vapi event handlers ───────────────────────────────────────────────────

  const handleCallStart = useCallback(() => {
    console.log('[useVapiAssistant] call-start');
    setCallStatus(CALL_STATUS.ACTIVE);
    setIsListening(true);
    setError(null);
  }, []);

  const handleCallEnd = useCallback(() => {
    console.log('[useVapiAssistant] call-end');
    setCallStatus(CALL_STATUS.IDLE);
    setIsSpeaking(false);
    setIsListening(false);
    isStartingRef.current = false;
  }, []);

  const handleSpeechStart = useCallback(() => {
    // assistant starts speaking
    setIsSpeaking(true);
    setIsListening(false);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    // assistant stopped speaking → back to listening
    setIsSpeaking(false);
    setIsListening(true);
  }, []);

  const handleError = useCallback((err) => {
    console.error('[useVapiAssistant] error:', err);
    setError(err?.message || 'Voice assistant error. Please try again.');
    setCallStatus(CALL_STATUS.IDLE);
    isStartingRef.current = false;
  }, []);

  const handleMessage = useCallback((message) => {
    console.log('[Vapi Message Received]:', message.type, message);
    
    // ── Transcript messages ────────────────────────────────────────────────
    if (message?.type === 'transcript') {
      const role = message.role === 'user' ? 'user' : 'model';
      const text = message.transcript || '';
      if (!text) return;

      if (message.transcriptType === 'final') {
        // Add finalised transcript to conversation display
        setTranscript((prev) => [...prev, { role, content: text }]);
        setMessages((prev) => [...prev, { role, content: text }]);

        // Language detection for user messages
        if (role === 'user') {
          const lang = detectLanguage(text);
          if (lang !== agentState.detectedLanguage) setDetectedLanguage(lang);
        }
      }
      return;
    }

    // ── Tool call messages ─────────────────────────────────────────────────
    if (
      message?.type === 'tool-calls' ||
      message?.type === 'function-call' ||
      (message?.type === 'conversation-update' && message?.conversation?.some?.(m => m.tool_calls?.length > 0))
    ) {
      const toolCalls =
        message?.toolCallList ||
        message?.toolCalls ||
        message?.function_calls ||
        [];

      if (toolCalls.length > 0) {
        const deps = buildDeps();
        // Execute sequentially to prevent race conditions
        (async () => {
          for (const tc of toolCalls) {
            const result = await dispatchVapiTool(tc, deps);
            
            // 🔥 DEBUG VISUAL: Add the tool result to the chat so the user can see it!
            setMessages((prev) => [
              ...prev,
              {
                role: 'system',
                content: `🔧 [System Tool Fired]: ${tc.name || tc.function?.name} => ${result.result}`,
              },
            ]);

            // Send tool result back to Vapi so the assistant can continue
            try {
              sendVapiMessage({
                type: 'add-message',
                message: {
                  role: 'tool',
                  tool_call_id: tc.id || tc.toolCallId || '',
                  name: tc.name || tc.function?.name || '',
                  content: JSON.stringify(result),
                },
              });
            } catch (e) {
              console.warn('[useVapiAssistant] Could not send tool result:', e);
            }
          }
        })();
      }
      return;
    }

    // ── Assistant speech text (for transcript display) ─────────────────────
    if (message?.type === 'speech-update' && message?.role === 'assistant' && message?.status === 'started') {
      // Handled via speech-start/speech-end events
      return;
    }
  }, [buildDeps, setMessages, detectLanguage, agentState.detectedLanguage, setDetectedLanguage]);

  // ── Register / re-register Vapi event listeners ───────────────────────────
  useEffect(() => {
    // Clean up previous listeners before registering new ones
    if (cleanupListeners.current) {
      cleanupListeners.current();
      cleanupListeners.current = null;
    }

    cleanupListeners.current = subscribeVapiEvents({
      onCallStart:  handleCallStart,
      onCallEnd:    handleCallEnd,
      onSpeechStart: handleSpeechStart,
      onSpeechEnd:  handleSpeechEnd,
      onMessage:    handleMessage,
      onError:      handleError,
    });

    return () => {
      if (cleanupListeners.current) {
        cleanupListeners.current();
        cleanupListeners.current = null;
      }
    };
  }, [handleCallStart, handleCallEnd, handleSpeechStart, handleSpeechEnd, handleMessage, handleError]);

  // ── Mid-call context sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== CALL_STATUS.ACTIVE) return;

    const now = Date.now();
    const cartChanged = JSON.stringify(cart) !== JSON.stringify(prevCartRef.current);
    const orderTypeChanged = agentState.orderType !== prevOrderTypeRef.current;
    const pageChanged = location.pathname !== prevPageRef.current;
    const orderStatusChanged = agentState.orderStatus !== prevOrderStatusRef.current;

    const hasSignificantChange = cartChanged || orderTypeChanged || pageChanged || orderStatusChanged;
    const enoughTimeElapsed = now - lastSyncRef.current > CONTEXT_SYNC_THROTTLE;

    if (hasSignificantChange && enoughTimeElapsed) {
      lastSyncRef.current = now;
      prevCartRef.current = [...cart];
      prevOrderTypeRef.current = agentState.orderType;
      prevPageRef.current = location.pathname;
      prevOrderStatusRef.current = agentState.orderStatus;

      const contextUpdate = buildVapiContextUpdate(agentState, cart, totalAmount, location.pathname);

      try {
        sendVapiMessage({
          type: 'add-message',
          message: {
            role: 'system',
            content: `[CONTEXT UPDATE] ${JSON.stringify(contextUpdate)}`,
          },
        });
      } catch (e) {
        // Swallow — mid-call sync is best-effort
      }
    }
  }, [callStatus, cart, agentState, location.pathname, totalAmount]);

  // ── Cleanup on unmount (end any lingering call) ───────────────────────────
  useEffect(() => {
    return () => {
      if (callStatus === CALL_STATUS.ACTIVE || callStatus === CALL_STATUS.CONNECTING) {
        stopVapiCall();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start the Vapi assistant.
   * Builds fresh context from current app state and starts the call.
   */
  const startAssistant = useCallback(async () => {
    if (isStartingRef.current) return;
    if (callStatus === CALL_STATUS.ACTIVE || callStatus === CALL_STATUS.CONNECTING) return;

    if (!isVapiConfigured()) {
      setError(getVapiConfigError());
      return;
    }

    isStartingRef.current = true;
    setCallStatus(CALL_STATUS.CONNECTING);
    setError(null);

    try {
      // Build fresh context from current application state
      const assistantOverrides = {
        variableValues,
      };

      const { success, error: startError } = await startVapiCall(assistantOverrides);

      if (!success) {
        setError(startError || 'Failed to start voice assistant.');
        setCallStatus(CALL_STATUS.IDLE);
        isStartingRef.current = false;
      }
      // Success → wait for 'call-start' event to set ACTIVE status
    } catch (err) {
      console.error('[useVapiAssistant] startAssistant error:', err);
      setError(err?.message || 'Failed to start voice assistant.');
      setCallStatus(CALL_STATUS.IDLE);
      isStartingRef.current = false;
    }
  }, [callStatus, agentState, cart, totalAmount, location.pathname]);

  /**
   * Stop the active Vapi call.
   * Does NOT reset cart, customer info, or any restaurant journey state.
   */
  const stopAssistant = useCallback(() => {
    if (callStatus === CALL_STATUS.IDLE) return;
    setCallStatus(CALL_STATUS.ENDING);
    stopVapiCall();
  }, [callStatus]);

  /**
   * Toggle the assistant on/off.
   */
  const toggleAssistant = useCallback(() => {
    if (callStatus === CALL_STATUS.ACTIVE || callStatus === CALL_STATUS.CONNECTING) {
      stopAssistant();
    } else {
      startAssistant();
    }
  }, [callStatus, startAssistant, stopAssistant]);

  return {
    // Status
    callStatus,
    isConnected:   callStatus === CALL_STATUS.ACTIVE,
    isConnecting:  callStatus === CALL_STATUS.CONNECTING,
    isSpeaking,
    isListening,
    // Data
    transcript,
    error,
    // Actions
    startAssistant,
    stopAssistant,
    toggleAssistant,
    isConfigured: isVapiConfigured(),
  };
}
