# Research: Última Execução das Rotinas

Nenhum `NEEDS CLARIFICATION` restava no Technical Context; as decisões abaixo fecham as
escolhas de design.

## D1 — Onde gravar o registro

- **Decision**: Dentro do próprio backend, nos handlers `SyncPricesAsync` e
  `BackfillPricesAsync` (`AssetHandler`), logo antes de retornar sucesso.
- **Rationale**: O servidor é a única testemunha confiável de que a rotina concluiu;
  funciona mesmo se a rotina for chamada fora da UI, e atende ao armazenamento
  compartilhado confirmado na clarificação.
- **Alternatives**: (a) Front chamar um `POST` extra "registrar execução" após o sucesso —
  rejeitado: duas chamadas, risco de divergência se a aba fechar no meio, e o cliente
  poderia forjar o horário. (b) localStorage — rejeitado pela clarificação.

## D2 — Não alterar respostas existentes

- **Decision**: Manter `Response<int>` (sync) e `Response<BackfillPricesResponse>` como
  estão; a data vem de um GET novo, refeito após cada execução.
- **Rationale**: Princípio I; `Response<int>` não comporta campo extra sem quebrar
  chamadores.
- **Alternatives**: Embutir `executedAt` na resposta do POST — rejeitado por quebra de
  contrato; custo de um GET extra é desprezível.

## D3 — O que conta como "execução concluída" (FR-008)

- **Decision**: Sync: grava, exceto quando há ativos cadastrados e **nenhum** foi atualizado
  (falha total do provedor) ou o handler retorna erro (500). Sem ativos cadastrados conta
  como executada. Backfill: grava, exceto quando houve falhas e **nenhum** ativo foi
  processado, ou erro 500. Sucesso parcial sempre grava.
- **Rationale**: Alinha com a spec (falha total não sobrescreve; parcial sobrescreve). O
  sync retorna 200 com 0 atualizados quando o Yahoo Finance falha para todos, então olhar
  só o status HTTP marcaria falha total como sucesso.
- **Alternatives**: Gravar sempre que 2xx — rejeitado pelo motivo acima.

## D4 — Gravação best-effort

- **Decision**: O upsert do registro roda em `try/catch` próprio; se falhar, a rotina ainda
  retorna seu resultado normal (a falha é engolida, sem alterar a resposta).
- **Rationale**: A rotina é a ação principal; o carimbo é informativo. Os handlers do
  backend já seguem "nunca deixar exceção subir".
- **Alternatives**: Falhar a rotina se não gravar — rejeitado: puniria o usuário por um
  dado secundário.

## D5 — Formato e fuso do timestamp

- **Decision**: Coluna `timestamp with time zone`, valor gravado em UTC (`DateTime.UtcNow`),
  serializado em ISO 8601 com `Z`. O front converte com `new Date(iso)` e formata com
  `toLocaleString('pt-BR')` no fuso local.
- **Rationale**: Atende ao FR-005 (horário local do usuário). As colunas atuais usam
  `timestamp without time zone` com `DateTime.Now` (hora do servidor); reaproveitar isso
  mostraria o horário do servidor, não o do usuário, e é ambíguo.
- **Alternatives**: `DateTime.Now` sem fuso, como o resto do backend — rejeitado por
  ambiguidade de fuso quando servidor e usuário diferem (ex.: Docker em UTC).

## D6 — Modelo: uma linha por rotina, upsert

- **Decision**: Tabela `RoutineExecutions` com `RoutineKey` único (`sync-prices`,
  `backfill-prices`) e `LastExecutedAt`; atualizada por upsert.
- **Rationale**: A spec pede só a última execução, sem histórico; as chaves coincidem com
  os `id` já usados em `ACTIONS` de `Configuracoes.jsx`. Novas rotinas entram sem migração.
- **Alternatives**: Colunas em `Assets` ou tabela de log de execuções — rejeitado: modelo
  errado / fora do escopo (histórico é não-objetivo).

## D7 — Entidade fora de `AuditableEntity`

- **Decision**: `RoutineExecution` com `Id`, `RoutineKey`, `LastExecutedAt`, sem soft-delete,
  seguindo o estilo de `AssetPriceHistory` (entidade simples, `private set`, métodos de
  mutação).
- **Rationale**: Não há exclusão lógica nem auditoria relevante para esse registro.

## D8 — UI: estados do cartão

- **Decision**: `Configuracoes` busca `GET GetLastExecutions` ao montar (com guarda
  `cancelled`) e uma `refreshKey` local, incrementada após cada execução bem-sucedida.
  Cada `ActionCard` recebe `lastExecutedAt` e `loadError`. Estados: carregando
  ("Carregando..."), erro ("Não foi possível carregar a última execução."), nunca
  executada ("Nunca executada"), com data ("Última execução: DD/MM/AAAA HH:MM").
- **Rationale**: Segue o padrão de busca por página do CLAUDE.md e a ordem
  loading → error → vazio → dados. A falha do GET não bloqueia o botão "Executar" (FR-009).
- **Alternatives**: Duas chaves de refresh (externa + interna) — não se aplica: a página não
  recebe `refreshKey` do `App.jsx`, então basta a local.
