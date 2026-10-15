# Feature Specification: Sugestão do Último Provento Recebido

**Feature Branch**: `001-sugestao-ultimo-provento`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Criar uma opção na funcionalidade de Novo Provento Recebido, onde selecionar o ativo, o sistema apresente em tela como sugestão o ultimo provento recebido"

## Clarifications

### Session 2026-10-10

- Q: Quando o sistema preenche os campos com a sugestão do último provento, ele deve deixar algum sinal visual de que aquele valor é uma sugestão (não digitada pelo usuário), ou o preenchimento deve ser idêntico a um campo preenchido manualmente, sem nenhuma marcação? → A: Preencher os campos normalmente, sem nenhuma marcação visual distinguindo sugestão de valor digitado manualmente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver sugestão ao selecionar um ativo com histórico (Priority: P1)

Ao registrar um novo provento recebido, o usuário seleciona um ativo que já possui ao
menos um provento registrado anteriormente. O sistema apresenta, na própria tela, como
sugestão: o campo Data de Pagamento preenchido com a data atual, e os campos Valor
Financeiro e Custodiante preenchidos com os dados do provento mais recente registrado
para aquele ativo — para que o usuário apenas confirme ou ajuste antes de salvar.

**Why this priority**: É o cenário central pedido pelo usuário e o que entrega valor
imediato — reduzir o esforço de digitação e o risco de erro ao lançar proventos
recorrentes (ex.: dividendos mensais do mesmo ativo).

**Independent Test**: Pode ser testado isoladamente abrindo "Novo provento recebido",
selecionando um ativo que já tenha proventos registrados, e verificando que o campo Data
de Pagamento é preenchido com a data atual e os campos Valor Financeiro e Custodiante são
preenchidos automaticamente com os dados do provento mais recente daquele ativo,
permanecendo todos editáveis.

**Acceptance Scenarios**:

1. **Given** hoje é 13/10/2026 e o ativo "XPTO11" possui um provento registrado em
   15/09/2026 no valor de R$ 120,50 via custodiante BTG, **When** o usuário abre "Novo
   provento recebido" e seleciona "XPTO11" no campo Ativo, **Then** o campo Data de
   Pagamento é preenchido com 13/10/2026 (a data atual), e os campos Valor Financeiro e
   Custodiante são preenchidos com R$ 120,50 e BTG (dados do provento de 15/09/2026), e o
   usuário pode alterar todos livremente antes de registrar.
2. **Given** a sugestão foi preenchida automaticamente após selecionar um ativo,
   **When** o usuário troca a seleção para outro ativo com histórico de proventos,
   **Then** os campos Valor Financeiro e Custodiante são atualizados para refletir o
   último provento do novo ativo selecionado, substituindo a sugestão anterior; o campo
   Data de Pagamento não é afetado pela troca de ativo, pois seu valor sugerido é sempre
   a data atual.

---

### User Story 2 - Selecionar um ativo sem proventos anteriores (Priority: P2)

Ao selecionar um ativo que nunca teve um provento registrado, o usuário não vê nenhuma
sugestão de preenchimento para Valor Financeiro e Custodiante, e esses campos permanecem
vazios/padrão, sem mensagens de erro. O campo Data de Pagamento continua preenchido com a
data atual, já que seu valor não depende do histórico do ativo.

**Why this priority**: Evita que a ausência de histórico seja confundida com uma falha do
sistema; é um complemento necessário ao fluxo principal, mas não bloqueia o valor
entregue pela User Story 1.

**Independent Test**: Pode ser testado selecionando, na tela "Novo provento recebido", um
ativo recém-cadastrado que nunca recebeu proventos, e confirmando que os campos de valor
e custodiante permanecem com seus valores padrão (sem sugestão), que o campo de data
permanece com a data atual, e que nenhum erro é exibido.

**Acceptance Scenarios**:

1. **Given** o ativo "NOVO11" nunca teve um provento registrado, **When** o usuário o
   seleciona no campo Ativo da tela "Novo provento recebido", **Then** os campos Valor
   Financeiro e Custodiante mantêm seus valores padrão (sem preenchimento automático), o
   campo Data de Pagamento permanece com a data atual, e nenhuma mensagem de erro é
   exibida.

---

### User Story 3 - Sugestão não se aplica ao editar um provento existente (Priority: P3)

Ao editar um provento já registrado (não ao criar um novo), o sistema não substitui os
valores do provento que está sendo editado pela sugestão do último provento do ativo,
preservando os dados reais do registro em edição.

**Why this priority**: Garante que a nova funcionalidade não interfira em um fluxo já
existente (edição), evitando perda de dados; é um cuidado de borda, não o foco principal.

**Independent Test**: Pode ser testado abrindo a edição de um provento previamente
registrado e confirmando que os campos exibidos são os do próprio registro em edição, não
os do último provento do ativo (caso sejam diferentes).

**Acceptance Scenarios**:

1. **Given** um provento do ativo "XPTO11" registrado em 15/08/2026 está sendo editado, e
   esse mesmo ativo já recebeu um provento mais recente em 15/09/2026, **When** o usuário
   abre a edição do provento de 15/08/2026, **Then** os campos exibidos refletem os dados
   de 15/08/2026 (o registro em edição), não os de 15/09/2026.

### Edge Cases

- O que acontece quando o ativo selecionado possui múltiplos proventos na mesma data de
  pagamento? O sistema deve considerar o provento mais recentemente registrado entre eles
  como a sugestão de Valor Financeiro e Custodiante.
