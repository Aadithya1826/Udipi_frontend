const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: 'banking-db.cnkegcm24ikf.ap-south-2.rds.amazonaws.com',
  user: 'food_admin',
  password: 'foodadmin@123',
  database: 'food_ordering_db',
  ssl: {
    rejectUnauthorized: false
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend Server is running! Frontend: http://localhost:5173 | API: /api/categories, /api/items, /api/orders');
});

// ── MENU ──────────────────────────────────────────────

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all menu items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items WHERE is_available = true ORDER BY category_id ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get items by category
app.get('/api/items/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE category_id = $1 AND is_available = true ORDER BY id ASC',
      [categoryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items by category:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── RESTAURANT SETTINGS ───────────────────────────────

// Get restaurant info (tax rates etc.)
app.get('/api/restaurant', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching restaurant info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── ORDERS ────────────────────────────────────────────

// Place a new order (creates order + order_items + payment record)
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      table_number = '06',
      payment_method = 'UPI',
      phone = '',
      cart = [],
      subtotal = 0,
      gst = 0,
      service_charge = 0,
      total_amount = 0
    } = req.body;

    await client.query('BEGIN');

    // Find or default table_id
    let tableId = null;
    const tableResult = await client.query(
      "SELECT id FROM tables WHERE table_number = $1 LIMIT 1",
      [String(table_number)]
    );
    if (tableResult.rows.length > 0) {
      tableId = tableResult.rows[0].id;
    }

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (restaurant_id, table_id, total_amount, status, payment_status, payment_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [1, tableId, total_amount, 'confirmed', 'paid', payment_method]
    );
    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // Insert payment record
    await client.query(
      `INSERT INTO payments (order_id, amount, payment_method, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [orderId, total_amount, payment_method, 'completed']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      orderId: `ORD-${String(orderId).padStart(6, '0')}`,
      dbOrderId: orderId,
      message: 'Order placed successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order', details: err.message });
  } finally {
    client.release();
  }
});

// ── RAZORPAY ──────────────────────────────────────────

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };
    
    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).send('Some error occurred');
    
    res.json({ success: true, order });
  } catch (err) {
    console.error('Error creating razorpay order:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');
      
    if (razorpay_signature === expectedSign) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const itemsResult = await pool.query(
      `SELECT oi.*, mi.name, mi.description, mi.image_url
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [id]
    );
    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
