import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Radar, Radio, Zap, BarChart2, ShieldCheck, FileUp, ArrowRight, TrendingUp, Activity, Lock, Newspaper, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const MARKET_PULSE = [
  { label: 'NIFTY 50', value: '24,315.85', change: '+0.68%', up: true },
  { label: 'SENSEX', value: '80,116.49', change: '+0.64%', up: true },
  { label: 'BANK NIFTY', value: '52,283.30', change: '+0.42%', up: true },
  { label: 'GOLD (MCX)', value: '₹93,150', change: '+1.21%', up: true },
  { label: 'USD/INR', value: '₹84.32', change: '-0.18%', up: false },
];

const FEATURES = [
  {
    icon: Radar,
    color: '#2dd4bf',
    title: "Your Portfolio's Sentiment — Not The Market's",
    desc: 'Forget generic market heat. Finbuddy analyses news of only the stocks you own, giving you a personalised Bullish/Bearish score tailored to your exact holdings — no noise, all signal.',
  },
  {
    icon: ShieldCheck,
    color: '#0ea5e9',
    title: 'Deep Technical Scrutiny on Every Holding',
    desc: 'Click any stock to instantly get DMA50/200 positioning, Golden Cross & Death Cross alerts, RSI zone, Bollinger Band position, and candle pattern detection.',
  },
  {
    icon: Radio,
    color: '#8b5cf6',
    title: 'Oracle Forecast Built Around Your Wealth',
    desc: "Our 6-month projection isn't a NIFTY copy. It models your specific holdings, sector weights, and live sentiment to render a growth curve that is uniquely yours.",
  },
];

const STEPS = [
  { num: '01', icon: FileUp, title: 'Import Your Portfolio', desc: "Go to Smart Import → Upload your broker's Holdings CSV. Zerodha, Upstox, Groww, and Angel Broking are supported." },
  { num: '02', icon: Zap, title: 'Run AI Intelligence Sync', desc: 'Click "Live Quotes" in Portfolio → AI auto-classifies all stocks into SEBI sectors and fetches live market prices in one pass.' },
  { num: '03', icon: TrendingUp, title: 'Your Dashboard Goes Live', desc: 'Return here to see your personalised Oracle forecast, your portfolio sentiment score, and deep technical analysis on each holding.' },
];

