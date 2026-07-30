export default function KpiCard({ icon, label, value, cents, delta, deltaColor = '#0ecb81', foot, mainColor = '#ffffff' }) {
  return (
    <div style={{ background: '#1e2329', borderRadius: 12, padding: 20, border: '1px solid #2b3139' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#707a8a', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 26, color: mainColor, letterSpacing: '-0.01em', lineHeight: 1 }}>
        {value}
        {cents !== undefined && <span style={{ color: '#707a8a', fontSize: 18, fontWeight: 500 }}>{cents}</span>}
      </div>
      {(delta || foot) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {delta && <span style={{ color: deltaColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{delta}</span>}
          {foot && <span style={{ color: '#707a8a', fontSize: 12 }}>{foot}</span>}
        </div>
      )}
    </div>
  );
}
