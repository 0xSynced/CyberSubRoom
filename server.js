const express = require('express');
const path = require('path');
const sequelize = require('./db/sequelize');
const Feedback = require('./models/Feedback');
const Plan = require('./models/Plan');
const app = express();

const PORT = 3001;

// Sync DB
sequelize.sync({ alter: true })
  .then(() => console.log("DB synced."))
  .catch(err => console.error("Sync failed:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const routes = require('./routes/api');
app.use('/', routes);

// Start
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
