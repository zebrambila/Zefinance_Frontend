# Data Model: Sugestão do Último Provento Recebido

Nenhuma entidade nova é criada por esta feature. As entidades abaixo já existem no
contrato do backend (ver `src/api/dividends.js` e `src/api/assets.js`) e são reutilizadas
como estão; esta seção documenta apenas os campos relevantes para a sugestão e a relação
entre eles.

## Provento (Dividendo)

Já modelado pelo backend e consumido via `listDividends`/`getDividend`
(`src/api/dividends.js`). Campos relevantes para esta feature:

| Campo | Tipo | Relevância para a sugestão |
|---|---|---|
| `assetId` | string (id) | Chave usada para filtrar os proventos do ativo selecionado |
| `receiptDate` | string (data, `YYYY-MM-DD`) | Critério de "mais recente" — maior `receiptDate` vence. **Não** é usado para preencher o campo "Data de Pagamento" do formulário (ver abaixo) |
| `totalFinancial` | number | Valor sugerido para o campo "Valor Financeiro" |
| `custodian` | string (`ECustodian`) | Valor sugerido para o campo "Custodiante" |

> O campo "Data de Pagamento" do formulário é sempre preenchido com a data atual,
> independentemente do ativo selecionado ou de seu histórico de proventos (ver
> `research.md`, Decisão 0). Ele não faz parte da sugestão derivada do Provento mais
> recente.

Nenhum campo novo é adicionado a esta entidade; nenhuma mudança de schema no backend.

## Ativo

Já modelado pelo backend e consumido via `listAssets` (`src/api/assets.js`). Único campo
relevante aqui é `assetId`, usado como filtro na busca de proventos.

## Relação

- Um **Ativo** possui zero ou mais **Proventos** (`Provento.assetId → Ativo.assetId`).
- A "sugestão" é um valor **derivado**, calculado no cliente no momento da seleção do
  ativo no formulário — não é persistido em nenhum lugar, não é uma nova entidade, e não
  sobrevive após o fechamento do modal.
- Regra de seleção do provento sugerido (derivação): entre os proventos retornados para o
  `assetId` selecionado, escolher o de maior `receiptDate`; em caso de empate, escolher o
  retornado por último pela API (ver `research.md`, Decisão 1).

## Estados do formulário (não é uma máquina de estados persistida, apenas estados de UI)

| Estado | Condição | Data de Pagamento | Valor Financeiro / Custodiante |
|---|---|---|---|
| Sem ativo selecionado | `assetId === ''` | Data atual (padrão do formulário) | Valores padrão |
| Ativo selecionado, com histórico | busca retorna ≥1 provento para o `assetId` | Data atual (inalterada) | Preenchidos com os dados do provento mais recente (editáveis, sem marcação visual) |
| Ativo selecionado, sem histórico | busca retorna 0 proventos para o `assetId` | Data atual (inalterada) | Valores padrão, sem sugestão, sem erro |
| Busca da sugestão falhou | erro de rede/API ao buscar proventos do ativo | Data atual (inalterada) | Valores padrão, sem erro bloqueante (FR-008) |
| Editando provento existente | `isEditing === true` | Data do provento em edição (não afetada) | Sugestão nunca é buscada nem aplicada; refletem o provento em edição (FR-007) |
