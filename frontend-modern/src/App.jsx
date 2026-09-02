import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Auth from './Auth';
import Savings from './Savings';
import Analytics from './Analytics';
import Transactions from './Transactions';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path='/login' element={<Auth isLogin={true} />} />
                <Route path='/register' element={<Auth isLogin={false} />} />
                <Route path='/' element={<Dashboard />} />
                <Route path='/savings' element={<Savings />} />
                <Route path='/analytics' element={<Analytics />} />
                <Route path='/transactions' element={<Transactions />} />
                <Route path='*' element={<Navigate to='/' />} />
            </Routes>
        </Router>
    );
}
