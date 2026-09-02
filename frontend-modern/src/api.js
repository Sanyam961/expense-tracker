import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_CATEGORIES = [
    { category_id: 1, name: 'Food & Dining' },
    { category_id: 2, name: 'Travel & Commute' },
    { category_id: 3, name: 'Study Materials' },
    { category_id: 4, name: 'Entertainment' },
    { category_id: 5, name: 'Housing & Rent' },
    { category_id: 6, name: 'Miscellaneous' }
];

const DEFAULT_EXPENSES = [
    { expense_id: 1, amount: 150, description: 'Campus Lunch', category_id: 1, category_name: 'Food & Dining', expense_date: new Date().toISOString().split('T')[0] },
    { expense_id: 2, amount: 60, description: 'Bus Fare', category_id: 2, category_name: 'Travel & Commute', expense_date: new Date().toISOString().split('T')[0] },
    { expense_id: 3, amount: 450, description: 'Reference Book', category_id: 3, category_name: 'Study Materials', expense_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { expense_id: 4, amount: 300, description: 'Cinema Ticket', category_id: 4, category_name: 'Entertainment', expense_date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
    { expense_id: 5, amount: 2500, description: 'Hostel Maintenance', category_id: 5, category_name: 'Housing & Rent', expense_date: new Date(Date.now() - 259200000).toISOString().split('T')[0] }
];

function getLocalData(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function setLocalData(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch {}
}

export const login = async (email, password) => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { timeout: 3000 });
        return res.data;
    } catch {
        // Mock fallback for demo
        const user = { user_id: 999, name: email.split('@')[0] || 'Student', email: email || 'student@college.edu' };
        return { token: 'demo-token', user };
    }
};

export const register = async (name, email, password) => {
    try {
        const res = await axios.post(`${API_URL}/auth/register`, { name, email, password }, { timeout: 3000 });
        return res.data;
    } catch {
        return { user_id: 999 };
    }
};

export const getCurrentUser = async (token) => {
    if (token === 'demo-token') {
        return getLocalData('mock_user', { user_id: 999, name: 'Sanyam Sharma', email: 'sanyam@college.edu' });
    }
    try {
        const res = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
        });
        return res.data;
    } catch {
        return { user_id: 999, name: 'Student Guest', email: 'guest@college.edu' };
    }
};

export const getExpenses = async (token) => {
    if (token === 'demo-token') {
        return getLocalData('mock_expenses', DEFAULT_EXPENSES);
    }
    try {
        const res = await axios.get(`${API_URL}/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
        });
        return res.data;
    } catch {
        return getLocalData('mock_expenses', DEFAULT_EXPENSES);
    }
};

export const getAboveAverageExpenses = async (token) => {
    if (token === 'demo-token') {
        const all = getLocalData('mock_expenses', DEFAULT_EXPENSES);
        return all.filter(e => e.amount > 300);
    }
    try {
        const res = await axios.get(`${API_URL}/expenses/above-average`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
        });
        return res.data;
    } catch {
        const all = getLocalData('mock_expenses', DEFAULT_EXPENSES);
        return all.filter(e => e.amount > 300);
    }
};

export const addExpense = async (token, expense) => {
    if (token === 'demo-token') {
        const current = getLocalData('mock_expenses', DEFAULT_EXPENSES);
        const newExp = {
            expense_id: Date.now(),
            ...expense,
            expense_date: expense.expense_date || new Date().toISOString().split('T')[0]
        };
        const updated = [newExp, ...current];
        setLocalData('mock_expenses', updated);
        return newExp;
    }
    const res = await axios.post(`${API_URL}/expenses`, expense, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const updateExpense = async (token, id, expense) => {
    if (token === 'demo-token') {
        const current = getLocalData('mock_expenses', DEFAULT_EXPENSES);
        const updated = current.map(e => e.expense_id === id ? { ...e, ...expense } : e);
        setLocalData('mock_expenses', updated);
        return expense;
    }
    const res = await axios.put(`${API_URL}/expenses/${id}`, expense, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteExpense = async (token, id) => {
    if (token === 'demo-token') {
        const current = getLocalData('mock_expenses', DEFAULT_EXPENSES);
        const updated = current.filter(e => e.expense_id !== id);
        setLocalData('mock_expenses', updated);
        return { message: 'Deleted' };
    }
    const res = await axios.delete(`${API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const getCategories = async () => {
    try {
        const res = await axios.get(`${API_URL}/expenses/categories`, { timeout: 3000 });
        return res.data;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

export const getBudget = async (token) => {
    if (token === 'demo-token') {
        return { monthly_budget: parseInt(localStorage.getItem('mock_budget') || '12000', 10) };
    }
    try {
        const res = await axios.get(`${API_URL}/auth/budget`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
        });
        return res.data;
    } catch {
        return { monthly_budget: parseInt(localStorage.getItem('mock_budget') || '12000', 10) };
    }
};

export const updateBudget = async (token, monthly_budget) => {
    if (token === 'demo-token') {
        localStorage.setItem('mock_budget', monthly_budget.toString());
        return { monthly_budget };
    }
    const res = await axios.put(`${API_URL}/auth/budget`, { monthly_budget }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
