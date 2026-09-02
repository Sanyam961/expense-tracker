const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Session expired. Please log in again.' });

    try {
        const verified = jwt.verify(token.replace(/^Bearer\s+/i, '').trim(), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
};

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, name, email',
            [name, email, hashedPassword]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ user_id: user.rows[0].user_id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token, user: { user_id: user.rows[0].user_id, name: user.rows[0].name, email: user.rows[0].email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query('SELECT user_id, name, email FROM users WHERE user_id = $1', [req.user.user_id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's monthly budget
router.get('/budget', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT monthly_budget FROM users WHERE user_id = $1', [req.user.user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ monthly_budget: parseFloat(result.rows[0].monthly_budget) || 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user's monthly budget
router.put('/budget', authenticateToken, async (req, res) => {
    try {
        const { monthly_budget } = req.body;
        const result = await pool.query(
            'UPDATE users SET monthly_budget = $1 WHERE user_id = $2 RETURNING monthly_budget',
            [monthly_budget, req.user.user_id]
        );
        res.json({ monthly_budget: parseFloat(result.rows[0].monthly_budget) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
