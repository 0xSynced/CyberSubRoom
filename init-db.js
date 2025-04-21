const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cybersubroom'
});

const samplePlans = [
    {
        name: 'Free Plan',
        price: 0.00,
        features: 'Basic antivirus protection\nLimited VPN usage\nEmail support'
    },
    {
        name: 'Standard Plan',
        price: 9.99,
        features: 'Advanced antivirus protection\nUnlimited VPN usage\n24/7 Email support\nPassword Manager\nBasic identity protection'
    },
    {
        name: 'Premium Plan',
        price: 19.99,
        features: 'Premium antivirus protection\nUnlimited VPN usage\n24/7 Priority support\nAdvanced Password Manager\nComplete identity protection\nRemote IT Support\nFamily protection (up to 5 devices)'
    }
];

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Insert sample plans
    samplePlans.forEach(plan => {
        db.query(
            'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
            [plan.name, plan.price, plan.features],
            (err, result) => {
                if (err) {
                    console.error('Error inserting plan:', err);
                } else {
                    console.log(`Added plan: ${plan.name}`);
                }
            }
        );
    });

    // Close the connection after all inserts
    setTimeout(() => {
        db.end();
        console.log('Database initialization completed');
    }, 1000);
}); 