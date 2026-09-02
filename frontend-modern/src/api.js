import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data;
};

export const register = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    return res.data;
};

export const getCurrentUser = async (token) => {
    const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const getExpenses = async (token) => {
    const res = await axios.get(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const getAboveAverageExpenses = async (token) => {
    const res = await axios.get(`${API_URL}/expenses/above-average`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const addExpense = async (token, expense) => {
    const res = await axios.post(`${API_URL}/expenses`, expense, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const updateExpense = async (token, id, expense) => {
    const res = await axios.put(`${API_URL}/expenses/${id}`, expense, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteExpense = async (token, id) => {
    const res = await axios.delete(`${API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const getCategories = async () => {
    const res = await axios.get(`${API_URL}/expenses/categories`);
    return res.data;
};

export const getBudget = async (token) => {
    const res = await axios.get(`${API_URL}/auth/budget`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const updateBudget = async (token, monthly_budget) => {
    const res = await axios.put(`${API_URL}/auth/budget`, { monthly_budget }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
