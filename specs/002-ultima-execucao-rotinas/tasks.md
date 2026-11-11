---

description: "Lista de tarefas: Última Execução das Rotinas de Configuração"
---

# Tasks: Última Execução das Rotinas de Configuração

**Input**: Documentos de design em `/specs/002-ultima-execucao-rotinas/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/routines-api.md](./contracts/routines-api.md), [quickstart.md](./quickstart.md)

**Tests**: Não há suíte no front (só `npm run lint`). No backend, testes MSTest são **obrigatórios** (plan.md / Constituição, Princípio IV) e estão incluídos abaixo.

**Organization**: Tarefas agrupadas por user story. Trabalho **cross-repo**: `BACK` = `../InvestmentPortfolio/src/...` (repo irmão, .NET 10); `FRONT` = este repo (`zefinance-react`). Caminhos de backend são relativos a `../InvestmentPortfolio/src/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 = ver a última execução; US2 = registro automático ao executar

> **Escopo da implementação (2026-11-10)**: por decisão do usuário, apenas o FRONT foi
> alterado; o backend já estava pronto em `../InvestmentPortfolio-develop` (commit
> "Last execution jobs") com contrato **diferente do planejado**: `GET v1/assets/sync-status`
> → `{ syncPrices, backfillPrices }`, cada um `{ executedAt, success, message } | null`, e
> falhas também são registradas (`success:false`). Tarefas `[BACK]` (T001, T003–T015, T021–T025,
> T029) ficam fora desta entrega e **não foram executadas aqui**. T016/T017 foram adaptadas:
> `getSyncStatus` foi para `src/api/assets.js` (já reexportado por `index.js`), sem `routines.js`.
> T020/T027/T028 dependem de validação manual na UI com o backend no ar (pendente).

## Phase 1: Setup

**Purpose**: Preparar os dois repositórios e conferir a linha de base

- [ ] T001 [BACK] Em `../InvestmentPortfolio` (hoje na branch `main`), criar a branch `002-ultima-execucao-rotinas` e rodar `dotnet test src/InvestmentPortfolio.Tests/InvestmentPortfolio.Tests.csproj` para confirmar que a linha de base está verde antes de qualquer alteração
- [X] T002 [P] [FRONT] Rodar `npm run lint` na raiz deste repo e anotar os avisos pré-existentes (para distinguir de novos problemas ao final)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entidade, tabela e migração no backend, necessárias para ambas as stories

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase

- [ ] T003 [P] [BACK] Criar `InvestmentPortfolio.Core/Entities/RoutineExecution.cs` seguindo o estilo de `AssetPriceHistory` (`private set`, construtor privado vazio para o EF + construtor público, método `MarkExecuted(DateTime executedAtUtc)`): `Id` Guid (PK, gerado na criação), `RoutineKey` string "Obrigatório, **único**, máx. 64", `LastExecutedAt` DateTime "Obrigatório; gravado em UTC". Sem herdar de `AuditableEntity`, sem soft-delete
- [ ] T004 [P] [BACK] Criar `InvestmentPortfolio.Core/Entities/RoutineKeys.cs`: classe estática com constantes `SyncPrices = "sync-prices"` e `BackfillPrices = "backfill-prices"` (valores iniciais de `RoutineKey` — devem coincidir com os `id` de `ACTIONS` em `src/pages/Configuracoes.jsx`)
- [ ] T005 [P] [BACK] Criar `InvestmentPortfolio.Core/Responses/Routines/RoutineExecutionResponse.cs`: record com `string RoutineKey` e `DateTime LastExecutedAt` (serializa como `routineKey` / `lastExecutedAt`, conforme [contracts/routines-api.md](./contracts/routines-api.md))
- [ ] T006 [P] [BACK] Criar `InvestmentPortfolio.Infra/Data/Mappings/RoutineExecutionMapping.cs` (`IEntityTypeConfiguration<RoutineExecution>`, estilo de `AssetPriceHistoryMapping`): tabela `RoutineExecutions`; PK `Id`; `RoutineKey` required, `HasMaxLength(64)`, índice **único**; `LastExecutedAt` required, `HasColumnType("timestamp with time zone")`
- [ ] T007 [BACK] Em `InvestmentPortfolio.Infra/Data/InvestmentContext.cs`, adicionar `public DbSet<RoutineExecution> RoutineExecutions { get; set; } = null!;` (o mapping é descoberto por `ApplyConfigurationsFromAssembly`). Depende de T003 e T006
- [ ] T008 [BACK] Gerar a migração `AddRoutineExecutions`: `dotnet ef migrations add AddRoutineExecutions --project src/InvestmentPortfolio.Infra --startup-project src/InvestmentPortfolio.Api` (a partir da raiz de `../InvestmentPortfolio`). Conferir que `Up()` cria a tabela + índice único em `RoutineKey` e que `Down()` remove a tabela (e o índice); então aplicar com `dotnet ef database update`. Depende de T007
- [ ] T009 [BACK] **Testar o rollback (Constituição, Princípio III)**: `dotnet ef database update AddAssetPriceHistory ...` → confirmar que `RoutineExecutions` sumiu → reaplicar `dotnet ef database update ...` e confirmar que voltou. Anotar o plano de rollback para a descrição do PR do backend. Depende de T008

