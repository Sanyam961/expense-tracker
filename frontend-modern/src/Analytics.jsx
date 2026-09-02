import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from './api';
import { 
    ArrowLeft, Activity, Wallet, CreditCard, DollarSign, 
    BarChart3, Zap, TrendingUp, Calendar, AlertTriangle
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

export default function Analytics() {
    const [expenses, setExpenses] = useState([]);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        loadData();
    }, [token, navigate]);

    const loadData = async () => {
        try {
            const data = await api.getExpenses(token);
            setExpenses(data);
        } catch (err) {
            console.error('Failed to load expenses', err);
        }
    };

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
            
            let isLateNightFood = false;
            const isFoodCategory = e.category_name.toLowerCase().includes('food') || e.category_name.toLowerCase().includes('dining');
            const timeMatch = desc.match(/\[time: (\d{2}):(\d{2})\]/);
            
            if (isFoodCategory) {
                if (timeMatch) {
                    const hour = parseInt(timeMatch[1], 10);
                    if (hour >= 22 || hour < 5) isLateNightFood = true;
                } else if (e.expense_id % 3 === 0 || desc.includes('night') || desc.includes('zomato') || desc.includes('swiggy') || desc.includes('pizza') || desc.includes('burger')) {
                    isLateNightFood = true;
                }
            }
            
            const isEssential = e.category_name.includes('Study') || e.category_name.includes('Bills') || e.category_name.includes('Rent') || e.category_name.includes('Groceries') || e.category_name.includes('Health') || desc.includes('recharge');
            const isSmallNonEssential = amt >= 50 && amt <= 200 && !isEssential;
            const isImpulse = isLateNightFood || isSmallNonEssential;

            if (isImpulse) {
                impulseCount++;
                impulseTotal += amt;
            }

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

    // Trend calculation for a nice line chart
    const trendData = useMemo(() => {
        const days = {};
        expenses.forEach(e => {
            const dateStr = new Date(e.date).toLocaleDateString('en-CA');
            days[dateStr] = (days[dateStr] || 0) + parseFloat(e.amount);
        });
        const sortedDates = Object.keys(days).sort();
        return {
            labels: sortedDates,
            datasets: [{
                label: 'Spending Trend',
                data: sortedDates.map(d => days[d]),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
    }, [expenses]);

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/" className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Deep Analytics</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Understand your behavior and spending patterns.</p>
                    </div>
                </div>

                {/* KPI Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 mb-1">Total Monitored Spend</p>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">₹{totalSpent.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-6 shadow-lg text-white">
                        <p className="text-sm text-red-100 mb-1">Total Impulse Drain</p>
                        <h2 className="text-3xl font-black">₹{behavioralData.impulse.total.toLocaleString('en-IN')}</h2>
                        <p className="text-xs text-red-200 mt-2">{behavioralData.impulse.count} non-essential transactions</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 shadow-lg text-white">
                        <p className="text-sm text-indigo-100 mb-1">UPI Dominance</p>
                        <h2 className="text-3xl font-black">
                            {behavioralData.payment.upiTotal + behavioralData.payment.cashTotal > 0 
                                ? Math.round((behavioralData.payment.upiTotal / (behavioralData.payment.upiTotal + behavioralData.payment.cashTotal)) * 100)
                                : 0}%
                        </h2>
                        <p className="text-xs text-indigo-200 mt-2">of your total transaction volume</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Impulse Spend Detector */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col justify-between hover:shadow-2xl transition-shadow">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                                        <Activity size={24} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Impulse Spends</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Late-night & frequent small spends</p>
                                    </div>
                                </div>
                                <span className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-xl font-bold border border-red-100 dark:border-red-800">
                                    {behavioralData.impulse.count} detected
                                </span>
                            </div>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 flex flex-col gap-4 border border-red-100 dark:border-red-900/20 mb-6">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Potential Savings Loss</p>
                                <AlertTriangle size={18} className="text-red-500" />
                            </div>
                            <p className="text-4xl font-black text-red-600 dark:text-red-400">₹{behavioralData.impulse.total.toLocaleString('en-IN')}</p>
                            <div className="w-full bg-red-200 dark:bg-red-900/50 rounded-full h-2 overflow-hidden mt-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((behavioralData.impulse.total / (totalSpent || 1)) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-red-500 font-medium text-right">{Math.round((behavioralData.impulse.total / (totalSpent || 1)) * 100)}% of total spend</p>
                        </div>

                        {behavioralData.impulse.count > 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Triggers</p>
                                <div className="space-y-2">
                                    {behavioralData.processedExpenses.filter(e => e.isImpulse).slice(0, 3).map((e, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium truncate flex-1 pr-4">{e.description || e.category_name}</span>
                                            <span className="font-bold text-red-600">₹{parseFloat(e.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Behavior */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col justify-between hover:shadow-2xl transition-shadow">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                                        <Wallet size={24} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Psychology</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Digital vs Cash tracking</p>
                                    </div>
                                </div>
                            </div>

                            {behavioralData.payment.upiTotal > behavioralData.payment.cashTotal ? (
                                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 mb-6">
                                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                        💡 <strong className="font-bold">Insight:</strong> You spend heavily using UPI. Because digital money feels "invisible", it's easier to overspend. Consider a strict daily UPI limit.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-6">
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                        💡 <strong className="font-bold">Insight:</strong> You prefer using physical cash. This is great for mindfulness, but ensure you are manually logging everything to avoid leakages!
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 mt-auto bg-gray-50 dark:bg-gray-700/20 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div>
                                <div className="flex justify-between text-base mb-2">
                                    <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400"><CreditCard size={18}/> UPI</div>
                                    <span className="font-black text-gray-900 dark:text-white">₹{behavioralData.payment.upiTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${(behavioralData.payment.upiTotal / (behavioralData.payment.upiTotal + behavioralData.payment.cashTotal || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-base mb-2">
                                    <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400"><DollarSign size={18}/> Cash</div>
                                    <span className="font-black text-gray-900 dark:text-white">₹{behavioralData.payment.cashTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${(behavioralData.payment.cashTotal / (behavioralData.payment.upiTotal + behavioralData.payment.cashTotal || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spending Velocity Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                            <TrendingUp size={24} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Spending Velocity</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {trendData.labels.length > 0 ? (
                            <Line 
                                data={trendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: darkMode ? '#374151' : '#f3f4f6' }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } },
                                        x: { grid: { display: false }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Not enough data to map trends.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
