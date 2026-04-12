import fs from 'fs';

const file = 'src/components/Portfolio.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add deepScrutinyData and deepScrutinyLoading state after line 80
content = content.replace(
  "  const [selectedSectorFilter, setSelectedSectorFilter] = useState(null);",
  "  const [selectedSectorFilter, setSelectedSectorFilter] = useState(null);\n  const [deepScrutinyData, setDeepScrutinyData] = useState(null);\n  const [deepScrutinyLoading, setDeepScrutinyLoading] = useState(false);"
);

// 2. Replace handleDeepScrutiny function (lines 245-268)
const OLD_DS = `  const handleDeepScrutiny = async (asset) => {
    // Parse ticker name
    const match = asset.name.match(/(.+?)\\s*\\(\\s*(\\d+(?:\\.\\d+)?)\\s*shares\\)/i);
    const ticker = match ? match[1].trim() : asset.name;
    
    setRefreshing(true); // Re-use refreshing state for global UI feedback
    try {
       // Call profile with .NS first, then .BO if needed
       const res = await fetch(\`/api/profile?symbol=\${ticker}.NS\`);
       const data = await res.json();
       
       if (data.sector && data.sector !== 'Unknown') {
          await supabase.from('assets').update({ sector: data.sector }).eq('id', asset.id);
          alert(\`ORACLE SUCCESS: \${ticker} classified as "\${data.sector}"\`);
          fetchAssets();
          if (selectedAsset?.id === asset.id) setSelectedAsset({...selectedAsset, sector: data.sector});
       } else {
          alert(\`ORACLE FAILURE: No public metadata found for \${ticker}. Manual override required.\`);
       }
    } catch(e) {
       alert("Network Interruption during Deep Scrutiny.");
    }
    setRefreshing(false);
  };`;

const NEW_DS = `  const handleDeepScrutiny = async (asset) => {
    const match = asset.name.match(/(.+?)\\s*\\(\\s*(\\d+(?:\\.\\d+)?)\\s*shares\\)/i);
    const ticker = match ? match[1].trim() : asset.name.split('(')[0].trim();
    setDeepScrutinyData(null);
    setDeepScrutinyLoading(true);
    try {
      const [techRes, profileRes] = await Promise.allSettled([
        fetch(\`/api/deep-scrutiny?symbol=\${ticker}.NS\`).then(r => r.ok ? r.json() : fetch(\`/api/deep-scrutiny?symbol=\${ticker}.BO\`).then(r2 => r2.json())),
        fetch(\`/api/profile?symbol=\${ticker}.NS\`).then(r => r.json()),
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
  };`;

if (content.includes(OLD_DS)) {
  content = content.replace(OLD_DS, NEW_DS);
  console.log('✅ Replaced handleDeepScrutiny');
} else {
  console.log('❌ handleDeepScrutiny not found — manual patch needed');
  // Try partial replacement
  content = content.replace(
    "  const handleDeepScrutiny = async (asset) => {\n    // Parse ticker name",
    NEW_DS + "\n  const _REPLACED_handleDeepScrutiny_IGNORE = async () => {\n    // Parse ticker name"
  );
}

// 3. Clear deepScrutinyData when selecting a new asset
content = content.replace(
  "  const handleSelectAsset = async (asset) => {\n    setSelectedAsset(asset);\n    setFetchingInsights(true);\n    setInsightsData(null);\n    setIsEditingSector(false);",
  "  const handleSelectAsset = async (asset) => {\n    setSelectedAsset(asset);\n    setFetchingInsights(true);\n    setInsightsData(null);\n    setDeepScrutinyData(null);\n    setIsEditingSector(false);"
);

// 4. Add Deep Scrutiny panel between fundamentals and news section
const BEFORE_NEWS = `                 {insightsData.profile?.dataSource && (
                   <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '24px', textAlign: 'right' }}>
                     Data sourced from {insightsData.profile.dataSource}
                   </p>
                 )}

                 
                 <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Newspaper size={20} color="var(--accent-primary)" /> Latest Market Intelligence
                 </h3>`;

