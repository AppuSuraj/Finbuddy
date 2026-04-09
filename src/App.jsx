import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import BankAccounts from './components/BankAccounts';
import Settings from './components/Settings';
import Importer from './components/Importer';
import './App.css'; // Keeps standard import structure

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/accounts" element={<BankAccounts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<Importer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
