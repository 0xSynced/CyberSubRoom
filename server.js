const express = require('express');
const path = require('path');
const sequelize = require('./db/sequelize');
const Feedback = require('./models/Feedback');
const Plan = require('./models/Plan');
const session = require('express-session');
const app = express();

const PORT = 3001;

// Sync DB and create default plans if needed
async function initializeDatabase() {
  try {
    // Force sync to recreate tables
    await sequelize.sync({ alter: true });
    console.log("DB synced.");
    
    // Check if plans exist, if not create defaults
    const planCount = await Plan.count();
    if (planCount === 0) {
      console.log('Creating default plans...');
      const defaultPlans = [
        { name: 'Free', price: 0, description: 'Basic protection for individuals', type: 'free' },
        { name: 'Standard', price: 9.99, description: 'Enhanced protection for small businesses', type: 'standard' },
        { name: 'Premium', price: 19.99, description: 'Complete protection for enterprises', type: 'premium' }
      ];
      await Plan.bulkCreate(defaultPlans);
      console.log('Default plans created.');
    } else {
      console.log(`Found ${planCount} existing plans.`);
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

// Initialize database
initializeDatabase();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

// Routes
const routes = require('./routes/api');
app.use('/', routes);

// Start
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
