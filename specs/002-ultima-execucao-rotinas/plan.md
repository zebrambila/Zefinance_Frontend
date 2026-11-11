# Implementation Plan: Última Execução das Rotinas de Configuração

**Branch**: `002-ultima-execucao-rotinas` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ultima-execucao-rotinas/spec.md`

## Summary

A tela de Configurações passa a exibir, em cada cartão de rotina ("Sincronizar cotações" e
"Carregar histórico de preços"), a data/hora da última execução concluída, guardada **no
servidor** (decisão da clarificação). Abordagem: o backend (`InvestmentPortfolio.Api`, repo
irmão) ganha uma tabela `RoutineExecutions` (uma linha por rotina, upsert), grava o
registro dentro de `SyncPricesAsync` e `BackfillPricesAsync` quando a execução não é uma
falha total, e expõe um novo `GET v1/routines/GetLastExecutions`. O front ganha
`src/api/routines.js`, um formatador `fmtDateTime` e, em `Configuracoes.jsx`, a busca ao
montar a tela e um refetch após cada execução. As respostas atuais de `sync-prices` e
`BackfillPrices` **não mudam** (compatibilidade, Princípio I).

## Technical Context

**Language/Version**: Front: JavaScript (ES2022+), React 18, Vite 5. Back: C# / .NET 10
(minimal API), EF Core + PostgreSQL (Npgsql)

**Primary Dependencies**: Front: apenas `react`/`react-dom` (nenhuma nova). Back: nenhuma
nova — reaproveita `InvestmentContext`, `Response<T>`, padrão Endpoint/Handler existente

**Storage**: PostgreSQL via EF Core no backend: nova tabela `RoutineExecutions` + migração
com `Down()` (rollback). Front sem armazenamento próprio

**Testing**: Front: sem suíte; `npm run lint` + validação manual via
[quickstart.md](./quickstart.md). Back: MSTest (`dotnet test`), com `InvestmentContextFake`
(EF InMemory) e nomes `Dado_..._Quando_..._Entao_...`; novos testes obrigatórios

**Target Platform**: Navegador web (SPA) + API ASP.NET Core

**Project Type**: Aplicação web em dois repositórios (front `zefinance-react`, back
`../InvestmentPortfolio`); alteração cross-repo

**Performance Goals**: Uma chamada GET leve ao abrir Configurações (≤ 2 linhas); gravação
é um upsert por execução, desprezível frente à chamada ao Yahoo Finance

**Constraints**: Gravar o registro não pode fazer a rotina falhar (best-effort); respostas
existentes inalteradas; horário exibido no fuso local do usuário; estilo 100% inline

**Scale/Scope**: 2 rotinas (extensível por chave); 1 tela; 1 endpoint novo; 1 tabela nova

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Compatibilidade de API | Só adiciona endpoint novo; `POST sync-prices` e `POST BackfillPrices` mantêm rota e formato. Contrato novo documentado em comentário de `src/api/routines.js` e em [contracts/](./contracts/routines-api.md), a verificar contra o código real do backend ao implementar | PASS |
| II. Limites de Serviço Existentes | Busca por tela com `useState`/`useEffect` + guarda `cancelled`; estilização inline; sem roteador/estado global/dependência. No back: padrão Endpoint + Handler + Mapping existente | PASS |
| III. Rollback de Migração | Há migração (`AddRoutineExecutions`). Plano de rollback: `Down()` remove a tabela; reversão via `dotnet ef database update <migração anterior>` (`AddAssetPriceHistory`); sem perda de dados de negócio, só o registro de execução. Deve constar na descrição do PR do backend | PASS (condicionado a testar o rollback) |
| IV. Suítes de Teste | Front: `npm run lint` limpo. Back: `dotnet test` deve passar, incluindo novos testes | PASS (pendente de execução) |

**Re-avaliação pós-design**: sem violações; Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/002-ultima-execucao-rotinas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── routines-api.md
└── tasks.md             # /speckit-tasks (não criado aqui)
```

### Source Code

```text
# Front — zefinance-react
src/
├── api/
│   ├── routines.js          # NOVO: getRoutineExecutions + ERoutine (chaves)
│   └── index.js             # + export * from './routines'
├── lib/
│   └── format.js            # + fmtDateTime (pt-BR, fuso local)
└── pages/
    └── Configuracoes.jsx    # fetch ao montar, refetch após executar, linha "Última execução"

# Back — ../InvestmentPortfolio/src
InvestmentPortfolio.Core/
├── Entities/RoutineExecution.cs
├── Handlers/IRoutineHandler.cs
└── Responses/Routines/RoutineExecutionResponse.cs
InvestmentPortfolio.Infra/
├── Data/InvestmentContext.cs                  # + DbSet<RoutineExecution>
├── Data/Mappings/RoutineExecutionMapping.cs
└── Migrations/<ts>_AddRoutineExecutions.cs    # com Down()
InvestmentPortfolio.Api/
├── Endpoints/Routines/GetLastExecutionsEndpoint.cs
├── Handlers/RoutineHandler.cs
├── Handlers/AssetHandler.cs                   # grava execução em Sync/Backfill
├── Extensions/BuilderExtension.cs             # AddScoped<IRoutineHandler,...>
└── Program.cs                                 # GetLastExecutionsEndpoint.Map(app)
InvestmentPortfolio.Tests/Handlers/
├── RoutineHandlerTests.cs
└── AssetHandlerTests.cs                       # + casos de registro de execução
```

**Structure Decision**: Mudança cross-repo. Backend primeiro (endpoint + migração +
testes), depois o front, que depende do contrato em
[contracts/routines-api.md](./contracts/routines-api.md).

## Complexity Tracking

Sem violações a justificar.