const WITH_TECH_ANALYSIS = `                 {insightsData.profile?.dataSource && (
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
                         <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.6 }}>{deepScrutinyData.trendDesc}</p>

                         {/* DMA + RSI Grid */}
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                           {deepScrutinyData.dma50 && (
                             <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: \`1px solid \${deepScrutinyData.aboveDma50 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}\` }}>
                               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>DMA 50</p>
                               <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.aboveDma50 ? '#10b981' : '#ef4444' }}>₹{deepScrutinyData.dma50.toLocaleString('en-IN')}</p>
                               <p style={{ fontSize: '11px', margin: '4px 0 0', color: deepScrutinyData.aboveDma50 ? '#10b981' : '#ef4444' }}>{deepScrutinyData.aboveDma50 ? '▲' : '▼'} {Math.abs(deepScrutinyData.dma50Diff)}% {deepScrutinyData.aboveDma50 ? 'above' : 'below'}</p>
                             </div>
                           )}
                           {deepScrutinyData.dma200 && (
                             <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: \`1px solid \${deepScrutinyData.aboveDma200 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}\` }}>
                               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>DMA 200</p>
                               <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.aboveDma200 ? '#10b981' : '#ef4444' }}>₹{deepScrutinyData.dma200.toLocaleString('en-IN')}</p>
                               <p style={{ fontSize: '11px', margin: '4px 0 0', color: deepScrutinyData.aboveDma200 ? '#10b981' : '#ef4444' }}>{deepScrutinyData.aboveDma200 ? '▲' : '▼'} {Math.abs(deepScrutinyData.dma200Diff)}% {deepScrutinyData.aboveDma200 ? 'above' : 'below'}</p>
                             </div>
                           )}
                           {deepScrutinyData.rsi && (
                             <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: \`1px solid \${deepScrutinyData.rsiZone === 'Overbought' ? 'rgba(239,68,68,0.25)' : deepScrutinyData.rsiZone === 'Oversold' ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}\` }}>
                               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>RSI (14)</p>
                               <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: deepScrutinyData.rsiZone === 'Overbought' ? '#ef4444' : deepScrutinyData.rsiZone === 'Oversold' ? '#10b981' : '#eab308' }}>{deepScrutinyData.rsi}</p>
                               <p style={{ fontSize: '11px', margin: '4px 0 0', color: 'rgba(255,255,255,0.4)' }}>{deepScrutinyData.rsiZone}</p>
                             </div>
                           )}
                           {(deepScrutinyData.momentum1m !== null || deepScrutinyData.momentum3m !== null) && (
                             <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Momentum</p>
                               {deepScrutinyData.momentum1m !== null && <p style={{ fontSize: '13px', margin: '0 0 4px', color: deepScrutinyData.momentum1m >= 0 ? '#10b981' : '#ef4444' }}>1M: {deepScrutinyData.momentum1m >= 0 ? '+' : ''}{deepScrutinyData.momentum1m}%</p>}
                               {deepScrutinyData.momentum3m !== null && <p style={{ fontSize: '13px', margin: 0, color: deepScrutinyData.momentum3m >= 0 ? '#10b981' : '#ef4444' }}>3M: {deepScrutinyData.momentum3m >= 0 ? '+' : ''}{deepScrutinyData.momentum3m}%</p>}
                             </div>
                           )}
                         </div>

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
                     ) : (
                       <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Insufficient historical data for technical analysis.</p>
                     )}
                   </div>
                 )}

                 <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Newspaper size={20} color="var(--accent-primary)" /> Latest Market Intelligence
                 </h3>`;

if (content.includes(BEFORE_NEWS)) {
  content = content.replace(BEFORE_NEWS, WITH_TECH_ANALYSIS);
  console.log('✅ Added Deep Scrutiny panel');
} else {
  console.log('❌ Deep Scrutiny insertion point not found');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Done patching Portfolio.jsx');
