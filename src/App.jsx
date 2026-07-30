import { useState, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ativos from './pages/Ativos.jsx';
import Dividendos from './pages/Dividendos.jsx';
import Transacoes from './pages/Transacoes.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import TransactionModal from './modals/TransactionModal.jsx';
import AssetModal from './modals/AssetModal.jsx';
import DividendModal from './modals/DividendModal.jsx';

const titles = {
  dashboard:  { eyebrow: 'PANORAMA',  title: 'Dashboard' },
  ativos:     { eyebrow: 'CARTEIRA',  title: 'Ativos em custódia' },
  dividendos: { eyebrow: 'PROVENTOS', title: 'Dividendos recebidos' },
  transacoes: { eyebrow: 'OPERAÇÕES', title: 'Transações' },
  configuracoes: { eyebrow: 'SISTEMA', title: 'Configurações' },
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [modalKind, setModalKind] = useState(null); // 'transaction' | 'asset' | 'dividend' | null
  const [toast, setToast] = useState({ id: 0, msg: '' });
  const [period, setPeriod] = useState('1M'); // '1M' | '3M' | '6M' | '12M' | 'YTD' | null
  const [month, setMonth] = useState(null); // 'YYYY-MM' | null — closed-month filter, mutually exclusive with period
  const [assetsRefreshKey, setAssetsRefreshKey] = useState(0);
  const [dividendsRefreshKey, setDividendsRefreshKey] = useState(0);
  const flashTimer = useRef(null);

  const handlePeriodChange = (p) => {
    setMonth(null);
    setPeriod(p);
  };

  const handleMonthChange = (m) => {
    setPeriod(null);
    setMonth(m);
  };

  const closeModal = () => setModalKind(null);

  const flashAndClose = (msg, targetPage) => {
    setModalKind(null);
    if (targetPage) setPage(targetPage);
    setToast((t) => ({ id: t.id + 1, msg }));
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setToast((t) => ({ ...t, id: 0 })), 3200);
  };

  const topbarByPage = {
    dashboard:      { label: 'Novo lançamento', onClick: () => setModalKind('transaction') },
    transacoes:     { label: 'Nova transação',  onClick: () => setModalKind('transaction') },
    ativos:         { label: 'Novo ativo',      onClick: () => setModalKind('asset') },
    dividendos:     { label: 'Novo provento',   onClick: () => setModalKind('dividend') },
    configuracoes:  { label: null,              onClick: null },
  };
  const topbar = topbarByPage[page] || topbarByPage.dashboard;
  const t = titles[page] || titles.dashboard;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0e11', color: '#eaecef', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Sidebar page={page} onNavigate={setPage} />

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          eyebrow={t.eyebrow} title={t.title} topbarLabel={topbar.label} onTopbarClick={topbar.onClick}
          period={period} onPeriodChange={handlePeriodChange}
          month={month} onMonthChange={handleMonthChange}
          showPeriodFilters={page !== 'dashboard' && page !== 'configuracoes'}
        />

        {page === 'dashboard'      && <Dashboard />}
        {page === 'ativos'         && <Ativos refreshKey={assetsRefreshKey} />}
        {page === 'dividendos'     && <Dividendos refreshKey={dividendsRefreshKey} period={period} month={month} />}
        {page === 'transacoes'     && <Transacoes period={period} month={month} />}
        {page === 'configuracoes'  && <Configuracoes />}
      </main>

      {modalKind === 'transaction' && <TransactionModal onClose={closeModal} onSubmit={() => flashAndClose('Transação registrada', 'transacoes')} />}
      {modalKind === 'asset'       && <AssetModal       onClose={closeModal} onSubmit={() => { setAssetsRefreshKey((k) => k + 1); flashAndClose('Ativo cadastrado na carteira', 'ativos'); }} />}
      {modalKind === 'dividend'    && <DividendModal    onClose={closeModal} onSubmit={() => { setDividendsRefreshKey((k) => k + 1); flashAndClose('Provento registrado', 'dividendos'); }} />}

      {toast.id > 0 && <Toast msg={toast.msg} />}
    </div>
  );
}
