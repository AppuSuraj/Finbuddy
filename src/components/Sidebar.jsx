import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Settings as SettingsIcon, FileUp, LogOut, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ session, isCollapsed, onToggle }) {
  const navigate = useNavigate();
  const isAdmin = session?.user?.email === 'surajsan1998@gmail.com';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Smart Import', path: '/import', icon: FileUp }
  ];

  if (isAdmin) {
    navItems.push({ name: 'System Meta-Vault', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside style={{ ...styles.sidebar, width: isCollapsed ? '80px' : '250px' }}>
      <div style={{ ...styles.brand, justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '30px 0' : '30px 24px' }}>
        <div style={styles.logoMark} />
        {!isCollapsed && <h2 style={styles.brandText}>Finbuddy</h2>}
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            style={({isActive}) => ({
              ...styles.navItem,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '14px 0' : '14px 16px',
              ...(isActive ? styles.navItemActive : {})
            })}
            title={isCollapsed ? item.name : ''}
          >
            <item.icon size={20} color={""} className="nav-icon" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ ...styles.footer, padding: isCollapsed ? '24px 10px' : '24px' }}>
        <button className="btn btn-secondary w-full" onClick={() => navigate('/settings')} style={{ marginBottom: '12px', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '8px 0' : '10px 20px' }}>
          <SettingsIcon size={18} /> {!isCollapsed && 'Settings'}
        </button>
        <button className="btn w-full" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '8px 0' : '10px 20px' }} onClick={() => supabase.auth.signOut()}>
          <LogOut size={18} /> {!isCollapsed && 'Disconnect'}
        </button>

        <button 
          onClick={onToggle}
          style={{ width: '100%', marginTop: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--accent-primary)', padding: '10px 0', cursor: 'pointer', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--card-border)',
    background: 'rgba(4, 16, 20, 0.9)',
    backdropFilter: 'blur(20px)',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowX: 'hidden',
    position: 'sticky',
    top: 0
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
