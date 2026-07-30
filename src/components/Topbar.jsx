import MonthPicker from './MonthPicker.jsx';

const rangeOptions = ['1M', '3M', '6M', '12M', 'YTD', 'ALL'];

export default function Topbar({ eyebrow, title, topbarLabel, onTopbarClick, period, onPeriodChange, month, onMonthChange, showPeriodFilters = true }) {
  return (
    <header style={{
      height: 64, borderBottom: '1px solid #2b3139', display: 'flex', alignItems: 'center',
      padding: '0 32px', gap: 16, background: '#0b0e11', position: 'sticky', top: 0, zIndex: 5
    }}>
      <div>
        <div style={{ fontSize: 11, color: '#707a8a', letterSpacing: '0.08em', fontWeight: 500 }}>{eyebrow}</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      </div>
      <div style={{ flex: 1 }} />

      {showPeriodFilters && (
      <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e2329', borderRadius: 8, padding: 4, border: '1px solid #2b3139' }}>
        {rangeOptions.map((r) => (
          <button key={r} onClick={() => onPeriodChange?.(r)} style={{
            padding: '6px 10px', fontSize: 12, fontWeight: r === period ? 600 : 500,
            color: r === period ? '#181a20' : '#707a8a',
            background: r === period ? '#FCD535' : 'transparent',
            border: 0, borderRadius: 6, cursor: 'pointer',
          }}>{r}</button>
        ))}
      </div>

      <MonthPicker month={month} onChange={onMonthChange} />
      </>
      )}

      {topbarLabel && (
      <button
        onClick={onTopbarClick}
        style={{
          height: 36, padding: '0 16px', background: '#FCD535', color: '#181a20',
          border: 0, borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10"/>
        </svg>
        {topbarLabel}
      </button>
      )}
    </header>
  );
}