- O que acontece se a busca do último provento falhar (ex.: erro de rede)? O formulário
  deve permanecer utilizável, com Valor Financeiro e Custodiante em seus valores padrão e
  Data de Pagamento na data atual, sem bloquear o registro de um novo provento, e sem
  exibir a sugestão.
- O que acontece se o usuário editar manualmente o Valor Financeiro ou o Custodiante
  preenchidos pela sugestão e depois trocar de ativo novamente? A nova seleção de ativo
  deve sobrescrever esses dois campos com a sugestão do novo ativo (ou com os valores
  padrão, se não houver histórico), descartando a edição manual anterior — mesmo
  comportamento já existente ao trocar de ativo hoje. O campo Data de Pagamento nunca é
  sobrescrito por essa troca, pois seu valor sugerido é sempre a data atual, independente
  do ativo selecionado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao selecionar um ativo no formulário de registro de um novo provento
  recebido, o sistema MUST buscar o provento mais recente já registrado para aquele ativo.
- **FR-002**: Ao selecionar um ativo no formulário de registro de um novo provento
  recebido, o sistema MUST preencher automaticamente o campo Data de Pagamento com a data
  atual, independentemente de haver ou não histórico de proventos para o ativo.
- **FR-003**: Quando existir um provento anterior para o ativo selecionado, o sistema MUST
  apresentar os dados de Valor Financeiro e Custodiante desse provento como sugestão,
  preenchendo automaticamente os respectivos campos do formulário, sem nenhuma marcação
  visual que distinga o valor sugerido de um valor digitado manualmente pelo usuário.
- **FR-004**: Os campos preenchidos pela sugestão (Data de Pagamento, Valor Financeiro e
  Custodiante) MUST permanecer editáveis, permitindo que o usuário os ajuste livremente
  antes de confirmar o registro.
- **FR-005**: Quando não existir nenhum provento anterior para o ativo selecionado, o
  sistema MUST manter os campos Valor Financeiro e Custodiante do formulário em seus
  valores padrão, sem exibir sugestão nem mensagem de erro; o campo Data de Pagamento não
  é afetado por esta regra (FR-002 já garante que ele permanece na data atual).
- **FR-006**: Ao trocar a seleção do ativo, o sistema MUST atualizar os campos Valor
  Financeiro e Custodiante para refletir o último provento do ativo recém-selecionado (ou
  limpar esses dois campos, se o novo ativo não tiver histórico); o campo Data de
  Pagamento MUST NOT ser alterado por essa troca, pois seu valor sugerido (a data atual)
  não depende do ativo selecionado.
- **FR-007**: No fluxo de edição de um provento já existente, o sistema MUST NOT
  sobrescrever os dados do registro em edição (incluindo sua data de pagamento original)
  com a sugestão de Valor Financeiro/Custodiante nem com a data atual; a sugestão
  aplica-se apenas ao registrar um novo provento.
- **FR-008**: Caso a busca pelo último provento do ativo falhe, o sistema MUST permitir que
  o usuário continue preenchendo e registrando o novo provento manualmente, sem bloquear o
  fluxo; o campo Data de Pagamento permanece na data atual mesmo nesse caso.

### Key Entities

- **Provento (Dividendo)**: Registro de um valor recebido de um ativo, com data de
  pagamento, valor financeiro e custodiante; associado a um único ativo. É a entidade cujo
  registro mais recente, por ativo, alimenta a sugestão.
- **Ativo**: O investimento (ex.: ação, fundo) ao qual um ou mais proventos estão
  associados; é o critério usado para localizar o "último provento recebido" a sugerir.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao selecionar um ativo com histórico de proventos, a sugestão do último
  provento é exibida em tela sem exigir nenhuma ação adicional do usuário.
- **SC-002**: Pelo menos 90% dos registros de proventos para um ativo que já possui
  histórico são concluídos sem que o usuário precise digitar manualmente o valor
  financeiro ou o custodiante, quando esses dados coincidem com os do último provento
  recebido; a data de pagamento sugerida (a data atual) atende ao caso comum de registro
  no mesmo dia do recebimento sem exigir digitação.
- **SC-003**: 100% das seleções de ativos sem histórico de proventos resultam em formulário
  com campos padrão e nenhuma mensagem de erro exibida ao usuário.
- **SC-004**: 100% das edições de proventos existentes preservam os dados originais do
  registro, sem interferência da sugestão de outro provento do mesmo ativo.

## Assumptions

- A sugestão de Valor Financeiro e Custodiante é baseada no provento com a data de
  pagamento mais recente registrado para o ativo selecionado; em caso de empate de data,
  prevalece o registrado por último. A Data de Pagamento sugerida é sempre a data atual e
  não depende do histórico do ativo.
- "Apresentar como sugestão" significa pré-preencher os campos do formulário (data, valor,
  custodiante) com esses valores, permanecendo os campos totalmente editáveis e sem
  marcação visual distintiva — não um texto informativo separado nem um valor somente
  leitura (confirmado na seção Clarifications).
- A sugestão se aplica apenas ao fluxo de criação de um novo provento ("Novo provento
  recebido"); o fluxo de edição de um provento já existente continua exibindo os dados do
  próprio registro em edição, sem alteração de comportamento.
- Proventos excluídos (soft delete) não são considerados como "último provento recebido"
  para fins da sugestão de Valor Financeiro/Custodiante.
