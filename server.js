const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cybersubroom'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Routes
app.get('/', (req, res) => {
    db.query('SELECT * FROM plans', (err, plans) => {
        if (err) {
            console.error('Error fetching plans:', err);
            plans = [];
        }
        res.render('homepage', { plans });
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/plans', (req, res) => {
    res.render('plans');
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/user', (req, res) => {
    res.render('user');
});

app.get('/feedback', (req, res) => {
    res.render('feedback');
});

// Search functionality
app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.render('homepage', { plans: [] });
    }

    db.query(
        'SELECT * FROM plans WHERE name LIKE ? OR features LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, searchResults) => {
            if (err) {
                console.error('Error searching plans:', err);
                searchResults = [];
            }
            res.render('homepage', { 
                plans: [],
                searchResults,
                searchTerm
            });
        }
    );
});

// API Endpoints
// 1. Get all plans
app.get('/api/plans', (req, res) => {
    db.query('SELECT * FROM plans', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// 2. Add new plan
app.post('/api/plans', (req, res) => {
    const { name, price, features } = req.body;
    db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        [name, price, features],
        (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: result.insertId, message: 'Plan added successfully' });
        }
    );
});

// 3. Search plans
app.get('/api/plans/search', (req, res) => {
    const searchTerm = req.query.q;
    db.query(
        'SELECT * FROM plans WHERE name LIKE ? OR features LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(results);
        }
    );
});

// 4. Update plan
app.put('/api/plans/:id', (req, res) => {
    const { name, price, features } = req.body;
    db.query(
        'UPDATE plans SET name = ?, price = ?, features = ? WHERE id = ?',
        [name, price, features, req.params.id],
        (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Plan updated successfully' });
        }
    );
});

// 5. Delete plan
app.delete('/api/plans/:id', (req, res) => {
    db.query('DELETE FROM plans WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Plan deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 