**Checkpoint**: tabela `RoutineExecutions` existe e é reversível — as stories podem começar

---

## Phase 3: User Story 1 - Ver quando cada rotina foi executada pela última vez (Priority: P1) 🎯 MVP

**Goal**: A tela de Configurações mostra, em cada cartão, "Última execução: DD/MM/AAAA HH:MM" (fuso local) ou "Nunca executada", carregando do servidor.

**Independent Test**: Inserir manualmente uma linha em `RoutineExecutions` (ex.: `sync-prices`, data conhecida) e abrir Configurações: o cartão de cotações mostra a data no horário local e o de histórico mostra "Nunca executada". Derrubar a API e recarregar: o cartão informa a falha e o botão "Executar" segue habilitado (quickstart cenários 1 e 7).

### Tests for User Story 1

- [ ] T010 [P] [US1] [BACK] Criar `InvestmentPortfolio.Tests/Handlers/RoutineHandlerTests.cs` (MSTest, `InvestmentContextFake.Create()`, nomes `Dado_..._Quando_..._Entao_...`): (a) sem registros → `Code` 200 e `Data` lista vazia; (b) com `sync-prices` e `backfill-prices` gravados → lista com as duas chaves e suas datas. Escrever antes de T011 e ver falhar

### Implementation for User Story 1

- [ ] T011 [P] [US1] [BACK] Criar `InvestmentPortfolio.Core/Handlers/IRoutineHandler.cs` com `Task<Response<List<RoutineExecutionResponse>?>> GetLastExecutionsAsync(CancellationToken ct = default);`
- [ ] T012 [US1] [BACK] Criar `InvestmentPortfolio.Api/Handlers/RoutineHandler.cs` implementando `IRoutineHandler`: lê `context.RoutineExecutions` (`AsNoTracking`), projeta para `RoutineExecutionResponse`, retorna `Response` 200; envolver em try/catch e devolver 500 com mensagem em português ("Erro ao consultar a última execução das rotinas") conforme convenção dos handlers. Depende de T011
- [ ] T013 [US1] [BACK] Registrar `builder.Services.AddScoped<IRoutineHandler, RoutineHandler>();` em `InvestmentPortfolio.Api/Extensions/BuilderExtension.cs` (junto dos demais handlers em `AddHandlers`). Depende de T012
- [ ] T014 [US1] [BACK] Criar `InvestmentPortfolio.Api/Endpoints/Routines/GetLastExecutionsEndpoint.cs` (`Map(WebApplication app)`, rota `GET v1/routines/GetLastExecutions`, mesmo padrão de `SyncAssetPricesEndpoint`: `result.IsSuccess ? Results.Ok(result) : Results.StatusCode(result.Code)`, `.WithName/.WithTags("Routines")/.WithSummary/.Produces<Response<List<RoutineExecutionResponse>>>`) e registrar `GetLastExecutionsEndpoint.Map(app);` em `InvestmentPortfolio.Api/Program.cs` sob um novo bloco `// Routines`. Depende de T013
- [ ] T015 [US1] [BACK] Rodar `dotnet test` em `../InvestmentPortfolio` — T010 deve passar e nada pré-existente pode quebrar
- [X] T016 [P] [US1] [FRONT] Criar `src/api/routines.js` (named exports, sem default): comentário de contrato exatamente como em [contracts/routines-api.md](./contracts/routines-api.md); `export const ERoutine = { SyncPrices: 'sync-prices', BackfillPrices: 'backfill-prices' };` e `export const getRoutineExecutions = () => apiGet('routines/GetLastExecutions');` (importando `apiGet` de `./client`)
- [X] T017 [US1] [FRONT] Adicionar `export * from './routines';` em `src/api/index.js`. Depende de T016
- [X] T018 [P] [US1] [FRONT] Adicionar `fmtDateTime` em `src/lib/format.js`: recebe string ISO 8601 UTC, retorna `DD/MM/AAAA HH:MM` no fuso local via `new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })` (named export, sem vírgula entre data e hora — ajustar o resultado de `toLocaleString` se necessário para o formato exato `DD/MM/AAAA HH:MM`)
- [X] T019 [US1] [FRONT] Em `src/pages/Configuracoes.jsx`: (1) usar `ERoutine` nos `id` de `ACTIONS` (`ERoutine.SyncPrices`, `ERoutine.BackfillPrices`) em vez de literais; (2) em `Configuracoes`, adicionar `useState` para `executions` (mapa `routineKey → lastExecutedAt`), `loading`, `error` e `refreshKey`, com `useEffect` que chama `getRoutineExecutions()`, guarda `cancelled`, try/catch/finally com `setError(err.message || 'Falha ao carregar a última execução.')` (padrão de `Ativos.jsx`), dependendo de `[refreshKey]`; (3) passar `lastExecutedAt`, `loading` e `loadError` para cada `ActionCard`; (4) no `ActionCard`, renderizar abaixo da linha `route`, em JetBrains Mono tamanho 11 (estilo inline da linha `route`), na ordem fixa loading → error → vazio → dados: `Carregando última execução...` → `Não foi possível carregar a última execução.` (cor `#f6465d`) → `Nunca executada` → `Última execução: ${fmtDateTime(lastExecutedAt)}`. Nenhuma lib nova; botão "Executar" não depende do estado da busca (FR-009). Depende de T017 e T018
- [ ] T020 [US1] [FRONT] Rodar `npm run lint` (sem novos erros) e validar manualmente os cenários 1 e 7 do [quickstart.md](./quickstart.md), semeando uma linha em `RoutineExecutions` para o cenário de data exibida

