import { useEffect, useState } from 'react';
import { fmtKShort, fmtBRL } from '../lib/format.js';
import { getDividendsSummaryByMonth, getDividendsSummaryByAsset, getPatrimonyEvolutionByMonth, listAssets, listTransactions, EAssetType, EOperationType, ECustodian } from '../api/index.js';
import KpiCard from '../components/KpiCard.jsx';

const classLabel = { [EAssetType.Acoes]: 'Ações', [EAssetType.FIIs]: 'Fundos imobiliários' };
const classColor = { [EAssetType.Acoes]: '#FCD535', [EAssetType.FIIs]: '#2dbdb6' };
const custodianLabel = { [ECustodian.BTG]: 'BTG Pactual', [ECustodian.Itau]: 'Itaú' };
const custodianColor = { [ECustodian.BTG]: '#8ea3ff', [ECustodian.Itau]: '#f6a821' };

const assetColorCache = {};
const assetColorOf = (ticker) => {
  if (!assetColorCache[ticker]) {
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0;
    assetColorCache[ticker] = `hsl(${hash % 360}, 60%, 55%)`;
  }
  return assetColorCache[ticker];
};
const initialOf = (tk) => (tk.length > 5 ? tk.slice(0, 3) : tk.slice(0, 2));

const monthAbbrev = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const toDateParam = (d) => d.toISOString().slice(0, 10);

const kpiIcons = {
  patrimonio: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 6.5 8 2l6 4.5v6.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z"/>
      <path d="M6 13.5v-4h4v4"/>
    </svg>
  ),
  dividendos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6"/>
      <path d="M9.8 6.1c-.3-.7-1-1.1-1.9-1.1-1.2 0-2 .6-2 1.5 0 .9.8 1.3 2 1.6 1.4.4 2.2.8 2.2 1.8 0 1-.9 1.6-2.2 1.6-1 0-1.8-.4-2.1-1.2" strokeLinecap="round"/>
    </svg>
  ),
  aporte: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 2v12M3 8l5-5 5 5"/>
    </svg>
  ),
};

