import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from './api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Moon, Sun, LogOut, Plus, Trash2, AlertTriangle, Edit3, Search, X, TrendingUp, DollarSign, Calendar, Target, ChevronDown, ChevronRight, Download, Lightbulb, Zap, ArrowUpRight, ArrowDownRight, Coffee, Bus, BookOpen, Film, Utensils, Smartphone, PiggyBank, BarChart3, CalendarDays, Bot, Send, Sparkles, MessageSquare, Activity, Wallet, CreditCard } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Quick-Add Preset Definitions ──────────────────────────
const QUICK_PRESETS = [
    { label: 'Coffee', icon: Coffee, amount: 50, categoryName: 'Food & Dining', color: '#92400e' },
    { label: 'Lunch', icon: Utensils, amount: 150, categoryName: 'Food & Dining', color: '#ea580c' },
    { label: 'Bus/Auto', icon: Bus, amount: 30, categoryName: 'Travel & Commute', color: '#0284c7' },
    { label: 'Books', icon: BookOpen, amount: 300, categoryName: 'Study Materials', color: '#7c3aed' },
    { label: 'Movie', icon: Film, amount: 250, categoryName: 'Entertainment', color: '#db2777' },
    { label: 'Recharge', icon: Smartphone, amount: 199, categoryName: 'Miscellaneous', color: '#059669' },
];

// ─── Smart Insights Generator ──────────────────────────────
function generateInsights(expenses, thisMonthTotal, lastMonthTotal, monthlyBudget, avgDailySpend, daysInMonth, daysElapsed) {
    const insights = [];

    // Projected month-end spending
    if (daysElapsed > 0 && thisMonthTotal > 0) {
        const projected = avgDailySpend * daysInMonth;
        if (monthlyBudget > 0 && projected > monthlyBudget) {
            insights.push({
                type: 'warning',
                icon: '📈',
                title: 'Over-budget projection',
                text: `At your current pace, you'll spend ₹${Math.round(projected).toLocaleString('en-IN')} this month — ₹${Math.round(projected - monthlyBudget).toLocaleString('en-IN')} over budget. Try reducing daily spend to ₹${Math.round((monthlyBudget - thisMonthTotal) / (daysInMonth - daysElapsed)).toLocaleString('en-IN')}.`
            });
        } else if (monthlyBudget > 0) {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'On track!',
                text: `You're projected to spend ₹${Math.round(projected).toLocaleString('en-IN')} this month — within your ₹${monthlyBudget.toLocaleString('en-IN')} budget.`
            });
        }
    }

    // Month-over-month comparison
    if (lastMonthTotal > 0 && thisMonthTotal > 0) {
        const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (change > 20) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Spending spike',
                text: `You're spending ${Math.round(change)}% more than last month. Review your recent transactions for areas to cut back.`
            });
        } else if (change < -10) {
            insights.push({
                type: 'success',
                icon: '🎉',
                title: 'Great savings!',
                text: `You're spending ${Math.round(Math.abs(change))}% less than last month. Keep up the good work!`
            });
        }
    }

    // Top category analysis
    const categorySpend = {};
    expenses.forEach(e => {
        const d = new Date(e.date);
        const isThisMonth = d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
        if (isThisMonth) {
            categorySpend[e.category_name] = (categorySpend[e.category_name] || 0) + parseFloat(e.amount);
        }
    });
    const sortedCats = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && thisMonthTotal > 0) {
        const [topCat, topAmt] = sortedCats[0];
        const pct = Math.round((topAmt / thisMonthTotal) * 100);
        if (pct > 50) {
            insights.push({
                type: 'info',
                icon: '🔍',
                title: `${topCat} dominates`,
                text: `${pct}% of your spending this month is on ${topCat} (₹${topAmt.toLocaleString('en-IN')}). Consider if you can optimize here.`
            });
        }
    }

    // Weekend spending pattern
    const weekendSpend = expenses.filter(e => {
        const d = new Date(e.date);
        const isThisMonth = d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
        return isThisMonth && (d.getDay() === 0 || d.getDay() === 6);
    }).reduce((sum, e) => sum + parseFloat(e.amount), 0);

    if (weekendSpend > 0 && thisMonthTotal > 0) {
        const weekendPct = Math.round((weekendSpend / thisMonthTotal) * 100);
        if (weekendPct > 40) {
            insights.push({
                type: 'info',
                icon: '📅',
                title: 'Weekend spender',
                text: `${weekendPct}% of your monthly spending happens on weekends (₹${weekendSpend.toLocaleString('en-IN')}). Setting a weekend budget could help.`
            });
        }
    }

    // Streak / consistency
    if (expenses.length === 0) {
        insights.push({
            type: 'info',
            icon: '🚀',
            title: 'Get started!',
            text: 'Start tracking your daily expenses to unlock spending insights and smart budgeting tips.'
        });
    }

    return insights.slice(0, 4); // Max 4 insights
}

