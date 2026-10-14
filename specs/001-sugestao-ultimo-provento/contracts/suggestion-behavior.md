# Contrato de UI: Sugestão do Último Provento Recebido

Esta feature não introduz nenhum endpoint, rota ou formato de requisição/resposta novo no
backend. O único "contrato" novo é comportamental, dentro de `src/modals/DividendModal.jsx`.
O contrato de dados subjacente (rota, request/response shape) já está documentado em
`src/api/dividends.js` e permanece inalterado — ver Constituição, Princípio I.

## Gatilho

- **Quando**: o campo "ATIVO" do formulário "Novo provento recebido" muda de valor
  (evento `onChange` do `<select>`), e `isEditing === false`.
- **Entrada**: `assetId` selecionado (string, não vazio).

## Chamada à API existente

- Usa `listDividends({ assetId, pageSize: 5, pageNumber: 1 })` de `src/api/dividends.js`
  (nenhum parâmetro novo adicionado à função; `pageSize: 5` é apenas o valor de chamada
  usado por este fluxo).
- Resposta esperada: `PagedResponse<Dividend[]>` já documentado nos comentários do
  arquivo.

## Saída (efeito observável na UI)

| Condição da resposta | Efeito em "Valor Financeiro" / "Custodiante" | Efeito em "Data de Pagamento" |
|---|---|---|
| `data` contém ≥1 provento | Preenchidos com os valores do provento de maior `receiptDate` (ver `data-model.md`) | **Não alterado** — permanece com seu valor atual |
| `data` vazio (`[]`) | Retornam aos valores padrão; nenhuma sugestão exibida | **Não alterado** |
| Requisição falha (promise rejeitada) | Retornam aos valores padrão; nenhum erro bloqueante mostrado ao usuário | **Não alterado** |
| `assetId` é limpo (`''`) | Nenhuma busca é feita; retornam aos valores padrão | **Não alterado** |

O campo "Data de Pagamento" nunca é escrito por este fluxo (ver `research.md`, Decisão
0) — seu valor padrão já é a data atual no momento em que o formulário é aberto, e
assim permanece até que o próprio usuário o edite.

## Pós-condições

- Os campos Valor Financeiro e Custodiante preenchidos pela sugestão permanecem
  totalmente editáveis, assim como a Data de Pagamento (FR-004).
- Nenhuma marcação visual diferencia um valor sugerido de um valor digitado manualmente
  (decisão da clarificação de 2026-10-10).
- Trocar o ativo selecionado repete o gatilho e substitui a sugestão anterior de Valor
  Financeiro/Custodiante; a Data de Pagamento nunca é afetada por essa troca (FR-006).
- Este comportamento nunca é acionado quando o modal está em modo de edição (`isEditing
  === true`) — os campos exibidos são sempre os do provento em edição, incluindo sua
  data de pagamento original (FR-007).
