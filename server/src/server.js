const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { seedDefaultAdmin } = require('./controllers/authController');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Apex ERP Backend API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 520px; border: 1px solid #334155; }
          .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; margin-bottom: 1.25rem; }
          .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
          h1 { color: #f8fafc; margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700; }
          p { color: #94a3b8; line-height: 1.6; margin: 0 0 1.5rem 0; font-size: 0.95rem; }
          .endpoints { text-align: left; background: #0b1329; border: 1px solid #1e293b; padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: #cbd5e1; }
          .endpoints ul { margin: 0.5rem 0 0 0; padding-left: 1.25rem; }
          .endpoints li { margin-bottom: 0.35rem; }
          .endpoints code { background: #1e293b; color: #38bdf8; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.85rem; }
          .actions { display: flex; flex-direction: column; gap: 0.75rem; }
          .btn-primary { display: block; background: #2563eb; color: #ffffff; padding: 0.85rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: background 0.2s; }
          .btn-primary:hover { background: #1d4ed8; }
          .btn-secondary { display: block; background: #334155; color: #f8fafc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.9rem; transition: background 0.2s; }
          .btn-secondary:hover { background: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="pulse-dot"></span> Backend API Running</div>
          <h1>Apex ERP API Server</h1>
          <p>The Express backend is actively running on port 5000. If you are looking for the user interface, access the frontend client below.</p>
          <div class="endpoints">
            <strong>Key API Endpoints:</strong>
            <ul>
              <li>Health: <a href="/api/health" style="color: #38bdf8;"><code>/api/health</code></a></li>
              <li>Customers: <code>/api/customers</code></li>
              <li>Purchases: <code>/api/purchases</code></li>
              <li>Payments: <code>/api/payments</code></li>
              <li>Dashboard KPIs: <code>/api/dashboard/kpis</code></li>
            </ul>
          </div>
          <div class="actions">
            <a href="http://localhost:5173" class="btn-primary">Open Frontend Web App (Port 5173) &rarr;</a>
            <a href="/api/health" class="btn-secondary">Check Health Status (/api/health)</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'Apex ERP Customer & Payment Management API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await seedDefaultAdmin();
});
