// ====================================================
// MaxShop Backend - server.js
// Express.js REST API + Static File Server
// ====================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const session    = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// IN-MEMORY DATABASE (ganti dengan real DB di produksi)
// ============================================================
const db = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    email:    process.env.ADMIN_EMAIL    || 'admin@maxshop.id',
    // password di-hash saat server start
    passwordHash: null,
  },

  products: [
    { id: 'p1', name: 'Netflix UHD 4K',    price: 35000, badge: 'Premium', sold: 1200, rating: 4.9, reviews: 850,  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5Qn4WTp5NgqYjMuQnrAWwN3hdQ7_Y5donUaZ5PjILzYmfFMfIJaO1UeBr1ZcDTYs1aSBsQErBOeDnb9YRltHJjbgYxpjWY5GsJmyfXISZ-oVE-oiFcAogHuGBblO4_bbG1xQP5DQ4Na1EuTFYO0d3aQEmKQViw_hvR8T1HB0HAcA11CogibwupBCWjc1bOl2G9cAFMbXf_t6j8IS3UgFx_lAgWT4rlFb-dTnQjr5yAvYcgeTb0JpVRvoWA4LvKefDv7K3dPhWgLU', stock: 50  },
    { id: 'p2', name: 'CapCut Pro Full',   price: 35000, badge: 'Creator', sold: 2400, rating: 4.8, reviews: 1100, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjGUGOt99bjGC4J7UdpwjbK3PDYjWGmGvCJfCL6enBMYARO35aI1gS1Eo5REVFUfiuMfXqwVdLVzWvXY_Awl93kxMxAn8etXK0aYXmff3xgTrzaG_mECX2K_I4uXqtHwaAgnkeSeSaDXduk8JIqVfbwHX2E6PFBgSDE8Q1hDrZLgCZo3vB-gJE_qFQJb9mTlFXOcnCP6WGEbZeCXCMUoOhgKtZHzI4e_FcyZE232I_y8xELfSdjGIrr8fR5x_CM7vl3bvkKCi-Gg', stock: 100 },
    { id: 'p3', name: 'Disney+ Hotstar',   price: 25000, badge: 'Family',  sold: 900,  rating: 4.7, reviews: 420,  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMfwbYdEToSVfLGG3JLNJz5l4EHSll6-BgebY-6BHzINLU7w9c298jtgphJEnfWrIPEepywi6kyF0rul0Cs1s1yo7zyeXk1aiCywfdl3hYziT_OWHwOq4FYvecQHzRfSV2AIp-I-ivqB7bPSg6Ue5BfAG_kh-qfhcatx-AJEJnL4rPhMAZXGfWNflKwVz2TgdPyuoN0reJNO0DavoBB1Xm_emfwGUlgLASWPA3Yr0BexmLvCDz4jxvxCDsDbR7mpRnOGMzP6IqhfA', stock: 30  },
    { id: 'p4', name: 'YouTube Individual', price: 15000, badge: 'Ad-Free', sold: 3500, rating: 5.0, reviews: 2000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYrSKJFo548Z6ZwqS6AWsnS88NYJnpjSq5rhmcWMWLuPudzvZV-13VdODYb9p5bBxX69m29o_OeaYi90MImU7KsrYMbfacyIpJxGOU8uE8dJfR7ukhRf2kUsKz3-W1zRfZdUctpFFD2j3oyuwU-KuvW5O5hv7j1Xr_SgSMsePuGPu8Yjricf13bUEshTgFjOD_wkFYPSN3yWXhfXwYAeOuNMdVuQT0uTAEA7RLv5eLC-E9U5p1gruZwkck9U808LvzE0WsqMoZS3k', stock: 200 },
  ],

  orders: [], // { id, productId, productName, buyerName, qty, total, payment, priority, notes, status, createdAt }
};

// Hash password admin saat startup
(async () => {
  const rawPassword = process.env.ADMIN_PASSWORD || 'maxshop2024';
  db.admin.passwordHash = await bcrypt.hash(rawPassword, 10);
  console.log('✅ Admin password hashed successfully');
})();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'maxshop_session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// Serve static HTML files dari folder parent
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
// JWT AUTH MIDDLEWARE
// ============================================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

  jwt.verify(token, process.env.JWT_SECRET || 'maxshop_secret', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
    req.user = user;
    next();
  });
};

// ============================================================
// ROUTES — AUTH
// ============================================================

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });

    // Cek cocok dengan admin
    const isUsernameMatch = username === db.admin.username || username === db.admin.email;
    if (!isUsernameMatch)
      return res.status(401).json({ success: false, message: 'Username atau password salah' });

    const isPasswordValid = await bcrypt.compare(password, db.admin.passwordHash);
    if (!isPasswordValid)
      return res.status(401).json({ success: false, message: 'Username atau password salah' });

    // Generate JWT
    const token = jwt.sign(
      { username: db.admin.username, role: 'admin' },
      process.env.JWT_SECRET || 'maxshop_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: { username: db.admin.username, email: db.admin.email, role: 'admin' }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

/**
 * POST /api/auth/verify
 * Header: Authorization: Bearer <token>
 */
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================================
// ROUTES — PRODUCTS (Public)
// ============================================================

/** GET /api/products — Daftar semua produk */
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: db.products });
});

/** GET /api/products/:id — Detail satu produk */
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
  res.json({ success: true, data: product });
});

