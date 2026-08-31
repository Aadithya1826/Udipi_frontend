/**
 * vapiService.js
 *
 * Singleton wrapper around the @vapi-ai/web SDK.
 *
 * Rules:
 * - The Vapi instance is created ONCE for the entire browser session.
 * - Public key comes from VITE_VAPI_PUBLIC_KEY (frontend-safe).
 * - Assistant ID comes from VITE_VAPI_ASSISTANT_ID (frontend-safe).
 * - The private key is NEVER exposed here — it is backend-only.
 * - If credentials are missing, calls return a descriptive error object.
 */

import Vapi from '@vapi-ai/web';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || '';

// ── Singleton instance ────────────────────────────────────────────────────────
let _vapiInstance = null;

/**
 * Returns (or lazily creates) the singleton Vapi instance.
 * Returns null if the public key is missing.
 */
function getVapiInstance() {
  if (!VAPI_PUBLIC_KEY) {
    console.warn('[VapiService] VITE_VAPI_PUBLIC_KEY is not set. Voice calls will be unavailable.');
    return null;
  }
  if (!_vapiInstance) {
    _vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
    console.log('[VapiService] Vapi instance created.');
  }
  return _vapiInstance;
}

// ── Configuration helpers ─────────────────────────────────────────────────────

/** Returns true when both required env vars are present. */
export function isVapiConfigured() {
  return Boolean(VAPI_PUBLIC_KEY && VAPI_ASSISTANT_ID);
}

/** Returns a human-readable explanation of what is missing. */
export function getVapiConfigError() {
  if (!VAPI_PUBLIC_KEY && !VAPI_ASSISTANT_ID) {
    return 'Voice assistant is not configured. VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID are missing.';
  }
  if (!VAPI_PUBLIC_KEY) return 'Voice assistant is not configured. VITE_VAPI_PUBLIC_KEY is missing.';
  if (!VAPI_ASSISTANT_ID) return 'Voice assistant is not configured. VITE_VAPI_ASSISTANT_ID is missing.';
  return null;
}

// ── Call management ───────────────────────────────────────────────────────────

/**
 * Start a Vapi call with the configured assistant.
 *
 * @param {Object} [assistantOverrides] - Optional overrides passed to the assistant,
 *   e.g. { variableValues: { customer_name: 'Sriraam', cart_str: '...' } }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function startVapiCall(assistantOverrides = {}) {
  if (!isVapiConfigured()) {
    return { success: false, error: getVapiConfigError() };
  }

  const vapi = getVapiInstance();
  if (!vapi) {
    return { success: false, error: 'Failed to initialize Vapi. Check VITE_VAPI_PUBLIC_KEY.' };
  }

  try {
    console.log('[VapiService] Starting call with assistant:', VAPI_ASSISTANT_ID);
    await vapi.start(VAPI_ASSISTANT_ID, assistantOverrides);
    return { success: true };
  } catch (err) {
    console.error('[VapiService] Failed to start call:', err);
    return { success: false, error: err?.message || 'Failed to start voice call.' };
  }
}

/**
 * Stop the active Vapi call.
 */
export function stopVapiCall() {
  const vapi = getVapiInstance();
  if (vapi) {
    try {
      vapi.stop();
      console.log('[VapiService] Call stopped.');
    } catch (err) {
      console.warn('[VapiService] Stop error (may already be idle):', err?.message);
    }
  }
}

/**
 * Mute or unmute the user's microphone during an active call.
 */
export function muteVapiCall(isMuted) {
  const vapi = getVapiInstance();
  if (vapi) {
    try {
      vapi.setMuted(isMuted);
      console.log('[VapiService] Call muted:', isMuted);
    } catch (err) {
      console.warn('[VapiService] Mute error:', err?.message);
    }
  }
}

/**
 * Send a client-side message to the Vapi assistant during an active call.
 * Use this to push context updates (e.g., cart changed) during a live call.
 *
 * @param {Object} message - A Vapi message object.
 */
export function sendVapiMessage(message) {
  const vapi = getVapiInstance();
  if (vapi) {
    try {
      vapi.send(message);
    } catch (err) {
      console.warn('[VapiService] sendMessage error:', err?.message);
    }
  }
}

// ── Event subscription ────────────────────────────────────────────────────────

/**
 * Subscribe to Vapi events. Returns a cleanup function that removes all listeners.
 *
 * @param {Object} handlers
 * @param {Function} [handlers.onCallStart]
 * @param {Function} [handlers.onCallEnd]
 * @param {Function} [handlers.onSpeechStart]
 * @param {Function} [handlers.onSpeechEnd]
 * @param {Function} [handlers.onMessage]
 * @param {Function} [handlers.onError]
 * @returns {Function} cleanup — call this to remove all registered listeners
 */
export function subscribeVapiEvents({
  onCallStart,
  onCallEnd,
  onSpeechStart,
  onSpeechEnd,
  onMessage,
  onError,
} = {}) {
  const vapi = getVapiInstance();
  if (!vapi) return () => {};

  // Wrap to avoid crashes if a handler is not provided
  const safe = (fn) => (...args) => { try { fn?.(...args); } catch (e) { console.error('[VapiService] Event handler error:', e); } };

  const handlers = {
    'call-start':  safe(onCallStart),
    'call-end':    safe(onCallEnd),
    'speech-start': safe(onSpeechStart),
    'speech-end':  safe(onSpeechEnd),
    'message':     safe(onMessage),
    'error':       safe(onError),
  };

  // Register only handlers that were provided
  Object.entries(handlers).forEach(([event, handler]) => {
    if (handler) vapi.on(event, handler);
  });

  // Return cleanup
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) {
        try { vapi.off(event, handler); } catch {}
      }
    });
    console.log('[VapiService] Event listeners cleaned up.');
  };
}