export default function Dashboard() {
  const [dividendsMonthly, setDividendsMonthly] = useState([]);
  const [loadingDividends, setLoadingDividends] = useState(true);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [topDividends, setTopDividends] = useState([]);
  const [topDividendsTotal, setTopDividendsTotal] = useState(0);
  const [loadingTopDividends, setLoadingTopDividends] = useState(true);
  const [patrimonyMonthly, setPatrimonyMonthly] = useState([]);
  const [loadingPatrimony, setLoadingPatrimony] = useState(true);
  const [distributionView, setDistributionView] = useState('classe'); // 'classe' | 'ativo' | 'custodia'
  const [dividendEvolutionView, setDividendEvolutionView] = useState('anual'); // 'anual' | 'mensal'
  const [hoveredPatrimonyIndex, setHoveredPatrimonyIndex] = useState(null);
  const [hoveredDividendIndex, setHoveredDividendIndex] = useState(null);
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const dateFrom = toDateParam(new Date(2023, 0, 1));
    const dateTo = toDateParam(new Date());
    getDividendsSummaryByMonth({ dateFrom, dateTo })
      .then((res) => {
        if (cancelled) return;
        setDividendsMonthly(res?.data?.months ?? []);
      })
      .catch(() => { if (!cancelled) setDividendsMonthly([]); })
      .finally(() => { if (!cancelled) setLoadingDividends(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const dateFrom = toDateParam(new Date(today.getFullYear(), today.getMonth() - 11, 1));
    const dateTo = toDateParam(today);
    getDividendsSummaryByAsset({ dateFrom, dateTo, top: 7 })
      .then((res) => {
        if (cancelled) return;
        setTopDividends(res?.data?.assets ?? []);
        setTopDividendsTotal(res?.data?.totalReceived ?? 0);
      })
      .catch(() => { if (!cancelled) { setTopDividends([]); setTopDividendsTotal(0); } })
      .finally(() => { if (!cancelled) setLoadingTopDividends(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const dateFrom = toDateParam(new Date(today.getFullYear(), today.getMonth() - 11, 1));
    const dateTo = toDateParam(today);
    getPatrimonyEvolutionByMonth({ dateFrom, dateTo })
      .then((res) => { if (!cancelled) setPatrimonyMonthly(res?.data?.months ?? []); })
      .catch(() => { if (!cancelled) setPatrimonyMonthly([]); })
      .finally(() => { if (!cancelled) setLoadingPatrimony(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listAssets({ pageSize: 100 })
      .then((res) => { if (!cancelled) setAssets(res?.data ?? []); })
      .catch(() => { if (!cancelled) setAssets([]); })
      .finally(() => { if (!cancelled) setLoadingAssets(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listTransactions({ pageSize: 100 })
      .then((res) => { if (!cancelled) setTransactions(res?.data ?? []); })
      .catch(() => { if (!cancelled) setTransactions([]); })
      .finally(() => { if (!cancelled) setLoadingTransactions(false); });
    return () => { cancelled = true; };
  }, []);

  const totalMarket = assets.reduce((sum, a) => sum + (a.currentTotalValue ?? 0), 0);

  const buildDonutSegments = (groups) => {
    let cumulativeDeg = 0;
    return groups.map(({ label, color, amount }) => {
      const pct = totalMarket ? (amount / totalMarket) * 100 : 0;
      const deg = totalMarket ? (amount / totalMarket) * 360 : 0;
      const startDeg = cumulativeDeg;
      cumulativeDeg += deg;
      return {
        label, color, startDeg, endDeg: cumulativeDeg,
        amount: fmtBRL(amount),
        pct: pct.toFixed(1).replace('.', ',') + '%',
      };
    });
  };

  const buildGradientCss = (segments, activeIndex) => segments.length
    ? `conic-gradient(${segments.map((s, i) => {
        const color = activeIndex === null || activeIndex === undefined || activeIndex === i ? s.color : '#3a4148';
        return `${color} ${s.startDeg.toFixed(1)}deg ${s.endDeg.toFixed(1)}deg`;
      }).join(', ')})`
    : '#2b3139';

  const byClass = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + (a.currentTotalValue ?? 0);
    return acc;
  }, {});
  const classGroups = Object.entries(byClass)
    .sort(([, a], [, b]) => b - a)
    .map(([type, amount]) => ({ label: classLabel[type] ?? type, color: classColor[type] ?? '#707a8a', amount }));

  const assetsSorted = [...assets].sort((a, b) => (b.currentTotalValue ?? 0) - (a.currentTotalValue ?? 0));
  const ASSET_SEGMENTS_LIMIT = 8;
  const topAssets = assetsSorted.slice(0, ASSET_SEGMENTS_LIMIT);
  const restAssets = assetsSorted.slice(ASSET_SEGMENTS_LIMIT);
  const restTotal = restAssets.reduce((sum, a) => sum + (a.currentTotalValue ?? 0), 0);
  const assetGroups = [
    ...topAssets.map((a) => ({ label: a.ticker, color: assetColorOf(a.ticker), amount: a.currentTotalValue ?? 0 })),
    ...(restAssets.length ? [{ label: `Outros (${restAssets.length})`, color: '#707a8a', amount: restTotal }] : []),
  ];

  const priceByAssetId = assets.reduce((acc, a) => {
    acc[a.assetId] = a.currentPrice ?? 0;
    return acc;
  }, {});
  const qtyByAssetCustodian = transactions.reduce((acc, t) => {
    const key = `${t.assetId}|${t.custodian}`;
    const signedQty = t.side === EOperationType.Compra ? (t.quantity ?? 0) : -(t.quantity ?? 0);
    acc[key] = (acc[key] ?? 0) + signedQty;
    return acc;
  }, {});
  const byCustodian = Object.entries(qtyByAssetCustodian).reduce((acc, [key, qty]) => {
    const [assetId, custodian] = key.split('|');
    acc[custodian] = (acc[custodian] ?? 0) + qty * (priceByAssetId[assetId] ?? 0);
    return acc;
  }, {});
  const custodyGroups = Object.entries(byCustodian)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([custodian, amount]) => ({ label: custodianLabel[custodian] ?? custodian, color: custodianColor[custodian] ?? '#707a8a', amount }));

  const distributionGroups = distributionView === 'ativo' ? assetGroups : distributionView === 'custodia' ? custodyGroups : classGroups;
  const donutSegments = buildDonutSegments(distributionGroups);
  const donutGradient = buildGradientCss(donutSegments, hoveredSegmentIndex);
  const loadingDistribution = loadingAssets || (distributionView === 'custodia' && loadingTransactions);

  const maxPatrim = Math.max(1, ...patrimonyMonthly.flatMap((m) => [m.invested ?? 0, m.marketValue ?? 0]));
  const patrimony = patrimonyMonthly.map((m) => ({
    label: `${monthAbbrev[(m.month - 1 + 12) % 12]}/${String(m.year).slice(2)}`,
    invested: m.invested ?? 0,
    marketValue: m.marketValue ?? 0,
    hInv: (((m.invested ?? 0) / maxPatrim) * 100).toFixed(1) + '%',
    hMkt: (((m.marketValue ?? 0) / maxPatrim) * 100).toFixed(1) + '%',
  }));
  const tooltipPatrimony = patrimony[hoveredPatrimonyIndex ?? patrimony.length - 1];
  const patrimonyGainPct = tooltipPatrimony && tooltipPatrimony.invested
    ? ((tooltipPatrimony.marketValue - tooltipPatrimony.invested) / tooltipPatrimony.invested) * 100
    : 0;

  const maxTopDividend = Math.max(1, ...topDividends.map((a) => a.total ?? 0));
  const topDividendsRows = topDividends.map((a, i) => ({
    rank: String(i + 1).padStart(2, '0'),
    ticker: a.ticker ?? '—',
    name: a.name ?? '',
    value: fmtBRL(a.total ?? 0),
    pct: (topDividendsTotal ? ((a.total ?? 0) / topDividendsTotal) * 100 : 0).toFixed(1).replace('.', ',') + '%',
    width: (((a.total ?? 0) / maxTopDividend) * 100).toFixed(1) + '%',
  }));

  const dividendsByYear = Object.values(
    dividendsMonthly.reduce((acc, m) => {
      const year = m.year;
      acc[year] = acc[year] ?? { year, total: 0 };
      acc[year].total += m.total ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => a.year - b.year);

  const dividendsLast6Months = dividendsMonthly.slice(-6);

  const dividendGroups = dividendEvolutionView === 'mensal'
    ? dividendsLast6Months.map((m) => ({ label: `${monthAbbrev[(m.month - 1 + 12) % 12]}/${String(m.year).slice(2)}`, total: m.total ?? 0 }))
    : dividendsByYear.map((y) => ({ label: String(y.year), total: y.total }));

  const maxDividend = Math.max(1, ...dividendGroups.map((g) => g.total));
  const dividends = dividendGroups.map((g) => ({
    label: g.label,
    value: fmtKShort(g.total),
    fullValue: fmtBRL(g.total),
    height: ((g.total / maxDividend) * 100).toFixed(1) + '%',
  }));
  const tooltipDividend = hoveredDividendIndex !== null ? dividends[hoveredDividendIndex] : null;

  const deltaPct = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : 0);
  const deltaLabel = (pct) => (pct >= 0 ? '▲ +' : '▼ ') + Math.abs(pct).toFixed(2).replace('.', ',') + '%';
  const deltaColor = (pct) => (pct >= 0 ? '#0ecb81' : '#f6465d');

  // Patrimônio total: último mês vs. penúltimo (marketValue)
  const patrCurr = patrimonyMonthly[patrimonyMonthly.length - 1];
  const patrPrev = patrimonyMonthly[patrimonyMonthly.length - 2];
  const patrimonioTotal = patrCurr?.marketValue ?? 0;
  const patrimonioDeltaPct = deltaPct(patrimonioTotal, patrPrev?.marketValue ?? 0);

  // Dividendos no mês: último mês vs. penúltimo (total)
  const divCurr = dividendsMonthly[dividendsMonthly.length - 1];
  const divPrev = dividendsMonthly[dividendsMonthly.length - 2];
  const dividendosMes = divCurr?.total ?? 0;
  const dividendosDeltaPct = deltaPct(dividendosMes, divPrev?.total ?? 0);
  const divPrevLabel = divPrev ? `${monthAbbrev[(divPrev.month - 1 + 12) % 12]}/${divPrev.year}` : '';

  // Aporte do mês: invested(mês atual) - invested(mês anterior), comparado ao aporte do mês anterior
  const patrPrevPrev = patrimonyMonthly[patrimonyMonthly.length - 3];
  const aporteMes = (patrCurr?.invested ?? 0) - (patrPrev?.invested ?? 0);
  const aporteAnterior = (patrPrev?.invested ?? 0) - (patrPrevPrev?.invested ?? 0);
  const aporteDeltaPct = deltaPct(aporteMes, aporteAnterior);

  return (
    <div style={{ padding: '24px 32px 48px', flex: 1 }}>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <KpiCard
          icon={kpiIcons.patrimonio} label="Patrimônio total"
          value={fmtBRL(patrimonioTotal)}
          delta={patrPrev ? deltaLabel(patrimonioDeltaPct) : undefined}
          deltaColor={deltaColor(patrimonioDeltaPct)}
          foot="vs. mês anterior"
        />
        <KpiCard
          icon={kpiIcons.dividendos} label="Dividendos no mês"
          value={fmtBRL(dividendosMes)}
          delta={divPrev ? deltaLabel(dividendosDeltaPct) : undefined}
          deltaColor={deltaColor(dividendosDeltaPct)}
          foot={divPrevLabel ? `vs. ${divPrevLabel}` : undefined}
        />
        <KpiCard
          icon={kpiIcons.aporte} label="Aporte do mês"
          value={fmtBRL(aporteMes)}
          delta={patrPrevPrev ? deltaLabel(aporteDeltaPct) : undefined}
          deltaColor={deltaColor(aporteDeltaPct)}
          foot="vs. mês anterior"
        />
      </div>

      {/* PATRIMONY EVOLUTION */}
      <div style={{ background: '#1e2329', borderRadius: 12, padding: 24, border: '1px solid #2b3139', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Evolução do patrimônio</div>
            <div style={{ fontSize: 12, color: '#707a8a', marginTop: 2 }}>Investido vs. valor de mercado · últimos 12 meses</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2b3139', border: '2px solid #2dbdb6' }} />
              <span style={{ fontSize: 12, color: '#eaecef' }}>Investido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD535' }} />
              <span style={{ fontSize: 12, color: '#eaecef' }}>Valor de mercado</span>
            </div>
          </div>
        </div>

        {loadingPatrimony && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando patrimônio...</div>
        )}

        {!loadingPatrimony && patrimony.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum dado de patrimônio encontrado.</div>
        )}

        {!loadingPatrimony && patrimony.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 280, gap: 4, padding: '0 4px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {[maxPatrim, maxPatrim * 0.75, maxPatrim * 0.5, maxPatrim * 0.25, 0].map((v, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#707a8a' }}>{fmtKShort(v)}</div>
            ))}
          </div>

          <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 24, pointerEvents: 'none' }}>
            {[0, 25, 50, 75, 100].map((t) => (
              <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: t + '%', height: 1, background: '#2b3139' }} />
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, paddingLeft: 44, paddingBottom: 24, height: '100%' }}>
            {patrimony.map((m, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredPatrimonyIndex(i)}
                onMouseLeave={() => setHoveredPatrimonyIndex(null)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end',
                  cursor: 'default', borderRadius: 4,
                  background: hoveredPatrimonyIndex === i ? 'rgba(255,255,255,0.04)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 'calc(100% - 18px)', width: '100%', justifyContent: 'center' }}>
                  <div style={{ width: 12, background: '#2dbdb6', borderRadius: '2px 2px 0 0', height: m.hInv, opacity: hoveredPatrimonyIndex === null || hoveredPatrimonyIndex === i ? 1 : 0.4 }} />
                  <div style={{ width: 12, background: '#FCD535', borderRadius: '2px 2px 0 0', height: m.hMkt, opacity: hoveredPatrimonyIndex === null || hoveredPatrimonyIndex === i ? 1 : 0.4 }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#707a8a', height: 12 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {tooltipPatrimony && (
          <div style={{
            position: 'absolute', right: 26, top: 16, background: '#2b3139', border: '1px solid #3a4148',
            borderRadius: 8, padding: '10px 12px', minWidth: 130,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)', pointerEvents: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: '#707a8a', fontWeight: 500 }}>{tooltipPatrimony.label}</span>
              {hoveredPatrimonyIndex === null && <span style={{ fontSize: 9, color: '#5a626e' }}>(mais recente)</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FCD535' }} />
              <span style={{ fontSize: 11, color: '#eaecef' }}>Mercado</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ffffff', fontWeight: 600 }}>{fmtKShort(tooltipPatrimony.marketValue)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dbdb6' }} />
              <span style={{ fontSize: 11, color: '#eaecef' }}>Investido</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ffffff', fontWeight: 600 }}>{fmtKShort(tooltipPatrimony.invested)}</span>
            </div>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #3a4148', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#707a8a' }}>Ganho</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: patrimonyGainPct >= 0 ? '#0ecb81' : '#f6465d', fontWeight: 600 }}>{(patrimonyGainPct >= 0 ? '+' : '') + patrimonyGainPct.toFixed(1).replace('.', ',')}%</span>
            </div>
          </div>
          )}
        </div>
        )}
      </div>

      {/* DONUT + TOP DIVIDENDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 20, marginBottom: 20 }}>

        <div style={{ background: '#1e2329', borderRadius: 12, padding: 24, border: '1px solid #2b3139' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Distribuição da carteira</div>
              <div style={{ fontSize: 12, color: '#707a8a', marginTop: 2 }}>
                {distributionView === 'ativo' ? 'Alocação por ativo' : distributionView === 'custodia' ? 'Alocação por custodiante' : 'Alocação por classe de ativo'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, padding: 3, flexShrink: 0 }}>
              {[{ key: 'classe', label: 'Classe' }, { key: 'ativo', label: 'Ativo' }, { key: 'custodia', label: 'Custódia' }].map((o) => (
                <button key={o.key} onClick={() => { setDistributionView(o.key); setHoveredSegmentIndex(null); }} style={{
                  padding: '5px 10px', fontSize: 11, fontWeight: distributionView === o.key ? 600 : 500,
                  color: distributionView === o.key ? '#181a20' : '#707a8a',
                  background: distributionView === o.key ? '#FCD535' : 'transparent',
                  border: 0, borderRadius: 6, cursor: 'pointer'
                }}>{o.label}</button>
              ))}
            </div>
          </div>

          {loadingDistribution && (
            <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando carteira...</div>
          )}

          {!loadingDistribution && assets.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum ativo cadastrado.</div>
          )}

          {!loadingDistribution && assets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 20 }}>
            <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
              <div style={{ width: 200, height: 200, borderRadius: '50%', background: donutGradient }} />
              <div style={{ position: 'absolute', inset: 24, background: '#1e2329', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: '#707a8a', fontWeight: 500 }}>Total</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{fmtKShort(totalMarket)}</div>
                <div style={{ fontSize: 10, color: '#707a8a', marginTop: 2 }}>{assets.length} ativo{assets.length === 1 ? '' : 's'}</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {donutSegments.map((s, i) => (
                <div
                  key={s.label}
                  onMouseEnter={() => setHoveredSegmentIndex(i)}
                  onMouseLeave={() => setHoveredSegmentIndex(null)}
                  style={{
                    borderRadius: 6, padding: '4px 6px', margin: '-4px -6px', cursor: 'default',
                    background: hoveredSegmentIndex === i ? 'rgba(255,255,255,0.06)' : 'transparent',
                    opacity: hoveredSegmentIndex === null || hoveredSegmentIndex === i ? 1 : 0.5
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                      <span style={{ fontSize: 13, color: '#eaecef', fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ffffff', fontWeight: 600 }}>{s.pct}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#707a8a', paddingLeft: 18 }}>{s.amount}</div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <div style={{ background: '#1e2329', borderRadius: 12, padding: 24, border: '1px solid #2b3139' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Top dividendos por ativo</div>
              <div style={{ fontSize: 12, color: '#707a8a', marginTop: 2 }}>Acumulado em 12 meses</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#FCD535', fontWeight: 600 }}>{fmtBRL(topDividendsTotal)}</div>
          </div>

          {loadingTopDividends && (
            <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando proventos...</div>
          )}

          {!loadingTopDividends && topDividendsRows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum provento encontrado.</div>
          )}

          {!loadingTopDividends && topDividendsRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topDividendsRows.map((d) => (
              <div key={d.rank}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#707a8a', width: 16 }}>{d.rank}</span>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: assetColorOf(d.ticker), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{initialOf(d.ticker)}</div>
                    <span style={{ fontSize: 13, color: '#eaecef', fontWeight: 600 }}>{d.ticker}</span>
                    <span style={{ fontSize: 11, color: '#707a8a' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#ffffff', fontWeight: 600 }}>{d.value}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#707a8a', width: 38, textAlign: 'right' }}>{d.pct}</span>
                  </div>
                </div>
                <div style={{ height: 4, background: '#0b0e11', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: d.width, height: '100%', background: '#FCD535' }} />
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* DIVIDEND EVOLUTION */}
      <div style={{ background: '#1e2329', borderRadius: 12, padding: 24, border: '1px solid #2b3139' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>Evolução dos dividendos recebidos</div>
            <div style={{ fontSize: 12, color: '#707a8a', marginTop: 2 }}>
              {dividendEvolutionView === 'mensal' ? 'Proventos mensais · últimos 6 meses' : 'Proventos anuais · desde 2023'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, padding: 3, flexShrink: 0 }}>
            {[{ key: 'anual', label: 'Anual' }, { key: 'mensal', label: 'Mensal' }].map((o) => (
              <button key={o.key} onClick={() => { setDividendEvolutionView(o.key); setHoveredDividendIndex(null); }} style={{
                padding: '5px 10px', fontSize: 11, fontWeight: dividendEvolutionView === o.key ? 600 : 500,
                color: dividendEvolutionView === o.key ? '#181a20' : '#707a8a',
                background: dividendEvolutionView === o.key ? '#FCD535' : 'transparent',
                border: 0, borderRadius: 6, cursor: 'pointer'
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        {loadingDividends && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando proventos...</div>
        )}

        {!loadingDividends && dividends.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum provento encontrado.</div>
        )}

        {!loadingDividends && dividends.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 6, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {[maxDividend, maxDividend * 0.75, maxDividend * 0.5, maxDividend * 0.25, 0].map((v, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#707a8a' }}>{fmtKShort(v)}</div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 20, pointerEvents: 'none' }}>
            {[0, 33, 66, 100].map((t) => (
              <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: t + '%', height: 1, background: '#2b3139' }} />
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, paddingLeft: 48, paddingBottom: 20, height: '100%' }}>
            {dividends.map((d, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredDividendIndex(i)}
                onMouseLeave={() => setHoveredDividendIndex(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', cursor: 'default' }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#707a8a', height: 12 }}>{d.value}</div>
                <div style={{
                  width: '100%', maxWidth: 36, borderRadius: '3px 3px 0 0', height: d.height,
                  background: hoveredDividendIndex === i ? 'linear-gradient(180deg, #ffe066 0%, #FCD535 100%)' : 'linear-gradient(180deg, #FCD535 0%, #f0b90b 100%)',
                  boxShadow: hoveredDividendIndex === i ? '0 0 0 1px rgba(252,213,53,0.5)' : 'none',
                }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: hoveredDividendIndex === i ? '#eaecef' : '#707a8a', height: 12 }}>{d.label}</div>
              </div>
            ))}
          </div>

          {tooltipDividend && (
          <div style={{
            position: 'absolute', right: 26, top: 0, background: '#2b3139', border: '1px solid #3a4148',
            borderRadius: 8, padding: '10px 12px', minWidth: 130,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)', pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 10, color: '#707a8a', fontWeight: 500, marginBottom: 4 }}>{tooltipDividend.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#FCD535', fontWeight: 700 }}>{tooltipDividend.fullValue}</div>
          </div>
          )}
        </div>
        )}
      </div>

    </div>
  );
}
