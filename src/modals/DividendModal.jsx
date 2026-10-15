import { useState, useEffect } from 'react';
import { parseNum } from '../lib/format.js';
import ModalShell, { Label, CancelButton, SubmitButton } from '../components/ModalShell.jsx';
import { inputStyle, monoInputStyle } from '../components/modalStyles.js';
import { listAssets, getDividend, createDividend, updateDividend, getLastDividendForAsset, ECustodian } from '../api/index.js';

const custodianLabel = { [ECustodian.BTG]: 'BTG Pactual', [ECustodian.Itau]: 'Itaú' };

const todayParam = () => new Date().toISOString().slice(0, 10);

export default function DividendModal({ dividendId, onClose, onSubmit }) {
  const isEditing = !!dividendId;

  const [assets, setAssets]   = useState([]);
  const [assetId, setAssetId] = useState('');
  const [pay, setPay]         = useState(todayParam());
  const [amount, setAmount]   = useState('');
  const [custodian, setCustodian] = useState('BTG');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDividend, setLoadingDividend] = useState(isEditing);
  const [error, setError]     = useState('');

  useEffect(() => {
    listAssets({ pageSize: 100 })
      .then((res) => setAssets(res?.data ?? []))
      .catch(() => setError('Não foi possível carregar os ativos cadastrados.'));
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    getDividend(dividendId)
      .then((res) => {
        if (cancelled) return;
        const d = res?.data;
        if (!d) return;
        setAssetId(d.assetId);
        setPay((d.receiptDate || '').slice(0, 10));
        setAmount(String(d.totalFinancial));
        setCustodian(d.custodian);
      })
      .catch((err) => setError(err.message || 'Falha ao carregar o provento.'))
      .finally(() => { if (!cancelled) setLoadingDividend(false); });
    return () => { cancelled = true; };
  }, [isEditing, dividendId]);

  useEffect(() => {
    if (isEditing || !assetId) return;
    let cancelled = false;
    getLastDividendForAsset(assetId).then((last) => {
      if (cancelled) return;
      if (last) {
        setAmount(String(last.totalFinancial));
        setCustodian(last.custodian);
      } else {
        setAmount('');
        setCustodian('BTG');
      }
    });
    return () => { cancelled = true; };
  }, [isEditing, assetId]);

  const valid = !!assetId && parseNum(amount) > 0 && !submitting && !loadingDividend;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = { receiptDate: pay, totalFinancial: parseNum(amount), custodian: ECustodian[custodian] ?? custodian };
      if (isEditing) {
        await updateDividend(dividendId, payload);
      } else {
        await createDividend({ assetId, ...payload });
      }
      onSubmit();
    } catch (err) {
      setError(err.message || 'Falha ao registrar o provento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow={isEditing ? 'EDITAR PROVENTO' : 'REGISTRAR PROVENTO'}
      title={isEditing ? 'Editar provento' : 'Novo provento recebido'}
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        <SubmitButton
          valid={valid}
          onClick={handleSubmit}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3.5 3.5L13 5"/></svg>}
        >{submitting ? 'Enviando...' : isEditing ? 'Salvar alterações' : 'Registrar provento'}</SubmitButton>
      </>}
    >

      {loadingDividend ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando provento...</div>
      ) : (
      <>

      {/* ASSET */}
      <div>
        <Label>ATIVO</Label>
        <select
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          disabled={isEditing}
          style={{ ...inputStyle, fontSize: 13, appearance: 'none', opacity: isEditing ? 0.6 : 1, backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="%23707a8a" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          <option value="">Selecione um ativo cadastrado</option>
          {assets.map((a) => (
            <option key={a.assetId} value={a.assetId}>{a.ticker}{a.name ? ` — ${a.name}` : ''}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label>DATA DE PAGAMENTO</Label>
          <input type="date" value={pay} onChange={(e) => setPay(e.target.value)} style={{ ...inputStyle, fontSize: 13 }}/>
        </div>
        <div>
          <Label>VALOR FINANCEIRO</Label>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#707a8a', fontFamily: "'JetBrains Mono', monospace" }}>R$</span>
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" style={{ ...monoInputStyle, marginTop: 0, paddingLeft: 40 }}/>
          </div>
        </div>
      </div>

      <div>
        <Label>CUSTODIANTE</Label>
        <select
          value={custodian}
          onChange={(e) => setCustodian(e.target.value)}
          style={{ ...inputStyle, fontSize: 13, appearance: 'none', backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="%23707a8a" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          {Object.keys(ECustodian).map((key) => (
            <option key={key} value={key}>{custodianLabel[ECustodian[key]]}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ color: '#f6465d', fontSize: 12, background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 8, padding: '10px 12px' }}>
          {error}
        </div>
      )}

      </>
      )}

    </ModalShell>
  );
}