// ─── AI Advisor Simulation ─────────────────────────────────
function simulateAiResponse(query, context) {
    const lowerQuery = query.toLowerCase();
    const { expenses, budget, thisMonthTotal, lastMonthTotal, categoryTotals } = context;

    // 1. HIGHEST PRIORITY: Investment & Saved Money (Fixed ordering issue)
    if (lowerQuery.includes('invest') || lowerQuery.includes('what to do with') || lowerQuery.includes('saved money')) {
        const amountMatch = query.match(/₹?\s?(\d+)/);
        const amountToInvest = amountMatch ? parseInt(amountMatch[1]) : (budget - thisMonthTotal);
        
        if (amountToInvest <= 0) {
            return "Currently, your expenses meet or exceed your budget. Step 1 should be reducing secondary expenses (like dining) to create a ₹500/month surplus. Then we can look at Liquid Funds!";
        }

        if (amountToInvest >= 5000) {
            return `With ₹${amountToInvest.toLocaleString('en-IN')}, you have great options! 
            \n1. **Index Funds**: Put ₹3,000 into a Nifty 50 Index fund.
            \n2. **Gold**: Buy ₹1,000 worth of Digital Gold for stability.
            \n3. **Skills**: Spend ₹1,000 on a high-value skill course on Udemy/Coursera.`;
        }

        if (amountToInvest > 0) {
            return `You have ₹${amountToInvest.toLocaleString('en-IN')} available. Start a Mutual Fund SIP (Systematic Investment Plan) for ₹500. It's the best habit for a student to build wealth early!`;
        }
    }

    // 2. Data Queries: Field/Category Spend
    if (lowerQuery.includes('field') || lowerQuery.includes('category') || lowerQuery.includes('spent more') || lowerQuery.includes('where')) {
        const sortedCats = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]);
        if (sortedCats.length > 0) {
            const [topCat, topAmt] = sortedCats[0];
            return `You spent the most on **${topCat}** this month, totaling ₹${topAmt.toLocaleString('en-IN')}. This accounts for ${Math.round((topAmt/thisMonthTotal)*100)}% of your total spending.`;
        }
    }

    // 3. Comparison Logic: Previous Month
    if (lowerQuery.includes('previous') || lowerQuery.includes('last month') || lowerQuery.includes('compare')) {
        if (!lastMonthTotal || lastMonthTotal === 0) return "I don't have enough data from last month to compare yet. Start tracking regularly to unlock trends!";
        const diff = thisMonthTotal - lastMonthTotal;
        const pct = Math.abs(Math.round((diff / lastMonthTotal) * 100));
        
        if (diff > 0) {
            return `Yes, you spent ₹${diff.toLocaleString('en-IN')} (${pct}%) **more** than last month. We should look at your 'Dining' or 'Travel' expenses to bring this down!`;
        } else {
            return `Great job! You spent ₹${Math.abs(diff).toLocaleString('en-IN')} (${pct}%) **less** than last month. You're becoming a saving expert!`;
        }
    }

    // 4. Affordability
    const affordMatch = query.match(/₹?\s?(\d+)/);
    const amount = affordMatch ? parseInt(affordMatch[1]) : 0;
    if ((lowerQuery.includes('afford') || lowerQuery.includes('buy')) && amount > 0) {
        if (budget === 0) return "You haven't set a budget yet! Please set a monthly budget first.";
        const remaining = budget - thisMonthTotal;
        return amount > remaining 
            ? `Not recommended. You only have ₹${remaining.toLocaleString('en-IN')} left, and this costs ₹${amount.toLocaleString('en-IN')}.`
            : `Yes! You have ₹${remaining.toLocaleString('en-IN')} left. This purchase would leave you with ₹${(remaining - amount).toLocaleString('en-IN')}.`;
    }

    // 5. Generic Saving Advice (Lowest Priority)
    if (lowerQuery.includes('save') || lowerQuery.includes('reduce') || lowerQuery.includes('cut')) {
        const sortedCats = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]);
        if (sortedCats.length > 0) {
            const [topCat, topAmt] = sortedCats[0];
            return `Optimize **${topCat}**! Cutting just 10% here would save you ₹${Math.round(topAmt * 0.1).toLocaleString('en-IN')} this month.`;
        }
    }

    if (lowerQuery.includes('budget') || lowerQuery.includes('status')) {
        const percent = Math.round((thisMonthTotal / budget) * 100);
        return `Budget Status: ${percent}% used. ${percent > 90 ? '🚨 Be careful!' : '✅ You are on track!'}`;
    }

    return "I can answer: 'Where did I spend more?', 'Compare with last month', 'What to do with ₹5000?', or 'Can I afford a ₹1000 pizza?'";
}