**Checkpoint**: US1 funcional e testável sozinha (exibição do que estiver gravado)

---

## Phase 4: User Story 2 - Registro atualizado automaticamente após executar (Priority: P1)

**Goal**: Ao concluir uma rotina, o servidor grava a data/hora e o cartão atualiza na hora; falha total não sobrescreve; falha parcial sobrescreve.

**Independent Test**: Executar "Sincronizar cotações" e ver o cartão mudar para a data/hora atual sem recarregar; recarregar e abrir em outro navegador e ver a mesma data; derrubar o Yahoo Finance/API e ver que a data anterior permanece (quickstart cenários 2–6).

### Tests for User Story 2

- [ ] T021 [P] [US2] [BACK] Em `InvestmentPortfolio.Tests/Handlers/AssetHandlerTests.cs` (reusar `InvestmentContextFake`, `MarketDataServiceFake`, `AssetPriceHistoryServiceFake`; ajustar os fakes se faltar controle do resultado), adicionar testes para as regras de [data-model.md](./data-model.md): Sync — (a) ≥ 1 ativo atualizado grava `sync-prices`; (b) sem ativos cadastrados grava; (c) há ativos e 0 atualizados **não** grava; (d) segunda execução sobrescreve `LastExecutedAt` mantendo uma única linha. Backfill — (e) sem falhas grava `backfill-prices`; (f) falha parcial (≥ 1 processado) grava; (g) só falhas (0 processados) não grava; (h) execuções das duas rotinas não alteram a linha uma da outra (FR-003). Escrever antes de T022–T024 e ver falhar

### Implementation for User Story 2

- [ ] T022 [US2] [BACK] Em `InvestmentPortfolio.Api/Handlers/AssetHandler.cs`, adicionar método privado `RecordRoutineExecutionAsync(string routineKey, CancellationToken ct)`: busca `RoutineExecutions` pela chave; se existir chama `MarkExecuted(DateTime.UtcNow)`, senão adiciona nova `RoutineExecution`; `SaveChangesAsync`. **Best-effort**: `try/catch` próprio que engole a exceção, sem alterar o resultado da rotina ([research.md](./research.md) D4)
- [ ] T023 [US2] [BACK] Em `SyncPricesAsync` (`AssetHandler.cs`), chamar `RecordRoutineExecutionAsync(RoutineKeys.SyncPrices, ct)` antes de retornar sucesso quando: não há ativos cadastrados (retorno "Nenhum ativo cadastrado") **ou** `updated > 0`. NÃO chamar quando há ativos e `updated == 0`, nem no `catch` (500). A resposta `Response<int>` permanece inalterada. Depende de T022
- [ ] T024 [US2] [BACK] Em `BackfillPricesAsync` (`AssetHandler.cs`), chamar `RecordRoutineExecutionAsync(RoutineKeys.BackfillPrices, ct)` quando `result.Failed.Count == 0` **ou** `result.Processed.Count > 0`. NÃO chamar quando só há falhas (`Processed.Count == 0` e `Failed.Count > 0`), nem no `catch` (500). Resposta inalterada. Depende de T022
- [ ] T025 [US2] [BACK] Rodar `dotnet test` em `../InvestmentPortfolio` — T021 deve passar e nada pré-existente pode quebrar. Depende de T023 e T024
- [X] T026 [US2] [FRONT] Em `src/pages/Configuracoes.jsx`: passar a cada `ActionCard` um callback `onExecuted` que faz `setRefreshKey((k) => k + 1)` na página; no `handleRun` do `ActionCard`, chamar `onExecuted()` **somente** após `setStatus('done')` (caminho de sucesso); no `catch` NÃO chamar (a data anterior permanece — FR-008). Garantir que a mensagem de resultado e o resumo de falhas parciais do backfill continuam sendo exibidos como hoje. Depende de T019
- [ ] T027 [US2] [FRONT] Rodar `npm run lint` e validar manualmente os cenários 2–6 e 8 do [quickstart.md](./quickstart.md) (execução atualiza o cartão ≤ 1 min, persistência entre navegadores, independência entre rotinas, falha total mantém data, falha parcial atualiza, fuso local)

