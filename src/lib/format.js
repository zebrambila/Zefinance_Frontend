// Formatters shared across the app.
export const fmtBRL = (n) =>
  'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n) => n.toLocaleString('pt-BR');

export const fmtPct = (n) =>
  (n >= 0 ? '+' : '') +
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  '%';

export const fmtKShort = (n) => 'R$' + (n / 1000).toFixed(1) + 'k';

export const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;

// Accepts 'YYYY-MM-DD' or 'DD/MM/YYYY' and returns 'YYYY-MM-DD', or null if unparseable.
export const parseDateFlexible = (v) => {
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};
