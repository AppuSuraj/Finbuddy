import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Building2, CreditCard, PiggyBank, Plus } from 'lucide-react';

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Account State
  const [showForm, setShowForm] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', type: 'Checking', balance: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  }

  async function handleAddAccount(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('accounts').insert([
      { 
        name: newAcc.name, 
        type: newAcc.type, 
        balance: Number(newAcc.balance) 
      }
    ]);

    if (!error) {
      setShowForm(false);
      setNewAcc({ name: '', type: 'Checking', balance: '' });
      fetchAccounts(); 
    }
    setIsSubmitting(false);
  }

  const getIcon = (type) => {
    switch (type) {
      case 'Checking': return <Building2 size={24} color="var(--accent-primary)" />;
      case 'Savings': return <PiggyBank size={24} color="var(--accent-secondary)" />;
      case 'Credit': return <CreditCard size={24} color="var(--warning)" />;
      default: return <Building2 size={24} color="var(--accent-primary)" />;
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Connected Accounts</h1>
          <p className="text-muted">Manage your liquid assets, checking, and credit lines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={18}/> Link Account</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel animate-in" style={{ marginBottom: '30px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Link New Account</h3>
          <form style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }} onSubmit={handleAddAccount}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Account Name</label>
              <input required type="text" value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} style={styles.input} placeholder="e.g. Citi Bank" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Initial Balance (₹)</label>
              <input required type="number" value={newAcc.balance} onChange={e => setNewAcc({...newAcc, balance: e.target.value})} style={styles.input} placeholder="5000" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted">Type</label>
              <select value={newAcc.type} onChange={e => setNewAcc({...newAcc, type: e.target.value})} style={styles.input}>
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Linking...' : 'Link'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Syncing securely with Database...</p>
      ) : accounts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Building2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No Accounts Linked</h3>
          <p className="text-muted" style={{ marginBottom: '24px' }}>Please run the SQL schema in Supabase to initialize.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {accounts.map((acc, index) => (
            <div key={acc.id} className={`glass-panel delay-${index + 1}`} style={styles.accountCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={styles.iconWrapper}>
                  {getIcon(acc.type)}
                </div>
                <span style={styles.badge}>{acc.type}</span>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <p className="text-muted">{acc.name}</p>
                <h2 style={{ fontSize: '32px', margin: '8px 0', color: acc.balance < 0 ? 'var(--warning)' : '#fff' }}>
                  ₹{Math.abs(acc.balance).toLocaleString('en-IN')}
                  {acc.balance < 0 && <span className="text-sm" style={{marginLeft:'8px', color: 'var(--text-muted)'}}>(Owed)</span>}
                </h2>
              </div>
              
              <div style={styles.cardFooter}>
                <span className="text-sm text-primary" style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>View Transactions →</span>
              </div>
            </div>
          ))}
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  accountCard: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  iconWrapper: {
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardFooter: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'flex-end'
  }
};
