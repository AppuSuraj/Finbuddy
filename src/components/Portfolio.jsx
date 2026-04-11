import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { TrendingUp, Layers, Plus, Search, RefreshCw, LayoutGrid, List, ArrowLeft, Newspaper, Info } from 'lucide-react';

const getRelativeTime = (timeProp) => {
   if (!timeProp) return 'Unknown Date';
   const date = new Date(timeProp);
   if (isNaN(date.getTime())) return 'Invalid Date';
   
   const diffMs = new Date() - date;
   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
   const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
   
   if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
   if (diffHrs > 0) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
   return 'Just now';
};

const Sparkline = ({ name }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
     let isMounted = true;
     const match = name.match(/(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*shares\)/i);
     const ticker = match ? match[1].trim() : name;
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
  const color = isUp ? '#22c55e' : '#ef4444';
  
  return (
    <div style={{ width: '80px', height: '30px' }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="close" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Portfolio() {
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

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setAssetAllocation(data);
    }
    setLoading(false);
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('assets').insert([
      { 
        name: newAsset.name, 
        value: Number(newAsset.value), 
        color: newAsset.color,
        buy_price: newAsset.buy_price ? Number(newAsset.buy_price) : null
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
    let result = assetAllocation.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (sortBy === 'value-desc') {
      result.sort((a, b) => Number(b.value) - Number(a.value));
    } else if (sortBy === 'value-asc') {
      result.sort((a, b) => Number(a.value) - Number(b.value));
    } else if (sortBy === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [assetAllocation, searchQuery, sortBy]);

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

  const handleRefreshLivePrices = async () => {
    setRefreshing(true);
    let updatedCount = 0;
    const newAllocations = [...assetAllocation];

    for (let i = 0; i < newAllocations.length; i++) {
      let asset = newAllocations[i];
      // Regex detects imported convention: "TICKER (10 shares)"
      const match = asset.name.match(/(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*shares\)/i);
      
      if (!match) continue; // Skip custom added assets that don't match the format
      
      const ticker = match[1].trim();
      const qty = Number(match[2]);

      let price = await fetchPrice(ticker, 'NS');
      if (price === null) {
        price = await fetchPrice(ticker, 'BO'); // Fallback to BSE
      }
      
      let sectorStr = asset.sector;
      if (!sectorStr || sectorStr === 'Unknown' || sectorStr === 'Uncategorized') {
         try {
           const profileRes = await fetch(`/api/profile?symbol=${ticker}.NS`);
           const profile = await profileRes.json();
           if (profile && profile.sector && profile.sector !== 'Unknown') sectorStr = profile.sector;
         } catch(e) {}
      }

      if (price !== null) {
        const newVal = price * qty;
        newAllocations[i].value = newVal;
        newAllocations[i].sector = sectorStr;
        await supabase.from('assets').update({ value: newVal, sector: sectorStr }).eq('id', asset.id);
        updatedCount++;
      }
    }
    
    setAssetAllocation(newAllocations);
    setRefreshing(false);
    if (updatedCount > 0) alert(`Successfully updated ${updatedCount} assets via Live Markets!`);
    else alert('No valid stock tickers identified. Make sure they were imported via Smart Import.');
  };

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset);
    setFetchingInsights(true);
    setInsightsData(null);
    
    // Parse ticker name
    const match = asset.name.match(/(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*shares\)/i);
    let ticker = asset.name;
    if (match) ticker = match[1].trim();

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

  const totalValue = assetAllocation.reduce((acc, curr) => acc + Number(curr.value), 0);

  const getSectorColor = (sector) => {
    const map = { 'Technology': '#3b82f6', 'Energy': '#eab308', 'Financial Services': '#10b981', 'Healthcare': '#ef4444', 'Industrials': '#f97316', 'Consumer Defensive': '#ec4899', 'Consumer Cyclical': '#d946ef', 'Basic Materials': '#8b5cf6', 'Communication Services': '#0ea5e9', 'Utilities': '#14b8a6', 'Real Estate': '#f43f5e' };
    return map[sector] || '#64748b';
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
        <div className="flex gap-4">
          <button className="btn btn-secondary" onClick={handleRefreshLivePrices} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "spin-animation" : ""} /> {refreshing ? 'Fetching Data...' : 'Live Quotes'}
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
                <button onClick={() => setChartView('asset')} style={{ padding: '6px 12px', background: chartView === 'asset' ? 'var(--accent-primary)' : 'transparent', color: chartView === 'asset' ? '#000' : '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Assets</button>
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
                          if (!entry.isOther && !entry.isSector) handleSelectAsset(entry);
                        }}
                        style={{ cursor: entry.isOther || entry.isSector ? 'default' : 'pointer', outline: 'none' }}
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
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', padding: '20px' 
          }}
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', 
              padding: '40px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--accent-primary)' 
            }}
            onClick={e => e.stopPropagation()}
            className="vault-scroll"
          >
             <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                   {selectedAsset.name.split('(')[0].trim()} Insights
                </h2>
                <button className="btn btn-secondary" style={{ padding: '6px 16px' }} onClick={() => setSelectedAsset(null)}>
                  Close
                </button>
             </div>
             
             {fetchingInsights ? (
               <div style={{ padding: '60px 0', textAlign: 'center' }}>
                 <p className="text-muted text-lg flex items-center justify-center gap-3"><RefreshCw size={24} className="spin-animation" /> Scraping Financial Terminals...</p>
               </div>
             ) : insightsData?.error || (!insightsData?.profile && (!insightsData?.news || insightsData?.news.length === 0)) ? (
               <p className="text-danger mt-4 text-center">Failed to load detailed insights. Ensure API proxy is running and ticker is publicly listed.</p>
             ) : insightsData ? (
               <div>
                 <div style={{ 
                   display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' 
                 }}>
                    {/* Row 1 */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Market Cap</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.summaryDetail?.marketCap ? `₹${(insightsData.profile.summaryDetail.marketCap / 10000000).toFixed(0)} Cr.` : 'N/A'}
                       </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Current Price</p>
                       <p className="font-semibold" style={{ fontSize: '22px', color: 'var(--accent-primary)' }}>
                         {insightsData.profile?.price?.regularMarketPrice ? `₹${insightsData.profile.price.regularMarketPrice.toLocaleString('en-IN')}` : 'N/A'}
                       </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>High / Low (52w)</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.summaryDetail?.fiftyTwoWeekHigh && insightsData.profile?.summaryDetail?.fiftyTwoWeekLow ? 
                           `₹${insightsData.profile.summaryDetail.fiftyTwoWeekHigh.toLocaleString('en-IN')} / ₹${insightsData.profile.summaryDetail.fiftyTwoWeekLow.toLocaleString('en-IN')}` : 'N/A'
                         }
                       </p>
                    </div>

                    {/* Row 2 */}
                    <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Stock P/E</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>{insightsData.profile?.summaryDetail?.trailingPE?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Book Value</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.defaultKeyStatistics?.bookValue ? `₹${insightsData.profile.defaultKeyStatistics.bookValue.toFixed(2)}` : 'N/A'}
                       </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Dividend Yield</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.summaryDetail?.dividendYield ? `${(insightsData.profile.summaryDetail.dividendYield * 100).toFixed(2)} %` : 'N/A'}
                       </p>
                    </div>

                    {/* Row 3 */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>ROCE (ROA Proxy)</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.financialData?.returnOnAssets ? `${(insightsData.profile.financialData.returnOnAssets * 100).toFixed(1)} %` : 'N/A'}
                       </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>ROE</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>
                         {insightsData.profile?.financialData?.returnOnEquity ? `${(insightsData.profile.financialData.returnOnEquity * 100).toFixed(1)} %` : 'N/A'}
                       </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                       <p className="text-muted text-sm" style={{ marginBottom: '4px' }}>Face Value</p>
                       <p className="font-semibold" style={{ fontSize: '22px' }}>N/A</p>
                    </div>
                 </div>
                 
                 <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Newspaper size={20} color="var(--accent-primary)" /> Latest Market Intelligence
                 </h3>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {insightsData.news && insightsData.news.length > 0 ? insightsData.news.map((item, idx) => (
                     <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="glass-panel" style={{ padding: '20px', display: 'block', textDecoration: 'none', color: 'inherit', background: 'rgba(0,0,0,0.1)', borderLeft: item.sentimentGrade === 'Positive' ? '4px solid #22c55e' : item.sentimentGrade === 'Negative' ? '4px solid #ef4444' : '4px solid #94a3b8' }}>
                       <div className="flex justify-between items-start gap-4" style={{ marginBottom: '8px' }}>
                         <p className="font-semibold" style={{ fontSize: '17px', lineHeight: '1.4' }}>{item.title}</p>
                         <span style={{ 
                           padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                           background: item.sentimentGrade === 'Positive' ? 'rgba(34,197,94,0.1)' : item.sentimentGrade === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)',
                           color: item.sentimentGrade === 'Positive' ? '#4ade80' : item.sentimentGrade === 'Negative' ? '#f87171' : '#cbd5e1'
                         }}>
                           {item.sentimentGrade === 'Positive' ? '🟢 Positive' : item.sentimentGrade === 'Negative' ? '🔴 Negative' : '⚪ Neutral'}
                         </span>
                       </div>
                       <p className="text-xs text-muted">{item.publisher} • {getRelativeTime(item.providerPublishTime)}</p>
                     </a>
                   )) : <p className="text-muted text-center" style={{ padding: '30px' }}>No recent news articles logged for this specific asset.</p>}
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

