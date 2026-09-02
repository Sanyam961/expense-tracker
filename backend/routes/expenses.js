const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
};

// Get all expenses for a user along with categories
router.get('/', authenticate, async (req, res) => {
    try {
        const expenses = await pool.query(
            `SELECT e.expense_id, e.amount, e.date, e.description, c.category_name, c.category_id 
             FROM expenses e 
             JOIN categories c ON e.category_id = c.category_id 
             WHERE e.user_id = $1 
             ORDER BY e.date DESC`,
            [req.user.user_id]
        );
        res.json(expenses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get above average expenses (Uses a Subquery)
router.get('/above-average', authenticate, async (req, res) => {
    try {
        const expenses = await pool.query(
            `SELECT e.expense_id, e.amount, e.date, e.description, c.category_name 
             FROM expenses e 
             JOIN categories c ON e.category_id = c.category_id 
             WHERE e.user_id = $1 
               AND e.amount > (
                   SELECT AVG(amount) 
                   FROM expenses 
                   WHERE user_id = $1
               )
             ORDER BY e.amount DESC`,
            [req.user.user_id]
        );
        res.json(expenses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new expense
router.post('/', authenticate, async (req, res) => {
    try {
        const { category_id, amount, date, description } = req.body;
        const newExpense = await pool.query(
            'INSERT INTO expenses (user_id, category_id, amount, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.user_id, category_id, amount, date, description]
        );
        res.json(newExpense.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update an expense
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, date, description } = req.body;
        
        const updateExpense = await pool.query(
            'UPDATE expenses SET category_id = $1, amount = $2, date = $3, description = $4 WHERE expense_id = $5 AND user_id = $6 RETURNING *',
            [category_id, amount, date, description, id, req.user.user_id]
        );
        res.json(updateExpense.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete an expense
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM expenses WHERE expense_id = $1 AND user_id = $2', [id, req.user.user_id]);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await pool.query('SELECT * FROM categories');
        res.json(categories.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
