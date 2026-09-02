import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from './api';
import { 
    Target, Plus, Trash2, Sparkles, PiggyBank, 
    ArrowLeft, TrendingUp, ShieldCheck, Zap, 
    Lightbulb, ChevronRight, Wallet, Activity
} from 'lucide-react';

export default function Savings() {
    const [expenses, setExpenses] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem('savingsGoals');
        return saved ? JSON.parse(saved) : [];
    });
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        loadData();
    }, [token, navigate]);

    useEffect(() => {
        localStorage.setItem('savingsGoals', JSON.stringify(goals));
    }, [goals]);

    const loadData = async () => {
        try {
            const [fetchedExpenses, budgetData] = await Promise.all([
                api.getExpenses(token),
                api.getBudget(token)
            ]);
            setExpenses(fetchedExpenses);
            setMonthlyBudget(budgetData.monthly_budget || 0);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddGoal = (goalData) => {
        const newGoal = {
            id: Date.now(),
            name: goalData.name,
            target: parseFloat(goalData.target),
            saved: 0 // In a real app, this might track actual contributions
        };
        setGoals([...goals, newGoal]);
        setShowGoalModal(false);
        showToast(`Goal '${goalData.name}' created!`);
    };

    const handleDeleteGoal = (id) => {
        setGoals(goals.filter(g => g.id !== id));
        showToast('Goal removed');
    };

    // ─── Calculations ──────────────────────────────────────
    const thisMonthTotal = useMemo(() => {
        const now = new Date();
        return expenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    }, [expenses]);

    const currentSurplus = Math.max(monthlyBudget - thisMonthTotal, 0);

    const impulseData = useMemo(() => {
        const foodExpenses = expenses.filter(e => 
            e.category_name.toLowerCase().includes('food') || 
            e.category_name.toLowerCase().includes('dining')
        );
        let count = 0;
        let total = 0;
        foodExpenses.forEach(e => {
            const desc = (e.description || '').toLowerCase();
            const amt = parseFloat(e.amount);
            if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('night') || (amt > 50 && amt < 200)) {
                count++;
                total += amt;
            }
        });
        return { count, total };
    }, [expenses]);

    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Savings & Goals</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your future, one rupee at a time.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowGoalModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={20} />
                        <span>Add New Goal</span>
                    </button>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Surplus Card */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                                <Wallet size={18} />
                                <span className="text-sm font-medium uppercase tracking-wider">Available Surplus</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-extrabold">₹{currentSurplus.toLocaleString('en-IN')}</h2>
                                <span className="text-indigo-200 text-sm">this month</span>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <p className="text-xs text-indigo-100 mb-1">Monthly Budget</p>
                                    <p className="text-xl font-bold">₹{monthlyBudget.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <p className="text-xs text-indigo-100 mb-1">Total Spent</p>
                                    <p className="text-xl font-bold">₹{thisMonthTotal.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* AI Quick Insight */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Smart Tip</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {impulseData.total > 0 
                                    ? `You could save an extra ₹${impulseData.total.toLocaleString('en-IN')} this month by cutting back on late-night snacks!` 
                                    : "You're doing great! No major impulse spends detected this week."}
                            </p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Savings Potential</span>
                                <span className="font-bold text-emerald-500">+12%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Goals Grid */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Target className="text-indigo-500" /> Active Goals
                </h3>
                
                {goals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <div className="inline-flex p-4 rounded-full bg-gray-50 dark:bg-gray-900 mb-4">
                            <PiggyBank size={32} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">No active goals yet</h4>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">Start saving for that trip, gadget, or emergency fund today!</p>
                        <button 
                            onClick={() => setShowGoalModal(true)}
                            className="mt-6 text-indigo-600 font-semibold hover:underline"
                        >
                            Create your first goal →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map(goal => {
                            const progress = Math.min((currentSurplus / goal.target) * 100, 100);
                            return (
                                <div key={goal.id} className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <Target size={24} />
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{goal.name}</h4>
                                    <p className="text-sm text-gray-500 mb-6">Target: ₹{goal.target.toLocaleString('en-IN')}</p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}% Complete</span>
                                            <span className="text-gray-400">₹{currentSurplus.toLocaleString('en-IN')} saved</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {progress >= 100 && (
                                        <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl">
                                            <ShieldCheck size={16} />
                                            <span>Goal Achieved!</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Savings Tools */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-pink-500" /> Impulse Analysis
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-red-700 dark:text-red-300">Potential Savings Loss</span>
                                    <Zap size={16} className="text-red-500" />
                                </div>
                                <p className="text-2xl font-black text-red-600">₹{impulseData.total.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-red-500/70 mt-1">Based on {impulseData.count} detected transactions</p>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Our AI detected that late-night snacking and small "minor" spends are your biggest drain. Moving these to a savings goal could get you to your target 15% faster.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" /> Compound Growth
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                                <div>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 uppercase font-bold">If you save ₹100/day</p>
                                    <p className="text-2xl font-black text-emerald-600">₹36,500/yr</p>
                                </div>
                                <TrendingUp size={32} className="text-emerald-400 opacity-50" />
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Consistent small amounts outperform large sporadic savings. Set an automated transfer of ₹100 daily to see massive results.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showGoalModal && (
                <GoalModal 
                    onSave={handleAddGoal} 
                    onClose={() => setShowGoalModal(false)} 
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl animate-slide-up z-50 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
        </div>
    );
}

function GoalModal({ onSave, onClose }) {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, target });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-scale-in border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create a New Goal</h3>
                <p className="text-sm text-gray-500 mb-8">What are you dreaming of today?</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Goal Name</label>
                        <input 
                            type="text" 
                            required 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Dream Vacation, PS5, Emergency"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Amount (₹)</label>
                        <input 
                            type="number" 
                            required 
                            value={target} 
                            onChange={e => setTarget(e.target.value)}
                            placeholder="50000"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Create Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
