import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { overallMetrics, performanceData, recentTransactions } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Welcome back, <span className="text-gradient">Suraj</span>
          </h1>
          <p className="text-muted">Here is your financial summary for today.</p>
        </div>
        <button className="btn btn-primary">+ Add Transaction</button>
      </div>

      <div style={styles.metricsGrid}>
        <div className="glass-panel delay-1">
          <p className="text-muted text-sm">Total Net Worth</p>
          <h2 style={{ fontSize: '42px', margin: '10px 0' }}>
            ${overallMetrics.netWorth.toLocaleString()}
          </h2>
          <div className="flex items-center gap-2 text-success" style={{ fontWeight: 500 }}>
            <ArrowUpRight size={20} />
            <span>${overallMetrics.monthlyChange.toLocaleString()} ({overallMetrics.monthlyChangePercent}%) this month</span>
          </div>
        </div>
        <div className="glass-panel delay-2 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm">Liquid Cash (Savings & Checking)</p>
            <h2 style={{ fontSize: '28px', margin: '8px 0' }}>$21,500</h2>
            <span className="text-sm text-muted">21% of Net Worth</span>
          </div>
          <div style={styles.iconBox}>
            <Wallet size={28} color="var(--accent-primary)" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>
        <div className="glass-panel delay-3">
          <h3 style={{ marginBottom: '24px' }}>Performance History</h3>
          <div style={{ height: '300px', width: '100%' }}>
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

        <div className="glass-panel delay-3">
          <h3 style={{ marginBottom: '24px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {recentTransactions.map(tx => (
              <div key={tx.id} style={styles.transaction}>
                <div>
                  <p style={{ fontWeight: 500 }}>{tx.desc}</p>
                  <p className="text-xs text-muted" style={{ marginTop: '4px' }}>{tx.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className={tx.amount > 0 ? 'text-success' : 'text-primary'} style={{ fontWeight: 600 }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary w-full" style={{ marginTop: '24px' }}>View All</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px'
  },
  iconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    background: 'rgba(45, 212, 191, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  transaction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  }
};
