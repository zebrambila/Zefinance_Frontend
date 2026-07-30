import { useEffect, useState, useMemo } from 'react';
import { initialOf } from '../data/mock.js';
import { fmtBRL, fmtNum } from '../lib/format.js';
import { listTransactions, deleteTransaction, EOperationType, ECustodian } from '../api/index.js';
import TransactionModal from '../modals/TransactionModal.jsx';
import ImportTransactionsModal from '../modals/ImportTransactionsModal.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 25;
const custodianLabel = { [ECustodian.BTG]: 'BTG Pactual', [ECustodian.Itau]: 'Itaú' };

const tickerColorCache = {};
const tickerColorOf = (ticker) => {
  if (!tickerColorCache[ticker]) {
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    tickerColorCache[ticker] = `hsl(${hue}, 55%, 45%)`;
  }
  return tickerColorCache[ticker];
};

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

export default function Transacoes({ period, month }) {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // unpaginated snapshot for summary + chip counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todas'); // 'todas' | 'compras' | 'vendas'
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { setPage(1); }, [period, month]);

  useEffect(() => {
    let cancelled = false;
    const { dateFrom, dateTo } = month ? monthRange(month) : periodRange(period);
    listTransactions({ pageNumber: page, pageSize: PAGE_SIZE, dateFrom, dateTo })
      .then((res) => {
        if (cancelled) return;
        setTransactions(res?.data ?? []);
        setTotalPages(res?.totalPages ?? 1);
        setTotalCount(res?.totalCount ?? 0);
        setError('');
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Falha ao carregar transações.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, month, refreshKey, page]);

  useEffect(() => {
    let cancelled = false;
    const { dateFrom, dateTo } = month ? monthRange(month) : periodRange(period);
    listTransactions({ pageSize: 1000, dateFrom, dateTo })
      .then((res) => { if (!cancelled) setAllTransactions(res?.data ?? []); })
      .catch(() => { if (!cancelled) setAllTransactions([]); });
    return () => { cancelled = true; };
  }, [period, month, refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (t) => {
    const label = t.asset?.ticker || 'esta transação';
    if (!window.confirm(`Excluir a operação de ${label}? Essa ação não pode ser desfeita.`)) return;
    setDeletingId(t.id);
    try {
      await deleteTransaction(t.id);
      handleRefresh();
    } catch (err) {
      setError(err.message || 'Falha ao excluir a transação.');
    } finally {
      setDeletingId(null);
    }
  };

  const byFilter = useMemo(() => {
    if (filter === 'compras') return transactions.filter((t) => t.side === EOperationType.Compra);
    if (filter === 'vendas') return transactions.filter((t) => t.side === EOperationType.Venda);
    return transactions;
  }, [transactions, filter]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? byFilter.filter((t) => t.asset?.ticker?.toLowerCase().includes(searchTerm) || t.asset?.name?.toLowerCase().includes(searchTerm))
    : byFilter;

  const compras = allTransactions.filter((t) => t.side === EOperationType.Compra);
  const vendas = allTransactions.filter((t) => t.side === EOperationType.Venda);
  const volumeComprado = compras.reduce((sum, t) => sum + (t.totalValue ?? 0), 0);
  const volumeVendido = vendas.reduce((sum, t) => sum + (t.totalValue ?? 0), 0);

  const summary = [
    { label: 'Operações no período', value: fmtNum(allTransactions.length), color: '#ffffff' },
    { label: 'Volume comprado',      value: fmtBRL(volumeComprado),      color: '#0ecb81' },
    { label: 'Volume vendido',       value: fmtBRL(volumeVendido),       color: '#f6465d' },
  ];

  const chips = [
    { key: 'todas',   label: `Todas · ${allTransactions.length}` },
    { key: 'compras', label: `Compras · ${compras.length}` },
    { key: 'vendas',  label: `Vendas · ${vendas.length}` },
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {chips.map((c) => (
          <button key={c.key} onClick={() => setFilter(c.key)} style={{
            height: 32, padding: '0 14px',
            background: filter === c.key ? '#FCD535' : '#1e2329',
            color: filter === c.key ? '#181a20' : '#eaecef',
            border: filter === c.key ? 0 : '1px solid #2b3139',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: filter === c.key ? 600 : 500
          }}>{c.label}</button>
        ))}
        <div style={{ flex: 1 }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.8fr 1.5fr 0.7fr 1fr 1.1fr 1fr 0.7fr', padding: '14px 20px', borderBottom: '1px solid #2b3139', fontSize: 11, color: '#707a8a', fontWeight: 600, letterSpacing: '0.04em' }}>
          <div>DATA</div><div>OPERAÇÃO</div><div>ATIVO</div>
          <div style={{ textAlign: 'right' }}>QTD</div>
          <div style={{ textAlign: 'right' }}>PREÇO</div>
          <div style={{ textAlign: 'right' }}>TOTAL</div>
          <div style={{ textAlign: 'right' }}>CUSTODIANTE</div>
          <div style={{ textAlign: 'right' }}>AÇÕES</div>
        </div>

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando transações...</div>
        )}

        {!loading && error && (
          <div style={{ padding: 24, textAlign: 'center', color: '#f6465d', fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhuma transação encontrada.</div>
        )}

        {!loading && !error && filtered.map((t) => {
          const isBuy = t.side === EOperationType.Compra;
          const ticker = t.asset?.ticker ?? '—';
          const isDeleting = deletingId === t.id;
          return (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.8fr 1.5fr 0.7fr 1fr 1.1fr 1fr 0.7fr', padding: '14px 20px', borderBottom: '1px solid #2b3139', alignItems: 'center', opacity: isDeleting ? 0.5 : 1 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef' }}>{fmtDate(t.dateBuySell)}</div>
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                  background: isBuy ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)',
                  color: isBuy ? '#0ecb81' : '#f6465d',
                  borderRadius: 4, fontSize: 11, fontWeight: 600
                }}>
                  {isBuy ? '↗' : '↘'} {isBuy ? 'Compra' : 'Venda'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: tickerColorOf(ticker), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{initialOf(ticker)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{ticker}</div>
                  <div style={{ fontSize: 11, color: '#707a8a' }}>{t.asset?.name ?? ''}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef', textAlign: 'right' }}>{fmtNum(t.quantity)}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef', textAlign: 'right' }}>{fmtBRL(t.unitPrice)}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ffffff', textAlign: 'right', fontWeight: 600 }}>{fmtBRL(t.totalValue)}</div>
              <div style={{ fontSize: 12, color: '#eaecef', textAlign: 'right' }}>{custodianLabel[t.custodian] ?? t.custodian}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  onClick={() => setEditingId(t.id)}
                  disabled={isDeleting}
                  title="Editar"
                  style={{ background: 'transparent', border: '1px solid #2b3139', borderRadius: 6, color: '#707a8a', cursor: isDeleting ? 'default' : 'pointer', padding: 6, display: 'flex' }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 2.5 13.5 5 5 13.5H2.5V11L11 2.5Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(t)}
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
        <TransactionModal
          transactionId={editingId}
          onClose={() => setEditingId(null)}
          onSubmit={() => { setEditingId(null); handleRefresh(); }}
        />
      )}

      {showImport && (
        <ImportTransactionsModal
          onClose={() => setShowImport(false)}
          onSubmit={() => { setShowImport(false); handleRefresh(); }}
        />
      )}
    </div>
  );
}
