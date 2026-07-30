export default function ModalShell({ eyebrow, title, subtitle, onClose, footer, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e2329', border: '1px solid #2b3139', borderRadius: 16,
          width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ padding: '22px 24px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #2b3139' }}>
          <div>
            <div style={{ fontSize: 11, color: '#FCD535', letterSpacing: '0.12em', fontWeight: 600 }}>{eyebrow}</div>
            <div style={{ fontSize: 19, fontWeight: 600, color: '#ffffff', marginTop: 4 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#707a8a', marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: '#707a8a', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 6 }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3 3 13"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {children}
        </div>

        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #2b3139', display: 'flex', gap: 10 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

export const Label = ({ children, optional }) => (
  <label style={{ fontSize: 11, color: '#707a8a', letterSpacing: '0.06em', fontWeight: 600 }}>
    {children}
    {optional && <span style={{ color: '#5a626e', fontWeight: 400, letterSpacing: 0, marginLeft: 4 }}>(opcional)</span>}
  </label>
);

export const CancelButton = ({ onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, height: 42, background: 'transparent', border: '1px solid #2b3139',
    borderRadius: 8, color: '#eaecef', fontSize: 13, fontWeight: 600, cursor: 'pointer'
  }}>Cancelar</button>
);

export const SubmitButton = ({ valid, onClick, icon, children }) => (
  <button
    onClick={valid ? onClick : undefined}
    style={{
      flex: 2, height: 42,
      background: valid ? '#FCD535' : '#3a3a1f',
      color: valid ? '#181a20' : '#707a8a',
      border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: valid ? 'pointer' : 'not-allowed',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
    }}
  >
    {icon}
    {children}
  </button>
);
