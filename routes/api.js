const express = require('express');
const path = require('path');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { Op } = require('sequelize');

// Serve static HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/homepage.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    return res.redirect('/admin');
  } else {
    return res.redirect('/user');
  }
});

router.get('/plans', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/plans.html'));
});

router.get('/feedback', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/feedback.html'));
});

router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

router.get('/admin-manage-user', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-manage-user.html'));
});

router.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user.html'));
});

// API: Submit Feedback
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await Feedback.create({ name, email, message });
    res.redirect('/feedback');
  } catch (err) {
    console.error('Failed to save feedback:', err);
    res.status(500).send('Server error');
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
    const plans = await Plan.findAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// POST a new plan (admin add)
router.post('/api/plans', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    await Plan.create({ name, price, description });
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
    res.json(results);
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: User Management
router.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
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
      const { name, email, role, plan, status } = req.body;
      await User.update(
        { name, email, role, plan, status },
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
      const { firstName, lastName, email, password } = req.body;
  
      const fullName = `${firstName} ${lastName}`;
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(409).json({ error: 'Email already registered' });
  
      await User.create({
        name: fullName,
        email,
        password,
        role: 'user',
        plan: 'free',
        status: 'active'
      });
  
      res.status(201).json({ message: 'Registered successfully. You can now login.' });
    } catch (err) {
      console.error('Registration failed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

module.exports = router;