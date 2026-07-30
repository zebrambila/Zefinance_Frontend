export default function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const btnStyle = (disabled) => ({
    width: 28, height: 28, borderRadius: 6, background: '#1e2329', border: '1px solid #2b3139',
    color: disabled ? '#3a4148' : '#eaecef', cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #2b3139' }}>
      <span style={{ fontSize: 12, color: '#707a8a' }}>{from}–{to} de {totalCount}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={btnStyle(page <= 1)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9.5 3.5-5 4.5 5 4.5"/></svg>
        </button>
        <span style={{ fontSize: 12, color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>Página {page} de {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={btnStyle(page >= totalPages)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 3.5 5 4.5-5 4.5"/></svg>
        </button>
      </div>
    </div>
  );
}
