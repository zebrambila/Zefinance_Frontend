import { useEffect, useState, useMemo } from 'react';
import { initialOf } from '../data/mock.js';
import { fmtBRL, fmtNum, fmtPct } from '../lib/format.js';
import { listAssets, listTransactions, EAssetType, EOperationType, ECustodian } from '../api/index.js';
import ImportAssetsModal from '../modals/ImportAssetsModal.jsx';
import AssetDividendsModal from '../modals/AssetDividendsModal.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 25;
const classLabel = { [EAssetType.Acoes]: 'Ações', [EAssetType.FIIs]: 'FIIs' };
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

export default function Ativos({ refreshKey }) {
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]); // unpaginated snapshot, for summary cards + chip counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos'); // 'todos' | 'acoes' | 'fiis'
  const [custodianFilter, setCustodianFilter] = useState('todos'); // 'todos' | ECustodian.BTG | ECustodian.Itau
  const [transactions, setTransactions] = useState([]); // snapshot p/ derivar custodiante por ativo
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

  useEffect(() => {
    let cancelled = false;
    // Não há campo "custodiante" no ativo em si — só nas transações. Buscamos tudo pra
    // reconstruir, por ativo, em qual(is) custodiante(s) ele tem posição líquida positiva.
    listTransactions({ pageSize: 1000 })
      .then((res) => { if (!cancelled) setTransactions(res?.data ?? []); })
      .catch(() => { if (!cancelled) setTransactions([]); });
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

  const handleCustodianFilterChange = (key) => {
    setCustodianFilter(key);
    setPage(1);
  };

  // Quantidade líquida por ativo × custodiante (Compra soma, Venda subtrai), a partir de
  // todas as transações — usada só pra saber ONDE (em qual custodiante) o ativo tem posição.
  const custodiansByAssetId = useMemo(() => {
    const qtyByAssetCustodian = transactions.reduce((acc, t) => {
      const key = `${t.assetId}|${t.custodian}`;
      const signedQty = t.side === EOperationType.Compra ? (t.quantity ?? 0) : -(t.quantity ?? 0);
      acc[key] = (acc[key] ?? 0) + signedQty;
      return acc;
    }, {});
    return Object.entries(qtyByAssetCustodian).reduce((acc, [key, qty]) => {
      if (qty <= 0) return acc;
      const [assetId, custodian] = key.split('|');
      if (!acc[assetId]) acc[assetId] = new Set();
      acc[assetId].add(custodian);
      return acc;
    }, {});
  }, [transactions]);

  const hasCustodian = (assetId) => custodianFilter === 'todos' || custodiansByAssetId[assetId]?.has(custodianFilter);
  const custodianActive = custodianFilter !== 'todos';

  // Com filtro de custodiante ativo, a paginação do servidor não serve mais: o ativo pode
  // estar em qualquer página do conjunto original. Filtramos e paginamos no cliente sobre
  // `allAssets` (snapshot completo) em vez da página vinda do servidor.
  const custodianFilteredAssets = useMemo(() => {
    if (!custodianActive) return null;
    const type = filter === 'acoes' ? EAssetType.Acoes : filter === 'fiis' ? EAssetType.FIIs : undefined;
    return allAssets
      .filter((a) => !type || a.type === type)
      .filter((a) => custodiansByAssetId[a.assetId]?.has(custodianFilter));
  }, [allAssets, custodianActive, custodianFilter, filter, custodiansByAssetId]);

  const gridSource = custodianActive
    ? custodianFilteredAssets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : assets;
  const gridTotalPages = custodianActive
    ? Math.max(1, Math.ceil(custodianFilteredAssets.length / PAGE_SIZE))
    : totalPages;
  const gridTotalCount = custodianActive ? custodianFilteredAssets.length : totalCount;

  const rows = useMemo(() => gridSource.map((a) => {
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
  }), [gridSource]);

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

  // Item 5 (candidato novo): preço médio vs. cotação atual, por ativo.
  const priceCompareRows = allAssets
    .filter((a) => (a.averagePrice ?? 0) > 0 && (a.currentPrice ?? 0) > 0)
    .filter((a) => hasCustodian(a.assetId))
    .map((a) => {
      const avg = a.averagePrice;
      const current = a.currentPrice;
      const rowMax = Math.max(avg, current);
      const pct = ((current - avg) / avg) * 100;
      return {
        assetId: a.assetId,
        ticker: a.ticker,
        avgFmt: fmtBRL(avg),
        currentFmt: fmtBRL(current),
        avgWidth: `${((avg / rowMax) * 100).toFixed(1)}%`,
        currentWidth: `${((current / rowMax) * 100).toFixed(1)}%`,
        pct,
        up: current >= avg,
      };
    })
    .sort((a, b) => b.pct - a.pct);

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
        <div style={{ width: 1, height: 20, background: '#2b3139', margin: '0 2px' }} />
        {[{ key: 'todos', label: 'Todas' }, { key: ECustodian.BTG, label: custodianLabel[ECustodian.BTG] }, { key: ECustodian.Itau, label: custodianLabel[ECustodian.Itau] }].map((c) => (
          <button
            key={c.key}
            onClick={() => handleCustodianFilterChange(c.key)}
            title="Filtro por custodiante"
            style={{
              height: 32, padding: '0 14px',
              background: custodianFilter === c.key ? '#FCD535' : '#1e2329',
              color: custodianFilter === c.key ? '#181a20' : '#eaecef',
              border: custodianFilter === c.key ? 0 : '1px solid #2b3139',
              borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: custodianFilter === c.key ? 600 : 500
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
          <Pagination page={page} totalPages={gridTotalPages} totalCount={gridTotalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {/* PREÇO MÉDIO VS. COTAÇÃO ATUAL (candidato novo — item 5) */}
      <div style={{ background: '#1e2329', borderRadius: 12, border: '1px solid #2b3139', padding: 24, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Preço médio vs. cotação atual</div>
            <div style={{ fontSize: 12, color: '#707a8a', marginTop: 2 }}>Toda a carteira, ordenada por variação</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#707a8a' }} />
              <span style={{ fontSize: 12, color: '#eaecef' }}>Preço médio</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FCD535' }} />
              <span style={{ fontSize: 12, color: '#eaecef' }}>Cotação atual</span>
            </div>
          </div>
        </div>

        {priceCompareRows.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum ativo com posição para comparar.</div>
        )}

        {priceCompareRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
            {priceCompareRows.map((r) => (
              <div key={r.assetId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: tickerColorOf(r.ticker), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{initialOf(r.ticker)}</div>
                    <span style={{ fontSize: 13, color: '#eaecef', fontWeight: 600 }}>{r.ticker}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: r.up ? '#0ecb81' : '#f6465d' }}>
                    {(r.up ? '+' : '') + r.pct.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#0b0e11', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: r.avgWidth, height: '100%', background: '#707a8a' }} />
                    </div>
                    <span style={{ width: 76, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#707a8a' }}>{r.avgFmt}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#0b0e11', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: r.currentWidth, height: '100%', background: '#FCD535' }} />
                    </div>
                    <span style={{ width: 76, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#eaecef' }}>{r.currentFmt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
