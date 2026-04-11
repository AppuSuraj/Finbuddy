import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Settings as SettingsIcon, FileUp, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sidebar() {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Smart Import', path: '/import', icon: FileUp }
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logoMark} />
        <h2 style={styles.brandText}>Finbuddy</h2>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            style={({isActive}) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {})
            })}
          >
            <item.icon size={20} color={""} className="nav-icon" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <button className="btn btn-secondary w-full" onClick={() => navigate('/settings')} style={{ marginBottom: '12px' }}>
          <SettingsIcon size={18} /> Settings
        </button>
        <button className="btn w-full" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => supabase.auth.signOut()}>
          <LogOut size={18} /> Disconnect
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-w)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--card-border)',
    background: 'rgba(4, 16, 20, 0.8)',
    backdropFilter: 'blur(20px)'
  },
  brand: {
    padding: '30px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--accent-gradient)',
    boxShadow: '0 0 15px rgba(45, 212, 191, 0.4)'
  },
  brandText: {
    fontSize: '24px',
    color: '#fff',
    margin: 0
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 16px',
    flex: 1
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: 'var(--text-muted)',
    fontSize: '16px',
    fontWeight: 500,
    transition: 'all 0.3s ease'
  },
  navItemActive: {
    background: 'rgba(45, 212, 191, 0.1)',
    color: 'var(--accent-primary)',
    boxShadow: 'inset 3px 0 0 var(--accent-primary)'
  },
  footer: {
    padding: '24px',
    marginTop: 'auto'
  }
};
