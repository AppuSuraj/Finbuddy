import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Users, Activity, Clock, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminConsole({ session }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ total: 0, active24h: 0 });

  // Security Gate: Secondary verification inside the component
  const isAdmin = session?.user?.email === 'surajsan1998@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_sign_in_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
      
      const now = new Date();
      const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      setMetrics({
        total: data.length,
        active24h: data.filter(p => new Date(p.last_sign_in_at) > last24h).length
      });
    }
    setLoading(false);
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getRelativeTime = (time) => {
    if (!time) return 'Never';
    const date = new Date(time);
    const diff = new Date() - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Active now';
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <ShieldAlert size={36} className="text-secondary" /> System Meta-Vault
          </h1>
          <p className="text-muted">Master Monitoring for Authorized Terminal Instances</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchProfiles} disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin-animation" : ""} /> Refresh Logs
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex items-center gap-3 text-muted text-sm mb-2">
            <Users size={16} /> TOTAL AUTHORIZED EMAILS
          </div>
          <h2 style={{ fontSize: '32px' }}>{metrics.total}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex items-center gap-3 text-muted text-sm mb-2">
            <Activity size={16} className="text-success" /> ACTIVE (LAST 24H)
          </div>
          <h2 style={{ fontSize: '32px' }}>{metrics.active24h}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 text-muted text-sm mb-2">
            <Clock size={16} /> SYSTEM UPTIME
          </div>
          <h2 style={{ fontSize: '32px' }}>99.9%</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--card-border)' }}>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '1px' }}>TERMINAL IDENTIFIER (EMAIL)</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '1px' }}>LAST HANDSHAKE</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '1px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-bg">
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: getRelativeTime(profile.last_sign_in_at) === 'Active now' ? '#22c55e' : '#94a3b8' 
                    }}></div>
                    <span style={{ fontWeight: 500, fontSize: '16px' }}>{profile.email}</span>
                    {profile.email === 'surajsan1998@gmail.com' && (
                       <span style={{ fontSize: '10px', background: 'var(--accent-primary)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>CREATOR</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                    UUID: {profile.id}
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span className="text-muted">{getRelativeTime(profile.last_sign_in_at)}</span>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                    {profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString() : 'N/A'}
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => alert(`To delete this user:\n1. Open Supabase Dashboard\n2. Auth -> Users\n3. Delete ${profile.email}`)}
                    >
                      <Trash2 size={14} /> Revoke Access
                    </button>
                    <a 
                      href={`https://supabase.com/dashboard/project/_/auth/users`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} /> Open Master
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {profiles.length === 0 && !loading && (
           <div style={{ padding: '60px', textAlign: 'center' }}>
             <p className="text-muted">No external terminal instances logged. You are currently flying solo.</p>
           </div>
        )}
      </div>
    </div>
  );
}
