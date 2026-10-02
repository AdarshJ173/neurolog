import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Server, Search, BrainCircuit, ChevronRight, ChevronLeft, Settings, Bot } from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside
      className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isCollapsed ? '64px' : '250px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--glass-border)',
        height: '100%',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '24px 8px' : '24px 12px',
        borderRadius: '0 16px 16px 0',
        transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        overflowX: 'hidden'
      }}
    >
      {/* --- LOGO & TOGGLE --- */}
      <div
        role="button" tabIndex={0} aria-label="Toggle sidebar" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSidebar(); } }} className="brand-container"
        onClick={toggleSidebar}
        style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '40px', cursor: 'pointer', position: 'relative',
            paddingLeft: isCollapsed ? '15px' : '12px',
            transition: 'padding 0.3s ease'
        }}
      >
        <div style={{minWidth: '32px'}}>
            <BrainCircuit size={32} color="#3b82f6" />
        </div>

        <h2 style={{
            margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight:'700', letterSpacing:'-0.5px',
            opacity: isCollapsed ? 0 : 1, whiteSpace: 'nowrap', transition: 'opacity 0.2s ease', display: isCollapsed ? 'none' : 'block'
        }}>
          NEUROLOG
        </h2>
      </div>

      {/* --- NAVIGATION MENU --- */}
      <nav style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: 1}}>
        <NavItem to="/dashboard" icon={<Activity size={22} />} label="Live Monitor" active={isActive('/dashboard')} collapsed={isCollapsed} />
        <NavItem to="/analysis" icon={<Server size={22} />} label="Vector Analysis" active={isActive('/analysis')} collapsed={isCollapsed} />
        <NavItem to="/explorer" icon={<Search size={22} />} label="Log Explorer" active={isActive('/explorer')} collapsed={isCollapsed} />

        {/* NEW AI ASSISTANT TAB */}
        <NavItem to="/assistant" icon={<Bot size={22} />} label="AI Assistant" active={isActive('/assistant')} collapsed={isCollapsed} />

        <NavItem to="/configuration" icon={<Settings size={20} />} label="Configuration" active={isActive('/configuration')} collapsed={isCollapsed} />
      </nav>

      {/* --- FOOTER TOGGLE --- */}
      <div
        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', paddingLeft: isCollapsed ? '12px' : '16px', paddingBottom: '16px', transition: 'padding 0.3s ease' }}
        onClick={toggleSidebar}
      >
        {isCollapsed ? <ChevronRight size={24} /> : <><ChevronLeft size={20}/> <span className="collapse-label" style={{fontSize:'0.9rem', whiteSpace: 'nowrap'}}>Collapse Sidebar</span></>}
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon, label, active, collapsed }) => (
  <Link
    aria-label={label} aria-current={active ? "page" : undefined} title={label}
    to={to}
    style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '12px', borderRadius: '12px', color: active ? '#fff' : 'var(--text-muted)',
        background: active ? '#3b82f6' : 'transparent', textDecoration: 'none', transition: 'all 0.2s ease', minWidth: collapsed ? '46px' : 'auto'
    }}
  >
    <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>{icon}</div>
    <span style={{ marginLeft: '14px', fontWeight: '500', fontSize:'0.95rem', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, display: collapsed ? 'none' : 'block', transition: 'opacity 0.2s ease' }}>
        {label}
    </span>
  </Link>
);

export default Sidebar;
