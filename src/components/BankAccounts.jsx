import { bankAccounts } from '../data/mockData';
import { Building2, CreditCard, PiggyBank, Plus } from 'lucide-react';

export default function BankAccounts() {
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
        <button className="btn btn-primary"><Plus size={18}/> Link Account</button>
      </div>

      <div style={styles.grid}>
        {bankAccounts.map((acc, index) => (
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
                ${Math.abs(acc.balance).toLocaleString()}
                {acc.balance < 0 && <span className="text-sm" style={{marginLeft:'8px', color: 'var(--text-muted)'}}>(Owed)</span>}
              </h2>
            </div>
            
            <div style={styles.cardFooter}>
              <span className="text-sm text-primary" style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>View Transactions →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
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
