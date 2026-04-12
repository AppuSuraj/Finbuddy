import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Settings as SettingsIcon, FileUp, LogOut, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ session, isCollapsed, onToggle }) {
  const navigate = useNavigate();
  const email = session?.user?.email || '';
  const isAdmin = email.toLowerCase() === 'surajsan1998@gmail.com';
  const initials = email.slice(0, 2).toUpperCase();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Smart Import', path: '/import', icon: FileUp },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Meta-Vault', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '252px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(45, 212, 191, 0.12)',
      background: 'linear-gradient(180deg, rgba(4,16,20,0.98) 0%, rgba(6,22,28,0.97) 100%)',
      backdropFilter: 'blur(24px)',
      transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>

      {/* Brand */}
      <div style={{
        padding: isCollapsed ? '24px 0' : '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'padding 0.28s ease',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
          boxShadow: '0 0 18px rgba(45,212,191,0.45)',
          flexShrink: 0,
        }} />
        {!isCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <h2 style={{ fontSize: '20px', color: '#fff', margin: 0, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>Finbuddy</h2>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Intelligence Terminal</p>
          </div>
        )}
      </div>

      {/* User Pill */}
      <div style={{
        margin: isCollapsed ? '16px 10px' : '16px 16px',
        padding: isCollapsed ? '10px 0' : '12px 14px',
        background: 'rgba(45, 212, 191, 0.07)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        transition: 'all 0.28s ease',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#041014', flexShrink: 0,
        }}>{initials}</div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: '12px', color: '#fff', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isAdmin ? 'Suraj (Admin)' : email.split('@')[0]}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Live Session</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav Label */}
      {!isCollapsed && (
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 20px 8px', margin: 0 }}>Navigation</p>
      )}

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: isCollapsed ? '0 10px' : '0 12px', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isCollapsed ? item.name : ''}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isCollapsed ? '12px 0' : '11px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.45)',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: isActive ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
              boxShadow: isActive ? 'inset 3px 0 0 var(--accent-primary)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            })}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ opacity: 1, transition: 'opacity 0.2s' }}>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: isCollapsed ? '16px 10px' : '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', marginBottom: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.5)', padding: isCollapsed ? '10px 0' : '9px 14px',
            cursor: 'pointer', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '10px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s ease',
          }}
        >
          <SettingsIcon size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && 'Settings'}
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            color: 'rgba(239,68,68,0.7)', padding: isCollapsed ? '10px 0' : '9px 14px',
            cursor: 'pointer', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '10px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s ease',
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && 'Sign Out'}
        </button>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          style={{
            width: '100%', marginTop: '10px',
            background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.15)',
            color: 'var(--accent-primary)', padding: '8px 0',
            cursor: 'pointer', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span style={{ fontSize: '12px', marginLeft: '6px' }}>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
