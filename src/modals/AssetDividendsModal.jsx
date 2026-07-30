import { useEffect, useState } from 'react';
import { fmtBRL } from '../lib/format.js';
import { listDividends, syncAssetDividends, ECustodian } from '../api/index.js';
import ModalShell, { CancelButton, SubmitButton } from '../components/ModalShell.jsx';

const custodianLabel = { [ECustodian.BTG]: 'BTG Pactual', [ECustodian.Itau]: 'Itaú' };

const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
};

const currentMonthRange = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { dateFrom, dateTo };
};

// First day of the current month through today (not the month's last day).
const monthToDateRange = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);
  return { dateFrom, dateTo };
};

const monthLabel = () => new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function AssetDividendsModal({ assetId, ticker, onClose }) {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const loadDividends = () => {
    setLoading(true);
    const { dateFrom, dateTo } = currentMonthRange();
    return listDividends({ assetId, dateFrom, dateTo, pageSize: 100 })
      .then((res) => { setDividends(res?.data ?? []); setError(''); })
      .catch((err) => { setError(err.message || 'Falha ao carregar proventos.'); })
      .finally(() => { setLoading(false); });
  };

  useEffect(() => {
    let cancelled = false;
    const { dateFrom, dateTo } = currentMonthRange();
    listDividends({ assetId, dateFrom, dateTo, pageSize: 100 })
      .then((res) => { if (!cancelled) { setDividends(res?.data ?? []); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message || 'Falha ao carregar proventos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assetId]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError('');
    try {
      const { dateFrom, dateTo } = monthToDateRange();
      await syncAssetDividends(ticker, { dateFrom, dateTo });
      await loadDividends();
    } catch (err) {
      setSyncError(err.message || 'Falha ao atualizar os proventos.');
    } finally {
      setSyncing(false);
    }
  };

  const total = dividends.reduce((sum, d) => sum + (d.totalFinancial ?? 0), 0);

  return (
    <ModalShell
      eyebrow="PROVENTOS DO MÊS"
      title={`Proventos de ${ticker}`}
      subtitle={monthLabel()}
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        <SubmitButton
          valid={!syncing}
          onClick={handleSync}
          icon={<svg
            width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={syncing ? { animation: 'spin 0.8s linear infinite' } : undefined}
          >
            <path d="M13.5 8A5.5 5.5 0 1 1 11.8 4.1"/>
            <path d="M13.5 2.5v3.2h-3.2"/>
          </svg>}
        >{syncing ? 'Atualizando...' : 'Atualizar proventos'}</SubmitButton>
      </>}
    >
      {syncError && (
        <div style={{ color: '#f6465d', fontSize: 12, background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 8, padding: '10px 12px' }}>
          {syncError}
        </div>
      )}

      {loading && (
        <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando proventos...</div>
      )}

      {!loading && error && (
        <div style={{ color: '#f6465d', fontSize: 12, background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 8, padding: '10px 12px' }}>
          {error}
        </div>
      )}

      {!loading && !error && dividends.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Nenhum provento de {ticker} neste mês.</div>
      )}

      {!loading && !error && dividends.length > 0 && (
        <>
          <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>Total no mês</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, color: '#0ecb81', fontWeight: 700 }}>+ {fmtBRL(total)}</span>
          </div>

          <div style={{ border: '1px solid #2b3139', borderRadius: 8, overflow: 'hidden' }}>
            {dividends.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #2b3139' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#eaecef' }}>{fmtDate(d.receiptDate)}</div>
                  <div style={{ fontSize: 11, color: '#707a8a', marginTop: 2 }}>{custodianLabel[d.custodian] ?? d.custodian}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#0ecb81', fontWeight: 600 }}>+ {fmtBRL(d.totalFinancial)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ModalShell>
  );
}
