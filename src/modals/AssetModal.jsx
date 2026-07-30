import { useState } from 'react';
import ModalShell, { Label, CancelButton, SubmitButton } from '../components/ModalShell.jsx';
import { inputStyle } from '../components/modalStyles.js';
import { createAsset, EAssetType } from '../api/index.js';

const CLASSES = [EAssetType.Acoes, EAssetType.FIIs];

export default function AssetModal({ onClose, onSubmit }) {
  const [cls, setCls]         = useState(EAssetType.Acoes);
  const [ticker, setTicker]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');

  const valid = ticker.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      await createAsset({ ticker: ticker.trim(), type: cls });
      onSubmit();
    } catch (err) {
      setError(err.message || 'Falha ao cadastrar o ativo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow="CADASTRAR ATIVO"
      title="Novo ativo na carteira"
      subtitle="Adiciona o ativo ao seu catálogo · a posição é construída pelas transações"
      onClose={onClose}
      footer={<>
        <CancelButton onClick={onClose} />
        <SubmitButton
          valid={valid}
          onClick={handleSubmit}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10"/></svg>}
        >{submitting ? 'Enviando...' : 'Cadastrar ativo'}</SubmitButton>
      </>}
    >

      {/* CLASSE */}
      <div>
        <Label>CLASSE DO ATIVO</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 10, padding: 4, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 8 }}>
          {CLASSES.map((c) => {
            const active = cls === c;
            return (
              <button key={c} onClick={() => setCls(c)} style={{ position: 'relative', padding: '8px 4px', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent' }}>
                {active && <div style={{ position: 'absolute', inset: 0, background: 'rgba(252,213,53,0.16)', border: '1px solid rgba(252,213,53,0.4)', borderRadius: 6 }}/>}
                <span style={{ position: 'relative', color: active ? '#FCD535' : '#707a8a' }}>{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>TICKER</Label>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="PETR4"
          style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        />
      </div>

      <div style={{ background: '#0b0e11', border: '1px solid #2b3139', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(252,213,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="#FCD535">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.8 10.2H7.2V7H8.8v4.2ZM8 5.9a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z"/>
          </svg>
        </div>
        <div style={{ fontSize: 11, color: '#707a8a', lineHeight: 1.5 }}>
          O cadastro apenas registra o ativo no seu catálogo. Para começar a acompanhar posição, preço médio e resultado, registre a primeira compra em <strong style={{ color: '#eaecef' }}>Transações</strong>.
        </div>
      </div>

      {error && (
        <div style={{ color: '#f6465d', fontSize: 12, background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 8, padding: '10px 12px' }}>
          {error}
        </div>
      )}

    </ModalShell>
  );
}
