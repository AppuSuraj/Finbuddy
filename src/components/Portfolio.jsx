import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { TrendingUp, Layers, Plus, Search, RefreshCw, LayoutGrid, List, ArrowLeft, Newspaper, Info, Edit3, ShieldCheck } from 'lucide-react';

const SECTORS = [
  'Aerospace & Defense', 'Agricultural Food & other Products', 'Agricultural, Commercial & Construction Vehicles', 'Auto Components', 'Automobiles', 'Banks', 'Beverages', 'Capital Markets', 'Cement & Cement Products', 'Chemicals & Petrochemicals', 'Cigarettes & Tobacco Products', 'Commercial Services & Supplies', 'Construction', 'Consumable Fuels', 'Consumer Durables', 'Diversified', 'Diversified FMCG', 'Diversified Metals', 'Electrical Equipment', 'Engineering Services', 'Entertainment', 'Ferrous Metals', 'Fertilizers & Agrochemicals', 'Finance', 'Financial Technology (Fintech)', 'Food Products', 'Gas', 'Healthcare Equipment & Supplies', 'Healthcare Services', 'Household Products', 'Industrial Manufacturing', 'Industrial Products', 'Insurance', 'IT - Hardware', 'IT - Services', 'IT - Software', 'Leisure Services', 'Media', 'Metals & Minerals Trading', 'Minerals & Mining', 'Non - Ferrous Metals', 'Oil', 'Other Construction Materials', 'Other Consumer Services', 'Other Utilities', 'Paper, Forest & Jute Products', 'Personal Products', 'Petroleum Products', 'Pharmaceuticals & Biotechnology', 'Power', 'Printing & Publication', 'Realty', 'Retailing', 'Telecom - Equipment & Accessories', 'Telecom - Services', 'Textiles & Apparels', 'Transport Infrastructure', 'Transport Services', 'Uncategorized'
];

