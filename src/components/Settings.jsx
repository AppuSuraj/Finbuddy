import { useState } from 'react';
import { User, Palette, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Settings() {
  const [profileName, setProfileName] = useState('Suraj');
  const [theme, setTheme] = useState('dark');
  const [saved, setSaved] = useState(false);
  const [erasing, setErasing] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // In a full app, this would write to a 'profiles' table in Supabase
  };

  const handleEraseData = async () => {
    if (window.confirm("Are you SURE? This will permanently delete all your transactions, accounts, and assets.")) {
      setErasing(true);
      try {
        await supabase.from('transactions').delete().neq('id', 0);
        await supabase.from('accounts').delete().neq('id', 0);
        await supabase.from('assets').delete().neq('id', 0);
        window.alert("All financial data has been erased.");
      } catch (err) {
        console.error(err);
        window.alert("Failed to erase data.");
      }
      setErasing(false);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Properties & Settings</h1>
          <p className="text-muted">Configure your Finbuddy experience.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '30px' }}>
        <div className="glass-panel delay-1">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <User size={20} className="text-secondary" /> Profile Details
              </h3>
              <label className="text-xs text-muted">Display Name</label>
              <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} style={styles.input} />
            </div>

            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Palette size={20} className="text-secondary" /> Appearance
              </h3>
              <label className="text-xs text-muted">Theme Settings</label>
              <select value={theme} onChange={e => setTheme(e.target.value)} style={styles.input}>
                <option value="dark">Ocean (Dark) - Default</option>
                <option value="light">Sand (Light)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              {saved ? 'Saved Successfully!' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="glass-panel delay-2">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={20} className="text-secondary" /> Security & Data
          </h3>
          <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>
            Your data is securely stored in your personal Supabase cluster. If you wish to wipe your financial history, you can do so below.
          </p>
          <button 
            onClick={handleEraseData} 
            disabled={erasing}
            className="btn" 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: erasing ? 'not-allowed' : 'pointer' }}
          >
            {erasing ? 'Erasing Data...' : 'Erase All Financial Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  input: {
    width: '100%', padding: '12px 16px', marginTop: '6px', borderRadius: '8px', 
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
    color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '16px'
  }
};
