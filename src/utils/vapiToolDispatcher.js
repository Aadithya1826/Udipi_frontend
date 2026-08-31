/**
 * vapiToolDispatcher.js
 *
 * Central dispatcher: receives a Vapi tool-call and routes it to the
 * existing Data Udipi frontend actions.
 *
 * RULES:
 * - No new business logic here — reuse existing cart/navigation/context functions.
 * - No DB access — all state is managed by existing React contexts.
 * - The backend is NOT called from here.
 *
 * Tool names must match exactly what is configured in the Vapi Dashboard assistant.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Dispatch a Vapi tool call to the appropriate Data Udipi action.
 *
 * @param {Object} toolCall - The Vapi tool call object
 *   { name: string, parameters: Object }
 * @param {Object} deps - All required Data Udipi functions/state, passed in from the hook
 * @returns {Promise<{ result: string }>} - Result string sent back to Vapi as tool response
 */
export async function dispatchVapiTool(toolCall, deps) {
  const rawToolName = toolCall?.name || toolCall?.function?.name || '';
  const toolName = rawToolName.toLowerCase();
  // Vapi may put parameters in `parameters` or `function.arguments`
  let args = toolCall?.parameters || toolCall?.function?.arguments || {};
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch (e) {
      console.warn('[VapiTool] Failed to parse tool arguments string:', args);
      args = {};
    }
  }

  console.log('[VapiTool] Dispatching:', toolName, args);

  const {
    // Cart
    cart,
    addToCart,
    removeCartItem,
    updateItemQuantity,
    setIsCartOpen,
    // VoiceAgentContext
    agentState,
    setCustomerInfo,
    setFlowStage,
    setOrderType,
    setTableNumber,
    setCartTableNumber,
    setOrderStatus,
    startOrderTracking,
    setIsAgentOpen,
    // Navigation
    navigate,
    // UI
    setActiveCategory,
  } = deps;

  try {
    switch (toolName) {

      // ── Customer details ─────────────────────────────────────────────────
      case 'set_customer':
      case 'setcustomer': {
        const name  = args.name  || args.customer_name  || null;
        const phone = args.phone || args.customer_phone || null;
        setCustomerInfo({ name, phone });
        if (name)  document.dispatchEvent(new CustomEvent('update-name',  { detail: { name } }));
        if (phone) document.dispatchEvent(new CustomEvent('update-phone', { detail: { phone } }));
        return { result: `Customer updated: ${name || ''}${phone ? ` / ${phone}` : ''}` };
      }

      // ── Flow stage ───────────────────────────────────────────────────────
      case 'set_flow_stage':
      case 'setflowstage': {
        const stage = args.stage || args.flow_stage || '';
        if (stage) setFlowStage(stage);
        return { result: `Flow stage set to ${stage}` };
      }

      // ── Order type ───────────────────────────────────────────────────────
      case 'set_order_type':
      case 'setordertype': {
        const type = String(args.type || args.order_type || args.orderType || '').toLowerCase();
        setOrderType(type.includes('take') ? 'takeaway' : 'dine-in');
        
        // Auto-navigate to the correct menu based on order type
        if (type.includes('dine')) {
          if (window.location.pathname !== '/dine-in') navigate('/dine-in');
        } else if (type.includes('take')) {
          if (window.location.pathname !== '/take-away') navigate('/take-away');
        }
        
        return { result: `Order type set to ${type} and navigated to menu.` };
      }

      // ── Region filter ────────────────────────────────────────────────────
      case 'set_region':
      case 'setregion': {
        const region = (args.region || '').toLowerCase();
        if (region.includes('north')) {
          document.dispatchEvent(new CustomEvent('change-region', { detail: { region: 'north' } }));
        } else if (region.includes('south')) {
          document.dispatchEvent(new CustomEvent('change-region', { detail: { region: 'south' } }));
        } else {
          document.dispatchEvent(new CustomEvent('change-region', { detail: { region: 'all' } }));
        }
        return { result: `Region set to ${region || 'all'}` };
      }

      // ── Table number ─────────────────────────────────────────────────────
      case 'set_table_number':
      case 'settablenumber': {
        const num = String(args.table || args.table_number || '').replace(/\D/g, '') || String(args.table || args.table_number || '');
        if (num) {
          try {
            const rId = localStorage.getItem('selected_restaurant_id') || '1';
            const response = await fetch(`${API_BASE}/api/v1/public/tables/${num}?restaurant_id=${rId}`);
            if (!response.ok) {
              return { result: `Table ${num} does not exist. Please ask the user to check their table number.` };
            }
            // Valid table
            setTableNumber(num);
            if (setCartTableNumber) setCartTableNumber(num);
            return { result: `Table number validated and set to ${num}.` };
          } catch (err) {
            console.error('[VapiTool] Table validation error:', err);
            setTableNumber(num);
            if (setCartTableNumber) setCartTableNumber(num);
            return { result: `Table number set to ${num}.` };
          }
        }
        return { result: 'No table number provided.' };
      }

      // ── Navigation ───────────────────────────────────────────────────────
      case 'navigate': {
        const page = String(args.page || args.destination || args.target || '').toLowerCase();
        if (page.includes('dine') || page.includes('menu')) {
          const target = agentState.orderType === 'takeaway' ? '/take-away' : '/dine-in';
          navigate(target);
        } else if (page.includes('take')) {
          navigate('/take-away');
        } else if (page === 'checkout' || page === 'cart') {
          navigate(agentState.orderType === 'takeaway' ? '/takeaway-checkout' : '/checkout');
        } else if (page === 'payment') {
          navigate(agentState.orderType === 'takeaway' ? '/takeaway-payment' : '/payment');
        } else if (page === 'home') {
          navigate('/');
        } else if (page === 'order-success' || page === 'ordersuccess') {
          navigate(agentState.orderType === 'takeaway' ? '/takeaway-order-success' : '/order-success');
        } else if (args.page) {
          // Try to match a menu category by name
          const categoryName = args.page.trim();
          const lowerName = categoryName.toLowerCase();
          const rId = localStorage.getItem('selected_restaurant_id') || '1';
          try {
            const res = await fetch(`${API_BASE}/api/v1/public/menu/categories?restaurant_id=${rId}`);
            const categories = await res.json();
            const matched = categories.find((c) => c.name?.toLowerCase().includes(lowerName))
                          || categories.find((c) => lowerName.includes(c.name?.toLowerCase()));
            if (matched && setActiveCategory) {
              const targetRoute = agentState.orderType === 'takeaway' ? '/take-away' : '/dine-in';
              if (window.location.pathname !== targetRoute) navigate(targetRoute);
              setTimeout(() => {
                setActiveCategory(String(matched.id));
                document.dispatchEvent(new CustomEvent('change-category', { detail: { categoryId: String(matched.id) } }));
              }, 100);
            }
          } catch (err) {
            console.warn('[VapiTool] navigate category lookup failed:', err);
          }
        }
        return { result: `Navigated to ${args.page}` };
      }

      // ── Add to cart ──────────────────────────────────────────────────────
      case 'add_to_cart':
      case 'addtocart': {
        const itemName = args.item || args.item_name || '';
        const qty = Number(args.quantity) || 1;
        if (!itemName) return { result: 'No item name provided.' };

        // Fetch REAL menu items — never trust invented names/prices from Vapi
        const rId = localStorage.getItem('selected_restaurant_id') || '1';
        const res = await fetch(`${API_BASE}/api/v1/public/menu/items?restaurant_id=${rId}`);
        const menuItems = await res.json();

        const match = (Array.isArray(menuItems) ? menuItems : []).find(
          (m) => m.name?.toLowerCase() === itemName.toLowerCase()
        ) || (Array.isArray(menuItems) ? menuItems : []).find(
          (m) => m.name?.toLowerCase().includes(itemName.toLowerCase())
        );

        if (!match) {
          return { result: `Item "${itemName}" not found on menu. Could not add to cart.` };
        }
        if (match.is_available === false) {
          return { result: `"${match.name}" is currently unavailable.` };
        }

        let img = null;
        if (match.image_url) {
          img = match.image_url.startsWith('http') ? match.image_url : `${API_BASE}${match.image_url}`;
        }

        addToCart({ id: match.id, name: match.name, price: Number(match.price), image: img }, qty);

        // Briefly show cart then return to agent
        if (setIsCartOpen && setIsAgentOpen) {
          setIsAgentOpen(false);
          setIsCartOpen(true);
          setTimeout(() => {
            setIsCartOpen(false);
            setIsAgentOpen(true);
          }, 3000);
        }

        return { result: `Added ${qty}x ${match.name} (₹${match.price} each) to cart.` };
      }

      // ── Remove from cart ─────────────────────────────────────────────────
      case 'remove_from_cart':
      case 'removefromcart': {
        const itemName = args.item || args.item_name || '';
        const found = cart.find((c) => c.name?.toLowerCase() === itemName.toLowerCase())
                    || cart.find((c) => c.name?.toLowerCase().includes(itemName.toLowerCase()));
        if (found) {
          removeCartItem(found.id);
          return { result: `Removed ${found.name} from cart.` };
        }
        return { result: `"${itemName}" not found in cart.` };
      }

      // ── Update cart quantity ─────────────────────────────────────────────
      case 'update_cart_quantity':
      case 'updatecartquantity': {
        const itemName = args.item || args.item_name || '';
        const qty = Number(args.quantity);
        if (!itemName || isNaN(qty) || qty < 0) {
          return { result: 'Invalid item or quantity for update.' };
        }
        const found = cart.find((c) => c.name?.toLowerCase() === itemName.toLowerCase())
                    || cart.find((c) => c.name?.toLowerCase().includes(itemName.toLowerCase()));
        if (found) {
          updateItemQuantity(found.id, qty);
          return { result: qty === 0 ? `Removed ${found.name}.` : `Updated ${found.name} quantity to ${qty}.` };
        }
        return { result: `"${itemName}" not found in cart.` };
      }

      // ── View cart ────────────────────────────────────────────────────────
      case 'view_cart':
      case 'viewcart': {
        const route = agentState.orderType === 'takeaway' ? '/take-away' : '/dine-in';
        if (window.location.pathname !== route && window.location.pathname !== '/') {
          navigate(route);
          setTimeout(() => { if (setIsCartOpen) setIsCartOpen(true); }, 100);
        } else if (window.location.pathname === '/') {
          navigate(route);
          setTimeout(() => { if (setIsCartOpen) setIsCartOpen(true); }, 100);
        } else {
          if (setIsCartOpen) setIsCartOpen(true);
        }
        return { result: 'Cart opened.' };
      }

      // ── Trigger checkout ─────────────────────────────────────────────────
      case 'trigger_checkout':
      case 'triggercheckout': {
        if (!cart || cart.length === 0) {
          return { result: 'Cart is empty. Please add items first.' };
        }
        setFlowStage('CHECKOUT_REVIEW');
        const route = agentState.orderType === 'takeaway' ? '/takeaway-checkout' : '/checkout';
        navigate(route);
        return { result: 'Navigated to checkout.' };
      }

      // ── Auto navigate to payment ─────────────────────────────────────────
      case 'auto_navigate_to_payment':
      case 'autonavigatetopayment': {
        const delay = Number(args.delay_ms) || 2500;
        setFlowStage('PAYMENT_SELECT');
        setTimeout(() => {
          const route = agentState.orderType === 'takeaway' ? '/takeaway-payment' : '/payment';
          navigate(route);
        }, delay);
        return { result: 'Navigating to payment.' };
      }

      // ── Payment method ───────────────────────────────────────────────────
      case 'payment_method':
      case 'paymentmethod': {
        const rawMethod = (args.method || 'Cash').toLowerCase();
        const method = rawMethod.includes('upi') || rawMethod.includes('online') ? 'UPI' : 'Cash';
        document.dispatchEvent(new CustomEvent('select-payment', { detail: { method } }));
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('confirm-place-order', { detail: { method } }));
          const confirmBtn = document.getElementById('payment-confirm-btn');
          if (confirmBtn) confirmBtn.click();
        }, 300);
        return { result: `Payment method set to ${method}.` };
      }

      // ── Start order tracking ─────────────────────────────────────────────
      case 'start_order_tracking':
      case 'startordertracking': {
        const oid = agentState.orderId || localStorage.getItem('active_order_id');
        if (oid) {
          startOrderTracking(oid, (status) => setOrderStatus(status));
          return { result: `Tracking started for order ${oid}.` };
        }
        return { result: 'No active order ID found to track.' };
      }

      // ── Get order status ─────────────────────────────────────────────────
      case 'get_order_status':
      case 'getorderstatus': {
        const oid = args.order_id || agentState.orderId || localStorage.getItem('active_order_id');
        if (!oid) return { result: 'No active order to check.' };
        try {
          const cleanId = String(oid).replace(/\D/g, '');
          const res = await fetch(`${API_BASE}/api/orders/${cleanId}`);
          if (!res.ok) return { result: 'Could not retrieve order status.' };
          const data = await res.json();
          const status = data.status || data.order_status || 'unknown';
          setOrderStatus(status);
          return { result: `Order ${cleanId} status: ${status}` };
        } catch {
          return { result: 'Failed to fetch order status.' };
        }
      }

      // ── Request feedback ─────────────────────────────────────────────────
      case 'request_feedback':
      case 'requestfeedback': {
        setFlowStage('FEEDBACK');
        return { result: 'Feedback stage set.' };
      }

      // ── Scroll page ──────────────────────────────────────────────────────
      case 'scroll_page':
      case 'scrollpage':
      case 'scroll': {
        const direction = (args.direction || 'down').toLowerCase();
        const amount = (args.amount || 'medium').toLowerCase();
        
        let scrollY = 400; // medium
        if (amount === 'small') scrollY = 200;
        if (amount === 'large') scrollY = 800;
        
        if (direction === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (direction === 'bottom') {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        } else if (direction === 'up') {
          window.scrollBy({ top: -scrollY, behavior: 'smooth' });
        } else {
          // default down
          window.scrollBy({ top: scrollY, behavior: 'smooth' });
        }
        
        return { result: `Scrolled page ${direction}.` };
      }

      default:
        console.warn('[VapiTool] Unknown tool:', toolName, args);
        return { result: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    console.error('[VapiTool] Error dispatching tool:', toolName, err);
    return { result: `Error executing ${toolName}: ${err?.message}` };
  }
}
