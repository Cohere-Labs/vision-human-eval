import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import App from './App';
import Dashboard from './Dashboard';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <div>
        <nav className="p-4 bg-gray-200 flex justify-between">
          <Link to="/" className="mr-4 font-bold">Chatbot Arena</Link>
          <Link to="/dashboard" className="font-bold">Dashboard</Link>
        </nav>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRouter; 