import { useState } from 'react';
import { parseCSV, downloadCSV } from '../lib/csv.js';
import { parseNum } from '../lib/format.js';
import ModalShell, { Label, CancelButton, SubmitButton } from '../components/ModalShell.jsx';
import { bulkCreateAssets, EAssetType } from '../api/index.js';

const TEMPLATE_CSV = 'ticker;nome;classe;preco\nPETR4;Petrobras PN;Ações;38,92\nHGLG11;CSHG Logística;FIIs;172,30\n';

const TICKER_KEYS = ['ticker'];
const NAME_KEYS = ['nome', 'name'];
const TYPE_KEYS = ['classe', 'tipo', 'type'];
const PRICE_KEYS = ['preco', 'preço', 'price'];

const firstMatch = (row, keys) => {
  const key = Object.keys(row).find((k) => keys.includes(k));
  return key ? row[key] : '';
};

const normalizeType = (raw) => {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith('fii')) return EAssetType.FIIs;
  if (v.startsWith('aç') || v.startsWith('ac')) return EAssetType.Acoes;
  return null;
};

function toRow(raw, index) {
  const ticker = firstMatch(raw, TICKER_KEYS).trim().toUpperCase();
  const name = firstMatch(raw, NAME_KEYS).trim();
  const typeRaw = firstMatch(raw, TYPE_KEYS);
  const type = normalizeType(typeRaw);
  const priceRaw = firstMatch(raw, PRICE_KEYS).trim();
  const price = priceRaw ? parseNum(priceRaw) : null;

  const errors = [];
  if (!ticker) errors.push('ticker vazio');
  if (!type) errors.push(`classe inválida ("${typeRaw}")`);
  if (priceRaw && (!price || price <= 0)) errors.push('preço inválido');

  return {
    index,
    ticker,
    name,
    type,
    price: price && price > 0 ? price : null,
    valid: errors.length === 0,
    error: errors.join(', '),
  };
}

export default function ImportAssetsModal({ onClose, onSubmit }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'preview' | 'result'
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result));
        if (parsed.length === 0) {
          setError('O arquivo não contém linhas de dados.');
          return;
        }
        setRows(parsed.map(toRow));
        setStep('preview');
      } catch {
        setError('Não foi possível ler o arquivo. Verifique se é um CSV válido.');
      }
    };
    reader.onerror = () => setError('Não foi possível ler o arquivo.');
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await bulkCreateAssets(validRows.map((r) => ({ ticker: r.ticker, name: r.name || null, type: r.type, price: r.price })));
      setResult(res?.data ?? { created: [], failed: [] });
      setStep('result');
    } catch (err) {
      setError(err.message || 'Falha ao importar os ativos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    onSubmit();
  };

  return (
    <ModalShell
      eyebrow="IMPORTAR ATIVOS"
      title="Importar ativos via CSV"
      subtitle={step === 'pick' ? 'Colunas esperadas: ticker, nome (opcional), classe (Ações/FIIs), preço (opcional)' : undefined}
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        {step === 'preview' && (
          <SubmitButton
            valid={validRows.length > 0 && !submitting}
            onClick={handleImport}
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3.5 3.5L13 5"/></svg>}
          >{submitting ? 'Importando...' : `Importar ${validRows.length} ativo${validRows.length === 1 ? '' : 's'}`}</SubmitButton>
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
            <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ color: '#eaecef', fontSize: 13 }} />
            <div style={{ fontSize: 11, color: '#707a8a', marginTop: 10 }}>
              Exporte sua planilha do Excel como CSV (Arquivo → Salvar como → CSV) antes de importar.
            </div>
          </div>
          <button
            onClick={() => downloadCSV('modelo_ativos.csv', TEMPLATE_CSV)}
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
                  <th style={{ padding: '8px 10px' }}>Classe</th>
                  <th style={{ padding: '8px 10px' }}>Preço</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} style={{ borderTop: '1px solid #2b3139' }}>
                    <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{r.ticker || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#eaecef' }}>{r.type || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#eaecef', fontFamily: "'JetBrains Mono', monospace" }}>{r.price ?? '—'}</td>
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
              <div style={{ fontSize: 11, color: '#707a8a' }}>Criados</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#0ecb81', fontWeight: 700, marginTop: 4 }}>{result.created?.length ?? 0}</div>
            </div>
            <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#707a8a' }}>Falharam</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#f6465d', fontWeight: 700, marginTop: 4 }}>{result.failed?.length ?? 0}</div>
            </div>
          </div>

          {result.failed?.length > 0 && (
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
