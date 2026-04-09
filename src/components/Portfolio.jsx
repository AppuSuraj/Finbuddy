import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Layers, Plus } from 'lucide-react';

export default function Portfolio() {
  const [assetAllocation, setAssetAllocation] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Asset State
  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', value: '', color: '#2dd4bf' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        color: newAsset.color 
      }
    ]);

    if (!error) {
      setShowForm(false);
      setNewAsset({ name: '', value: '', color: '#2dd4bf' });
      fetchAssets(); 
    }
    setIsSubmitting(false);
  }

  const totalValue = assetAllocation.reduce((acc, curr) => acc + Number(curr.value), 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Investment Portfolio</h1>
          <p className="text-muted">Track your wealth allocation across different asset classes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={18}/> Add Asset</>}
        </button>
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
          <p className="text-muted">No assets found. Please run the Supabase schema.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          <div className="glass-panel delay-1">
            <h3 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} className="text-secondary" /> Asset Allocation
            </h3>
            <div style={{ height: '350px', position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ background: '#0a1f26', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.centerText}>
                <p className="text-muted text-sm">Total Assets</p>
                <h2 style={{ fontSize: '28px' }}>₹{totalValue.toLocaleString('en-IN')}</h2>
              </div>
            </div>
          </div>

          <div className="glass-panel delay-2">
            <h3 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} className="text-secondary" /> Holdings Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {assetAllocation.map((asset, i) => {
                const percentage = totalValue === 0 ? 0 : ((asset.value / totalValue) * 100).toFixed(1);
                return (
                  <div key={asset.id} style={styles.assetCard}>
                    <div className="flex items-center gap-4">
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: asset.color }}></div>
                      <span style={{ fontWeight: 500, fontSize: '18px' }}>{asset.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, fontSize: '18px' }}>₹{Number(asset.value).toLocaleString('en-IN')}</p>
                      <p className="text-muted text-sm">{percentage}% of portfolio</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  input: {
    width: '100%', padding: '10px 14px', marginTop: '6px', borderRadius: '8px', 
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
    color: '#fff', outline: 'none', fontFamily: 'inherit'
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
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }
};