export default function Portfolio({ session, onPortfolioChange, brokerFilter, onBrokerFilterChange }) {
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const ms = Date.now() - (Number(timestamp) * 1000);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const smartResolveTicker = (rawName) => {
    if (!rawName) return '';
    let name = String(rawName).toUpperCase().trim();
    const suffixes = [' LTD', ' LIMITED', ' CORP', ' INC', ' REITY', ' INFRA', ' CO', ' INDUSTRIES', ' SERVICES', ' ENTERPRISES'];
    suffixes.forEach(s => {
      if (name.includes(s)) name = name.substring(0, name.indexOf(s)).trim();
    });
    const mappings = { 'HDFC BANK': 'HDFCBANK', 'TATA POWER': 'TATAPOWER', 'KOTAK MAHINDRA BANK': 'KOTAKBANK', 'ICICI BANK': 'ICICIBANK', 'ADANI ENTERPRISES': 'ADANIENT' };
    if (mappings[name]) return mappings[name];
    if (name.includes('(')) name = name.split('(')[0].trim();
    return name.split(' ')[0].replace(/[^A-Z0-9&]/g, '');
  };

  const Sparkline = ({ name }) => {
    const [data, setData] = useState([]);
    useEffect(() => {
       let isMounted = true;
       const ticker = smartResolveTicker(name);
       fetch(`/api/sparkline?symbol=${ticker}.NS`).then(r => r.json()).then(res => {
          if (!res.error && res.length > 0 && isMounted) setData(res);
          else {
             fetch(`/api/sparkline?symbol=${ticker}.BO`).then(r => r.json()).then(r2 => {
                if (!r2.error && r2.length > 0 && isMounted) setData(r2);
             });
          }
       }).catch(()=>{});
       return () => isMounted = false;
    }, [name]);
    
    if (data.length === 0) return <div style={{width:'80px', height:'30px'}} />;
    const isUp = data[data.length-1].close >= data[0].close;
    return (
      <div style={{ width: '80px', height: '30px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Line type="monotone" dataKey="close" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  const getScrutinySummary = (data) => {
    if (!data) return null;
    let summary = "";
    const signals = [];
    
    // Overall Trend Summary
    if (data.trend?.includes('Strong Uptrend')) summary = "This stock is in a powerful bullish cycle, consistently trading above its long-term moving averages.";
    else if (data.trend?.includes('Strong Downtrend')) summary = "Bearish dominance is clear; the stock is struggling to find support below its key moving averages.";
    else if (data.trend?.includes('Recovery')) summary = "The stock is attempting a recovery, recently breaking back above its 50-day average.";
    else if (data.trend?.includes('Pullback')) summary = "Currently in a short-term pullback within a larger uptrend; watch for support at DMA 200.";
    else summary = "The stock is currently in a consolidation phase, seeking a clear direction.";

    // Actionable Technical Signals
    if (data.rsi > 70) signals.push("It is in the 'Overbought' zone (RSI > 70), which often signals reaching a peak.");
    if (data.rsi < 30) signals.push("It is currently 'Oversold' (RSI < 30), which can lead to a reversal or a 'dead cat' bounce.");
    if (data.crossoverSignal === 'Golden Cross') signals.push("A 'Golden Cross' has triggered—a strong long-term momentum indicator.");
    if (data.crossoverSignal === 'Death Cross') signals.push("A 'Death Cross' is active, warning of a potential deeper correction.");
    if (data.pattern?.signal === 'Bullish') signals.push(`The ${data.pattern.name} pattern recently formed, showing institutional buying pressure.`);
    if (data.pattern?.signal === 'Bearish') signals.push(`The ${data.pattern.name} pattern suggests caution as sellers are gaining control.`);
    
    return { main: summary, tags: signals };
  };

  const [assetAllocation, setAssetAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', value: '', color: '#2dd4bf', buy_price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter/Sort/View State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value-desc'); 
  const [viewMode, setViewMode] = useState('list'); // list, table
  const [chartView, setChartView] = useState('asset'); // asset, sector

  // Insights State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [fetchingInsights, setFetchingInsights] = useState(false);
  const [deepScanStates, setDeepScanStates] = useState({});
  const [isEditingSector, setIsEditingSector] = useState(false);
  const [cooldown, setCooldown] = useState(0); 
  const [selectedSectorFilter, setSelectedSectorFilter] = useState(null);
  const [deepScrutinyData, setDeepScrutinyData] = useState(null);
  const [deepScrutinyLoading, setDeepScrutinyLoading] = useState(false);
  const isAdmin = session?.user?.email?.toLowerCase() === 'surajsan1998@gmail.com';

  useEffect(() => {
    fetchAssets();
    
    // Initialize Cooldown from LocalStorage (Safe check)
    if (session?.user?.id) {
       const lastSync = localStorage.getItem(`finbuddy_last_sync_${session.user.id}`);
       if (lastSync) {
         const diff = Math.floor((Date.now() - Number(lastSync)) / 1000);
         if (diff < 300) setCooldown(300 - diff);
       }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function fetchAssets() {
    const { data, error } = await supabase.from('assets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });
    if (!error && data) {
      setAssetAllocation(data);
    }
    setLoading(false);
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Add defensive check in case the user has not migrated Supabase DB yet
    const { error } = await supabase.from('assets').insert([
      { 
        name: newAsset.name, 
        value: Number(newAsset.value), 
        color: newAsset.color,
        buy_price: newAsset.buy_price ? Number(newAsset.buy_price) : null,
        user_id: session.user.id
      }
    ]);

    if (!error) {
      setShowForm(false);
      setNewAsset({ name: '', value: '', color: '#2dd4bf', buy_price: '' });
      fetchAssets(); 
    }
    setIsSubmitting(false);
  }

  // Engine for Sorting & Filtering
  const filteredAndSortedAssets = useMemo(() => {
    let result = assetAllocation.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBroker = brokerFilter === 'All' || a.broker === brokerFilter;
      return matchesSearch && matchesBroker;
    });
    
    // Apply Sector Filter if active
    if (selectedSectorFilter) {
      result = result.filter(a => (a.sector || 'Uncategorized') === selectedSectorFilter);
    }

    if (sortBy === 'value-desc') {
      result.sort((a, b) => Number(b.value) - Number(a.value));
    } else if (sortBy === 'value-asc') {
      result.sort((a, b) => Number(a.value) - Number(b.value));
    } else if (sortBy === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [assetAllocation, searchQuery, sortBy, selectedSectorFilter]);

  // Yahoo Finance Fetcher Layer
  const fetchPrice = async (ticker, suffix) => {
    try {
      const res = await fetch(`/api/finance/${ticker}.${suffix}`);
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return price ? Number(price) : null;
    } catch {
       return null;
    }
  };

  async function handleRefreshLivePrices() {
    if (!isAdmin && cooldown > 0) {
       alert(`SECURITY COOLDOWN: Please wait ${Math.floor(cooldown / 60)}m ${cooldown % 60}s before syncing again.`);
       return;
    }

    setRefreshing(true);
    let updatedCount = 0;
    const newAllocations = [...assetAllocation];

    // Build a resilient fetch proxy preventing infinite hangs
    const fetchWithTimeout = async (url, ms = 8000) => {
       const controller = new AbortController();
       const id = setTimeout(() => controller.abort(), ms);
       const response = await fetch(url, { signal: controller.signal });
       clearTimeout(id);
       return response;
    };

    const fetchPriceWithTimeout = async (ticker, suffix) => {
      try {
        const res = await fetchWithTimeout(`/api/finance/${ticker}.${suffix}`);
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        return price ? Number(price) : null;
      } catch { return null; }
    };

    let targetAllocations = newAllocations;
    
    if (!isAdmin && targetAllocations.length > 5) {
       targetAllocations = newAllocations.slice(0, 5);
       alert("GUEST ACCOUNT BOUNDARY: Throttling live market scrape to top 5 portfolio assets to prevent massive proxy rate-limiting.");
    }
    
    const promises = targetAllocations.map(async (asset, i) => {
      const ticker = smartResolveTicker(asset.name);
      if (!ticker) return;

      const qtyMatch = asset.name.match(/\((\d+(?:\.\d+)?)\s*shares\)/i);
      const qty = qtyMatch ? Number(qtyMatch[1]) : 1;

      // Fire price and profile scraping massively parallel
      let [priceRes, profileRes] = await Promise.allSettled([
          fetchPriceWithTimeout(ticker, 'NS').then(p => p === null ? fetchPriceWithTimeout(ticker, 'BO') : p),
          (!asset.sector || asset.sector === 'Unknown' || asset.sector === 'Uncategorized') 
             ? fetchWithTimeout(`/api/profile?symbol=${ticker}.NS`).then(r => r.json()) 
             : Promise.resolve({ sector: asset.sector })
      ]);

      const finalPrice = priceRes.status === 'fulfilled' ? priceRes.value : null;
      let sectorStr = asset.sector;
      if (profileRes.status === 'fulfilled' && profileRes.value.sector && profileRes.value.sector !== 'Unknown') {
          sectorStr = profileRes.value.sector;
      }

      if (finalPrice !== null) {
        const newVal = finalPrice * qty;
        newAllocations[i].value = newVal;
        newAllocations[i].sector = sectorStr;
        await supabase.from('assets').update({ value: newVal, sector: sectorStr }).eq('id', asset.id);
        updatedCount++;
      }
    });

    // Wait for all 20+ connections to clear (or timeout at 8s)
    await Promise.allSettled(promises);
    
    setAssetAllocation([...newAllocations]);
    setRefreshing(false);
    
    if (!isAdmin && session?.user?.id) {
       setCooldown(300);
       localStorage.setItem(`finbuddy_last_sync_${session.user.id}`, Date.now().toString());
    }

    if (updatedCount > 0) alert(`Successfully synced ${updatedCount} assets dynamically via Parallel Market Oracle!`);
    else alert('Oracle Timeout or no valid stock tickers identified.');
  };

  const handleDeepScrutiny = async (asset) => {
    if (!isAdmin) {
      alert("Deep Scrutiny is a Premium feature. Please upgrade your account to unlock Institutional Flow & Deep Technical Analysis.");
      return;
    }

    const ticker = smartResolveTicker(asset.name);
    setDeepScrutinyData(null);
    setDeepScrutinyLoading(true);
    try {
      const [techRes, profileRes] = await Promise.allSettled([
        fetch(`/api/deep-scrutiny?symbol=${ticker}.NS`).then(r => r.ok ? r.json() : fetch(`/api/deep-scrutiny?symbol=${ticker}.BO`).then(r2 => r2.json())),
        fetch(`/api/profile?symbol=${ticker}.NS`).then(r => r.json()),
      ]);
      const tech = techRes.status === 'fulfilled' ? techRes.value : null;
      const prof = profileRes.status === 'fulfilled' ? profileRes.value : null;
      if (prof?.sector && prof.sector !== 'Unknown') {
        await supabase.from('assets').update({ sector: prof.sector }).eq('id', asset.id);
        fetchAssets();
        if (selectedAsset?.id === asset.id) setSelectedAsset({...selectedAsset, sector: prof.sector});
      }
      setDeepScrutinyData(tech);
    } catch(e) { setDeepScrutinyData(null); }
    setDeepScrutinyLoading(false);
  };

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset);
    setFetchingInsights(true);
    setInsightsData(null);
    setDeepScrutinyData(null);
    setIsEditingSector(false);
    
    // Parse ticker name
    const ticker = smartResolveTicker(asset.name);

    try {
      const queryName = encodeURIComponent(asset.name);
      const querySector = asset.sector ? `&sector=${encodeURIComponent(asset.sector)}` : '';
      let res = await fetch(`/api/insights?symbol=${ticker}.NS&name=${queryName}${querySector}`);
      let data = await res.json();
      
      // Fallback logic
      if (data.error || (!data.profile && (!data.news || data.news.length === 0))) {
         res = await fetch(`/api/insights?symbol=${ticker}.BO&name=${queryName}${querySector}`);
         data = await res.json();
      }

      setInsightsData(data);
    } catch {
      setInsightsData({ error: 'Failed to fetch insights' });
    }
    setFetchingInsights(false);
  };

  const handleManualSectorUpdate = async (newSec) => {
    if (!selectedAsset) return;
    
    const { error } = await supabase.from('assets').update({ sector: newSec }).eq('id', selectedAsset.id);
    if (!error) {
       // Update local state instantly
       const updatedAllocations = assetAllocation.map(a => a.id === selectedAsset.id ? { ...a, sector: newSec } : a);
       setAssetAllocation(updatedAllocations);
       setSelectedAsset({ ...selectedAsset, sector: newSec });
       setIsEditingSector(false);
    }
  };

  const totalValue = assetAllocation.reduce((acc, curr) => acc + Number(curr.value), 0);

  // Deterministic HSL Generator for 58+ Categories
  const getSectorColor = (sector) => {
    if (!sector || sector === 'Uncategorized' || sector === 'Unknown') return '#64748b';
    
    // Hash function to turn string into consistent hue
    let hash = 0;
    for (let i = 0; i < sector.length; i++) {
        hash = sector.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    // Fixed Saturation & Lightness for a premium "Oceanic Dark" feel
    return `hsl(${hue}, 70%, 55%)`;
  };

  const finalGroupedAssets = useMemo(() => {
    if (chartView === 'sector') {
      const sectorMap = {};
      assetAllocation.forEach(a => {
         const sec = a.sector || 'Uncategorized';
         if(!sectorMap[sec]) sectorMap[sec] = { id: sec, name: sec, value: 0, color: getSectorColor(sec), isSector: true };
         sectorMap[sec].value += Number(a.value);
      });
      return Object.values(sectorMap).sort((a,b) => b.value - a.value);
    }
    
    if (assetAllocation.length <= 7) return assetAllocation;
    const sorted = [...assetAllocation].sort((a,b) => Number(b.value) - Number(a.value));
    const top = sorted.slice(0, 6);
    const othersValue = sorted.slice(6).reduce((acc, curr) => acc + Number(curr.value), 0);
    return [
      ...top,
      { id: 'others', name: 'Other Assets', value: othersValue, color: '#475569', isOther: true }
    ];
  }, [assetAllocation, chartView]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Investment Portfolio</h1>
          <p className="text-muted">Track and analyze your live wealth allocation.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
            {['All', 'Zerodha', 'Groww'].map(m => (
              <button
                key={m}
                onClick={() => onBrokerFilterChange(m)}
                style={{
                  padding: '8px 16px', borderRadius: '9px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: brokerFilter === m ? (m === 'Zerodha' ? '#0ea5e9' : m === 'Groww' ? '#10b981' : 'var(--accent-primary)') : 'transparent',
                  color: brokerFilter === m ? '#041014' : 'rgba(255,255,255,0.5)',
                  boxShadow: brokerFilter === m ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshLivePrices} 
            disabled={refreshing || (!isAdmin && cooldown > 0)}
          >
            <RefreshCw size={18} className={refreshing ? "spin-animation" : ""} /> 
            {refreshing ? 'Deep Researching via Screener...' : (cooldown > 0 && !isAdmin ? `Cooldown (${Math.floor(cooldown/60)}m)` : 'Live Quotes')}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : <><Plus size={18}/> Add Asset</>}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-panel animate-in" style={{ marginBottom: '30px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Add New Asset / Category</h3>
          <form style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }} onSubmit={handleAddAsset}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Asset Name (e.g., Reliance Shares)</label>
              <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} style={styles.input} placeholder="e.g. Reliance" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Value (₹)</label>
              <input required type="number" value={newAsset.value} onChange={e => setNewAsset({...newAsset, value: e.target.value})} style={styles.input} placeholder="50000" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Cost Basis (Buy Price)</label>
              <input type="number" value={newAsset.buy_price} onChange={e => setNewAsset({...newAsset, buy_price: e.target.value})} style={styles.input} placeholder="Optional P&L Tracker" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Chart Color Hex</label>
              <input required type="text" value={newAsset.color} onChange={e => setNewAsset({...newAsset, color: e.target.value})} style={styles.input} placeholder="#2dd4bf" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Analyzing Assets from Database...</p>
      ) : assetAllocation.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '40px' }}>
          <p className="text-muted">No assets found. Import from CSV or Add manually.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          <div className="glass-panel delay-1">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} className="text-secondary" /> Asset Allocation
              </h3>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => { setChartView('asset'); setSelectedSectorFilter(null); }} style={{ padding: '6px 12px', background: chartView === 'asset' ? 'var(--accent-primary)' : 'transparent', color: chartView === 'asset' ? '#000' : '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Assets</button>
                <button onClick={() => setChartView('sector')} style={{ padding: '6px 12px', background: chartView === 'sector' ? 'var(--accent-primary)' : 'transparent', color: chartView === 'sector' ? '#000' : '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Sectors</button>
              </div>
            </div>
            <div style={{ height: '350px', position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={finalGroupedAssets}
                    innerRadius={95}
                    outerRadius={125}
                    paddingAngle={3}
                    cornerRadius={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {finalGroupedAssets.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        onClick={() => {
                           if (chartView === 'sector') {
                              setSelectedSectorFilter(entry.name);
                           } else if (!entry.isOther && !entry.isSector) {
                              handleSelectAsset(entry);
                           }
                        }}
                        style={{ cursor: entry.isOther ? 'default' : 'pointer', outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ background: 'rgba(10, 31, 38, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--card-border)', borderRadius: '12px', color: '#fff', fontSize: '14px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.centerText}>
                <p className="text-muted text-sm" style={{ letterSpacing: '1px', textTransform: 'uppercase' }}>Total Wealth</p>
                <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 0 0' }}>₹{totalValue.toLocaleString('en-IN')}</h2>
              </div>
            </div>
          </div>

          <div className="glass-panel delay-2" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '30px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} className="text-secondary" /> Holdings Vault
                {selectedSectorFilter && (
                   <span 
                    onClick={() => setSelectedSectorFilter(null)}
                    style={{ fontSize: '11px', background: 'var(--accent-primary)', color: '#000', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                   >
                     Viewing {selectedSectorFilter} ×
                   </span>
                 )}
              </h3>
              
              <div className="flex gap-2">
                <div style={{ position: 'relative' }}>
                  <Search size={16} className="text-muted" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Search asset..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ ...styles.input, marginTop: 0, paddingLeft: '32px', width: '140px' }} 
                  />
                </div>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  style={{...styles.input, marginTop: 0, width: '130px'}}
                >
                  <option value="value-desc">Highest Value</option>
                  <option value="value-asc">Lowest Value</option>
                  <option value="az">A-Z Name</option>
                </select>
                <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}>
                  {viewMode === 'list' ? <List size={18} /> : <LayoutGrid size={18} />}
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, maxHeight: '400px', pr: '10px' }} className="vault-scroll">
              
              {viewMode === 'list' ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredAndSortedAssets.map((asset, i) => {
                    const percentage = totalValue === 0 ? 0 : ((asset.value / totalValue) * 100).toFixed(1);
                    return (
                      <div key={asset.id} style={styles.assetCard} onClick={() => handleSelectAsset(asset)}>
                        <div className="flex items-center gap-4">
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: asset.color }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: 500, fontSize: '18px' }}>{asset.name}</span>
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content', color: 'var(--text-muted)' }}>
                               {asset.sector ? `⚡ ${asset.sector}` : 'Sector Uncategorized'}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 600, fontSize: '18px' }}>₹{Number(asset.value).toLocaleString('en-IN')}</p>
                          {asset.buy_price ? (
                            <p className={Number(asset.value) >= Number(asset.buy_price) ? "text-success text-sm" : "text-danger text-sm"}>
                              {Number(asset.value) >= Number(asset.buy_price) ? '+' : ''}
                              {(((Number(asset.value) - Number(asset.buy_price)) / Number(asset.buy_price)) * 100).toFixed(1)}% ({percentage}% of port)
                            </p>
                          ) : (
                            <p className="text-muted text-sm">{percentage}% of portfolio</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Identifier</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>7D Trend</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Portfolio Weight</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedAssets.map((asset, i) => {
                      const percentage = totalValue === 0 ? 0 : ((asset.value / totalValue) * 100).toFixed(1);
                      return (
                        <tr key={asset.id} onClick={() => handleSelectAsset(asset)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' }}}>
                          <td style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: asset.color }}></div>
                              <span style={{ fontWeight: 500 }}>{asset.name}</span>
                            </div>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px', width: 'fit-content', color: 'var(--text-muted)' }}>
                               {asset.sector ? `⚡ ${asset.sector}` : 'Sector Uncategorized'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}><Sparkline name={asset.name} /></td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{percentage}%</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>₹{Number(asset.value).toLocaleString('en-IN')}</span>
                            {asset.buy_price && (
                              <span style={{ fontSize: '12px' }} className={Number(asset.value) >= Number(asset.buy_price) ? "text-success" : "text-danger"}>
                                {Number(asset.value) >= Number(asset.buy_price) ? '+' : ''}
                                {(((Number(asset.value) - Number(asset.buy_price)) / Number(asset.buy_price)) * 100).toFixed(1)}% P&L
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {filteredAndSortedAssets.length === 0 && (
                 <p className="text-center text-muted" style={{ padding: '40px 0' }}>No assets match your search.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Translucent Fullscreen Modal Overlay */}
      {selectedAsset && (
        <div 
          className="animate-in" 
          style={{ 
            position: 'fixed', inset: 0, zIndex: 50, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', padding: '20px' 
          }}
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', 
              padding: '40px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
              border: '1px solid var(--accent-primary)', background: 'rgba(10, 25, 30, 0.95)'
            }}
            onClick={e => e.stopPropagation()}
            className="vault-scroll glass-panel"
          >
             <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                   {selectedAsset.name.split('(')[0].trim()} Insights
                </h2>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {!isEditingSector ? (
                        <div className="flex gap-2">
                           <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleDeepScrutiny(selectedAsset)}>
                              <ShieldCheck size={14} className="text-secondary" /> Deep Scrutiny
                           </button>
                           <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsEditingSector(true)}>
                              <Edit3 size={14} /> {selectedAsset.sector || 'Uncategorized'}
                           </button>
                        </div>
                    ) : (
                       <div className="flex items-center gap-2">
                          <select 
                            value={selectedAsset.sector || 'Uncategorized'} 
                            onChange={(e) => handleManualSectorUpdate(e.target.value)}
                            style={{ background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '4px 8px', outline: 'none', fontSize: '13px' }}
                          >
                             {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="text-muted text-xs hover-text-primary" onClick={() => setIsEditingSector(false)}>Cancel</button>
                       </div>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '6px 16px' }} onClick={() => setSelectedAsset(null)}>
                      Close
                    </button>
                 </div>
              </div>
             
             {fetchingInsights ? (
               <div style={{ padding: '60px 0', textAlign: 'center' }}>
                 <p className="text-muted text-lg flex items-center justify-center gap-3"><RefreshCw size={24} className="spin-animation" /> Scraping Financial Terminals...</p>
               </div>
             ) : insightsData ? (
               <div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                   {[
                     { label: 'Current Price', value: insightsData.profile?.currentPrice ? `₹${Number(insightsData.profile.currentPrice).toLocaleString('en-IN')}` : null, accent: true },
                     { label: 'Market Cap', value: insightsData.profile?.marketCap ? `₹${Number(insightsData.profile.marketCap).toLocaleString('en-IN')} Cr.` : null },
                     { label: '52W High / Low', value: insightsData.profile?.high52w && insightsData.profile?.low52w ? `₹${Number(insightsData.profile.high52w).toLocaleString('en-IN')} / ₹${Number(insightsData.profile.low52w).toLocaleString('en-IN')}` : null },
                     { label: 'Stock P/E', value: insightsData.profile?.pe ? Number(insightsData.profile.pe).toFixed(2) : null },
                     { label: 'Book Value', value: insightsData.profile?.bookValue ? `₹${Number(insightsData.profile.bookValue).toLocaleString('en-IN')}` : null },
                     { label: 'Dividend Yield', value: insightsData.profile?.dividendYield ? `${insightsData.profile.dividendYield} %` : null },
                     { label: 'ROCE', value: insightsData.profile?.roce ? `${insightsData.profile.roce} %` : null },
                     { label: 'ROE', value: insightsData.profile?.roe ? `${insightsData.profile.roe} %` : null },
                     { label: 'Face Value', value: insightsData.profile?.faceValue ? `₹${insightsData.profile.faceValue}` : null },
                   ].map((kpi, i) => (
                     <div key={i} className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '6px' }}>{kpi.label}</p>
                       <p style={{ fontSize: '20px', fontWeight: 700, color: kpi.accent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                         {kpi.value || <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px' }}>—</span>}
                       </p>
                     </div>
                   ))}
                 </div>
                 {insightsData.profile?.dataSource && (
                   <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '24px', textAlign: 'right' }}>
                     Data sourced from {insightsData.profile.dataSource}
                   </p>
                 )}

                 {/* Deep Scrutiny Technical Analysis Panel */}
                 {(deepScrutinyLoading || deepScrutinyData) && (
                   <div style={{ marginBottom: '32px', background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '14px', padding: '24px' }}>
                     <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                       <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} /> Deep Technical Scrutiny
                       {deepScrutinyLoading && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Analysing 1Y chart data...</span>}
                     </h3>
                     {deepScrutinyLoading ? (
                       <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                         {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, minWidth: '140px', height: '80px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />)}
                       </div>
                     ) : deepScrutinyData && !deepScrutinyData.error ? (
                       <>
                         {/* Trend Badge + Crossover Signal */}
                         <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                           <span style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12px', background: deepScrutinyData.trend?.includes('Up') ? 'rgba(16,185,129,0.15)' : deepScrutinyData.trend?.includes('Down') ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: deepScrutinyData.trend?.includes('Up') ? '#10b981' : deepScrutinyData.trend?.includes('Down') ? '#ef4444' : '#eab308' }}>
                             📈 {deepScrutinyData.trend}
                           </span>
                           {deepScrutinyData.crossoverSignal && (
                             <span style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12px', background: deepScrutinyData.crossoverSignal === 'Golden Cross' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)', color: deepScrutinyData.crossoverSignal === 'Golden Cross' ? '#fbbf24' : '#ef4444', border: deepScrutinyData.crossoverSignal === 'Golden Cross' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(239,68,68,0.4)' }}>
                               {deepScrutinyData.crossoverSignal === 'Golden Cross' ? '⭐ Golden Cross Detected!' : '💀 Death Cross Detected!'}
                             </span>
                           )}
                           {deepScrutinyData.pattern && (
                             <span style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 600, fontSize: '12px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                               🕯️ {deepScrutinyData.pattern.name}
                             </span>
                           )}
                         </div>
                                                   <div style={{ padding: '16px', background: 'rgba(45,212,191,0.06)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(45,212,191,0.15)' }}>
                            <p style={{ fontSize: '14px', color: '#fff', margin: '0 0 10px', lineHeight: '1.5', fontWeight: 500 }}>
                              {getScrutinySummary(deepScrutinyData).main}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {getScrutinySummary(deepScrutinyData).tags.map((tag, i) => (
                                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)' }} /> {tag}
                                </p>
                              ))}
                            </div>
                          </div>

                         {/* DMA + RSI Grid */}
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                           <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: `1px solid ${deepScrutinyData.dma50 ? (deepScrutinyData.aboveDma50 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)') : 'rgba(255,255,255,0.05)'}` }}>
                             <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>DMA 50</p>
                             {deepScrutinyData.dma50 ? (
                               <>
                                 <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.aboveDma50 ? '#10b981' : '#ef4444' }}>₹{deepScrutinyData.dma50.toLocaleString('en-IN')}</p>
                                 <p style={{ fontSize: '11px', margin: '4px 0 0', color: deepScrutinyData.aboveDma50 ? '#10b981' : '#ef4444' }}>{deepScrutinyData.aboveDma50 ? '▲' : '▼'} {Math.abs(deepScrutinyData.dma50Diff)}% {deepScrutinyData.aboveDma50 ? 'above' : 'below'}</p>
                               </>
                             ) : (
                               <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Data Pending</p>
                             )}
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: `1px solid ${deepScrutinyData.dma200 ? (deepScrutinyData.aboveDma200 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)') : 'rgba(255,255,255,0.05)'}` }}>
                             <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>DMA 200</p>
                             {deepScrutinyData.dma200 ? (
                               <>
                                 <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.aboveDma200 ? '#10b981' : '#ef4444' }}>₹{deepScrutinyData.dma200.toLocaleString('en-IN')}</p>
                                 <p style={{ fontSize: '11px', margin: '4px 0 0', color: deepScrutinyData.aboveDma200 ? '#10b981' : '#ef4444' }}>{deepScrutinyData.aboveDma200 ? '▲' : '▼'} {Math.abs(deepScrutinyData.dma200Diff)}% {deepScrutinyData.aboveDma200 ? 'above' : 'below'}</p>
                               </>
                             ) : (
                               <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Data Pending</p>
                             )}
                           </div>
                           {deepScrutinyData.rsi && (
                             <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: `1px solid ${deepScrutinyData.rsiZone === 'Overbought' ? 'rgba(239,68,68,0.25)' : deepScrutinyData.rsiZone === 'Oversold' ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}` }}>
                               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>RSI (14)</p>
                               <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.rsiZone === 'Overbought' ? '#ef4444' : deepScrutinyData.rsiZone === 'Oversold' ? '#10b981' : '#eab308' }}>{deepScrutinyData.rsi}</p>
                               <p style={{ fontSize: '11px', margin: '4px 0 0', color: 'rgba(255,255,255,0.4)' }}>{deepScrutinyData.rsiZone}</p>
                             </div>
                           )}
                           <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                             <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Momentum</p>
                             {deepScrutinyData.momentum1m !== null ? (
                               <>
                                 <p style={{ fontSize: '13px', margin: '0 0 4px', color: deepScrutinyData.momentum1m >= 0 ? '#10b981' : '#ef4444' }}>1M: {deepScrutinyData.momentum1m >= 0 ? '+' : ''}{deepScrutinyData.momentum1m}%</p>
                                 {deepScrutinyData.momentum3m !== null && <p style={{ fontSize: '13px', margin: 0, color: deepScrutinyData.momentum3m >= 0 ? '#10b981' : '#ef4444' }}>3M: {deepScrutinyData.momentum3m >= 0 ? '+' : ''}{deepScrutinyData.momentum3m}%</p>}
                               </>
                             ) : (
                               <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Limited History</p>
                             )}
                           </div>
                         </div>

                         {/* Institutional Flow & HNI */}
                          {deepScrutinyData.institutional && (
                            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>🏦 Institutional Flow & HNI Activity</p>
                                <span style={{ fontSize: '10px', background: 'var(--accent-gradient)', color: '#041014', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 600 }}>PREMIUM</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div style={{ flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>FII Sentiment</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: deepScrutinyData.institutional.fii === 'Bullish' ? '#10b981' : deepScrutinyData.institutional.fii === 'Bearish' ? '#ef4444' : '#eab308' }}>{deepScrutinyData.institutional.fii}</p>
                                </div>
                                <div style={{ flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>DII Sentiment</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: deepScrutinyData.institutional.dii === 'Bullish' ? '#10b981' : deepScrutinyData.institutional.dii === 'Bearish' ? '#ef4444' : '#eab308' }}>{deepScrutinyData.institutional.dii}</p>
                                </div>
                                <div style={{ flex: 1.5, minWidth: '180px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>Flow Activity</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: '#fff' }}>{deepScrutinyData.institutional.activity}</p>
                                </div>
                              </div>
                              
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5, borderLeft: '3px solid var(--accent-primary)', paddingLeft: '10px' }}>
                                {deepScrutinyData.institutional.description}
                              </p>
                            </div>
                          )}

                          {/* Bollinger Band + Volume */}
                         <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                           {deepScrutinyData.bollingerPosition && (
                             <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                               📊 Bollinger: <strong style={{ color: '#fff' }}>{deepScrutinyData.bollingerPosition}</strong>
                             </div>
                           )}
                           {deepScrutinyData.volumeTrend && (
                             <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                               📦 Volume: <strong style={{ color: '#fff' }}>{deepScrutinyData.volumeTrend}</strong>
                             </div>
                           )}
                           {deepScrutinyData.pattern && (
                             <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                               🕯️ Pattern: <strong style={{ color: '#fff' }}>{deepScrutinyData.pattern.desc}</strong>
                             </div>
                           )}
                         </div>
                       </>
                     ) : deepScrutinyData ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginBottom: '8px' }}>🚀 This appears to be a very newly listed stock.</p>
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>Technical indicators will automatically appear once enough historical trading days are recorded.</p>
                        </div>
                      ) : (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Error loading technical profile.</p>
                      )}
                   </div>
                 )}

                 <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Newspaper size={20} color="var(--accent-primary)" /> Latest Market Intelligence
                 </h3>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {insightsData.news && insightsData.news.length > 0 ? insightsData.news.map((item, idx) => {
                     const isDeepScanned = deepScanStates[idx];
                     const finalGrade = isDeepScanned ? item.deepSentimentGrade : item.sentimentGrade;
                     return (
                     <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'block', background: 'rgba(0,0,0,0.1)', borderLeft: finalGrade === 'Positive' ? '4px solid #22c55e' : finalGrade === 'Negative' ? '4px solid #ef4444' : '4px solid #94a3b8' }}>
                       <div className="flex justify-between items-start gap-4" style={{ marginBottom: '8px' }}>
                         <a href={item.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                           <p className="font-semibold hover-text-primary transition-colors" style={{ fontSize: '17px', lineHeight: '1.4' }}>{item.title}</p>
                         </a>
                         <div className="flex gap-2 items-center">
                           {!isDeepScanned && (
                             <button onClick={() => setDeepScanStates(prev => ({...prev, [idx]: true}))} className="hover-scale" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                               🔬 Deep Scan
                             </button>
                           )}
                           <span style={{ 
                             padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                             background: finalGrade === 'Positive' ? 'rgba(34,197,94,0.1)' : finalGrade === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)',
                             color: finalGrade === 'Positive' ? '#4ade80' : finalGrade === 'Negative' ? '#f87171' : '#cbd5e1'
                           }}>
                             {finalGrade === 'Positive' ? '🟢 Positive' : finalGrade === 'Negative' ? '🔴 Negative' : '⚪ Neutral'}
                           </span>
                         </div>
                       </div>
                       
                       {isDeepScanned && (
                          <div className="animate-in" style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', margin: '14px 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-sm text-secondary" style={{ marginBottom: '8px', letterSpacing: '0.5px' }}><strong>DEEP NLP ANALYSIS:</strong></p>
                            <p className="text-sm" style={{ lineHeight: '1.5', color: '#cbd5e1' }}>{item.contentSnippet}</p>
                            <p className="text-xs text-muted" style={{ marginTop: '12px', fontVariantNumeric: 'tabular-nums' }}>
                               Base Score: {item.baseScore} | Adjusted Heuristic Score: {item.deepScore}
                            </p>
                          </div>
                       )}

                       <p className="text-xs text-muted mt-2">{item.publisher} • {getRelativeTime(item.providerPublishTime)}</p>
                     </div>
                   )}) : <p className="text-muted text-center" style={{ padding: '30px' }}>No recent news articles logged for this specific asset.</p>}
                 </div>
               </div>
             ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  input: {
    width: '100%', padding: '8px 12px', borderRadius: '8px', 
    background: 'var(--bg-color)', border: '1px solid var(--card-border)', 
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontSize: '14px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(400px, 1fr) 1fr',
    gap: '30px'
  },
  centerText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  assetCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }
};

