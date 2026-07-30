export default function Toast({ msg }) {
  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1e2329', border: '1px solid #2b3139', borderLeft: '3px solid #0ecb81',
      borderRadius: 10, padding: '12px 18px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(14,203,129,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0ecb81" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 8 3.5 3.5L13 5"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{msg}</div>
        <div style={{ fontSize: 11, color: '#707a8a', marginTop: 1 }}>A operação foi adicionada ao seu histórico</div>
      </div>
    </div>
  );
}
