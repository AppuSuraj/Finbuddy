import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { assetAllocation } from '../data/mockData';
import { TrendingUp, Layers } from 'lucide-react';

export default function Portfolio() {
  const totalValue = assetAllocation.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Investment Portfolio</h1>
          <p className="text-muted">Track your wealth allocation across different asset classes.</p>
        </div>
      </div>

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
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ background: '#0a1f26', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.centerText}>
              <p className="text-muted text-sm">Total Assets</p>
              <h2 style={{ fontSize: '28px' }}>${totalValue.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        <div className="glass-panel delay-2">
          <h3 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} className="text-secondary" /> Holdings Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assetAllocation.map((asset, i) => {
              const percentage = ((asset.value / totalValue) * 100).toFixed(1);
              return (
                <div key={i} style={styles.assetCard}>
                  <div className="flex items-center gap-4">
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: asset.color }}></div>
                    <span style={{ fontWeight: 500, fontSize: '18px' }}>{asset.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, fontSize: '18px' }}>${asset.value.toLocaleString()}</p>
                    <p className="text-muted text-sm">{percentage}% of portfolio</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
