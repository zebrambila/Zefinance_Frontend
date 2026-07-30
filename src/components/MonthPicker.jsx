import { useEffect, useRef, useState } from 'react';

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const pad2 = (n) => String(n).padStart(2, '0');

const formatMonth = (m) => {
  if (!m) return 'Selecionar mês';
  const [year, month] = m.split('-').map(Number);
  return `${monthLabels[month - 1]}/${year}`;
};

export default function MonthPicker({ month, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (month ? Number(month.split('-')[0]) : new Date().getFullYear()));
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectedYear = month ? Number(month.split('-')[0]) : null;
  const selectedMonthIndex = month ? Number(month.split('-')[1]) : null;

  const pickMonth = (monthIndex) => {
    onChange(`${viewYear}-${pad2(monthIndex)}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          height: 36, padding: '0 14px',
          background: month ? '#2b3139' : 'transparent',
          color: month ? '#FCD535' : '#eaecef',
          border: month ? '1px solid #FCD535' : '1px solid #2b3139',
          borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="3" width="12" height="11" rx="1.5"/>
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round"/>
        </svg>
        {formatMonth(month)}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20,
          background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10,
          padding: 14, width: 240, boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={() => setViewYear((y) => y - 1)}
              style={{ background: 'transparent', border: 0, color: '#707a8a', cursor: 'pointer', padding: 4, display: 'flex' }}
              aria-label="Ano anterior"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>{viewYear}</span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              style={{ background: 'transparent', border: 0, color: '#707a8a', cursor: 'pointer', padding: 4, display: 'flex' }}
              aria-label="Próximo ano"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 3 5 5-5 5"/></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {monthLabels.map((label, i) => {
              const monthIndex = i + 1;
              const isSelected = selectedYear === viewYear && selectedMonthIndex === monthIndex;
              return (
                <button
                  key={label}
                  onClick={() => pickMonth(monthIndex)}
                  style={{
                    padding: '8px 0', fontSize: 12, fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#181a20' : '#eaecef',
                    background: isSelected ? '#FCD535' : '#0b0e11',
                    border: '1px solid ' + (isSelected ? '#FCD535' : '#2b3139'),
                    borderRadius: 6, cursor: 'pointer'
                  }}
                >{label}</button>
              );
            })}
          </div>

          {month && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              style={{ marginTop: 12, width: '100%', padding: '8px 0', background: 'transparent', border: '1px solid #2b3139', borderRadius: 6, color: '#707a8a', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >Limpar seleção</button>
          )}
        </div>
      )}
    </div>
  );
}