// Dashboard is now a pure rendering component — all data fetching lives in App.jsx
export default function Dashboard({ session, data, loading, onRefresh }) {
  const navigate = useNavigate();
  const [expandedStock, setExpandedStock] = useState(null);
  const [alphaBase, setAlphaBase] = useState('Nifty50');

  const email = session?.user?.email || '';
  const isAdmin = email.toLowerCase() === 'surajsan1998@gmail.com';
  const firstName = isAdmin ? 'Suraj' : email.split('@')[0];

  // ── Loading state — only on first load ──
  if (loading || data === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <Activity size={32} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
        <p className="text-muted" style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>Initializing Terminal...</p>
        <p className="text-muted" style={{ fontSize: '11px', opacity: 0.5 }}>This only happens once per session</p>
      </div>
    );
  }

  const { assets = [], netWorth = 0, weather = { percent: 50, articleCount: 0 }, oracleData, projectionTimeline = [], intelligenceData, analyticsData } = data;
  const hasAssets = assets.length > 0;
  const sentimentColor = weather.percent > 65 ? '#2dd4bf' : weather.percent < 45 ? '#ef4444' : '#eab308';

  const totalBuyValue = assets.reduce((acc, a) => acc + (a.buy_price ? Number(a.buy_price) : 0), 0);
  const pnl = totalBuyValue > 0 ? netWorth - totalBuyValue : null;

  const gaugeData = [
    { name: 'Score', value: weather.percent, fill: sentimentColor },
    { name: 'Empty', value: 100 - weather.percent, fill: 'rgba(255,255,255,0.04)' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="animate-in" style={{ maxWidth: '1400px' }}>

      {/* ── Market Pulse Ticker ── */}
      <div style={{ display: 'flex', overflowX: 'auto', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', scrollbarWidth: 'none' }}>
        {MARKET_PULSE.map((m, i) => (
          <div key={i} style={{ padding: '12px 24px', borderRight: i < MARKET_PULSE.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 3px' }}>{m.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{m.value}</span>
              <span style={{ fontSize: '11px', color: m.up ? '#10b981' : '#ef4444', fontWeight: 600 }}>{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '32px', margin: 0 }}>
              Good {greeting}, <span className="text-gradient">{firstName}</span>
            </h1>
            {isAdmin && <span style={{ fontSize: '11px', background: 'var(--accent-gradient)', color: '#041014', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>👑 Admin</span>}
          </div>
          <p className="text-muted" style={{ fontSize: '14px' }}>
            {hasAssets
              ? `Your portfolio intelligence is live. ${assets.length} assets tracked across ${[...new Set(assets.map(a => a.sector).filter(Boolean))].length} sectors.`
              : 'Welcome to your financial intelligence terminal. Follow the setup guide to get started.'}
          </p>
        </div>
        <button
          onClick={onRefresh}
          title="Refresh Dashboard Data"
          style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: 'var(--accent-primary)', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', flexShrink: 0 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {hasAssets ? (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Total Portfolio Value', value: `₹${netWorth.toLocaleString('en-IN')}`, sub: 'Active Wealth Exposure', color: '#2dd4bf', icon: TrendingUp },
              { label: 'Total Assets', value: assets.length, sub: 'Holdings in Vault', color: '#0ea5e9', icon: BarChart2 },
              { label: 'Sector Coverage', value: [...new Set(assets.map(a => a.sector).filter(Boolean))].length, sub: 'Unique SEBI Sectors', color: '#8b5cf6', icon: Radar },
              ...(pnl !== null ? [{ label: 'Unrealised P&L', value: `${pnl >= 0 ? '+' : ''}₹${Math.abs(Math.round(pnl)).toLocaleString('en-IN')}`, sub: pnl >= 0 ? 'Net Gain' : 'Net Loss', color: pnl >= 0 ? '#10b981' : '#ef4444', icon: ArrowUpRight }] : []),
            ].map((kpi, i) => (
              <div key={i} className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: '80px', height: '80px', borderRadius: '50%', background: kpi.color, opacity: 0.06 }} />
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>{kpi.label}</p>
                <h2 style={{ fontSize: '28px', margin: '0 0 4px', color: kpi.color, fontWeight: 700 }}>{kpi.value}</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Investor Upgrade Suite ── */}
          {analyticsData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '20px', marginBottom: '28px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Health Grade Card */}
                <div className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${analyticsData.health.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <ShieldCheck size={24} color={analyticsData.health.color} />
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Health Grade</h3>
                    <span style={{ marginLeft: 'auto', fontSize: '24px', fontWeight: 800, color: analyticsData.health.color }}>{analyticsData.health.grade}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{analyticsData.health.riskFactor}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{analyticsData.health.correctionTip}</p>
                </div>

                {/* Passive Income Card */}
                <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(45,212,191,0.05) 100%)', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <TrendingUp size={24} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Passive Income</h3>
                  </div>
                  <h2 style={{ fontSize: '28px', margin: '0 0 4px', color: '#10b981', fontWeight: 700 }}>₹{analyticsData.dividends.annual.toLocaleString('en-IN')} <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500}}>/ yr</span></h2>
                  <p style={{ fontSize: '13px', color: '#fff', margin: '0 0 12px' }}>That is <strong style={{color: '#10b981'}}>₹{analyticsData.dividends.monthly.toLocaleString('en-IN')}</strong> per month.</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>Congratulations! Financial independence is driven by cash flow. You are steadily building your passive wealth engine.</p>
                </div>
              </div>

              {/* Alpha Chart */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} className="text-secondary" /> Alpha Tracking</h3>
                    <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>1-Year Relative Performance: Portfolio vs Market</p>
                  </div>
                  <select 
                    value={alphaBase} 
                    onChange={e => setAlphaBase(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="Nifty50">vs NIFTY 50</option>
                    <option value="Sensex">vs SENSEX</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
                  {analyticsData.alphaData && analyticsData.alphaData.length > 0 ? (
                    <ResponsiveContainer>
                      <LineChart data={analyticsData.alphaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tickFormatter={v => `${v}%`} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v) => [`${v}%`, '']}
                          contentStyle={{ background: '#0a1f26', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '10px' }}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                          itemStyle={{ fontSize: '13px', padding: '2px 0' }}
                        />
                        <Line type="monotone" name="Portfolio" dataKey="Portfolio" stroke="var(--accent-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" name={alphaBase === 'Nifty50' ? 'NIFTY 50' : 'SENSEX'} dataKey={alphaBase} stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted" style={{ textAlign: 'center', marginTop: '80px' }}>Loading historical market data...</p>
                  )}
                </div>
              </div>
              
            </div>
          )}

          {/* Sentiment + Oracle */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginBottom: '28px' }}>
            {/* Gauge */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
              <p className="text-muted" style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radar size={14} color={sentimentColor} /> Market Sentiment
              </p>
              <div style={{ position: 'relative', width: '200px', height: '110px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={88} dataKey="value" stroke="none" cornerRadius={8}>
                      {gaugeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                  <h2 style={{ fontSize: '30px', margin: '0 0 2px', color: sentimentColor, fontWeight: 700 }}>{weather.percent}%</h2>
                  <p style={{ fontSize: '11px', color: sentimentColor, margin: 0, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {weather.percent > 65 ? '🟢 Bullish' : weather.percent < 45 ? '🔴 Bearish' : '🟡 Neutral'}
                  </p>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: '11px', textAlign: 'center', marginTop: '20px', lineHeight: 1.5 }}>
                Analysis of <strong style={{ color: sentimentColor }}>{weather.articleCount}</strong> global news headlines across your top {isAdmin ? '10' : '4'} holdings.
              </p>
            </div>

            {/* Oracle Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Radio size={18} className="text-secondary" /> Oracle Forecast</h3>
                  <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>6-Month AI-Projected Growth Trajectory</p>
                </div>
                {oracleData && (
                  <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.25)', padding: '10px 16px', borderRadius: '10px', border: `1px solid ${oracleData.growthPercent >= 0 ? 'rgba(45,212,191,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', letterSpacing: '1px', textTransform: 'uppercase' }}>Alpha Projection</p>
                    <h2 style={{ fontSize: '24px', margin: 0, color: oracleData.growthPercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {oracleData.growthPercent >= 0 ? '+' : ''}{oracleData.growthPercent}%
                    </h2>
                  </div>
                )}
              </div>
              <div style={{ height: '220px' }}>
                {projectionTimeline.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={projectionTimeline}>
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2dd4bf" />
                          <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['dataMin - (dataMin*0.04)', 'dataMax + (dataMax*0.04)']} />
                      <Tooltip
                        formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Projected Value']}
                        contentStyle={{ background: '#0a1f26', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '10px' }}
                        itemStyle={{ color: '#2dd4bf' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Line type="monotone" dataKey="Projected Value" stroke="url(#lineGrad)" strokeWidth={2.5} strokeDasharray="6 3"
                        dot={{ fill: '#041014', stroke: '#2dd4bf', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 7, fill: '#2dd4bf' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', marginTop: '80px' }}>Processing oracle data...</p>
                )}
              </div>
            </div>
          </div>

          {/* Premium Intelligence Panel */}
          <div style={{ position: 'relative', marginBottom: '28px' }}>
            {!isAdmin && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(4,16,20,0.75)', backdropFilter: 'blur(8px)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px solid rgba(45,212,191,0.2)' }}>
                <Lock size={32} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '18px' }}>Premium Intelligence</h3>
                <p className="text-muted" style={{ fontSize: '13px', margin: 0, textAlign: 'center', maxWidth: '280px' }}>Deep Sentiment Analysis of your top 10 holdings is a Premium feature.</p>
                <button className="btn btn-primary" style={{ padding: '9px 22px', fontSize: '13px', marginTop: '4px' }}>Upgrade to Premium</button>
              </div>
            )}
            <div className="glass-panel" style={{ padding: '24px', filter: isAdmin ? 'none' : 'blur(2px)', pointerEvents: isAdmin ? 'auto' : 'none', minHeight: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Newspaper size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '16px' }}>Deep Intelligence: Top 10 Holdings</h3>
                <span style={{ marginLeft: 'auto', fontSize: '11px', background: 'var(--accent-gradient)', color: '#041014', padding: '2px 10px', borderRadius: '20px', fontWeight: 700 }}>PREMIUM</span>
              </div>
              {intelligenceData && intelligenceData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {intelligenceData.map((stock, i) => {
                    const sc = stock.percent > 65 ? '#10b981' : stock.percent < 45 ? '#ef4444' : '#eab308';
                    const isExpanded = expandedStock === stock.name;
                    return (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${sc}22` }}>
                        <div onClick={() => setExpandedStock(isExpanded ? null : stock.name)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', width: '20px', flexShrink: 0 }}>#{i + 1}</span>
                          <span style={{ fontWeight: 600, fontSize: '14px', flex: 1 }}>{stock.name}</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{stock.articleCount} articles</span>
                          <div style={{ width: '80px', height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ width: `${stock.percent}%`, height: '100%', background: sc, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: sc, width: '38px', textAlign: 'right', flexShrink: 0 }}>{stock.percent}%</span>
                          <span style={{ fontSize: '11px', background: `${sc}22`, color: sc, padding: '2px 8px', borderRadius: '12px', fontWeight: 600, width: '58px', textAlign: 'center', flexShrink: 0 }}>{stock.sentiment}</span>
                          {isExpanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
                        </div>
                        {isExpanded && stock.headlines && stock.headlines.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px 12px 48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stock.headlines.map((h, j) => (
                              <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '10px', background: h.score > 0 ? 'rgba(16,185,129,0.15)' : h.score < 0 ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: h.score > 0 ? '#10b981' : h.score < 0 ? '#ef4444' : '#eab308', padding: '2px 7px', borderRadius: '8px', fontWeight: 600, flexShrink: 0, marginTop: '2px' }}>
                                  {h.score > 0 ? '▲' : h.score < 0 ? '▼' : '●'}
                                </span>
                                <div>
                                  <p style={{ fontSize: '12px', margin: '0 0 2px', lineHeight: 1.4, color: 'rgba(255,255,255,0.8)' }}>{h.title}</p>
                                  <p style={{ fontSize: '10px', margin: 0, color: 'rgba(255,255,255,0.3)' }}>{h.publisher}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  {isAdmin ? 'Intelligence data loading on next refresh...' : 'Premium analysis locked.'}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // ── EMPTY STATE ──
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '36px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden', border: `1px solid ${f.color}22` }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: '100px', height: '100px', borderRadius: '50%', background: f.color, opacity: 0.06 }} />
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${f.color}18`, border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.15)' }}>
            <h2 style={{ fontSize: '22px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={22} style={{ color: 'var(--accent-primary)' }} /> Unlock Your Intelligence in 3 Steps
            </h2>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '28px' }}>Follow these steps to activate your personal financial command centre.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flexShrink: 0, width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>{step.num}</div>
                  <div>
                    <h4 style={{ fontSize: '14px', margin: '0 0 5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}><step.icon size={14} style={{ color: 'var(--accent-primary)' }} /> {step.title}</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: '28px', padding: '12px 28px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/import')}>
              Start with Smart Import <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
