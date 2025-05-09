const express = require('express');
const path = require('path');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../db/sequelize');

// Serve EJS templates
router.get('/', (req, res) => {
  res.render('homepage');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { name: username } });
    if (user && user.password === password) {
      // Store user data in session
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      req.session.userId = user.id;
      
      if (user.role === 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/user');
      }
    }
    
    // Check if the request is JSON
    if (req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For form submissions, render the login page with error
    return res.render('login', { error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    
    // Check if the request is JSON
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
    
    // For form submissions, render the login page with error
    return res.render('login', { error: 'Login failed. Please try again.' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plansData = await Plan.findAll();
    
    // Standardize plan data but keep original prices
    const plans = plansData.map(plan => {
      const planData = plan.toJSON();
      
      // Ensure plan type exists
      if (!planData.type) {
        const nameLower = (planData.name || '').toLowerCase();
        if (nameLower.includes('free')) {
          planData.type = 'free';
        } else if (nameLower.includes('standard')) {
          planData.type = 'standard';
        } else if (nameLower.includes('premium')) {
          planData.type = 'premium';
        } else {
          planData.type = nameLower;
        }
      }
      
      // Never override the original price
      return planData;
    });

    res.render('plans', { plans });
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.render('plans', { plans: [] });
  }
});

router.get('/feedback', (req, res) => {
  res.render('feedback');
});

router.get('/admin', async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.render('admin', { plans });
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.render('admin', { plans: [] });
  }
});

router.get('/admin-manage-user', async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('admin-manage-user', { users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.render('admin-manage-user', { users: [] });
  }
});

router.get('/user', async (req, res) => {
  try {
    // Get user from session
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/login');
    }

    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      return res.redirect('/login');
    }

    // Fetch available plans
    let availablePlans = [];
    try {
      availablePlans = await Plan.findAll({
        order: [['price', 'ASC']]
      });
    } catch (error) {
      console.error('Error fetching plans for user page:', error);
      // Try with specific fields if all fields fail
      availablePlans = await Plan.findAll({
        attributes: ['id', 'name', 'price', 'description'],
        order: [['price', 'ASC']]
      });
    }

    console.log('Plans for user page:', availablePlans.length);
    
    // Standardize plan data but keep original prices
    const standardizedPlans = availablePlans.map(plan => {
      const planData = plan.toJSON();
      
      // Ensure plan type exists
      if (!planData.type) {
        const nameLower = (planData.name || '').toLowerCase();
        if (nameLower.includes('free')) {
          planData.type = 'free';
        } else if (nameLower.includes('standard')) {
          planData.type = 'standard';
        } else if (nameLower.includes('premium')) {
          planData.type = 'premium';
        } else {
          planData.type = nameLower;
        }
      }
      
      // Never override the original price
      return planData;
    });

    // Find current plan or default to free
    const userPlanName = (user.plan || 'free').toLowerCase();
    let currentPlan = standardizedPlans.find(p => p.name.toLowerCase() === userPlanName);
    
    // If current plan not found, use free or first available
    if (!currentPlan) {
      currentPlan = standardizedPlans.find(p => p.name.toLowerCase() === 'free') || 
                    standardizedPlans[0] || 
                    { name: 'Free', price: 0, type: 'free', description: 'Basic plan' };
    }

    console.log('Current plan for user:', currentPlan.name);

    res.render('user', {
      user,
      availablePlans: standardizedPlans,
      currentPlan
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    // Clear session on error
    req.session.destroy();
    res.redirect('/login');
  }
});

router.get('/admin-feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.render('admin-feedback', { feedbacks });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.render('admin-feedback', { feedbacks: [] });
  }
});

