# ZeFinance

Protótipo em React + Vite de um sistema de controle financeiro pessoal — patrimônio, ativos, dividendos e transações.

## Como rodar

```bash
npm install
npm run dev
```

O projeto abre em `http://localhost:5173`.

## Scripts

- `npm run dev`     — dev server com HMR
- `npm run build`   — build de produção em `dist/`
- `npm run preview` — serve o build local

## Estrutura

```
src/
├── main.jsx              # entrypoint React
├── App.jsx               # roteamento por estado (page) + orquestração de modais/toast
├── index.css             # reset + fontes + scrollbar (o resto é inline styles)
├── data/
│   └── mock.js           # dados de portfólio (ativos, dividendos, transações, séries mensais)
├── lib/
│   └── format.js         # fmtBRL, fmtNum, fmtPct, parseNum
├── components/
│   ├── Sidebar.jsx       # navegação lateral fixa
│   ├── Topbar.jsx        # cabeçalho com KPIs de contexto + botão "Novo"
│   ├── Toast.jsx         # notificação de sucesso
│   ├── KpiCard.jsx       # cartão de KPI reutilizável
│   └── ModalShell.jsx    # shell + helpers compartilhados (Label, inputs, botões)
├── pages/
│   ├── Dashboard.jsx     # one-page com 4 KPIs + 3 gráficos
│   ├── Ativos.jsx        # tabela de posições em custódia
│   ├── Dividendos.jsx    # extrato de proventos
│   └── Transacoes.jsx    # registro de compras/vendas
└── modals/
    ├── TransactionModal.jsx  # nova compra/venda
    ├── AssetModal.jsx        # cadastro de novo ativo
    └── DividendModal.jsx     # registro de novo provento
```

## Convenções

- **Estilos**: inline (`style={{...}}`) — sem CSS Modules, sem Tailwind. Facilita colar/mover peças e mantém 1:1 com o protótipo HTML.
- **Estado**: local por componente com `useState`. `App.jsx` orquestra página ativa, kind de modal aberto, e toast.
- **Fontes**: Inter (UI), JetBrains Mono (números tabulares) — carregadas via Google Fonts no `index.html`.
- **Paleta**: dark trading — canvas `#0b0e11`, surface `#1e2329`, régua `#2b3139`; amarelo `#FCD535` como acento único; `#0ecb81` positivo, `#f6465d` negativo.

## O que substituir para produção

- `src/data/mock.js` → chamadas HTTP para uma API de portfólio (B3, corretora, backend próprio).
- Os handlers dos modais (`onSubmit`) só disparam o toast — plugue em `POST /transactions`, `POST /assets`, `POST /dividends`.
- Substituir estado por-página em `App.jsx` por React Router se quiser URLs reais.
- Os gráficos são feitos com CSS puro (barras de `div` com altura em %, donut com `conic-gradient`) — troque por Recharts / Victory / uPlot se precisar de interatividade real.

## Requisitos

- Node 18+ (Vite 6 exige)
- npm 9+
