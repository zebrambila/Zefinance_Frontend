# Implementation Plan: Sugestão do Último Provento Recebido

**Branch**: `001-sugestao-ultimo-provento` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-sugestao-ultimo-provento/spec.md`

## Summary

Ao abrir "Novo provento recebido" e selecionar um ativo, o formulário deve pré-preencher
a Data de Pagamento com a data atual (independente do ativo), e o Valor Financeiro e o
Custodiante com os dados do provento mais recente já registrado para aquele ativo (sem
nenhuma marcação visual de "sugestão" — campos ficam indistinguíveis de um preenchimento
manual, por decisão da clarificação). Abordagem técnica: reusar o endpoint existente
`listDividends` (`GET v1/dividends/GetAllDividends`) filtrado por `assetId`, selecionar o
registro mais recente no cliente (já que o ordenamento padrão do backend não é
documentado) apenas para derivar Valor Financeiro/Custodiante, e aplicar o mesmo padrão
de `useEffect` + `cancelled` flag já usado em `DividendModal.jsx` — sem endpoint novo, sem
dependência nova.

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 18, Vite 5

**Primary Dependencies**: `react`/`react-dom` apenas (já existentes); nenhuma dependência
nova — reaproveita `listDividends` de `src/api/dividends.js`

**Storage**: N/A — este repositório não tem banco de dados próprio; dados vêm do backend
`.NET` via `src/api/client.js`

**Testing**: Nenhuma suíte automatizada configurada neste repositório (ver Constituição,
Princípio IV); validação via `npm run lint` e teste manual guiado por `quickstart.md`

**Target Platform**: Navegador web (SPA Vite), mesmo alvo do restante da aplicação

**Project Type**: Aplicação web single-page (frontend único, sem backend neste repo)

**Performance Goals**: Nenhuma meta específica — uma chamada adicional leve ao backend por
troca de ativo, mesma ordem de grandeza das chamadas já existentes no modal (`listAssets`)

**Constraints**: Deve seguir os padrões já estabelecidos (Constituição, Princípio II):
busca de dados local ao componente via `useState`/`useEffect` com guarda `cancelled`,
estilização 100% inline, sem novo estado global

**Scale/Scope**: Alteração isolada a `src/modals/DividendModal.jsx` (e, se necessário, um
helper em `src/api/dividends.js`); nenhum novo endpoint, nenhuma nova página

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Compatibilidade de API | Reusa `listDividends` (`GET v1/dividends/GetAllDividends`) exatamente como documentado em `src/api/dividends.js`; nenhuma mudança de rota, formato de requisição/resposta ou enum | PASS |
| II. Respeitar os Limites de Serviço Existentes | Segue o padrão per-componente de `useState`/`useEffect` já usado em `DividendModal.jsx`/`Ativos.jsx`; nenhum roteador, estado global, cache de query ou nova metodologia de CSS introduzidos | PASS |
| III. Disciplina de Rollback de Migração | Não aplicável — nenhuma migração de banco de dados envolvida nesta feature | N/A |
| IV. Suítes de Teste Estabelecidas Devem Passar | Nenhuma suíte automatizada existe hoje; `npm run lint` MUST permanecer limpo | PASS (pendente de execução ao final da implementação) |

Nenhuma violação identificada — **Complexity Tracking não se aplica**.

## Project Structure

### Documentation (this feature)

```text
specs/001-sugestao-ultimo-provento/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── suggestion-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── dividends.js         # possível helper getLastDividendForAsset (reusa listDividends)
├── modals/
│   └── DividendModal.jsx    # ponto principal de alteração: preenche sugestão ao selecionar ativo
└── pages/
    └── Dividendos.jsx       # consumidor do modal; nenhuma alteração funcional esperada
```

**Structure Decision**: Projeto único de frontend (sem diretório `backend/` neste repo — o
backend é o repositório irmão `InvestmentPortfolio.Api`). A alteração fica contida em
`src/modals/DividendModal.jsx`, reaproveitando `src/api/dividends.js`, seguindo a
estrutura já existente (Option 1 adaptada: não há `models/`, `services/`, `cli/` neste
projeto — a árvore real é `src/{api,modals,pages,components,lib}`).

## Complexity Tracking

*Não aplicável — nenhuma violação do Constitution Check.*
