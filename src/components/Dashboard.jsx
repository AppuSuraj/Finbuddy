import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Radar, PieChart as PieIcon, Radio } from 'lucide-react';
export default function Dashboard() {
  const [netWorth, setNetWorth] = useState(0);
  const [weather, setWeather] = useState({ percent: 50, articleCount: 0 });
  
  // Oracle State
  const [oracleData, setOracleData] = useState(null);
  const [projectionTimeline, setProjectionTimeline] = useState([]);
  const [oracleSyncing, setOracleSyncing] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const { data: assetData } = await supabase.from('assets').select('*');
    let totalAssets = 0;
    
    if (assetData && assetData.length > 0) {
      totalAssets = assetData.reduce((acc, curr) => acc + Number(curr.value), 0);
      
      // Calculate Portfolio Intelligence Weather via Top 4 holdings
      const sorted = [...assetData].sort((a,b) => Number(b.value) - Number(a.value));
      const topNames = sorted.slice(0, 4).map(a => encodeURIComponent(a.name.split('(')[0].trim())).join(',');
      
      try {
        const res = await fetch(`/api/portfolio-sentiment?names=${topNames}`);
        const sentimentData = await res.json();
        if (sentimentData && typeof sentimentData.percent === 'number') {
           setWeather(sentimentData);
        }
      } catch(e) {}
      
      // Request Machine Oracle Neural Subsystem
      try {
        setOracleSyncing(true);
        const oRes = await fetch(`/api/oracle?names=${topNames}`);
        const predictData = await oRes.json();
        setOracleData(predictData);
        
        // Extrapolate prediction dynamically onto the user's specific Net Worth line
        if (totalAssets > 0) {
            const months = ['Today', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
            let current = totalAssets;
            // Smooth the total growth % linearly over the trajectory
            const monthlyGrowth = predictData.growthPercent / 6;
            
            const timeline = months.map(m => {
               const point = { month: m, 'Projected Value': Math.round(current) };
               current = current * (1 + (monthlyGrowth / 100));
               return point;
            });
            setProjectionTimeline(timeline);
        }
      } catch(e) {}
      setOracleSyncing(false);
    }
    
    setNetWorth(totalAssets);
    setLoading(false);
  }

  if (loading) {
    return <div className="main-content"><p className="text-muted">Analyzing Portfolio...</p></div>;
  }

  const sentimentColor = weather.percent > 65 ? '#2dd4bf' : weather.percent < 45 ? '#ef4444' : '#eab308';
  const gaugeData = [
    { name: 'Score', value: weather.percent, fill: sentimentColor },
    { name: 'Empty', value: 100 - weather.percent, fill: 'rgba(255,255,255,0.05)' }
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Welcome back, <span className="text-gradient">Suraj</span>
          </h1>
          <p className="text-muted">Here is your live intelligence dashboard.</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div className="glass-panel delay-1">
          <p className="text-muted text-sm">Active Wealth Exposure</p>
          <h2 style={{ fontSize: '42px', margin: '10px 0' }}>
            ₹{netWorth.toLocaleString('en-IN')}
          </h2>
          <div className="flex items-center gap-2 text-success" style={{ fontWeight: 500 }}>
            <ArrowUpRight size={20} />
            <span>Tracking {netWorth > 0 ? 'Live Assets' : 'No Assets Yet'}</span>
          </div>
        </div>
        
        <div className="glass-panel delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
          <p className="text-muted text-sm flex items-center gap-2" style={{ marginBottom: '16px' }}>
             <Radar size={16} color={sentimentColor}/> Macro Intelligence Weather
          </p>
          
          <div style={{ position: 'relative', width: '220px', height: '110px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0}
                  innerRadius={75} outerRadius={95} paddingAngle={0} dataKey="value" stroke="none" cornerRadius={10}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
               <h2 style={{ fontSize: '34px', margin: '0 0 4px 0', color: sentimentColor }}>{weather.percent}%</h2>
               <p className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                 {weather.percent > 65 ? 'Bullish' : weather.percent < 45 ? 'Bearish' : 'Neutral'}
               </p>
            </div>
          </div>
          <p className="text-muted text-xs" style={{ marginTop: '20px' }}>
             Analysis of {weather.articleCount} incoming global news headlines across your core holdings today.
          </p>
        </div>
      </div>

      <div className="glass-panel delay-3" style={{ marginTop: '30px', position: 'relative' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
               <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Radio size={22} className="text-secondary" /> Projective Oracle Forecast
               </h3>
               <p className="text-muted text-sm" style={{ marginBottom: '24px' }}>AI-driven growth vector mapping using active geopolitical news parsing & NIFTY indexing bounds.</p>
            </div>
            {oracleData && (
                <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--accent-primary)' }}>
                   <p className="text-muted text-xs uppercase" style={{ letterSpacing: '1px' }}>6-Month Alpha Projection</p>
                   {oracleSyncing ? <p className="text-muted spin-animation">Calculating...</p> : (
                     <h2 className={oracleData.growthPercent >= 0 ? "text-success" : "text-danger"} style={{ fontSize: '28px', marginTop: '4px' }}>
                       {oracleData.growthPercent >= 0 ? '+' : ''}{oracleData.growthPercent}%
                     </h2>
                   )}
                </div>
            )}
         </div>
         
         <div style={{ height: '320px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {oracleSyncing ? (
             <p className="text-primary" style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>📡 Processing Vector Weights...</p>
          ) : projectionTimeline.length > 0 ? (
          <ResponsiveContainer>
            <LineChart data={projectionTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['dataMin - (dataMin*0.05)', 'dataMax + (dataMax*0.05)']} />
              <Tooltip 
                formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                contentStyle={{ background: '#0a1f26', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="Projected Value" 
                stroke="var(--accent-primary)" 
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={{ fill: 'var(--bg-color)', stroke: 'var(--accent-primary)', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, fill: 'var(--accent-primary)' }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
          ) : <p className="text-muted">Import assets into the Vault to unlock Oracle mathematical forecasting.</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(350px, 1fr) 1fr',
    gap: '30px'
  }
};