/** POST /api/products — Tambah produk (Admin only) */
app.post('/api/products', verifyToken, (req, res) => {
  const { name, price, badge, stock, image } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: 'name dan price wajib diisi' });

  const newProduct = {
    id: 'p' + Date.now(),
    name, price: parseInt(price),
    badge: badge || 'New',
    sold: 0, rating: 5.0, reviews: 0,
    image: image || '',
    stock: parseInt(stock) || 0,
  };
  db.products.push(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});

/** PUT /api/products/:id — Update produk (Admin only) */
app.put('/api/products/:id', verifyToken, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

  db.products[idx] = { ...db.products[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: db.products[idx] });
});

/** DELETE /api/products/:id — Hapus produk (Admin only) */
app.delete('/api/products/:id', verifyToken, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

  db.products.splice(idx, 1);
  res.json({ success: true, message: 'Produk dihapus' });
});

// ============================================================
// ROUTES — ORDERS
// ============================================================

/**
 * POST /api/orders — Buat pesanan baru (Public)
 * Body: { productId, buyerName, qty, payment, priority, notes }
 */
app.post('/api/orders', (req, res) => {
  const { productId, buyerName, qty, payment, priority, notes } = req.body;

  if (!productId || !buyerName || !qty || !payment)
    return res.status(400).json({ success: false, message: 'productId, buyerName, qty, payment wajib diisi' });

  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

  const quantity = parseInt(qty);
  if (isNaN(quantity) || quantity < 1)
    return res.status(400).json({ success: false, message: 'Quantity tidak valid' });

  const total = product.price * quantity;
  const orderId = 'ORD-' + Date.now().toString().slice(-6);

  const order = {
    id: orderId,
    productId,
    productName: product.name,
    buyerName,
    qty: quantity,
    total,
    payment,
    priority: priority || 'Normal',
    notes: notes || '-',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.orders.push(order);

  // Tambah sold count
  product.sold += quantity;

  // Generate WA link untuk dikirim ke client
  const formatRp = (n) => 'Rp ' + n.toLocaleString('id-ID');
  const waMessage = encodeURIComponent(
`*🔔 PESANAN BARU - MAXSHOP 🔔*
━━━━━━━━━━━━━━━━━━━━
🆔 Order ID   : ${orderId}

*📝 Detail Pembeli:*
👤 Nama       : ${buyerName}
⚡ Prioritas  : ${priority || 'Normal'}
🗒️ Catatan    : ${notes || '-'}

*🛒 Detail Produk:*
📦 Produk     : ${product.name}
🔢 Jumlah     : ${quantity}x
💰 Total      : *${formatRp(total)}*

*💳 Metode Pembayaran:*
🏦 ${payment}
━━━━━━━━━━━━━━━━━━━━
_Halo min, saya ingin melanjutkan pesanan di atas. Mohon konfirmasinya ya! 🙏_`
  );

  const waUrl = `https://wa.me/${process.env.WA_NUMBER || '62895393870131'}?text=${waMessage}`;

  res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat',
    data: { order, waUrl }
  });
});

/** GET /api/orders — Daftar semua pesanan (Admin only) */
app.get('/api/orders', verifyToken, (req, res) => {
  const { status, limit = 50, page = 1 } = req.query;
  let orders = [...db.orders].reverse(); // newest first
  if (status) orders = orders.filter(o => o.status === status);
  const start = (page - 1) * limit;
  const paginated = orders.slice(start, start + parseInt(limit));
  res.json({ success: true, total: db.orders.length, data: paginated });
});

/** GET /api/orders/:id — Detail satu pesanan (Admin only) */
app.get('/api/orders/:id', verifyToken, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  res.json({ success: true, data: order });
});

/** PATCH /api/orders/:id/status — Update status pesanan (Admin only) */
app.patch('/api/orders/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: `Status harus salah satu dari: ${validStatuses.join(', ')}` });

  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

  order.status = status;
  order.updatedAt = new Date().toISOString();
  res.json({ success: true, data: order });
});

// ============================================================
// ROUTES — DASHBOARD STATS (Admin only)
// ============================================================
app.get('/api/stats', verifyToken, (req, res) => {
  const totalRevenue  = db.orders.filter(o => o.status === 'paid' || o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
  const totalOrders   = db.orders.length;
  const pendingOrders = db.orders.filter(o => o.status === 'pending').length;
  const paidOrders    = db.orders.filter(o => o.status === 'paid' || o.status === 'completed').length;

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      pendingOrders,
      paidOrders,
      totalProducts: db.products.length,
      recentOrders: [...db.orders].reverse().slice(0, 5),
    }
  });
});

// ============================================================
// ROUTES — WA REDIRECT (Public)
// ============================================================
app.get('/api/wa-support', (req, res) => {
  const msg = encodeURIComponent('Halo Admin MaxShop, saya butuh bantuan. 🙏');
  res.redirect(`https://wa.me/${process.env.WA_NUMBER || '62895393870131'}?text=${msg}`);
});

// ============================================================
// FALLBACK — Serve index.html untuk semua GET request
// ============================================================
app.get('*', (req, res) => {
  // Jika request untuk API, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🛍️  MaxShop Backend Server           ║');
  console.log(`║   🚀  Running on http://localhost:${PORT}  ║`);
  console.log('║   📦  API: /api/products               ║');
  console.log('║   🛒  API: /api/orders                 ║');
  console.log('║   🔐  API: /api/auth/login             ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`Admin login: ${db.admin.username} / ${process.env.ADMIN_PASSWORD || 'maxshop2024'}`);
});
