import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
// We still use static performanceData for the chart as we didn't model historical snapshots in DB yet
import { performanceData } from '../data/mockData';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [netWorth, setNetWorth] = useState(0);
  const [liquidCash, setLiquidCash] = useState(0);
  const [loading, setLoading] = useState(true);

  // New Transaction State
  const [showForm, setShowForm] = useState(false);
  const [newTx, setNewTx] = useState({ description: '', amount: '', type: 'expense' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    // Fetch recent transactions
    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(5);
    if (txData) setTransactions(txData);

    // Calculate dynamic Net Worth from assets
    const { data: assetData } = await supabase.from('assets').select('value');
    let totalAssets = 0;
    if (assetData) {
      totalAssets = assetData.reduce((acc, curr) => acc + Number(curr.value), 0);
    }
    setNetWorth(totalAssets);

    // Calculate dynamic Liquid Cash from Savings/Checking accounts
    const { data: accData } = await supabase.from('accounts').select('balance, type');
    let totalLiquid = 0;
    if (accData) {
      accData.forEach(acc => {
        if (acc.type === 'Checking' || acc.type === 'Savings') {
          totalLiquid += Number(acc.balance);
        }
      });
    }
    setLiquidCash(totalLiquid);

    setLoading(false);
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const amountVal = newTx.type === 'expense' ? -Math.abs(Number(newTx.amount)) : Math.abs(Number(newTx.amount));
    
    const { error } = await supabase.from('transactions').insert([
      { 
        description: newTx.description, 
        amount: amountVal, 
        type: newTx.type, 
        date_label: 'Just Now' 
      }
    ]);

    if (!error) {
      setShowForm(false);
      setNewTx({ description: '', amount: '', type: 'expense' });
      fetchDashboardData(); // Refreshes live balances and list
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return <div className="main-content"><p className="text-muted">Loading Dashboard...</p></div>;
  }

  const liquidPercent = netWorth === 0 ? 0 : ((liquidCash / netWorth) * 100).toFixed(1);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Welcome back, <span className="text-gradient">Suraj</span>
          </h1>
          <p className="text-muted">Here is your live financial summary.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel animate-in" style={{ marginBottom: '30px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>New Transaction</h3>
          <form style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }} onSubmit={handleAddTransaction}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Description</label>
              <input required type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} style={styles.input} placeholder="e.g. Grocery Store" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Amount (₹)</label>
              <input required type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} style={styles.input} placeholder="150" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Type</label>
              <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} style={styles.input}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.metricsGrid}>
        <div className="glass-panel delay-1">
          <p className="text-muted text-sm">Live Net Worth (from Assets)</p>
          <h2 style={{ fontSize: '42px', margin: '10px 0' }}>
            ₹{netWorth.toLocaleString('en-IN')}
          </h2>
          <div className="flex items-center gap-2 text-success" style={{ fontWeight: 500 }}>
            <ArrowUpRight size={20} />
            <span>Updated live from Supabase</span>
          </div>
        </div>
        <div className="glass-panel delay-2 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm">Liquid Cash (Savings & Checking)</p>
            <h2 style={{ fontSize: '28px', margin: '8px 0' }}>₹{liquidCash.toLocaleString('en-IN')}</h2>
            <span className="text-sm text-muted">{liquidPercent}% of Net Worth</span>
          </div>
          <div style={styles.iconBox}>
            <Wallet size={28} color="var(--accent-primary)" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>
        <div className="glass-panel delay-3">
          <h3 style={{ marginBottom: '24px' }}>Historical Performance (Mock)</h3>
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
          {transactions.length === 0 ? (
            <p className="text-muted">No transactions found in Database.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={styles.transaction}>
                  <div>
                    <p style={{ fontWeight: 500 }}>{tx.description}</p>
                    <p className="text-xs text-muted" style={{ marginTop: '4px' }}>{tx.date_label}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={Number(tx.amount) > 0 ? 'text-success' : 'text-primary'} style={{ fontWeight: 600 }}>
                      {Number(tx.amount) > 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary w-full" style={{ marginTop: '24px' }}>View All</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  input: {
    width: '100%', padding: '10px 14px', marginTop: '6px', borderRadius: '8px', 
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
    color: '#fff', outline: 'none', fontFamily: 'inherit'
  },
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
