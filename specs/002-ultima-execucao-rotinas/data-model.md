# Data Model: Última Execução das Rotinas

## RoutineExecution (backend, tabela `RoutineExecutions`)

Um registro por rotina; representa a última execução concluída.

| Campo | Tipo | Regras |
|---|---|---|
| `Id` | Guid (PK) | Gerado na criação |
| `RoutineKey` | string (máx. 64) | Obrigatório, **único**; valores iniciais `sync-prices`, `backfill-prices` |
| `LastExecutedAt` | `timestamp with time zone` | Obrigatório; gravado em UTC |

**Índices**: único em `RoutineKey` (garante um registro por rotina e viabiliza o upsert).

**Ciclo de vida**: não existe até a primeira execução concluída → criado (insert) nessa
execução → sobrescrito (update de `LastExecutedAt`) a cada execução concluída seguinte.
Nunca excluído. Rotina sem linha = "Nunca executada".

**Quando é gravado** (ver [research.md](./research.md) D3):

| Rotina | Grava | Não grava |
|---|---|---|
| `sync-prices` | Sem ativos cadastrados; ao menos 1 ativo atualizado | Há ativos e 0 atualizados; erro 500 |
| `backfill-prices` | Sem falhas; falha parcial (≥ 1 processado); sem ativos | Só falhas (0 processados); erro 500 |

**Migração**: `AddRoutineExecutions` cria a tabela e o índice único; `Down()` remove a
tabela (rollback). Sem backfill de dados: antes da migração não há como saber quando as
rotinas rodaram, então todas começam como "Nunca executada".

## Modelo no front (resposta do GET, sem estado global)

`{ routineKey: string, lastExecutedAt: string /* ISO 8601 UTC */ }[]` — ver
[contracts/routines-api.md](./contracts/routines-api.md). Na tela, vira um mapa
`routineKey → lastExecutedAt` guardado em `useState` local de `Configuracoes`.