// API: Submit Feedback
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await Feedback.create({ 
      name, 
      email, 
      subject,
      message
    });
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('Failed to save feedback:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET feedback (JSON)
router.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// API: Delete Feedback
router.delete('/api/feedback/:id', async (req, res) => {
  try {
    await Feedback.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Feedback deleted' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET plans (JSON)
router.get('/api/plans', async (req, res) => {
  try {
    console.log('Fetching plans from database...');
    
    // Check if the plans table exists
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    if (!tableNames.includes('plans')) {
      console.log('Plans table does not exist, sending fallback plans');
      return res.json([
        { id: 1, name: 'Free', price: 0, description: 'Basic protection for individuals', type: 'free' },
        { id: 2, name: 'Standard', price: 9.99, description: 'Enhanced protection for small businesses', type: 'standard' },
        { id: 3, name: 'Premium', price: 19.99, description: 'Complete protection for enterprises', type: 'premium' }
      ]);
    }
    
    // Get table structure
    const [columns] = await sequelize.query('DESCRIBE plans');
    const columnNames = columns.map(c => c.Field);
    console.log('Plan table columns:', columnNames);
    
    // Build a query based on existing columns
    const selectColumns = ['id'];
    if (columnNames.includes('name')) selectColumns.push('name');
    if (columnNames.includes('price')) selectColumns.push('price');
    if (columnNames.includes('description')) selectColumns.push('description');
    if (columnNames.includes('type')) selectColumns.push('type');
    
    // Fallback if no valid columns
    if (selectColumns.length <= 1) {
      console.log('No valid columns in plans table, sending fallback plans');
      return res.json([
        { id: 1, name: 'Free', price: 0, description: 'Basic protection for individuals', type: 'free' },
        { id: 2, name: 'Standard', price: 9.99, description: 'Enhanced protection for small businesses', type: 'standard' },
        { id: 3, name: 'Premium', price: 19.99, description: 'Complete protection for enterprises', type: 'premium' }
      ]);
    }
    
    // Execute the query
    const query = `SELECT ${selectColumns.join(', ')} FROM plans ORDER BY price ASC`;
    console.log('Executing query:', query);
    const [plans] = await sequelize.query(query);
    
    console.log('Plans found:', plans.length);
    
    // If no plans, create default plans
    if (plans.length === 0) {
      console.log('No plans found, sending default plans');
      return res.json([
        { id: 1, name: 'Free', price: 0, description: 'Basic protection for individuals', type: 'free' },
        { id: 2, name: 'Standard', price: 9.99, description: 'Enhanced protection for small businesses', type: 'standard' },
        { id: 3, name: 'Premium', price: 19.99, description: 'Complete protection for enterprises', type: 'premium' }
      ]);
    }
    
    // Add missing fields but preserve original prices
    const enhancedPlans = plans.map(plan => {
      const enhancedPlan = { ...plan };
      
      // Standardize name capitalization
      if (enhancedPlan.name) {
        enhancedPlan.name = enhancedPlan.name.charAt(0).toUpperCase() + enhancedPlan.name.slice(1).toLowerCase();
      } else {
        enhancedPlan.name = 'Unknown Plan';
      }
      
      // Ensure plan type exists
      const nameLower = enhancedPlan.name.toLowerCase();
      if (!enhancedPlan.type) {
        // Auto-detect plan type based on name
        if (nameLower.includes('free')) {
          enhancedPlan.type = 'free';
        } else if (nameLower.includes('standard')) {
          enhancedPlan.type = 'standard';
        } else if (nameLower.includes('premium')) {
          enhancedPlan.type = 'premium';
        } else {
          enhancedPlan.type = nameLower;
        }
      }
      
      // Only set a price if it's completely missing (null/undefined)
      if (enhancedPlan.price === null || enhancedPlan.price === undefined) {
        enhancedPlan.price = 0;
      }
      
      // Ensure description exists
      if (!enhancedPlan.description) {
        if (enhancedPlan.type === 'free') {
          enhancedPlan.description = 'Basic protection for individuals';
        } else if (enhancedPlan.type === 'standard') {
          enhancedPlan.description = 'Enhanced protection for small businesses';
        } else if (enhancedPlan.type === 'premium') {
          enhancedPlan.description = 'Complete protection for enterprises';
        } else {
          enhancedPlan.description = `${enhancedPlan.name} plan for security needs`;
        }
      }
      
      return enhancedPlan;
    });
    
    console.log('Sending enhanced plans:', enhancedPlans.length);
    res.json(enhancedPlans);
  } catch (err) {
    console.error('Error in /api/plans:', err);
    // Return fallback plans
    console.log('Error occurred, sending fallback plans');
    res.json([
      { id: 1, name: 'Free', price: 0, description: 'Basic protection for individuals', type: 'free' },
      { id: 2, name: 'Standard', price: 9.99, description: 'Enhanced protection for small businesses', type: 'standard' },
      { id: 3, name: 'Premium', price: 19.99, description: 'Complete protection for enterprises', type: 'premium' }
    ]);
  }
});

// POST a new plan (admin add)
router.post('/api/plans', async (req, res) => {
  try {
    const { name, price, description, type } = req.body;
    await Plan.create({ name, price, description, type });
    res.status(201).json({ message: 'Plan added' });
  } catch (err) {
    console.error('Error adding plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE plan by ID
router.delete('/api/plans/:id', async (req, res) => {
  try {
    await Plan.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Plan deleted' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update plan by ID
router.put('/api/plans/:id', async (req, res) => {
  try {
    const { name, price, description, type } = req.body;
    
    // Validate price
    if (price < 0 || price > 999) {
      return res.status(400).json({ error: 'Price must be between 0 and 999' });
    }

    // Validate plan type
    if (!['free', 'standard', 'premium'].includes(type)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await plan.update({
      name,
      price,
      description,
      type
    });

    res.status(200).json({ message: 'Plan updated successfully', plan });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Search Feedback
router.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await Feedback.findAll({
      where: {
        name: {
          [Op.like]: `%${q}%`
        }
      }
    });
    res.render('search-results', { results });
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).send('Search failed');
  }
});

// API: Get all users
router.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'plan', 'status', 'lastLogin']
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/users', async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      plan,
      status,
      joinDate,
      notes
    } = req.body;

    await User.create({
      name,
      email,
      role,
      plan,
      status,
      joinDate,
      notes,
      lastLogin: new Date()
    });

    res.status(201).json({ message: 'User added' });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/api/users/:id', async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE user by ID
router.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role, plan, status, password } = req.body;
    const updateData = { name, email, role, plan, status };
    
    // Only include password in update if it was provided
    if (password) {
      updateData.password = password;
    }
    
    await User.update(
      updateData,
      { where: { id: req.params.id } }
    );
    res.status(200).json({ message: 'User updated' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Username validation
    if (!username || typeof username !== 'string') {
      return res.render('register', { error: 'Username is required' });
    }

    // Check for spaces in username
    if (username.includes(' ')) {
      return res.render('register', { error: 'Username cannot contain spaces' });
    }

    // Check if username starts with a number
    if (/^\d/.test(username)) {
      return res.render('register', { error: 'Username cannot start with a number' });
    }

    // Email validation
    if (!email || !email.includes('@')) {
      return res.render('register', { error: 'Valid email is required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render('register', { error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { name: username } });
    if (existingUsername) {
      return res.render('register', { error: 'Username already taken' });
    }

    // Create new user
    await User.create({
      name: username,
      email,
      password,
      role: 'user',
      plan: 'free',
      status: 'active'
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Registration failed:', err);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Get current user data
router.get('/api/users/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      status: user.status,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;