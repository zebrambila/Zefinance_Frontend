// Sample portfolio data — swap for API calls in production.

export const monthLabels = ['Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun'];
export const investedByMonth = [240,252,264,276,288,300,312,322,332,340,348,356]; // thousands
export const marketByMonth   = [248,262,275,290,303,318,335,348,362,375,386,397];
export const dividendsByMonth = [1840,2120,2580,2240,2980,3120,2740,2860,3420,3680,3520,3847];

export const rawAssets = [
  { ticker: 'PETR4',   name: 'Petrobras PN',        cls: 'Ações',         qty: 600,  avg: 32.45,  price: 38.92 },
  { ticker: 'ITUB4',   name: 'Itaú Unibanco PN',    cls: 'Ações',         qty: 900,  avg: 28.10,  price: 33.47 },
  { ticker: 'VALE3',   name: 'Vale ON',             cls: 'Ações',         qty: 500,  avg: 62.80,  price: 58.15 },
  { ticker: 'BBSE3',   name: 'BB Seguridade ON',    cls: 'Ações',         qty: 700,  avg: 31.20,  price: 38.74 },
  { ticker: 'TAEE11',  name: 'Taesa UNT',           cls: 'Ações',         qty: 800,  avg: 33.50,  price: 35.62 },
  { ticker: 'HGLG11',  name: 'CSHG Logística',      cls: 'FII',           qty: 280,  avg: 158.40, price: 172.30 },
  { ticker: 'MXRF11',  name: 'Maxi Renda',          cls: 'FII',           qty: 3000, avg: 10.10,  price: 10.34 },
  { ticker: 'KNRI11',  name: 'Kinea Renda Imob.',   cls: 'FII',           qty: 220,  avg: 142.60, price: 148.20 },
  { ticker: 'IVVB11',  name: 'iShares S&P 500',     cls: 'Internacional', qty: 140,  avg: 280.40, price: 318.90 },
  { ticker: 'TESOURO', displayTicker: 'TES IPCA+35', name: 'Tesouro IPCA+ 2035', cls: 'Renda fixa', qty: 2, avg: 42850, price: 51230 },
];

export const rawDividends = [
  { date: '15/06/2025', ticker: 'TAEE11', name: 'Taesa',           type: 'Dividendo',  qty: '800',   perShare: 'R$ 0,61', total: 'R$ 488,00' },
  { date: '12/06/2025', ticker: 'HGLG11', name: 'CSHG Logística',  type: 'Rendimento', qty: '280',   perShare: 'R$ 1,10', total: 'R$ 308,00' },
  { date: '10/06/2025', ticker: 'MXRF11', name: 'Maxi Renda',      type: 'Rendimento', qty: '3.000', perShare: 'R$ 0,10', total: 'R$ 300,00' },
  { date: '02/06/2025', ticker: 'ITUB4',  name: 'Itaú Unibanco',   type: 'JCP',        qty: '900',   perShare: 'R$ 0,36', total: 'R$ 324,00' },
  { date: '28/05/2025', ticker: 'BBSE3',  name: 'BB Seguridade',   type: 'Dividendo',  qty: '700',   perShare: 'R$ 1,28', total: 'R$ 896,00' },
  { date: '22/05/2025', ticker: 'KNRI11', name: 'Kinea Renda',     type: 'Rendimento', qty: '220',   perShare: 'R$ 1,02', total: 'R$ 224,40' },
  { date: '15/05/2025', ticker: 'PETR4',  name: 'Petrobras',       type: 'Dividendo',  qty: '600',   perShare: 'R$ 0,72', total: 'R$ 432,00' },
  { date: '10/05/2025', ticker: 'HGLG11', name: 'CSHG Logística',  type: 'Rendimento', qty: '280',   perShare: 'R$ 1,12', total: 'R$ 313,60' },
  { date: '03/05/2025', ticker: 'TAEE11', name: 'Taesa',           type: 'JCP',        qty: '800',   perShare: 'R$ 0,48', total: 'R$ 384,00' },
  { date: '28/04/2025', ticker: 'VALE3',  name: 'Vale',            type: 'Dividendo',  qty: '500',   perShare: 'R$ 1,15', total: 'R$ 575,00' },
];

export const rawTransactions = [
  { date: '20/06/2025', side: 'Compra', ticker: 'PETR4',  name: 'Petrobras',       qty: '50',  price: 'R$ 38,45',  total: 'R$ 1.922,50', fee: 'R$ 1,42', broker: 'XP' },
  { date: '20/06/2025', side: 'Compra', ticker: 'ITUB4',  name: 'Itaú Unibanco',   qty: '60',  price: 'R$ 33,18',  total: 'R$ 1.990,80', fee: 'R$ 1,48', broker: 'XP' },
  { date: '18/06/2025', side: 'Venda',  ticker: 'MGLU3',  name: 'Magazine Luiza',  qty: '100', price: 'R$ 4,82',   total: 'R$ 482,00',   fee: 'R$ 0,38', broker: 'Rico' },
  { date: '12/06/2025', side: 'Compra', ticker: 'HGLG11', name: 'CSHG Logística',  qty: '8',   price: 'R$ 171,90', total: 'R$ 1.375,20', fee: 'R$ 1,02', broker: 'XP' },
  { date: '10/06/2025', side: 'Compra', ticker: 'IVVB11', name: 'iShares S&P 500', qty: '6',   price: 'R$ 318,40', total: 'R$ 1.910,40', fee: 'R$ 1,42', broker: 'Avenue' },
  { date: '08/06/2025', side: 'Compra', ticker: 'MXRF11', name: 'Maxi Renda',      qty: '120', price: 'R$ 10,31',  total: 'R$ 1.237,20', fee: 'R$ 0,92', broker: 'XP' },
  { date: '05/06/2025', side: 'Compra', ticker: 'TAEE11', name: 'Taesa',           qty: '40',  price: 'R$ 35,45',  total: 'R$ 1.418,00', fee: 'R$ 1,05', broker: 'XP' },
  { date: '02/06/2025', side: 'Compra', ticker: 'BBSE3',  name: 'BB Seguridade',   qty: '32',  price: 'R$ 38,60',  total: 'R$ 1.235,20', fee: 'R$ 0,92', broker: 'Rico' },
  { date: '25/05/2025', side: 'Compra', ticker: 'KNRI11', name: 'Kinea Renda',     qty: '5',   price: 'R$ 147,80', total: 'R$ 739,00',   fee: 'R$ 0,55', broker: 'XP' },
];

export const tickerPalette = {
  PETR4:  '#26b07a', ITUB4:  '#ec7a08', VALE3:  '#6b8a2e', BBSE3:  '#fdd000',
  TAEE11: '#0066b3', HGLG11: '#7a3fa5', MXRF11: '#e3565c', KNRI11: '#1d6f88',
  IVVB11: '#000000', TESOURO:'#0a4f88', MGLU3:  '#f6465d',
};

export const initialOf = (tk) => (tk.length > 5 ? tk.slice(0, 3) : tk.slice(0, 2));
export const colorOf   = (tk) => tickerPalette[tk] || '#2b3139';

export const dividendTypeStyles = {
  Dividendo:  { bg: 'rgba(252,213,53,0.15)',  color: '#FCD535' },
  JCP:        { bg: 'rgba(110,138,255,0.15)', color: '#8ea3ff' },
  Rendimento: { bg: 'rgba(45,189,182,0.15)',  color: '#2dbdb6' },
};

export const suggestionsTickers = ['PETR4','ITUB4','VALE3','HGLG11','MXRF11','TAEE11','BBSE3','KNRI11'];
