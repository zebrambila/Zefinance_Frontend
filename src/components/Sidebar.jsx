import { useState } from 'react';

const COLLAPSE_KEY = 'zefinance:sidebarCollapsed';

const NavItem = ({ active, onClick, icon, label, collapsed }) => (
  <div style={{ position: 'relative', marginBottom: 2 }}>
    {active && <div style={{ position: 'absolute', inset: 0, background: '#1e2329', borderRadius: 8 }} />}
    {active && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: '#FCD535', borderRadius: '0 2px 2px 0' }} />}
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start',
        background: 'transparent', color: '#eaecef',
        border: 0, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left'
      }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  </div>
);

const Icon = {
  Dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2"   y="2"   width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="2"   width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2"   y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Ativos: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1.5"  y="9"   width="3.2" height="5.5"  rx="0.6" fill="currentColor"/>
      <rect x="6.4"  y="5.5" width="3.2" height="9"    rx="0.6" fill="currentColor"/>
      <rect x="11.3" y="2"   width="3.2" height="12.5" rx="0.6" fill="currentColor"/>
    </svg>
  ),
  Dividendos: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9.8 6.1c-.3-.7-1-1.1-1.9-1.1-1.2 0-2 .6-2 1.5 0 .9.8 1.3 2 1.6 1.4.4 2.2.8 2.2 1.8 0 1-.9 1.6-2.2 1.6-1 0-1.8-.4-2.1-1.2M8 4v1M8 11v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Transacoes: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M2.5 5h9M9 2.2 11.8 5 9 7.8"/>
      <path d="M13.5 11h-9M7 13.8 4.2 11 7 8.2"/>
    </svg>
  ),
  Configuracoes: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="2"/>
      <path d="M13.4 9.6a1.2 1.2 0 0 0 .24 1.32l.04.04a1.4 1.4 0 1 1-2 2l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.72 1.1V14a1.4 1.4 0 1 1-2.8 0v-.06a1.2 1.2 0 0 0-.78-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.4 1.4 0 1 1-2-2l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.72H2a1.4 1.4 0 1 1 0-2.8h.06a1.2 1.2 0 0 0 1.1-.78"/>
    </svg>
  ),
};

export default function Sidebar({ page, onNavigate }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <aside style={{
      width: collapsed ? 72 : 240, background: '#0b0e11', borderRight: '1px solid #2b3139',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh',
      transition: 'width 0.18s ease'
    }}>

      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        style={{
          position: 'absolute', right: -11, top: 26, width: 22, height: 22, borderRadius: '50%',
          background: '#1e2329', border: '1px solid #2b3139', color: '#707a8a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}>
          <path d="m9.5 3.5-5 4.5 5 4.5"/>
        </svg>
      </button>

      <div style={{ padding: collapsed ? '22px 0 24px' : '22px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: '#FCD535', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#181a20', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>Z</div>
        {!collapsed && <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: '#FCD535' }}>ZeFinance</div>}
      </div>

      <div style={{ padding: collapsed ? '4px 10px' : '4px 12px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {!collapsed && <div style={{ padding: '16px 10px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: '#707a8a' }}>GERAL</div>}
        <NavItem active={page === 'dashboard'} onClick={() => onNavigate('dashboard')} icon={Icon.Dashboard} label="Dashboard" collapsed={collapsed} />

        {!collapsed && <div style={{ padding: '18px 10px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: '#707a8a' }}>CARTEIRA</div>}
        {collapsed && <div style={{ height: 1, background: '#1e2329', margin: '12px 4px' }} />}
        <NavItem active={page === 'ativos'}     onClick={() => onNavigate('ativos')}     icon={Icon.Ativos}     label="Ativos"     collapsed={collapsed} />
        <NavItem active={page === 'dividendos'} onClick={() => onNavigate('dividendos')} icon={Icon.Dividendos} label="Dividendos" collapsed={collapsed} />
        <NavItem active={page === 'transacoes'} onClick={() => onNavigate('transacoes')} icon={Icon.Transacoes} label="Transações" collapsed={collapsed} />

        {!collapsed && <div style={{ padding: '18px 10px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: '#707a8a' }}>CONTA</div>}
        {collapsed && <div style={{ height: 1, background: '#1e2329', margin: '12px 4px' }} />}
        <NavItem active={page === 'configuracoes'} onClick={() => onNavigate('configuracoes')} icon={Icon.Configuracoes} label="Configurações" collapsed={collapsed} />

      </div>

    </aside>
  );
}
