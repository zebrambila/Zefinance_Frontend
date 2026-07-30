import { useEffect, useState, useMemo } from 'react';
import { initialOf, colorOf } from '../data/mock.js';
import { fmtBRL, fmtNum } from '../lib/format.js';
import { listDividends, deleteDividend, ECustodian } from '../api/index.js';
import DividendModal from '../modals/DividendModal.jsx';
import ImportDividendsModal from '../modals/ImportDividendsModal.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 25;
const custodianLabel = { [ECustodian.BTG]: 'BTG Pactual', [ECustodian.Itau]: 'Itaú' };

const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
};

const toDateParam = (d) => d.toISOString().slice(0, 10);

function periodRange(period) {
  const today = new Date();
  const dateTo = toDateParam(today);

  if (period === 'ALL') {
    return { dateFrom: undefined, dateTo: undefined };
  }

  if (period === 'YTD') {
    const jan1 = new Date(today.getFullYear(), 0, 1);
    return { dateFrom: toDateParam(jan1), dateTo };
  }

  const daysByPeriod = { '1M': 30, '3M': 90, '6M': 180, '12M': 360 };
  const from = new Date(today);
  from.setDate(from.getDate() - daysByPeriod[period]);
  return { dateFrom: toDateParam(from), dateTo };
}

// Closed-month range: first to last day of the given 'YYYY-MM' string.
function monthRange(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const lastDay = new Date(year, monthIndex, 0);
  return { dateFrom: toDateParam(firstDay), dateTo: toDateParam(lastDay) };
}