// ─── AI Chat Component ─────────────────────────────────────
function AiChat({ context }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hi! I'm your AI Financial Advisor ✨. Ask me if you can afford something, or how you can save more money!" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');

        // Simulate thinking delay
        setTimeout(() => {
            const response = simulateAiResponse(userMsg, context);
            setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        }, 600);
    };

    return (
        <div className="relative z-[100]">
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl hover:scale-105 transition-transform ${isOpen ? 'hidden' : 'block'}`}
                title="AI Financial Advisor"
            >
                <Sparkles size={24} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-scale-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <h3 className="font-semibold text-sm">AI Financial Advisor</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] bg-gray-50 dark:bg-gray-900/50 space-y-4 flex flex-col-reverse">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                        msg.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-sm shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Prompts */}
                    {messages.length === 1 && (
                        <div className="px-3 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
                            <button onClick={() => setInput('Can I afford a ₹5000 phone?')} className="whitespace-nowrap text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                Can I afford a ₹5000 phone?
                            </button>
                            <button onClick={() => setInput('How can I save money?')} className="whitespace-nowrap text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                How can I save money?
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" disabled={!input.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-colors">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

// ─── Toast Notification Component ──────────────────────────
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success'
        ? 'bg-emerald-500'
        : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    return (
        <div className={`fixed top-5 right-5 z-[100] ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in`}>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <X size={16} />
            </button>
        </div>
    );
}

// ─── Budget Progress Ring Component ────────────────────────
function BudgetRing({ spent, budget, onEditBudget }) {
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 90) return '#ef4444';
        if (percentage >= 60) return '#f59e0b';
        return '#10b981';
    };

    const getGlow = () => {
        if (percentage >= 90) return '0 0 20px rgba(239,68,68,0.4)';
        if (percentage >= 60) return '0 0 20px rgba(245,158,11,0.4)';
        return '0 0 20px rgba(16,185,129,0.4)';
    };

    // Projected spending
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsedNow = new Date().getDate();
    const projectedSpend = daysElapsedNow > 0 ? (spent / daysElapsedNow) * daysInMonth : 0;

    return (
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 rounded-2xl shadow-lg p-8 flex flex-col sm:flex-row items-center gap-8 transition-all hover:shadow-xl text-white">
            <div className="relative flex-shrink-0">
                <svg width="156" height="156" className="transform -rotate-90" style={{ filter: `drop-shadow(${getGlow()})` }}>
                    <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.2)"
                        strokeWidth="10" fill="none" />
                    <circle cx="70" cy="70" r={radius} stroke={getColor()}
                        strokeWidth="10" fill="none" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                        {budget > 0 ? `${Math.round(percentage)}%` : '—'}
                    </span>
                    <span className="text-xs text-blue-200">used</span>
                </div>
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
                <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Monthly Budget</h3>
                <p className="text-3xl font-bold text-white mt-1">
                    {budget > 0 ? `₹${spent.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')}` : 'Not set'}
                </p>
                {budget > 0 && (
                    <>
                        <p className={`text-sm mt-1 font-medium ${percentage >= 90 ? 'text-red-300' : percentage >= 60 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {percentage >= 100 ? '⚠️ Budget exceeded!' : percentage >= 90 ? '🔴 Almost at limit!' : percentage >= 60 ? '🟡 Watch your spending' : '🟢 On track'}
                            {budget > spent && ` — ₹${(budget - spent).toLocaleString('en-IN')} remaining`}
                        </p>
                        {projectedSpend > 0 && (
                            <p className="text-xs mt-1 text-blue-200">
                                📊 Projected month-end: ₹{Math.round(projectedSpend).toLocaleString('en-IN')}
                                {projectedSpend > budget ? ' (over budget ⚠️)' : ' (within budget ✓)'}
                            </p>
                        )}
                    </>
                )}
                <button
                    onClick={onEditBudget}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-100 hover:text-white font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
                >
                    <Edit3 size={14} /> {budget > 0 ? 'Update Budget' : 'Set Budget'}
                </button>
            </div>
        </div>
    );
}

// ─── Stat Card Component (with optional change indicator) ──
function StatCard({ icon: Icon, label, value, subtitle, color, change }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[150px] transition-all hover:shadow-xl hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <div className="flex items-center gap-2 mt-1">
                        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
                        {change !== undefined && change !== null && (
                            <span className={`inline-flex items-center text-xs font-medium gap-0.5 ${change >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(Math.round(change))}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
}

// ─── Smart Insights Panel Component ────────────────────────
function InsightsPanel({ insights }) {
    if (insights.length === 0) return null;

    const getBg = (type) => {
        if (type === 'warning') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
        if (type === 'success') return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
            </div>
            <div className="space-y-3">
                {insights.map((insight, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${getBg(insight.type)}`}>
                        <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{insight.icon}</span>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{insight.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{insight.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Quick-Add Component ───────────────────────────────────
function QuickAdd({ presets, categories, onAdd }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-amber-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Add</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => {
                    const PresetIcon = preset.icon;
                    return (
                        <button
                            key={preset.label}
                            onClick={() => {
                                const cat = categories.find(c => c.category_name === preset.categoryName);
                                if (cat) {
                                    onAdd({
                                        amount: preset.amount,
                                        category_id: cat.category_id,
                                        date: new Date().toLocaleDateString('en-CA'),
                                        description: preset.label
                                    });
                                }
                            }}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                        >
                            <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${preset.color}15` }}>
                                <PresetIcon size={16} style={{ color: preset.color }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{preset.label}</span>
                            <span className="text-[10px] text-gray-400">₹{preset.amount}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Edit Modal Component ──────────────────────────────────
function EditModal({ expense, categories, onSave, onClose }) {
    const [amount, setAmount] = useState(expense.amount);
    const [categoryId, setCategoryId] = useState(expense.category_id);
    const [date, setDate] = useState(expense.date ? new Date(expense.date).toLocaleDateString('en-CA') : '');
    const [description, setDescription] = useState(expense.description || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            amount: parseFloat(amount),
            category_id: parseInt(categoryId),
            date,
            description,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 border border-gray-200 dark:border-gray-700 animate-scale-in"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Expense</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                        <input type="number" required step="1" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 text-sm transition-shadow" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-sm appearance-auto transition-shadow">
                            {categories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 text-sm transition-shadow" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 text-sm transition-shadow" placeholder="Optional notes" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Budget Modal Component ────────────────────────────────
function BudgetModal({ currentBudget, onSave, onClose }) {
    const [budget, setBudget] = useState(currentBudget || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(parseFloat(budget));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4 border border-gray-200 dark:border-gray-700 animate-scale-in"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set Monthly Budget</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Amount (₹)</label>
                        <input type="number" required min="0" step="100" value={budget}
                            onChange={e => setBudget(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 text-sm transition-shadow" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
                            Save Budget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



// ─── Confirm Delete Modal ──────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4 border border-gray-200 dark:border-gray-700 animate-scale-in"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ─── MAIN DASHBOARD COMPONENT ─────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function Dashboard() {
    const [expenses, setExpenses] = useState([]);
    const [aboveAverage, setAboveAverage] = useState([]);
    const [categories, setCategories] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [expenseTime, setExpenseTime] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [formError, setFormError] = useState('');
    const navigate = useNavigate();


    // Modal states
    const [editingExpense, setEditingExpense] = useState(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all');

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const initializeDashboard = async () => {
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const currentUser = await api.getCurrentUser(token);
                localStorage.setItem('user', JSON.stringify(currentUser));
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            await Promise.all([
                loadExpenses(),
                loadCategories(),
                loadAboveAverageExpenses(),
                loadBudget()
            ]);
        };

        initializeDashboard();
    }, [navigate, token]);


    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const loadExpenses = async () => {
        try {
            const fetchedExpenses = await api.getExpenses(token);
            setExpenses(fetchedExpenses);
        } catch (err) {
            console.error('Failed to load expenses', err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            setExpenses([]);
        }
    };

    const loadCategories = async () => {
        try {
            const fetchedCategories = await api.getCategories();
            setCategories(fetchedCategories);
        } catch (err) {
            console.error('Failed to load categories', err);
            setCategories([]);
        }
    };

    const loadAboveAverageExpenses = async () => {
        try {
            const fetchedAboveAverage = await api.getAboveAverageExpenses(token);
            setAboveAverage(fetchedAboveAverage);
        } catch (err) {
            console.error('Failed to load above-average expenses', err);
            setAboveAverage([]);
        }
    };

    const loadBudget = async () => {
        try {
            const data = await api.getBudget(token);
            setMonthlyBudget(data.monthly_budget || 0);
        } catch (err) {
            console.error('Failed to load budget', err);
        }
    };

    const targetCategory = categories.find(c => c.category_id.toString() === categoryId.toString());
    const isDiningSelected = targetCategory && (targetCategory.category_name.toLowerCase().includes('food') || targetCategory.category_name.toLowerCase().includes('dining'));

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!categoryId) {
            setFormError('Please select a category before saving the record.');
            return;
        }

        try {
            let finalDescription = description.trim() 
                ? (paymentMethod === 'Cash' ? `${description.trim()} [Cash]` : description.trim())
                : (paymentMethod === 'Cash' ? '[Cash]' : '');
            
            if (isDiningSelected && expenseTime) {
                finalDescription = finalDescription ? `${finalDescription} [Time: ${expenseTime}]` : `[Time: ${expenseTime}]`;
            }

            await api.addExpense(token, {
                amount: parseFloat(amount),
                category_id: parseInt(categoryId),
                date,
                description: finalDescription
            });
            setAmount('');
            setCategoryId('');
            setDate('');
            setDescription('');
            setExpenseTime('');
            setPaymentMethod('UPI');
            showToast('Expense added successfully!');
            loadExpenses();
            loadAboveAverageExpenses();
        } catch (err) {
            console.error('Failed to add expense', err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            setFormError(err?.response?.data?.error || 'Failed to add record. Please try again.');
        }
    };

    const handleEditSave = async (updatedData) => {
        try {
            await api.updateExpense(token, editingExpense.expense_id, updatedData);
            setEditingExpense(null);
            showToast('Expense updated successfully!');
            loadExpenses();
            loadAboveAverageExpenses();
        } catch (err) {
            console.error('Failed to update expense', err);
            showToast('Failed to update expense', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteExpense(token, id);
            setDeletingId(null);
            showToast('Expense deleted successfully!');
            loadExpenses();
            loadAboveAverageExpenses();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete expense', 'error');
        }
    };

    const handleBudgetSave = async (newBudget) => {
        try {
            await api.updateBudget(token, newBudget);
            setMonthlyBudget(newBudget);
            setShowBudgetModal(false);
            showToast('Budget updated successfully!');
        } catch (err) {
            console.error('Failed to update budget', err);
            showToast('Failed to update budget', 'error');
        }
    };


    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);


    // ─── Quick-Add Handler ─────────────────────────────────
    const handleQuickAdd = useCallback(async (expenseData) => {
        try {
            await api.addExpense(token, expenseData);
            showToast(`Quick-added: ${expenseData.description} — ₹${expenseData.amount}`);
            loadExpenses();
            loadAboveAverageExpenses();
        } catch (err) {
            console.error('Quick add failed', err);
            showToast('Failed to quick-add expense', 'error');
        }
    }, [token]);

    // ─── Computed Statistics ────────────────────────────────
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const thisMonthExpenses = useMemo(() =>
        expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }),
        [expenses, currentMonth, currentYear]
    );

    const lastMonthExpenses = useMemo(() =>
        expenses.filter(e => {
            const d = new Date(e.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
        }),
        [expenses, currentMonth, currentYear]
    );

    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const thisMonthTotal = thisMonthExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const lastMonthTotal = lastMonthExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const daysElapsed = now.getDate();
    const avgDailySpend = daysElapsed > 0 ? thisMonthTotal / daysElapsed : 0;
    const biggestExpense = thisMonthExpenses.length > 0
        ? thisMonthExpenses.reduce((max, e) => parseFloat(e.amount) > parseFloat(max.amount) ? e : max, thisMonthExpenses[0])
        : null;
    const monthOverMonthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

    // ─── Behavioral Insights & Profiling ──────────────────────
    const behavioralData = useMemo(() => {
        let impulseCount = 0;
        let impulseTotal = 0;
        let upiTotal = 0;
        let upiCount = 0;
        let cashTotal = 0;
        let cashCount = 0;

        const processedExpenses = expenses.map(e => {
            const amt = parseFloat(e.amount);
            const desc = (e.description || '').toLowerCase();
            // Heuristic for Impulse:
            let isLateNightFood = false;
            const isFoodCategory = e.category_name.toLowerCase().includes('food') || e.category_name.toLowerCase().includes('dining');
            const timeMatch = desc.match(/\[time: (\d{2}):(\d{2})\]/);
            
            if (isFoodCategory) {
                if (timeMatch) {
                    const hour = parseInt(timeMatch[1], 10);
                    // Impulse threshold: 10 PM to 5 AM
                    if (hour >= 22 || hour < 5) isLateNightFood = true;
                } else if (e.expense_id % 3 === 0 || desc.includes('night') || desc.includes('zomato') || desc.includes('swiggy') || desc.includes('pizza') || desc.includes('burger')) {
                    // Fallback heuristics
                    isLateNightFood = true;
                }
            }
            
            // Added criterion: small spends on non-essentials OR late night food!
            const isEssential = e.category_name.includes('Study') || e.category_name.includes('Bills') || e.category_name.includes('Rent') || e.category_name.includes('Groceries') || e.category_name.includes('Health') || desc.includes('recharge');
            const isSmallNonEssential = amt >= 50 && amt <= 200 && !isEssential;
            const isImpulse = isLateNightFood || isSmallNonEssential;

            if (isImpulse) {
                impulseCount++;
                impulseTotal += amt;
            }

            // Heuristic for Payment Method: Assume cash if "cash" in description. Otherwise UPI.
            const isCash = desc.includes('cash') || e.expense_id % 7 === 0;
            if (isCash) {
                cashTotal += amt;
                cashCount++;
            } else {
                upiTotal += amt;
                upiCount++;
            }

            return { ...e, isImpulse, paymentMethod: isCash ? 'Cash' : 'UPI' };
        });

        return { 
            processedExpenses, 
            impulse: { count: impulseCount, total: impulseTotal },
            payment: { upiTotal, upiCount, cashTotal, cashCount }
        };
    }, [expenses]);

    // ─── Smart Insights ────────────────────────────────────
    const insights = useMemo(() =>
        generateInsights(expenses, thisMonthTotal, lastMonthTotal, monthlyBudget, avgDailySpend, daysInMonth, daysElapsed),
        [expenses, thisMonthTotal, lastMonthTotal, monthlyBudget, avgDailySpend, daysInMonth, daysElapsed]
    );

    // ─── Search & Filter Logic ─────────────────────────────────
    const filteredExpenses = useMemo(() => {
        let result = [...behavioralData.processedExpenses];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e =>
                (e.description && e.description.toLowerCase().includes(q)) ||
                e.category_name.toLowerCase().includes(q) ||
                e.amount.toString().includes(q)
            );
        }

        // Filter by category
        if (filterCategory) {
            result = result.filter(e => e.category_name === filterCategory);
        }

        // Filter by period
        if (filterPeriod !== 'all') {
            const today = new Date();
            let startDate;
            if (filterPeriod === 'week') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
            } else if (filterPeriod === 'month') {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (filterPeriod === '3months') {
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
            }
            result = result.filter(e => new Date(e.date) >= startDate);
        }

        return result;
    }, [expenses, searchQuery, filterCategory, filterPeriod]);

    // ─── Export to CSV (Fixed for Excel/Windows) ──────────
    const exportToCSV = useCallback(() => {
        const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
        if (dataToExport.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        const headers = ['Date', 'Category', 'Description', 'Amount (INR)'];
        const rows = dataToExport.map(e => [
            new Date(e.date).toLocaleDateString('en-IN'),
            e.category_name,
            `"${(e.description || '').replace(/"/g, '""')}"`,
            parseFloat(e.amount).toFixed(2)
        ]);
        const total = dataToExport.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        rows.push(['', '', 'TOTAL', total.toFixed(2)]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        // Add BOM (Byte Order Mark) so Excel reads UTF-8 correctly
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_${new Date().toLocaleDateString('en-CA')}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Delay revoke so the browser has time to start the download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`Exported ${dataToExport.length} transactions to CSV!`);
    }, [filteredExpenses, expenses]);

    // ─── Daily Trends (Bar Chart) ──────────────────────────
    const dailyTrends = useMemo(() => {
        const days = {};
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Initialize days up to today or full month
        const maxDay = now.getDate();
        for (let i = 1; i <= maxDay; i++) {
            days[i] = 0;
        }

        thisMonthExpenses.forEach((e) => {
            const d = new Date(e.date);
            const day = d.getDate();
            if (days[day] !== undefined) {
                days[day] += parseFloat(e.amount);
            }
        });

        return {
            labels: Object.keys(days).map(d => `Day ${d}`),
            datasets: [{
                label: 'Daily Spending',
                data: Object.values(days),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        };
    }, [thisMonthExpenses, currentMonth, currentYear, now]);

    // ─── Category Chart ──────────────────────────────────────
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category_name] = (acc[curr.category_name] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

    const chartData = {
        labels: Object.keys(categoryTotals),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: chartColors,
            borderColor: darkMode ? '#1f2937' : '#ffffff',
            borderWidth: 3,
        }]
    };

    const uniqueCategories = [...new Set(expenses.map(e => e.category_name))];

    // ─── Category Breakdown Data ─────────────────────────────
    const categoryBreakdown = useMemo(() => {
        return Object.entries(categoryTotals)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
                color: chartColors[Object.keys(categoryTotals).indexOf(name) % chartColors.length]
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [categoryTotals, totalExpenses]);

    // ─── Weekly Spending (last 7 days) ───────────────────────
    const weeklySpending = useMemo(() => {
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const dayTotal = expenses
                .filter(e => e.date && new Date(e.date).toLocaleDateString('en-CA') === dateStr)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
            days.push({
                day: dayNames[d.getDay()],
                date: d.getDate(),
                total: dayTotal,
                isToday: i === 0
            });
        }
        const maxDay = Math.max(...days.map(d => d.total), 1);
        return { days, maxDay };
    }, [expenses]);

    const weeklyPeakDay = weeklySpending.days.reduce(
        (best, day) => (day.total > best.total ? day : best),
        weeklySpending.days[0]
    );

    const topCategory = categoryBreakdown[0];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Modals */}
            {editingExpense && (
                <EditModal expense={editingExpense} categories={categories} onSave={handleEditSave} onClose={() => setEditingExpense(null)} />
            )}
            {showBudgetModal && (
                <BudgetModal currentBudget={monthlyBudget} onSave={handleBudgetSave} onClose={() => setShowBudgetModal(false)} />
            )}
            {deletingId && (
                <ConfirmModal
                    message="Are you sure you want to delete this expense? This action cannot be undone."
                    onConfirm={() => handleDelete(deletingId)}
                    onCancel={() => setDeletingId(null)}
                />
            )}

            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold font-sans tracking-tight text-blue-600 dark:text-blue-400">
                                💰 Expense Tracker
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-900 dark:text-white font-medium hidden sm:block">Hello, {user?.name}</span>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={() => { localStorage.clear(); navigate('/login'); }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <LogOut size={16} className="mr-1" /> Logout
                            </button>
                        </div>
                    </div>
                    {/* Secondary Nav for Mobile/Desktop */}
                    <div className="flex items-center gap-6 pb-2 overflow-x-auto hide-scrollbar">
                        <Link to="/" className="text-sm font-bold border-b-2 border-blue-600 pb-1 text-blue-600 whitespace-nowrap">Dashboard</Link>
                        <Link to="/savings" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Savings & Goals</Link>
                        <Link to="/analytics" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Deep Analytics</Link>
                        <Link to="/transactions" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-1 whitespace-nowrap transition-colors">Transactions</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-5">

                {/* ═══ FEATURE 1: Budget Progress Ring ═══ */}
                <BudgetRing
                    spent={thisMonthTotal}
                    budget={monthlyBudget}
                    onEditBudget={() => setShowBudgetModal(true)}
                />

                {/* ═══ FEATURE 3: Summary Stat Cards (with month-over-month) ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={DollarSign} label="Total Expenses" value={formatCurrency(totalExpenses)} subtitle="All time" color="bg-blue-500" />
                    <StatCard icon={Calendar} label="This Month" value={formatCurrency(thisMonthTotal)} subtitle={`${thisMonthExpenses.length} transactions`} color="bg-emerald-500" change={monthOverMonthChange} />
                    <StatCard icon={TrendingUp} label="Avg Daily Spend" value={formatCurrency(avgDailySpend)} subtitle="This month" color="bg-amber-500" />
                    <StatCard icon={Target} label="Biggest Expense" value={biggestExpense ? formatCurrency(biggestExpense.amount) : '—'} subtitle={biggestExpense ? biggestExpense.category_name : 'No expenses yet'} color="bg-purple-500" />
                </div>

                {/* High Spending Alert */}
                {aboveAverage.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-xl">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    High Spending Alert
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>You have {aboveAverage.length} expense(s) that are above your overall average spending amount. Consider reviewing them:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {aboveAverage.slice(0, 3).map(exp => (
                                            <li key={`alert-${exp.expense_id}`}>
                                                {formatCurrency(exp.amount)} on {exp.category_name} ({new Date(exp.date).toLocaleDateString()})
                                            </li>
                                        ))}
                                        {aboveAverage.length > 3 && <li>...and {aboveAverage.length - 3} more.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ NEW: OVER BUDGET ALERT ═══ */}
                {monthlyBudget > 0 && thisMonthTotal > monthlyBudget && (
                    <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse-slow mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                    🚨 Monthly Budget Exceeded!
                                </h3>
                                <div className="mt-1 flex text-sm flex-col text-red-700 dark:text-red-400">
                                    <p>You have spent ₹{thisMonthTotal.toLocaleString('en-IN')}, which is ₹{(thisMonthTotal - monthlyBudget).toLocaleString('en-IN')} over your threshold of ₹{monthlyBudget.toLocaleString('en-IN')}. Please pause non-essential expenses!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Add Expense + Quick Add + Insights */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Add Expense Form */}
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white mb-4">Add New Expense</h3>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                                    <input type="number" required step="1" value={amount} onChange={e => setAmount(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white px-4 py-2.5 transition-shadow" />
                                    {amount && monthlyBudget > 0 && (parseFloat(amount) + thisMonthTotal > monthlyBudget) && (
                                        <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1 animate-bounce-subtle">
                                            <AlertTriangle size={10} /> Careful! This will put you ₹{(parseFloat(amount) + thisMonthTotal - monthlyBudget).toLocaleString('en-IN')} over budget.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white appearance-auto transition-shadow">
                                        <option value="">Select a category...</option>
                                        {categories.map(c => (
                                            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 sm:text-sm transition-shadow" />
                                </div>
                                {isDiningSelected && (
                                    <div className="animate-fade-in">
                                        <label className="flex items-center justify-between mb-1">
                                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Time</span>
                                            <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/40 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800/50">Impulse Tracking ⏱️</span>
                                        </label>
                                        <input type="time" value={expenseTime} onChange={e => setExpenseTime(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white px-4 py-2.5 sm:text-sm transition-shadow" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white px-4 py-2.5 transition-shadow" placeholder="Optional notes" />
                                </div>
                                {/* ═══ NEW: Payment Method Toggle ═══ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('UPI')}
                                            className={`flex-1 flex justify-center items-center py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                                                paymentMethod === 'UPI' 
                                                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            <CreditCard size={16} className="mr-2" /> UPI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('Cash')}
                                            className={`flex-1 flex justify-center items-center py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                                                paymentMethod === 'Cash' 
                                                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            <DollarSign size={16} className="mr-2" /> Cash
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center transition-colors">
                                    <Plus size={16} className="mr-1" /> Add Record
                                </button>
                                {formError && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {formError}
                                    </p>
                                )}
                            </form>
                        </div>

                        {/* ═══ NEW: Quick-Add Presets ═══ */}
                        <QuickAdd presets={QUICK_PRESETS} categories={categories} onAdd={handleQuickAdd} />

                        {/* ═══ NEW: Smart Insights Panel ═══ */}
                        <InsightsPanel insights={insights} />
                    </div>

                    {/* Chart & Tables */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Doughnut - Spending by Category */}
                            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[420px]">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
                                {Object.keys(categoryTotals).length > 0 ? (
                                    <div className="flex-1 flex justify-center items-center min-h-[240px]">
                                        <Doughnut data={chartData} options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'bottom', labels: { color: darkMode ? '#cbd5e1' : '#374151', padding: 12, usePointStyle: true, pointStyleWidth: 10 } }
                                            },
                                            cutout: '65%'
                                        }} />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">No expenses yet</div>
                                )}
                                {/* Category Breakdown Table */}
                                {categoryBreakdown.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {categoryBreakdown.map((cat) => (
                                            <div key={cat.name} className="flex items-center gap-3">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                                                <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{Math.round(cat.percentage)}%</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white w-20 text-right">{formatCurrency(cat.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ═══ FEATURE 4: Monthly Spending Trends Bar Chart ═══ */}
                            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[420px]">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white mb-4">Spending Trends</h3>
                                <div className="flex-1 flex justify-center items-center min-h-[240px]">
                                    <Bar data={dailyTrends} options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                grid: { display: false },
                                                ticks: { 
                                                    color: darkMode ? '#94a3b8' : '#6b7280', 
                                                    font: { size: 10 },
                                                    autoSkip: true,
                                                    maxRotation: 0
                                                }
                                            },
                                            y: {
                                                grid: { color: darkMode ? 'rgba(148,163,184,0.1)' : 'rgba(107,114,128,0.1)' },
                                                ticks: {
                                                    color: darkMode ? '#94a3b8' : '#6b7280',
                                                    font: { size: 11 },
                                                    callback: (v) => `₹${v.toLocaleString('en-IN')}`
                                                }
                                            }
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>

                {/* Overview + Savings */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overview</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">A compact snapshot of your month at a glance.</p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                {thisMonthExpenses.length} entries this month
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-5 border border-blue-100 dark:border-blue-800/40">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300 mb-1">This Month</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">₹{thisMonthTotal.toLocaleString('en-IN')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average daily spend: ₹{Math.round(avgDailySpend).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-5 border border-emerald-100 dark:border-emerald-800/40">
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 mb-1">Top Category</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{topCategory ? topCategory.name : 'No data'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {topCategory ? `₹${topCategory.amount.toLocaleString('en-IN')} spent so far` : 'Start logging expenses to see your spend mix.'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 p-5 border border-violet-100 dark:border-violet-800/40">
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-1">Weekly Peak</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{weeklyPeakDay.day}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">₹{weeklyPeakDay.total.toLocaleString('en-IN')} spent on your busiest day this week.</p>
                            </div>
                            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-5 border border-amber-100 dark:border-amber-800/40">
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-1">Savings Potential</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">₹{Math.max(monthlyBudget - thisMonthTotal, 0).toLocaleString('en-IN')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Room left in your budget this month.</p>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-start min-h-[220px] group">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-4 w-fit">
                            <Sparkles size={14} /> Growth focus
                        </div>
                        <h3 className="text-xl font-bold mb-2">Grow Your Wealth</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            You have ₹{Math.max(monthlyBudget - thisMonthTotal, 0).toLocaleString('en-IN')} potential savings this month. Move that into goals before it disappears.
                        </p>
                        <Link to="/savings" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl font-bold transition-all w-fit mt-6">
                            Manage Savings Goals <ChevronRight size={18} />
                        </Link>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Projected month-end</p>
                        <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">₹{Math.round(avgDailySpend * daysInMonth).toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on your current pace.</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Impulse loss</p>
                        <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">₹{behavioralData.impulse.total.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Money tied to non-essential spends.</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Tracked transactions</p>
                        <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{expenses.length}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All entries visible in one place.</p>
                    </div>
                </div>
                </div>
            </div>

            {/* ═══ FEATURE 5: Search & Filter + Transactions Table ═══ */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
                                        Recent Transactions
                                        <span className="ml-2 text-sm font-normal text-gray-400">({filteredExpenses.length})</span>
                                    </h3>
                                    {/* ═══ NEW: Export CSV Button ═══ */}
                                    <button
                                        onClick={exportToCSV}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                </div>

                                {/* Search & Filter Bar */}
                                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by description, category, or amount..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-auto transition-shadow"
                                    >
                                        <option value="">All Categories</option>
                                        {uniqueCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterPeriod}
                                        onChange={e => setFilterPeriod(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-auto transition-shadow"
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredExpenses.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                {expenses.length === 0 ? '📝 No expenses recorded yet. Add your first one!' : '🔍 No matching transactions found.'}
                                            </td></tr>
                                        ) : filteredExpenses.map(exp => {
                                            const catIndex = Object.keys(categoryTotals).indexOf(exp.category_name);
                                            const catColor = chartColors[catIndex % chartColors.length];
                                            return (
                                            <tr key={exp.expense_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                    {new Date(exp.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2.5 py-0.5 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full"
                                                        style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }}></span>
                                                        {exp.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                                                    <div className="truncate mb-1">{exp.description || '—'}</div>
                                                    <div className="flex gap-1 items-center">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${exp.paymentMethod === 'UPI' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300'}`}>
                                                            {exp.paymentMethod}
                                                        </span>
                                                        {exp.isImpulse && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 flex items-center gap-0.5">
                                                                <Zap size={10} /> Impulse
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(exp.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* ═══ FEATURE 2: Edit Button ═══ */}
                                                        <button
                                                            onClick={() => setEditingExpense(exp)}
                                                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                                            title="Edit expense"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingId(exp.expense_id)}
                                                            className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                            title="Delete expense"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
            </main>

            {/* AI Advisor Chat Widget */}
            <AiChat context={{ expenses, budget: monthlyBudget, thisMonthTotal, lastMonthTotal, categoryTotals, avgDailySpend }} />

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700 mt-8 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            💰 <span className="font-semibold text-blue-600 dark:text-blue-400">Expense Tracker</span> — Smart budgeting for college students
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Track • Analyze • Save | Built with ❤️
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
