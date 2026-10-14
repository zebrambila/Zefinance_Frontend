# Quickstart: Validar a Sugestão do Último Provento Recebido

## Pré-requisitos

- Backend `InvestmentPortfolio.Api` rodando e acessível em `VITE_API_BASE_URL` (ver
  `.env.example`), ou stack completa via `docker-compose up --build`.
- Pelo menos um ativo cadastrado com 2+ proventos registrados em datas diferentes (para
  validar a seleção do mais recente), e pelo menos um ativo cadastrado sem nenhum
  provento.

## Setup

```bash
npm install
npm run dev
# http://localhost:5173
```

## Cenários de validação (ligados às User Stories do spec.md)

### 1. Sugestão aparece para ativo com histórico (User Story 1 / FR-001–004, FR-006)

1. Abra a página "Dividendos" e clique em "Novo provento recebido".
2. Confirme que o campo "DATA DE PAGAMENTO" já abre preenchido com a data atual.
3. No campo "ATIVO", selecione um ativo que já tenha proventos registrados.
4. **Esperado**: os campos "VALOR FINANCEIRO" e "CUSTODIANTE" são preenchidos
   automaticamente com os dados do provento mais recente desse ativo; "DATA DE
   PAGAMENTO" permanece com a data atual (não é alterado pela seleção do ativo); todos
   os campos continuam editáveis e sem nenhuma marcação visual de "sugestão"
   (clarificação de 2026-10-10).
5. Troque a seleção para outro ativo com histórico diferente.
6. **Esperado**: "VALOR FINANCEIRO" e "CUSTODIANTE" são atualizados para refletir o
   provento mais recente do novo ativo selecionado; "DATA DE PAGAMENTO" continua
   inalterado.

### 2. Ativo sem histórico não gera sugestão nem erro (User Story 2 / FR-005)

1. No mesmo modal, selecione um ativo que nunca recebeu proventos.
2. **Esperado**: "VALOR FINANCEIRO" e "CUSTODIANTE" permanecem/retornam aos valores
   padrão; "DATA DE PAGAMENTO" permanece com a data atual; nenhuma mensagem de erro é
   exibida.

### 3. Edição de provento existente não é afetada (User Story 3 / FR-007)

1. Na lista de proventos, abra a edição de um provento já registrado de um ativo que
   também tenha um provento mais recente que o que está sendo editado.
2. **Esperado**: os campos exibidos refletem os dados do provento em edição (incluindo a
   sua data de pagamento original, não a data atual), não os do provento mais recente do
   ativo.

### 4. Falha na busca da sugestão não bloqueia o registro (FR-008)

1. Simule uma falha de rede para a chamada de listagem de proventos (ex.: desligue
   temporariamente o backend, ou use as ferramentas de rede do navegador para bloquear a
   chamada a `v1/dividends/GetAllDividends`) e selecione um ativo com histórico.
2. **Esperado**: "VALOR FINANCEIRO" e "CUSTODIANTE" permanecem nos valores padrão (sem
   sugestão), "DATA DE PAGAMENTO" permanece na data atual, nenhum erro bloqueante é
   exibido, e o usuário ainda consegue digitar os valores manualmente e registrar o
   provento normalmente.

## Checklist de qualidade antes de concluir

- `npm run lint` limpo (ver Constituição, Princípio IV / Fluxo de Desenvolvimento).
- Nenhum novo endpoint ou dependência adicionado (ver `contracts/suggestion-behavior.md`
  e `research.md`).
- Comportamento validado contra os 4 cenários acima, cobrindo as 3 User Stories do
  `spec.md`.
