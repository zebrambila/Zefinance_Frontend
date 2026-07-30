import { useEffect, useState, useMemo } from 'react';
import { initialOf } from '../data/mock.js';
import { fmtBRL, fmtNum, fmtPct } from '../lib/format.js';
import { listAssets, EAssetType } from '../api/index.js';
import ImportAssetsModal from '../modals/ImportAssetsModal.jsx';
import AssetDividendsModal from '../modals/AssetDividendsModal.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 25;
const classLabel = { [EAssetType.Acoes]: 'Ações', [EAssetType.FIIs]: 'FIIs' };

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

export default function Ativos({ refreshKey }) {
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]); // unpaginated snapshot, for summary cards + chip counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos'); // 'todos' | 'acoes' | 'fiis'
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [viewingDividendsOf, setViewingDividendsOf] = useState(null); // { assetId, ticker } | null
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { setPage(1); }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const type = filter === 'acoes' ? EAssetType.Acoes : filter === 'fiis' ? EAssetType.FIIs : undefined;
    listAssets({ pageNumber: page, pageSize: PAGE_SIZE, type })
      .then((res) => {
        if (cancelled) return;
        setAssets(res?.data ?? []);
        setTotalPages(res?.totalPages ?? 1);
        setTotalCount(res?.totalCount ?? 0);
        setError('');
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Falha ao carregar ativos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey, internalRefreshKey, filter, page]);

  useEffect(() => {
    let cancelled = false;
    listAssets({ pageSize: 1000 })
      .then((res) => { if (!cancelled) setAllAssets(res?.data ?? []); })
      .catch(() => { if (!cancelled) setAllAssets([]); });
    return () => { cancelled = true; };
  }, [refreshKey, internalRefreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setPage(1);
    setInternalRefreshKey((k) => k + 1);
  };

  const handleFilterChange = (key) => {
    setFilter(key);
    setPage(1);
  };

  const rows = useMemo(() => assets.map((a) => {
    const market = a.currentTotalValue ?? 0;
    const invested = a.totalInvested ?? 0;
    const pnl = market - invested;
    const pnlPct = invested ? (pnl / invested) * 100 : 0;
    const up = pnl >= 0;
    return {
      ...a,
      qtyFmt: fmtNum(a.positionQuantity ?? 0),
      avgFmt: fmtBRL(a.averagePrice ?? 0),
      priceFmt: fmtBRL(a.currentPrice ?? 0),
      marketFmt: fmtBRL(market),
      pnlFmt: (up ? '+ ' : '- ') + fmtBRL(Math.abs(pnl)),
      pnlPctFmt: fmtPct(pnlPct),
      pnlColor: up ? '#0ecb81' : '#f6465d',
    };
  }), [assets]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? rows.filter((a) => a.ticker?.toLowerCase().includes(searchTerm) || a.name?.toLowerCase().includes(searchTerm))
    : rows;

  const acoesCount = allAssets.filter((a) => a.type === EAssetType.Acoes).length;
  const fiisCount = allAssets.filter((a) => a.type === EAssetType.FIIs).length;

  const totalMarket = allAssets.reduce((sum, a) => sum + (a.currentTotalValue ?? 0), 0);
  const totalInvested = allAssets.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
  const totalPnl = totalMarket - totalInvested;
  const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;

  const summary = [
    { label: 'Valor de mercado', value: fmtBRL(totalMarket),   color: '#ffffff' },
    { label: 'Total investido',  value: fmtBRL(totalInvested), color: '#ffffff' },
    { label: 'Resultado',        value: (totalPnl >= 0 ? '+ ' : '- ') + fmtBRL(Math.abs(totalPnl)), color: totalPnl >= 0 ? '#0ecb81' : '#f6465d' },
    { label: 'Rentabilidade',    value: fmtPct(totalPnlPct), color: totalPnl >= 0 ? '#0ecb81' : '#f6465d' },
  ];

  const chips = [
    { key: 'todos', label: `Todos · ${allAssets.length}` },
    { key: 'acoes', label: `Ações · ${acoesCount}` },
    { key: 'fiis',  label: `FIIs · ${fiisCount}` },
  ];

  return (
    <div style={{ padding: '24px 32px 48px', flex: 1 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {summary.map((s) => (
          <div key={s.label} style={{ background: '#1e2329', borderRadius: 12, padding: '18px 20px', border: '1px solid #2b3139' }}>
            <div style={{ fontSize: 12, color: '#707a8a' }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: s.color, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {chips.map((c) => (
          <button key={c.key} onClick={() => handleFilterChange(c.key)} style={{
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1.1fr 1.1fr 1.1fr 0.9fr 60px', padding: '14px 20px', borderBottom: '1px solid #2b3139', fontSize: 11, color: '#707a8a', fontWeight: 600, letterSpacing: '0.04em' }}>
          <div>ATIVO</div><div>CLASSE</div><div style={{ textAlign: 'right' }}>QTD</div>
          <div style={{ textAlign: 'right' }}>PREÇO MÉDIO</div>
          <div style={{ textAlign: 'right' }}>COTAÇÃO</div>
          <div style={{ textAlign: 'right' }}>VALOR ATUAL</div>
          <div style={{ textAlign: 'right' }}>RESULTADO</div>
          <div />
        </div>

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando ativos...</div>
        )}

        {!loading && error && (
          <div style={{ padding: 24, textAlign: 'center', color: '#f6465d', fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum ativo encontrado.</div>
        )}

        {!loading && !error && filtered.map((a) => (
          <div key={a.assetId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1.1fr 1.1fr 1.1fr 0.9fr 60px', padding: '14px 20px', borderBottom: '1px solid #2b3139', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: tickerColorOf(a.ticker), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{initialOf(a.ticker)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{a.ticker}</div>
                <div style={{ fontSize: 11, color: '#707a8a', marginTop: 1 }}>{a.name}</div>
              </div>
            </div>
            <div>
              <span style={{ display: 'inline-block', padding: '3px 8px', background: '#2b3139', borderRadius: 4, fontSize: 11, color: '#eaecef', fontWeight: 500 }}>{classLabel[a.type] ?? a.type}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef', textAlign: 'right' }}>{a.qtyFmt}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef', textAlign: 'right' }}>{a.avgFmt}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ffffff', textAlign: 'right', fontWeight: 500 }}>{a.priceFmt}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ffffff', textAlign: 'right', fontWeight: 600 }}>{a.marketFmt}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: a.pnlColor, fontWeight: 600 }}>{a.pnlPctFmt}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: a.pnlColor, marginTop: 1, opacity: 0.7 }}>{a.pnlFmt}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button
                onClick={() => setViewingDividendsOf({ assetId: a.assetId, ticker: a.ticker })}
                title="Proventos do mês"
                style={{ width: 26, height: 26, borderRadius: 5, background: '#2b3139', border: 0, color: '#eaecef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="8" cy="8" r="6.2"/>
                  <path d="M9.8 6.1c-.3-.7-1-1.1-1.9-1.1-1.2 0-2 .6-2 1.5 0 .9.8 1.3 2 1.6 1.4.4 2.2.8 2.2 1.8 0 1-.9 1.6-2.2 1.6-1 0-1.8-.4-2.1-1.2M8 4v1M8 11v1" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}

        {!loading && !error && (
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {showImport && (
        <ImportAssetsModal
          onClose={() => setShowImport(false)}
          onSubmit={() => { setShowImport(false); setPage(1); setInternalRefreshKey((k) => k + 1); }}
        />
      )}

      {viewingDividendsOf && (
        <AssetDividendsModal
          assetId={viewingDividendsOf.assetId}
          ticker={viewingDividendsOf.ticker}
          onClose={() => setViewingDividendsOf(null)}
        />
      )}

    </div>
  );
}
