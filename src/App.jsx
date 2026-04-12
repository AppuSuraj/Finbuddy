import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Settings from './components/Settings';
import Importer from './components/Importer';
import Auth from './components/Auth';
import AdminConsole from './components/AdminConsole';
import { supabase } from './supabaseClient';
import './App.css'; // Keeps standard import structure

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) {
     return <Auth />;
  }

  const sidebarWidth = isSidebarCollapsed ? '80px' : '250px';

  return (
    <Router>
      <div className="app-container" style={{ gridTemplateColumns: `${sidebarWidth} 1fr` }}>
        <Sidebar session={session} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard session={session} />} />
            <Route path="/portfolio" element={<Portfolio session={session} />} />
            <Route path="/settings" element={<Settings session={session} />} />
            <Route path="/import" element={<Importer session={session} />} />
            <Route path="/admin" element={<AdminConsole session={session} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
