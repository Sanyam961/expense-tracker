import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from './api';
import { ArrowLeft, Search, X, Download, Calendar, DollarSign, Wallet, ListFilter, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp, ReceiptText } from 'lucide-react';

export default function Transactions() {
    const [expenses, setExpenses] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const loadData = async () => {
            try {
                const [expenseData, budgetData] = await Promise.all([
                    api.getExpenses(token),
                    api.getBudget(token)
                ]);
                setExpenses(expenseData);
                setMonthlyBudget(budgetData.monthly_budget || 0);
            } catch (error) {
                console.error('Failed to load transactions', error);
            }
        };

        loadData();
    }, [token, navigate]);

    const totalSpent = useMemo(() => expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0), [expenses]);

    const thisMonthTotal = useMemo(() => {
        const now = new Date();
        return expenses
            .filter(expense => {
                const date = new Date(expense.date);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            })
            .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    }, [expenses]);

    const categories = [...new Set(expenses.map(expense => expense.category_name))];

    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(expense =>
                (expense.description || '').toLowerCase().includes(query) ||
                expense.category_name.toLowerCase().includes(query) ||
                expense.amount.toString().includes(query)
            );
        }

        if (filterCategory) {
            result = result.filter(expense => expense.category_name === filterCategory);
        }

        if (filterPeriod !== 'all') {
            const today = new Date();
            let startDate = null;

            if (filterPeriod === 'week') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
            } else if (filterPeriod === 'month') {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (filterPeriod === '3months') {
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
            }

            if (startDate) {
                result = result.filter(expense => new Date(expense.date) >= startDate);
            }
        }

        return result;
    }, [expenses, searchQuery, filterCategory, filterPeriod]);

    const topCategory = useMemo(() => {
        const totals = expenses.reduce((accumulator, expense) => {
            accumulator[expense.category_name] = (accumulator[expense.category_name] || 0) + parseFloat(expense.amount);
            return accumulator;
        }, {});

        const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        return entries.length > 0 ? { name: entries[0][0], amount: entries[0][1] } : null;
    }, [expenses]);

    const biggestTransaction = useMemo(() => {
        if (expenses.length === 0) return null;
        return expenses.reduce((maxExpense, expense) => (parseFloat(expense.amount) > parseFloat(maxExpense.amount) ? expense : maxExpense), expenses[0]);
    }, [expenses]);

    const exportToCSV = useCallback(() => {
        const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;

        if (dataToExport.length === 0) {
            return;
        }

        const headers = ['Date', 'Category', 'Description', 'Amount (INR)'];
        const rows = dataToExport.map(expense => [
            new Date(expense.date).toLocaleDateString('en-IN'),
            expense.category_name,
            `"${(expense.description || '').replace(/"/g, '""')}"`,
            parseFloat(expense.amount).toFixed(2)
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${new Date().toLocaleDateString('en-CA')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, [filteredExpenses, expenses]);

    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold font-sans tracking-tight text-blue-600 dark:text-blue-400">💰 Expense Tracker</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
                            >
                                {darkMode ? '☀' : '☾'}
                            </button>
                            <button
                                onClick={() => { localStorage.clear(); navigate('/login'); }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pb-2 overflow-x-auto hide-scrollbar">
                        <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Dashboard</Link>
                        <Link to="/savings" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Savings & Goals</Link>
                        <Link to="/analytics" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Deep Analytics</Link>
                        <Link to="/transactions" className="text-sm font-bold border-b-2 border-blue-600 pb-1 text-blue-600 whitespace-nowrap">Transactions</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
                            <ReceiptText size={14} /> Full transaction view
                        </p>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Transactions</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A dense log of every expense with filters and quick summaries.</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold shadow-lg"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">All Time Spend</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">₹{totalSpent.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">₹{thisMonthTotal.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 shadow-lg text-white">
                        <p className="text-sm text-indigo-100 mb-1">Budget Room</p>
                        <h3 className="text-3xl font-black">₹{Math.max(monthlyBudget - thisMonthTotal, 0).toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 shadow-lg text-white">
                        <p className="text-sm text-amber-100 mb-1">Transactions</p>
                        <h3 className="text-3xl font-black">{filteredExpenses.length}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Search, filter, and review every entry.</p>
                                </div>
                                <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <ListFilter size={16} /> {filteredExpenses.length} shown
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_180px] gap-3">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search description, category, or amount"
                                        className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="w-full px-3 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                                </select>
                                <select
                                    value={filterPeriod}
                                    onChange={e => setFilterPeriod(e.target.value)}
                                    className="w-full px-3 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="all">All Time</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">This Month</option>
                                    <option value="3months">Last 3 Months</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                                No matching transactions found.
                                            </td>
                                        </tr>
                                    ) : filteredExpenses.map(expense => (
                                        <tr key={expense.expense_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold text-xs">
                                                    {expense.category_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[260px]">
                                                <div className="truncate">{expense.description || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">₹{parseFloat(expense.amount).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-amber-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Quick Facts</h3>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500 dark:text-gray-400">Categories</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{categories.length}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500 dark:text-gray-400">Largest expense</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{biggestTransaction ? `₹${parseFloat(biggestTransaction.amount).toLocaleString('en-IN')}` : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500 dark:text-gray-400">Top category</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{topCategory ? topCategory.name : '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl min-h-[220px] flex flex-col justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-4">
                                    <TrendingUp size={14} /> Next move
                                </div>
                                <h3 className="text-xl font-bold mb-2">Push the surplus into savings</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed">You have ₹{Math.max(monthlyBudget - thisMonthTotal, 0).toLocaleString('en-IN')} left in your budget. Move it before it gets spent.</p>
                            </div>
                            <Link to="/savings" className="inline-flex items-center gap-2 mt-6 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-2xl font-semibold transition-colors w-fit">
                                Open Savings
                                <ArrowUpRight size={16} />
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-blue-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Budget Snapshot</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Monthly budget</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">₹{monthlyBudget.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">This month spent</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">₹{thisMonthTotal.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}