**Checkpoint**: US1 e US2 funcionam juntas — feature completa

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T028 Rodar o [quickstart.md](./quickstart.md) completo, incluindo a seção 4 (rollback) com o código final
- [ ] T029 [P] [BACK] Redigir a descrição do PR do backend incluindo **explicitamente o plano de rollback da migração** `AddRoutineExecutions` (`dotnet ef database update AddAssetPriceHistory` + reverter o código), conforme Fluxo de Qualidade da Constituição
- [X] T030 [P] [FRONT] Conferir que `src/api/routines.js` e o contrato em `contracts/routines-api.md` ainda batem com o endpoint real implementado no backend (Princípio I); corrigir o comentário se divergirem
- [ ] T031 Execução final: `npm run lint` (sem novos erros em relação a T002) e `dotnet test` verde no backend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências
- **Foundational (Fase 2)**: depende da Fase 1 — BLOQUEIA as stories (T007 ← T003+T006; T008 ← T007; T009 ← T008)
- **US1 (Fase 3)**: depende da Fase 2
- **US2 (Fase 4)**: depende da Fase 2; backend (T021–T025) independe da US1, mas o front (T026) edita o mesmo `Configuracoes.jsx` e depende de T019
- **Polish (Fase 5)**: depende das stories desejadas

### Dentro de cada story

- Testes backend antes da implementação (devem falhar primeiro)
- Interface → handler → registro DI → endpoint (US1 backend)
- `routines.js` → `index.js` → `Configuracoes.jsx` (US1 front)
- Backend antes do front ao validar manualmente (o front depende do endpoint no ar)

### Parallel Opportunities

- T003, T004, T005, T006 (arquivos diferentes, Fase 2)
- T010 e T011 (testes e interface); T016 e T018 (front, arquivos diferentes), que podem avançar em paralelo ao backend da US1
- T021 (testes US2) em paralelo ao início de T022
- T029 e T030 (Polish)

## Parallel Example: Foundational + User Story 1

```text
# Fase 2, em paralelo:
T003 Entidade RoutineExecution.cs
T004 Constantes RoutineKeys.cs
T005 DTO RoutineExecutionResponse.cs
T006 RoutineExecutionMapping.cs

# US1, em paralelo (repos/arquivos distintos):
T010 RoutineHandlerTests.cs      (BACK)
T016 src/api/routines.js         (FRONT)
T018 fmtDateTime em format.js    (FRONT)
```

---

## Implementation Strategy

### MVP First

As duas stories são P1 e se complementam: US1 sozinha só exibe dados semeados; o valor real
aparece com US2. Entregar na ordem:

1. Fases 1 e 2 (backend: tabela + migração com rollback testado)
2. **US1**: endpoint GET + exibição na tela → validar (com linha semeada)
3. **US2**: gravação nos handlers + refetch pós-execução → validar ponta a ponta
4. Polish e PRs (backend primeiro, front depois)

### Ordem de entrega entre repositórios

1. PR do backend (migração + endpoint + gravação) — publicar/aplicar migração antes
2. PR do front — depende do endpoint `GET v1/routines/GetLastExecutions` no ar

## Notes

- Não alterar rota nem formato de resposta de `POST sync-prices` e `POST BackfillPrices` (Princípio I)
- Estilo 100% inline, cores só da paleta do CLAUDE.md; sem novas dependências (Princípio II)
- Falha ao gravar o registro nunca pode falhar a rotina (T022)
- Commitar após cada tarefa ou grupo lógico, em cada repositório
