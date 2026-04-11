import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Radar, PieChart as PieIcon, Radio } from 'lucide-react';
import { performanceData } from '../data/mockData';

export default function Dashboard() {
  const [netWorth, setNetWorth] = useState(0);
  const [weather, setWeather] = useState({ percent: 50, articleCount: 0 });
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

      <div className="glass-panel delay-3" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '24px' }}>Historical Portfolio Projection (Algorithm Model)</h3>
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['dataMin - 5000', 'dataMax + 5000']} />
              <Tooltip 
                contentStyle={{ background: '#0a1f26', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--accent-primary)" 
                strokeWidth={4}
                dot={{ fill: 'var(--bg-color)', stroke: 'var(--accent-primary)', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: 'var(--accent-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
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
