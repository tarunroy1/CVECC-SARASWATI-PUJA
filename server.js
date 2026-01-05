const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   REQUEST LOGGING
========================= */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

/* =========================
   IMPORT ROUTES
========================= */
console.log('📦 Loading routes...');

const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const excelItemRoutes = require('./routes/excelitemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const memberRoutes = require('./routes/memberRoutes');
/* =========================
   USE ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/excel', excelItemRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/members', memberRoutes);

console.log('✅ Routes loaded successfully');

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

/* =========================
   STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   FRONTEND ROUTES
========================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admindashboard.html'));
});

/* =========================
   API 404 HANDLER
========================= */
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

/* =========================
   FRONTEND FALLBACK
========================= */
app.use((req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'admindashboard.html'));
  } else {
    res.status(404).send('Not found');
  }
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/* =========================
   DATABASE CONNECTION
========================= */
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saraswati_puja';

console.log('🔗 Connecting to MongoDB...');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });

  
/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login page: http://localhost:${PORT}/`);
  console.log(`📋 Dashboard: http://localhost:${PORT}/dashboard`);
   console.log(`📝 Signup: POST http://localhost:${PORT}/api/auth/signup`);
});
