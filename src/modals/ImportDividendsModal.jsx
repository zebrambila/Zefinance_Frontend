import { useState } from 'react';
import { parseCSV, downloadCSV } from '../lib/csv.js';
import { parseNum, parseDateFlexible } from '../lib/format.js';
import ModalShell, { Label, CancelButton, SubmitButton } from '../components/ModalShell.jsx';
import { listAssets, createDividend, ECustodian } from '../api/index.js';

const TEMPLATE_CSV = 'ticker;data;valor;custodiante\nPETR4;15/07/2026;432,00;BTG\nTAEE11;30/06/2026;488,00;Itau\n';

const TICKER_KEYS = ['ticker'];
const DATE_KEYS = ['data', 'data de pagamento', 'receiptdate', 'date'];
const AMOUNT_KEYS = ['valor', 'valor financeiro', 'total', 'totalfinancial'];
const CUSTODIAN_KEYS = ['custodiante', 'custodian'];

const firstMatch = (row, keys) => {
  const key = Object.keys(row).find((k) => keys.includes(k));
  return key ? row[key] : '';
};

const normalizeCustodian = (raw) => {
  const v = raw.trim().toLowerCase();
  if (!v) return ECustodian.BTG;
  if (v.startsWith('ita')) return ECustodian.Itau;
  if (v.startsWith('btg')) return ECustodian.BTG;
  return null;
};

export default function ImportDividendsModal({ onClose, onSubmit }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'preview' | 'result'
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const buildRow = (raw, index, assetByTicker) => {
    const ticker = firstMatch(raw, TICKER_KEYS).trim().toUpperCase();
    const dateRaw = firstMatch(raw, DATE_KEYS).trim();
    const amountRaw = firstMatch(raw, AMOUNT_KEYS).trim();
    const custodianRaw = firstMatch(raw, CUSTODIAN_KEYS);

    const asset = assetByTicker.get(ticker);
    const receiptDate = parseDateFlexible(dateRaw);
    const totalFinancial = amountRaw ? parseNum(amountRaw) : 0;
    const custodian = normalizeCustodian(custodianRaw);

    const errors = [];
    if (!ticker) errors.push('ticker vazio');
    else if (!asset) errors.push(`ticker "${ticker}" não cadastrado`);
    if (!receiptDate) errors.push(`data inválida ("${dateRaw}")`);
    if (!totalFinancial || totalFinancial <= 0) errors.push('valor inválido');
    if (!custodian) errors.push(`custodiante inválido ("${custodianRaw}")`);

    return {
      index, ticker, receiptDate, totalFinancial, custodian,
      assetId: asset?.assetId,
      valid: errors.length === 0,
      error: errors.join(', '),
    };
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    setLoadingAssets(true);

    const reader = new FileReader();
    reader.onload = () => {
      listAssets({ pageSize: 100 })
        .then((res) => {
          const assetByTicker = new Map((res?.data ?? []).map((a) => [a.ticker.toUpperCase(), a]));
          const parsed = parseCSV(String(reader.result));
          if (parsed.length === 0) {
            setError('O arquivo não contém linhas de dados.');
            return;
          }
          setRows(parsed.map((raw, i) => buildRow(raw, i, assetByTicker)));
          setStep('preview');
        })
        .catch(() => setError('Não foi possível carregar os ativos cadastrados para validar o CSV.'))
        .finally(() => setLoadingAssets(false));
    };
    reader.onerror = () => { setError('Não foi possível ler o arquivo.'); setLoadingAssets(false); };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    setError('');
    setProgress(0);
    const created = [];
    const failed = [];
    for (const row of validRows) {
      try {
        await createDividend({ assetId: row.assetId, receiptDate: row.receiptDate, totalFinancial: row.totalFinancial, custodian: row.custodian });
        created.push({ ticker: row.ticker });
      } catch (err) {
        failed.push({ ticker: row.ticker, error: err.message || 'Falha ao registrar.' });
      }
      setProgress((p) => p + 1);
    }
    setResult({ created, failed });
    setSubmitting(false);
    setStep('result');
  };

  const handleFinish = () => onSubmit();

  return (
    <ModalShell
      eyebrow="IMPORTAR PROVENTOS"
      title="Importar proventos via CSV"
      subtitle={step === 'pick' ? 'Colunas esperadas: ticker, data, valor, custodiante (BTG/Itaú)' : undefined}
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        {step === 'preview' && (
          <SubmitButton
            valid={validRows.length > 0 && !submitting}
            onClick={handleImport}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3.5 3.5L13 5"/></svg>}
          >{submitting ? `Importando... (${progress}/${validRows.length})` : `Importar ${validRows.length} provento${validRows.length === 1 ? '' : 's'}`}</SubmitButton>
        )}
        {step === 'result' && (
          <SubmitButton
            valid
            onClick={handleFinish}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3.5 3.5L13 5"/></svg>}
          >Concluir</SubmitButton>
        )}
      </>}
    >

      {step === 'pick' && (
        <div>
          <Label>ARQUIVO CSV</Label>
          <div style={{ marginTop: 10, border: '1px dashed #2b3139', borderRadius: 8, padding: '24px 16px', textAlign: 'center' }}>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={loadingAssets} style={{ color: '#eaecef', fontSize: 13 }} />
            <div style={{ fontSize: 11, color: '#707a8a', marginTop: 10 }}>
              {loadingAssets ? 'Carregando ativos cadastrados...' : 'Exporte sua planilha do Excel como CSV (Arquivo → Salvar como → CSV) antes de importar.'}
            </div>
          </div>
          <button
            onClick={() => downloadCSV('modelo_proventos.csv', TEMPLATE_CSV)}
            style={{ marginTop: 10, background: 'transparent', border: 0, color: '#FCD535', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8m0 0 3-3m-3 3-3-3M3 12v1.5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5V12"/>
            </svg>
            Baixar modelo CSV
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Label>{fileName}</Label>
            <span style={{ fontSize: 11, color: '#707a8a' }}>
              {validRows.length} válida{validRows.length === 1 ? '' : 's'} · {invalidRows.length} com erro
            </span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #2b3139', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#0b0e11', color: '#707a8a', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Ticker</th>
                  <th style={{ padding: '8px 10px' }}>Data</th>
                  <th style={{ padding: '8px 10px' }}>Valor</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} style={{ borderTop: '1px solid #2b3139' }}>
                    <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{r.ticker || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{r.receiptDate || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{r.totalFinancial || '—'}</td>
                    <td style={{ padding: '8px 10px', color: r.valid ? '#0ecb81' : '#f6465d' }}>{r.valid ? 'OK' : r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#707a8a' }}>Importados</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#0ecb81', fontWeight: 700, marginTop: 4 }}>{result.created.length}</div>
            </div>
            <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#707a8a' }}>Falharam</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#f6465d', fontWeight: 700, marginTop: 4 }}>{result.failed.length}</div>
            </div>
          </div>

          {result.failed.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #2b3139', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#0b0e11', color: '#707a8a', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Ticker</th>
                    <th style={{ padding: '8px 10px' }}>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failed.map((f, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #2b3139' }}>
                      <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{f.ticker}</td>
                      <td style={{ padding: '8px 10px', color: '#f6465d' }}>{f.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: '#f6465d', fontSize: 12, background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 8, padding: '10px 12px' }}>
          {error}
        </div>
      )}

    </ModalShell>
  );
}
