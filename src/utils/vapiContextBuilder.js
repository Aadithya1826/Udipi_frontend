/**
 * vapiContextBuilder.js
 *
 * Builds the `assistantOverrides.variableValues` object that is sent to Vapi
 * when a call starts (and when major state changes happen during a call).
 *
 * Uses the REAL current application state — no invented values.
 *
 * BACKEND UNTOUCHED: this file only reads from existing frontend stores
 * and the public menu API already used by the rest of the application.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function buildMenuText(restaurantId) {
  try {
    const rId = restaurantId || localStorage.getItem('selected_restaurant_id') || '1';
    
    // Fetch categories
    const catRes = await fetch(`${API_BASE}/api/v1/public/menu/categories?restaurant_id=${rId}`);
    const categories = catRes.ok ? await catRes.json() : [];
    
    // Fetch items
    const itemRes = await fetch(`${API_BASE}/api/v1/public/menu/items?restaurant_id=${rId}`);
    const items = itemRes.ok ? await itemRes.json() : [];

    if (!Array.isArray(categories) || !Array.isArray(items)) return '';

    // Build grouped text
    let menuText = '';
    categories.forEach(cat => {
      const catItems = items.filter(item => String(item.category_id) === String(cat.id) && item.is_available !== false);
      if (catItems.length > 0) {
        menuText += `Category: ${cat.name}\n`;
        catItems.forEach(item => {
          menuText += `* ${item.name} — ₹${item.price}\n`;
        });
        menuText += '\n';
      }
    });

    // Handle items with no category or unmapped category
    const unmappedItems = items.filter(item => item.is_available !== false && !categories.find(c => String(c.id) === String(item.category_id)));
    if (unmappedItems.length > 0) {
      menuText += `Category: Other\n`;
      unmappedItems.forEach(item => {
        menuText += `* ${item.name} — ₹${item.price}\n`;
      });
    }

    return menuText.trim();
  } catch (err) {
    console.error('[VapiContextBuilder] Error fetching menu:', err);
    return '';
  }
}

/**
 * Build the full Vapi assistant variable values from current app state.
 *
 * @param {Object} agentState  - From VoiceAgentContext
 * @param {Array}  cart        - From CartContext
 * @param {number} cartTotal   - From CartContext (totalAmount)
 * @param {string} currentPage - window.location.pathname
 * @returns {Promise<Object>}  - variableValues for Vapi assistantOverrides
 */
export async function buildVapiContext(agentState, cart, cartTotal, currentPage) {
  const restaurantId = localStorage.getItem('selected_restaurant_id') || '1';

  // Build cart string: "2x Idly, 1x Dosa"
  const cartStr = cart && cart.length > 0
    ? cart.map((item) => `${item.quantity}x ${item.name}`).join(', ')
    : 'empty';

  // Active order from localStorage (set by existing order success pages)
  const activeOrderId = agentState.orderId || localStorage.getItem('active_order_id') || '';

  // Menu text — fetched fresh so Vapi knows real availability
  const menuText = await buildMenuText(restaurantId);

  return {
    flow_stage:      agentState.flowStage       || 'GREETING',
    customer_name:   agentState.customerName    || '',
    customer_phone:  agentState.mobileNumber    || '',
    order_type:      agentState.orderType       || '',
    table_number:    agentState.tableNumber     || '',
    cart_str:        cartStr,
    cart_total:      String(cartTotal || 0),
    active_order_id: activeOrderId,
    payment_status:  agentState.paymentStatus   || 'pending',
    order_status:    agentState.orderStatus     || '',
    current_page:    currentPage                || '/',
    menu_text:       menuText,
  };
}

/**
 * Build a lightweight context update for sending mid-call when state changes.
 * Only includes fields that commonly change during a call.
 *
 * @param {Object} agentState
 * @param {Array}  cart
 * @param {number} cartTotal
 * @param {string} currentPage
 * @returns {Object} - partial variableValues
 */
export function buildVapiContextUpdate(agentState, cart, cartTotal, currentPage) {
  const cartStr = cart && cart.length > 0
    ? cart.map((item) => `${item.quantity}x ${item.name}`).join(', ')
    : 'empty';

  const activeOrderId = agentState.orderId || localStorage.getItem('active_order_id') || '';

  return {
    flow_stage:      agentState.flowStage       || 'GREETING',
    customer_name:   agentState.customerName    || '',
    customer_phone:  agentState.mobileNumber    || '',
    order_type:      agentState.orderType       || '',
    table_number:    agentState.tableNumber     || '',
    cart_str:        cartStr,
    cart_total:      String(cartTotal || 0),
    active_order_id: activeOrderId,
    payment_status:  agentState.paymentStatus   || 'pending',
    order_status:    agentState.orderStatus     || '',
    current_page:    currentPage                || '/',
  };
}
