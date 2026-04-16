import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Settings from './components/Settings';
import Importer from './components/Importer';
import Auth from './components/Auth';
import AdminConsole from './components/AdminConsole';
import { supabase } from './supabaseClient';
import './App.css';

// ── Dashboard data cache lives here so navigation never re-fetches ──
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);

  // Dashboard data — fetched once after login, never reset on navigation
  const [dashboardData, setDashboardData] = useState(null);   // null = not yet fetched
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [brokerFilter, setBrokerFilter] = useState('All'); // All, Zerodha, Groww

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setDashboardData(null); // Clear cache on sign-out
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Responsive sidebar collapse ──
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !isSidebarCollapsed) setIsSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarCollapsed]);

  // ── Dashboard data fetch — only runs once per session ──
  const fetchDashboardData = useCallback(async (sess) => {
    if (!sess) return;
    setDashboardLoading(true);
    const isAdmin = sess.user.email.toLowerCase() === 'surajsan1998@gmail.com';

    // Fresh fetch without explicit headers (not supported by Supabase client)
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', sess.user.id)
      .order('name', { ascending: true });

    // ── Auto-Fix Routine: Migrate legacy assets to structured columns ──
    if (assetData && assetData.length > 0) {
      const needsFix = assetData.filter(a => !a.quantity || a.quantity === 0);
      if (needsFix.length > 0) {
        console.log(`Auto-Fix: Migrating ${needsFix.length} legacy assets...`);
        await Promise.all(needsFix.map(async (a) => {
          const qtyMatch = a.name.match(/\((\d+(?:\.\d+)?)\s*shares\)/i);
          if (qtyMatch) {
            const qty = Number(qtyMatch[1]);
            const ltp = a.buy_price || (a.value / qty); // Estimated ltp if missing
            await supabase.from('assets')
              .update({ quantity: qty, ltp: ltp })
              .eq('id', a.id)
              .eq('user_id', sess.user.id);
          }
        }));
        // Re-fetch clean data after migration
        return fetchDashboardData(sess);
      }
    }

    if (!assetData || assetData.length === 0) {
      setDashboardData({ assets: [], netWorth: 0, weather: { percent: 50, articleCount: 0 }, oracleData: null, projectionTimeline: [], intelligenceData: null });
      setDashboardLoading(false);
      return;
    }

    const total = assetData.reduce((acc, curr) => acc + Number(curr.value), 0);
    const sorted = [...assetData].sort((a, b) => Number(b.value) - Number(a.value));

    // Build name list for API calls
    const top10Names = sorted.slice(0, 10).map(a => encodeURIComponent(a.name.split('(')[0].trim())).join(',');
    const top4Names = sorted.slice(0, 4).map(a => encodeURIComponent(a.name.split('(')[0].trim())).join(',');
    const oracleNames = encodeURIComponent(sorted.slice(0, 5).map(a => a.name.split('(')[0].trim()).join(','));

    // Start all heavy API calls in parallel
    const [sentimentRes, oracleRes, analyticsRes, pulseRes] = await Promise.allSettled([
      fetch(`/api/portfolio-sentiment?names=${isAdmin ? top10Names : top4Names}${isAdmin ? '&deep=true' : ''}`),
      fetch(`/api/oracle?names=${oracleNames}`),
      fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assets: sorted }) }),
      fetch('/api/market-pulse')
    ]);

    let weather = { percent: 50, articleCount: 0 };
    let intelligenceData = null;
    let oracleData = null;
    let projectionTimeline = [];
    let analyticsData = null;
    let marketPulse = null;

    if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
      const s = await sentimentRes.value.json();
      if (typeof s.percent === 'number') {
        weather = { percent: s.percent, articleCount: s.articleCount || 0 };
        if (isAdmin && s.breakdown) intelligenceData = s.breakdown;
      }
    }

    if (oracleRes.status === 'fulfilled' && oracleRes.value.ok) {
      const pred = await oracleRes.value.json();
      oracleData = pred;
      const months = ['Today', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'];
      let cur = total;
      const mg = (pred.growthPercent || 4.0) / 6;
      projectionTimeline = months.map(m => {
        const point = { month: m, 'Projected Value': Math.round(cur) };
        cur = cur * (1 + mg / 100);
        return point;
      });
    } else {
      oracleData = { growthPercent: 4.0 };
      const months = ['Today', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'];
      let cur = total;
      projectionTimeline = months.map(m => {
        const point = { month: m, 'Projected Value': Math.round(cur) };
        cur = cur * (1 + (4.0 / 6) / 100);
        return point;
      });
    }

    if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
      analyticsData = await analyticsRes.value.json();
    }

    if (pulseRes.status === 'fulfilled' && pulseRes.value.ok) {
      marketPulse = await pulseRes.value.json();
    }

    setDashboardData({ assets: assetData, netWorth: total, weather, oracleData, projectionTimeline, intelligenceData, analyticsData, marketPulse });
    setDashboardLoading(false);
  }, []);

  // Trigger fetch when session is established (once)
  useEffect(() => {
    if (session && dashboardData === null && !dashboardLoading) {
      fetchDashboardData(session);
    }
  }, [session, dashboardData, dashboardLoading, fetchDashboardData]);

  if (loading) return null;
  if (!session) return <Auth />;

  const sidebarWidth = isSidebarCollapsed ? '80px' : '250px';

  return (
    <Router>
      <div className="app-container" style={{ gridTemplateColumns: `${sidebarWidth} 1fr` }}>
        <Sidebar session={session} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <Dashboard
                session={session}
                data={dashboardData}
                loading={dashboardLoading}
                onRefresh={() => { setDashboardData(null); }}
                brokerFilter={brokerFilter}
                onBrokerFilterChange={setBrokerFilter}
              />
            } />
            <Route path="/portfolio" element={
              <Portfolio 
                session={session} 
                assets={dashboardData?.assets || []}
                loading={dashboardLoading}
                onPortfolioChange={() => { setDashboardData(null); }} 
                brokerFilter={brokerFilter} 
                onBrokerFilterChange={setBrokerFilter} 
              />
            } />
            <Route path="/settings" element={<Settings session={session} onDataWiped={() => setDashboardData(null)} />} />
            <Route path="/import" element={<Importer session={session} onImportComplete={() => setDashboardData(null)} />} />
            <Route path="/admin" element={<AdminConsole session={session} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