export default function Dividendos({ refreshKey, period, month }) {
  const [dividends, setDividends] = useState([]);
  const [allDividends, setAllDividends] = useState([]); // unpaginated snapshot for summary cards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { setPage(1); }, [period, month]);

  useEffect(() => {
    let cancelled = false;
    const { dateFrom, dateTo } = month ? monthRange(month) : periodRange(period);
    listDividends({ pageNumber: page, pageSize: PAGE_SIZE, dateFrom, dateTo })
      .then((res) => {
        if (cancelled) return;
        setDividends(res?.data ?? []);
        setTotalPages(res?.totalPages ?? 1);
        setTotalCount(res?.totalCount ?? 0);
        setError('');
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Falha ao carregar proventos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, month, refreshKey, internalRefreshKey, page]);

  useEffect(() => {
    let cancelled = false;
    const { dateFrom, dateTo } = month ? monthRange(month) : periodRange(period);
    listDividends({ pageSize: 1000, dateFrom, dateTo })
      .then((res) => { if (!cancelled) setAllDividends(res?.data ?? []); })
      .catch(() => { if (!cancelled) setAllDividends([]); });
    return () => { cancelled = true; };
  }, [period, month, refreshKey, internalRefreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setPage(1);
    setInternalRefreshKey((k) => k + 1);
  };

  const handleDelete = async (d) => {
    const label = d.asset?.ticker || 'este provento';
    if (!window.confirm(`Excluir o provento de ${label}? Essa ação não pode ser desfeita.`)) return;
    setDeletingId(d.id);
    try {
      await deleteDividend(d.id);
      setInternalRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Falha ao excluir o provento.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalReceived = useMemo(() => allDividends.reduce((sum, d) => sum + (d.totalFinancial ?? 0), 0), [allDividends]);
  const maiorProvento = useMemo(() => allDividends.reduce((max, d) => Math.max(max, d.totalFinancial ?? 0), 0), [allDividends]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? dividends.filter((d) => d.asset?.ticker?.toLowerCase().includes(searchTerm) || d.asset?.name?.toLowerCase().includes(searchTerm))
    : dividends;

  const summary = [
    { label: 'Total recebido',    value: fmtBRL(totalReceived), color: '#FCD535' },
    { label: 'Eventos registrados', value: fmtNum(allDividends.length), color: '#ffffff' },
    { label: 'Maior provento',    value: fmtBRL(maiorProvento), color: '#ffffff' },
  ];

  return (
    <div style={{ padding: '24px 32px 48px', flex: 1 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {summary.map((s) => (
          <div key={s.label} style={{ background: '#1e2329', borderRadius: 12, padding: '18px 20px', border: '1px solid #2b3139' }}>
            <div style={{ fontSize: 12, color: '#707a8a' }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: s.color, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#707a8a" strokeWidth="1.4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5"/>
            <path d="m14 14-3.5-3.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ativo"
            title="Busca dentro da página atual"
            style={{
              height: 32, padding: '0 12px 0 30px', background: '#1e2329', color: '#eaecef',
              border: '1px solid #2b3139', borderRadius: 6, fontSize: 12, width: 200
            }}/>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          title="Atualizar"
          style={{
            height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
            background: '#1e2329', color: '#eaecef', border: '1px solid #2b3139',
            borderRadius: 6, cursor: loading ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
            opacity: loading ? 0.6 : 1
          }}
        >
          <svg
            width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            style={loading ? { animation: 'spin 0.8s linear infinite' } : undefined}
          >
            <path d="M13.5 8A5.5 5.5 0 1 1 11.8 4.1"/>
            <path d="M13.5 2.5v3.2h-3.2"/>
          </svg>
          Atualizar
        </button>
        <button
          onClick={() => setShowImport(true)}
          style={{
            height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
            background: '#1e2329', color: '#eaecef', border: '1px solid #2b3139',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8m0 0 3-3m-3 3-3-3M3 12v1.5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5V12"/>
          </svg>
          Importar CSV
        </button>
      </div>

      <div style={{ background: '#1e2329', borderRadius: 12, border: '1px solid #2b3139', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.7fr 1fr 1fr 0.7fr', padding: '14px 20px', borderBottom: '1px solid #2b3139', fontSize: 11, color: '#707a8a', fontWeight: 600, letterSpacing: '0.04em' }}>
          <div>DATA COM</div><div>ATIVO</div>
          <div style={{ textAlign: 'right' }}>TOTAL</div>
          <div style={{ textAlign: 'right' }}>CUSTODIANTE</div>
          <div style={{ textAlign: 'right' }}>AÇÕES</div>
        </div>

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando proventos...</div>
        )}

        {!loading && error && (
          <div style={{ padding: 24, textAlign: 'center', color: '#f6465d', fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum provento encontrado.</div>
        )}

        {!loading && !error && filtered.map((d) => {
          const ticker = d.asset?.ticker ?? '—';
          const isDeleting = deletingId === d.id;
          return (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.7fr 1fr 1fr 0.7fr', padding: '14px 20px', borderBottom: '1px solid #2b3139', alignItems: 'center', opacity: isDeleting ? 0.5 : 1 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef' }}>{fmtDate(d.receiptDate)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: colorOf(ticker), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{initialOf(ticker)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{ticker}</div>
                  <div style={{ fontSize: 11, color: '#707a8a' }}>{d.asset?.name ?? ''}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#0ecb81', textAlign: 'right', fontWeight: 600 }}>+ {fmtBRL(d.totalFinancial)}</div>
              <div style={{ fontSize: 12, color: '#eaecef', textAlign: 'right' }}>{custodianLabel[d.custodian] ?? d.custodian}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  onClick={() => setEditingId(d.id)}
                  disabled={isDeleting}
                  title="Editar"
                  style={{ background: 'transparent', border: '1px solid #2b3139', borderRadius: 6, color: '#707a8a', cursor: isDeleting ? 'default' : 'pointer', padding: 6, display: 'flex' }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 2.5 13.5 5 5 13.5H2.5V11L11 2.5Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(d)}
                  disabled={isDeleting}
                  title="Excluir"
                  style={{ background: 'transparent', border: '1px solid #2b3139', borderRadius: 6, color: '#f6465d', cursor: isDeleting ? 'default' : 'pointer', padding: 6, display: 'flex' }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4.5h10M6 4.5v-1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m1.5 0-.6 8.4a1.5 1.5 0 0 1-1.5 1.4H5.6a1.5 1.5 0 0 1-1.5-1.4L3.5 4.5"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {!loading && !error && (
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {editingId && (
        <DividendModal
          dividendId={editingId}
          onClose={() => setEditingId(null)}
          onSubmit={() => { setEditingId(null); setInternalRefreshKey((k) => k + 1); }}
        />
      )}

      {showImport && (
        <ImportDividendsModal
          onClose={() => setShowImport(false)}
          onSubmit={() => { setShowImport(false); setInternalRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
