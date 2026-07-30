import { useState, useMemo, useEffect } from 'react';
import { fmtBRL, parseNum } from '../lib/format.js';
import ModalShell, { Label, CancelButton, SubmitButton } from '../components/ModalShell.jsx';
import { inputStyle, monoInputStyle } from '../components/modalStyles.js';
import { listAssets, getTransaction, createTransaction, updateTransaction, EOperationType, ECustodian } from '../api/index.js';

const todayParam = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ transactionId, onClose, onSubmit }) {
  const isEditing = !!transactionId;

  const [side, setSide]         = useState('Compra');
  const [assets, setAssets]     = useState([]);
  const [assetId, setAssetId]   = useState('');
  const [assetLabel, setAssetLabel] = useState(''); // read-only display while editing
  const [date, setDate]         = useState(todayParam());
  const [qty, setQty]           = useState('');
  const [price, setPrice]       = useState('');
  const [custodian, setCustodian] = useState('BTG');
  const [fee, setFee]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(isEditing);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isEditing) return;
    listAssets({ pageSize: 100 })
      .then((res) => setAssets(res?.data ?? []))
      .catch(() => setError('Não foi possível carregar os ativos cadastrados.'));
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    getTransaction(transactionId)
      .then((res) => {
        if (cancelled) return;
        const t = res?.data;
        if (!t) return;
        setSide(t.side);
        setAssetId(t.assetId);
        setAssetLabel(t.asset?.ticker ? `${t.asset.ticker}${t.asset.name ? ` — ${t.asset.name}` : ''}` : '—');
        setDate((t.dateBuySell || '').slice(0, 10));
        setQty(String(t.quantity));
        setPrice(String(t.unitPrice));
        setCustodian(t.custodian);
      })
      .catch((err) => setError(err.message || 'Falha ao carregar a transação.'))
      .finally(() => { if (!cancelled) setLoadingTransaction(false); });
    return () => { cancelled = true; };
  }, [isEditing, transactionId]);

  const isCompra = side === 'Compra';
  const bruto = useMemo(() => parseNum(qty) * parseNum(price), [qty, price]);
  const feeN = parseNum(fee);
  const liquido = isCompra ? bruto + feeN : bruto - feeN;
  const valid = !!assetId && parseNum(qty) > 0 && parseNum(price) > 0 && !submitting && !loadingTransaction;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        type: isCompra ? EOperationType.Compra : EOperationType.Venda,
        quantity: parseNum(qty),
        unitPrice: parseNum(price),
        dateBuySell: date,
        custodian: ECustodian[custodian],
      };
      if (isEditing) {
        await updateTransaction(transactionId, payload);
      } else {
        await createTransaction({ assetId, ...payload });
      }
      onSubmit();
    } catch (err) {
      setError(err.message || 'Falha ao salvar a transação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow={isEditing ? 'EDITAR OPERAÇÃO' : 'REGISTRAR OPERAÇÃO'}
      title={isEditing ? 'Editar lançamento' : 'Novo lançamento'}
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        <SubmitButton
          valid={valid}
          onClick={handleSubmit}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3.5 3.5L13 5"/></svg>}
        >{submitting ? 'Enviando...' : isEditing ? 'Salvar alterações' : isCompra ? 'Registrar compra' : 'Registrar venda'}</SubmitButton>
      </>}
    >

      {loadingTransaction ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#707a8a', fontSize: 13 }}>Carregando transação...</div>
      ) : (
      <>

      {/* SIDE TOGGLE */}
      <div>
        <Label>TIPO DE OPERAÇÃO</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, padding: 4, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8, opacity: isEditing ? 0.6 : 1 }}>
          <button disabled={isEditing} onClick={() => setSide('Compra')} style={{ position: 'relative', padding: 10, border: 0, borderRadius: 6, cursor: isEditing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isCompra && <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,203,129,0.18)', border: '1px solid rgba(14,203,129,0.4)', borderRadius: 6 }}/>}
            <span style={{ position: 'relative', color: isCompra ? '#0ecb81' : '#707a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>▲</span>Compra
            </span>
          </button>
          <button disabled={isEditing} onClick={() => setSide('Venda')} style={{ position: 'relative', padding: 10, border: 0, borderRadius: 6, cursor: isEditing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {!isCompra && <div style={{ position: 'absolute', inset: 0, background: 'rgba(246,70,93,0.18)', border: '1px solid rgba(246,70,93,0.4)', borderRadius: 6 }}/>}
            <span style={{ position: 'relative', color: !isCompra ? '#f6465d' : '#707a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>▼</span>Venda
            </span>
          </button>
        </div>
      </div>

      {/* ASSET */}
      <div>
        <Label>ATIVO</Label>
        {isEditing ? (
          <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: '#707a8a', background: '#0b0e11' }}>{assetLabel}</div>
        ) : (
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            style={{ ...inputStyle, fontSize: 13, appearance: 'none', backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="%23707a8a" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">Selecione um ativo cadastrado</option>
            {assets.map((a) => (
              <option key={a.assetId} value={a.assetId}>{a.ticker}{a.name ? ` — ${a.name}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* DATE + CUSTODIAN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label>DATA DA OPERAÇÃO</Label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, fontSize: 13 }}/>
        </div>
        <div>
          <Label>CUSTODIANTE</Label>
          <select value={custodian} onChange={(e) => setCustodian(e.target.value)} style={{ ...inputStyle, fontSize: 13, appearance: 'none', backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="%23707a8a" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
            <option value="BTG">BTG Pactual</option>
            <option value="Itau">Itaú</option>
          </select>
        </div>
      </div>

      {/* QTY + PRICE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label>QUANTIDADE</Label>
          <input type="text" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" style={monoInputStyle}/>
        </div>
        <div>
          <Label>PREÇO UNITÁRIO</Label>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#707a8a', fontFamily: "'JetBrains Mono', monospace" }}>R$</span>
            <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" style={{ ...monoInputStyle, marginTop: 0, paddingLeft: 40 }}/>
          </div>
        </div>
      </div>

      {/* FEE */}
      {!isEditing && (
        <div>
          <Label optional>TAXAS E EMOLUMENTOS</Label>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#707a8a', fontFamily: "'JetBrains Mono', monospace" }}>R$</span>
            <input type="text" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0,00" style={{ ...monoInputStyle, marginTop: 0, paddingLeft: 40 }}/>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span style={{ fontSize: 12, color: '#707a8a' }}>Volume bruto</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef' }}>{fmtBRL(bruto)}</span>
        </div>
        {!isEditing && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: 12, color: '#707a8a' }}>Taxas</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#eaecef' }}>{fmtBRL(feeN)}</span>
          </div>
        )}
        <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px dashed #2b3139', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>{isCompra ? 'Total debitado' : 'Total creditado'}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, color: isCompra ? '#f6465d' : '#0ecb81', fontWeight: 700 }}>{fmtBRL(liquido)}</span>
        </div>
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
