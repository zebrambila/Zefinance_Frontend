---
description: "Task list template for feature implementation"
---

# Tasks: Sugestão do Último Provento Recebido

**Input**: Design documents from `/specs/001-sugestao-ultimo-provento/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Nenhuma suíte de testes automatizada existe neste repositório (Constituição,
Princípio IV) e o spec não solicitou TDD — as tarefas de verificação abaixo são manuais,
guiadas por `quickstart.md`, em vez de testes automatizados.

**Organization**: Tarefas agrupadas pelas User Stories do `spec.md` (US1, US2, US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story à qual a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto único de frontend: `src/` na raiz do repositório (ver `plan.md` → Project
Structure). Não há diretório `backend/`/`tests/` — o backend é o repositório irmão
`InvestmentPortfolio.Api` e este repositório não tem suíte de testes configurada.

---

## Phase 1: Setup

**Purpose**: Confirmar a linha de base antes de alterar o modal

- [ ] T001 Rodar `npm run dev` e abrir "Dividendos" → "Novo provento recebido" em
      `src/modals/DividendModal.jsx` para confirmar o comportamento atual (campos Ativo,
      Data de Pagamento, Valor Financeiro, Custodiante) antes de qualquer alteração,
      servindo de linha de base para comparação nas validações manuais das fases
      seguintes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura compartilhada por todas as User Stories — nenhuma pode
começar antes desta fase estar completa

**⚠️ CRITICAL**: Nenhuma implementação de User Story pode começar antes de T002

- [X] T002 Adicionar a função `getLastDividendForAsset(assetId)` em
      `src/api/dividends.js`, reusando `listDividends({ assetId, pageSize: 5,
      pageNumber: 1 })` (nenhum novo endpoint, nenhuma mudança de assinatura das funções
      existentes): a função MUST ordenar a lista retornada por `receiptDate`
      decrescente, usando a ordem de retorno da API como critério de desempate em caso
      de `receiptDate` iguais (o último da lista empatada vence, conforme `research.md`
      Decisão 1 e a Assumption do `spec.md`), e MUST resolver para `null` (nunca lançar)
      tanto quando a lista vier vazia quanto quando a chamada falhar, para que os
      chamadores não precisem de try/catch (`research.md` Decisão 3, FR-008)

**Checkpoint**: Com `getLastDividendForAsset` disponível, as User Stories 1–3 podem ser
implementadas (sequencialmente, pois todas editam o mesmo efeito em
`DividendModal.jsx`)

---

## Phase 3: User Story 1 - Ver sugestão ao selecionar um ativo com histórico (Priority: P1) 🎯 MVP

**Goal**: Ao selecionar, no formulário "Novo provento recebido", um ativo que já tem
proventos registrados, os campos Valor Financeiro e Custodiante são preenchidos
automaticamente com os dados do provento mais recente daquele ativo; Data de Pagamento
permanece com a data atual (não faz parte desta sugestão).

**Independent Test**: Abrir "Novo provento recebido", selecionar um ativo com histórico
de proventos e confirmar que Valor Financeiro e Custodiante são preenchidos com os dados
do provento mais recente, que Data de Pagamento permanece na data atual, e que todos os
campos continuam editáveis.

### Implementation for User Story 1

- [X] T003 [US1] Em `src/modals/DividendModal.jsx`, adicionar um novo `useEffect` com
      dependência em `[assetId, isEditing]` que, quando `assetId` não é vazio e
      `!isEditing`, chama `getLastDividendForAsset(assetId)` (de `src/api/dividends.js`)
      usando o mesmo padrão de guarda `cancelled` já usado no `useEffect` de
      `getDividend` (linhas ~29-45 do mesmo arquivo); quando a chamada resolve para um
      provento não nulo, preencher **apenas** `setAmount(String(d.totalFinancial))` e
      `setCustodian(d.custodian)` — o campo Data de Pagamento (`pay`) NUNCA é escrito por
      este efeito, pois seu valor sugerido é sempre a data atual, já garantida pelo
      estado inicial (`todayParam()`), independente do ativo (FR-002, FR-003, FR-004,
      FR-006); sem adicionar nenhum elemento visual novo (rótulo, cor, texto auxiliar)
      nos campos afetados, conforme a decisão de clarificação de 2026-10-10
- [ ] T004 [US1] Validar manualmente o Cenário 1 de
      `specs/001-sugestao-ultimo-provento/quickstart.md` (sugestão aparece e é
      atualizada ao trocar de ativo com histórico), confirmando contra a baseline de T001
      que nenhuma marcação visual foi introduzida

**Checkpoint**: User Story 1 funcional e testável de forma independente

---

## Phase 4: User Story 2 - Selecionar um ativo sem proventos anteriores (Priority: P2)

**Goal**: Ao selecionar um ativo sem histórico de proventos (ou ao trocar de um ativo com
histórico para um sem histórico), os campos do formulário voltam/permanecem em seus
valores padrão, sem sugestão e sem mensagem de erro.

**Independent Test**: Selecionar, na tela "Novo provento recebido", um ativo que nunca
recebeu proventos e confirmar que Valor Financeiro e Custodiante mantêm seus valores
padrão e Data de Pagamento permanece na data atual, sem erro exibido; repetir trocando de
um ativo com histórico para um sem histórico.

### Implementation for User Story 2

- [X] T005 [US2] No mesmo `useEffect` adicionado em T003
      (`src/modals/DividendModal.jsx`), tratar explicitamente o caso em que
      `getLastDividendForAsset` resolve para `null` (ativo sem histórico ou falha na
      busca): resetar **apenas** `setAmount('')` e `setCustodian('BTG')` — para garantir
      que uma sugestão aplicada para um ativo anterior seja limpa ao trocar para um ativo
      sem histórico; o campo Data de Pagamento não é tocado neste caso (FR-005, FR-008)
- [ ] T006 [US2] Validar manualmente o Cenário 2 de
      `specs/001-sugestao-ultimo-provento/quickstart.md` (ativo sem histórico não gera
      sugestão nem erro), incluindo o caso de troca de um ativo com histórico para um sem
      histórico

**Checkpoint**: User Stories 1 e 2 funcionando de forma independente

---

## Phase 5: User Story 3 - Sugestão não se aplica ao editar um provento existente (Priority: P3)

**Goal**: No fluxo de edição de um provento já registrado, os campos exibidos continuam
sendo os do próprio registro em edição, nunca os do último provento do ativo.

**Independent Test**: Abrir a edição de um provento já registrado de um ativo que também
tenha um provento mais recente, e confirmar que os campos exibidos são os do registro em
edição.

### Implementation for User Story 3

- [X] T007 [US3] Confirmar/ajustar, em `src/modals/DividendModal.jsx`, que a condição
      `!isEditing` no `useEffect` adicionado em T003 (e estendido em T005) impede
      qualquer chamada a `getLastDividendForAsset` quando `isEditing === true`, e que o
      `useEffect` existente de `getDividend` (que preenche os campos com os dados do
      provento em edição) permanece como a única fonte de preenchimento nesse modo,
      sem nenhuma interferência do novo efeito (FR-007)
- [ ] T008 [US3] Validar manualmente o Cenário 3 de
      `specs/001-sugestao-ultimo-provento/quickstart.md` (edição de provento existente
      não é sobrescrita pela sugestão do último provento do ativo)

**Checkpoint**: Todas as User Stories (1–3) funcionando de forma independente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validações finais que cobrem o comportamento de falha (FR-008) e a
qualidade geral da alteração

- [ ] T009 [P] Validar manualmente o Cenário 4 de
      `specs/001-sugestao-ultimo-provento/quickstart.md` (falha na busca da sugestão não
      bloqueia o registro manual do provento)
- [X] T010 [P] Rodar `npm run lint` a partir da raiz do repositório e confirmar que
      permanece limpo (nenhum novo erro; avisos de `no-unused-vars` são aceitáveis),
      conforme a Constituição (Princípio IV / Fluxo de Desenvolvimento e Portões de
      Qualidade)
- [ ] T011 Executar os 4 cenários de
      `specs/001-sugestao-ultimo-provento/quickstart.md` em sequência como checklist
      final de aceitação da feature completa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as User
  Stories
- **User Stories (Phase 3–5)**: Todas dependem da conclusão da Fase Foundational. Diferente
  do caso geral, aqui as fases **não** podem ser paralelizadas entre si: US1 (T003),
  US2 (T005) e US3 (T007) editam sequencialmente o mesmo `useEffect` no mesmo arquivo
  (`src/modals/DividendModal.jsx`), então devem ser implementadas em ordem de
  prioridade (P1 → P2 → P3)
- **Polish (Phase 6)**: Depende da conclusão das User Stories 1–3

### User Story Dependencies

- **User Story 1 (P1)**: Depende apenas da Fase Foundational (T002)
- **User Story 2 (P2)**: Depende da Fase Foundational (T002) e estende o código
  introduzido por T003 (US1) no mesmo arquivo
- **User Story 3 (P3)**: Depende da Fase Foundational (T002) e estende o código
  introduzido por T003/T005 (US1/US2) no mesmo arquivo

### Parallel Opportunities

- T009 e T010 (Fase Polish) são independentes entre si e podem ser executadas em
  paralelo
- Não há tarefas `[P]` dentro das Fases 2–5: o Foundational tem uma única tarefa, e as
  três User Stories editam o mesmo arquivo/efeito em sequência, impedindo paralelismo
  real entre elas

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup (T001)
2. Completar Fase 2: Foundational (T002 — bloqueia todas as stories)
3. Completar Fase 3: User Story 1 (T003–T004)
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente
5. Já entrega valor: sugestão funcionando para ativos com histórico

### Incremental Delivery

1. Setup + Foundational → base pronta (T001–T002)
2. Adicionar User Story 1 → validar independentemente (T003–T004) → MVP
3. Adicionar User Story 2 → validar independentemente (T005–T006)
4. Adicionar User Story 3 → validar independentemente (T007–T008)
5. Polish (T009–T011) → `npm run lint` limpo + checklist final de aceitação

---

## Notes

- Esta feature é pequena e contida a dois arquivos (`src/api/dividends.js` e
  `src/modals/DividendModal.jsx`); por isso as User Stories, embora independentemente
  testáveis em comportamento, não são implementáveis em paralelo por pessoas diferentes
  sem conflito de merge no mesmo `useEffect`.
- Nenhum teste automatizado foi incluído — este repositório não tem suíte configurada
  (Constituição, Princípio IV) e o `spec.md` não solicitou TDD; a verificação é manual via
  `quickstart.md`.
- Commitar após cada tarefa ou grupo lógico de tarefas.
- Parar em cada checkpoint para validar a story isoladamente antes de avançar.
