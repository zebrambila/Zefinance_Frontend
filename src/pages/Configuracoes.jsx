import { useState } from 'react';
import { syncAssetPrices, backfillAssetPrices } from '../api/index.js';

const ACTIONS = [
  {
    id: 'sync-prices',
    label: 'Sincronizar cotações',
    description: 'Atualiza o preço atual de todos os ativos cadastrados via Yahoo Finance.',
    route: 'POST /v1/assets/sync-prices',
    run: syncAssetPrices,
    formatResult: (data) => `${data} ativo${data === 1 ? '' : 's'} atualizado${data === 1 ? '' : 's'}.`,
  },
  {
    id: 'backfill-prices',
    label: 'Carregar histórico de preços',
    description: 'Executa a rotina BackfillAsync, populando o histórico de preços de fechamento (últimos 12 meses) usado na evolução do patrimônio.',
    route: 'POST /v1/assets/BackfillPrices',
    run: () => backfillAssetPrices({ months: 12 }),
    formatResult: (data) => {
      const processed = data?.processed?.length ?? 0;
      const failed = data?.failed ?? [];
      const base = `${processed} ativo${processed === 1 ? '' : 's'} processado${processed === 1 ? '' : 's'}.`;
      if (!failed.length) return base;
      return `${base} ${failed.length} falharam: ${failed.map((f) => f.ticker).join(', ')}.`;
    },
  },
];

function ActionCard({ action }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'done' | 'error'
  const [message, setMessage] = useState('');

  const handleRun = async () => {
    setStatus('running');
    setMessage('');
    try {
      const res = await action.run();
      setMessage(action.formatResult(res?.data));
      setStatus('done');
    } catch (err) {
      setMessage(err.message || 'Falha ao executar.');
      setStatus('error');
    }
  };

  return (
    <div style={{ background: '#1e2329', borderRadius: 12, border: '1px solid #2b3139', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{action.label}</div>
          <div style={{ fontSize: 12, color: '#707a8a', marginTop: 4 }}>{action.description}</div>
          <div style={{ fontSize: 11, color: '#5a626e', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{action.route}</div>
        </div>
        <button
          onClick={handleRun}
          disabled={status === 'running'}
          style={{
            height: 34, padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
            background: status === 'running' ? '#3a3a1f' : '#FCD535',
            color: status === 'running' ? '#707a8a' : '#181a20',
            border: 0, borderRadius: 6, cursor: status === 'running' ? 'default' : 'pointer',
            fontSize: 12, fontWeight: 600
          }}
        >
          <svg
            width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={status === 'running' ? { animation: 'spin 0.8s linear infinite' } : undefined}
          >
            <path d="M13.5 8A5.5 5.5 0 1 1 11.8 4.1"/>
            <path d="M13.5 2.5v3.2h-3.2"/>
          </svg>
          {status === 'running' ? 'Executando...' : 'Executar'}
        </button>
      </div>

      {message && (
        <div style={{
          fontSize: 12, padding: '8px 12px', borderRadius: 6,
          background: status === 'error' ? 'rgba(246,70,93,0.1)' : 'rgba(14,203,129,0.1)',
          border: '1px solid ' + (status === 'error' ? 'rgba(246,70,93,0.3)' : 'rgba(14,203,129,0.3)'),
          color: status === 'error' ? '#f6465d' : '#0ecb81'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default function Configuracoes() {
  return (
    <div style={{ padding: '24px 32px 48px', flex: 1 }}>
      <div style={{ fontSize: 12, color: '#707a8a', marginBottom: 16 }}>
        Rotinas e integrações executadas sob demanda.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ACTIONS.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
