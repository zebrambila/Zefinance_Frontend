# Feature Specification: Última Execução das Rotinas de Configuração

**Feature Branch**: `002-ultima-execucao-rotinas`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Na tela de configuração, armazenar e apresentar a data/hora da ultima execução da rotina de sincronizar cotaçoes e carregar historico de preços"

## Clarifications

### Session 2026-11-10

- Q: Onde a data/hora da última execução deve ser guardada (servidor/backend ou apenas no navegador)? → A: No servidor (backend), compartilhada entre navegadores e dispositivos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quando cada rotina foi executada pela última vez (Priority: P1)

Ao abrir a tela de Configurações, o usuário vê, em cada uma das duas rotinas ("Sincronizar
cotações" e "Carregar histórico de preços"), a data e a hora da última vez em que ela foi
executada. Assim ele sabe, sem precisar lembrar, se as cotações e o histórico de preços
estão atualizados ou se está na hora de rodar a rotina novamente.

**Why this priority**: É o núcleo do pedido — hoje não há nenhuma indicação de quando as
rotinas rodaram, então o usuário não sabe se os valores de patrimônio estão baseados em
dados recentes.

**Independent Test**: Executar uma rotina, recarregar a página, abrir Configurações e
verificar que o cartão da rotina exibe a data/hora da execução recém-concluída.

**Acceptance Scenarios**:

1. **Given** a rotina "Sincronizar cotações" foi executada com sucesso em 10/11/2026 às
   14:32, **When** o usuário abre a tela de Configurações, **Then** o cartão dessa rotina
   exibe "Última execução: 10/11/2026 14:32".
2. **Given** a rotina "Carregar histórico de preços" foi executada em 09/11/2026 às 08:05
   e "Sincronizar cotações" em 10/11/2026 às 14:32, **When** o usuário abre Configurações,
   **Then** cada cartão exibe a sua própria data/hora, de forma independente.
3. **Given** uma rotina nunca foi executada, **When** o usuário abre Configurações,
   **Then** o cartão dessa rotina indica claramente que ela ainda não foi executada (ex.:
   "Nunca executada"), sem exibir data inválida ou vazia.

---

### User Story 2 - Registro atualizado automaticamente após executar (Priority: P1)

Quando o usuário clica em "Executar" em uma rotina e ela termina, a data/hora exibida no
cartão é atualizada imediatamente para o momento da execução concluída, sem precisar
recarregar a página. O valor fica guardado para que continue visível em acessos futuros.

**Why this priority**: Sem o registro automático a informação da User Story 1 não existiria;
as duas histórias formam juntas o menor incremento útil.

**Independent Test**: Anotar a data/hora exibida (ou "Nunca executada"), executar a rotina,
e verificar que o cartão passa a mostrar a data/hora atual; fechar e reabrir o aplicativo e
verificar que o valor persiste.

**Acceptance Scenarios**:

1. **Given** o cartão mostra uma data/hora antiga, **When** o usuário executa a rotina e ela
   conclui com sucesso, **Then** o cartão passa a exibir a data/hora do término dessa
   execução, ao lado da mensagem de resultado.
2. **Given** a rotina foi executada com sucesso, **When** o usuário fecha o navegador e abre
   o aplicativo novamente mais tarde, **Then** a mesma data/hora continua exibida.
3. **Given** a rotina "Carregar histórico de preços" terminou processando alguns ativos e
   com falha em outros, **When** a execução conclui, **Then** a data/hora da última execução
   é atualizada (a rotina rodou), e o resumo de falhas continua sendo exibido como hoje.
4. **Given** a rotina falha por completo (ex.: serviço indisponível), **When** a execução
   termina com erro, **Then** a data/hora da última execução exibida permanece a da última
   execução bem-sucedida anterior.

---

### Edge Cases

- Rotina nunca executada: exibe "Nunca executada" em vez de data.
- Falha total da rotina: não sobrescreve a data/hora da última execução bem-sucedida.
- Falha parcial (algumas cotações/ativos falham): conta como execução realizada e atualiza a
  data/hora.
- Falha ao carregar a informação de última execução ao abrir a tela: a tela continua
  utilizável (botões "Executar" funcionam) e o cartão informa que não foi possível carregar
  a data/hora, sem bloquear as rotinas.
- Duas execuções em sequência: prevalece sempre a mais recente.
- Fuso horário: a data/hora é mostrada no horário local do usuário, no formato brasileiro
  (DD/MM/AAAA HH:MM).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST registrar a data e a hora de cada execução concluída da rotina
  "Sincronizar cotações".
- **FR-002**: O sistema MUST registrar a data e a hora de cada execução concluída da rotina
  "Carregar histórico de preços".
- **FR-003**: O registro de cada rotina MUST ser independente: executar uma não altera a
  data/hora da outra.
- **FR-004**: O sistema MUST manter o registro de forma persistente no servidor (backend),
  de modo que ele permaneça disponível após recarregar a página, em novos acessos e em
  qualquer navegador ou dispositivo que acesse a mesma carteira.
- **FR-005**: A tela de Configurações MUST exibir, em cada cartão de rotina, a data/hora da
  última execução no formato brasileiro (DD/MM/AAAA HH:MM) e no horário local do usuário.
- **FR-006**: Quando uma rotina nunca foi executada, a tela MUST exibir um texto explícito
  ("Nunca executada") em vez de data vazia ou inválida.
- **FR-007**: Ao término de uma execução, a tela MUST atualizar a data/hora exibida no
  cartão imediatamente, sem exigir recarregar a página.
- **FR-008**: Uma execução com falha total MUST NOT alterar a data/hora da última execução
  registrada; uma execução com falha parcial MUST atualizá-la.
- **FR-009**: Se a data/hora registrada não puder ser carregada, a tela MUST continuar
  funcional, permitir executar as rotinas e informar o problema no cartão afetado.
- **FR-010**: A exibição da data/hora MUST seguir o estilo visual existente dos cartões de
  rotina e o padrão de textos em português da aplicação.

### Key Entities

- **Rotina**: uma das duas operações disponíveis na tela de Configurações ("Sincronizar
  cotações", "Carregar histórico de preços"). Identificada de forma única e possui, no
  máximo, um registro de última execução.
- **Registro de Última Execução**: data e hora (com fuso) em que uma rotina foi concluída
  pela última vez. Existe um por rotina; é sobrescrito a cada nova execução concluída.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das execuções concluídas (sucesso total ou parcial), a data/hora
  exibida no cartão corresponde ao momento da execução, com diferença de no máximo 1 minuto.
- **SC-002**: O usuário identifica quando cada rotina rodou pela última vez em até 5
  segundos após abrir a tela de Configurações, sem executar nenhuma ação adicional.
- **SC-003**: Após fechar e reabrir o aplicativo, 100% das rotinas que já foram executadas
  continuam mostrando a mesma data/hora anterior.
- **SC-004**: Em 100% das execuções com falha total, a data/hora exibida permanece inalterada.

## Assumptions

- O registro é guardado no servidor (decisão confirmada na clarificação), pois as rotinas
  atuam sobre dados globais da carteira (cotações e histórico de preços). Isso implica
  mudanças no backend, fora deste repositório.
- Há um único usuário/carteira por instalação; não é necessário separar registros por usuário.
- Apenas as duas rotinas atualmente listadas em Configurações estão no escopo; rotinas
  futuras poderão reutilizar o mesmo mecanismo, mas não fazem parte desta entrega.
- Não é necessário manter histórico de execuções anteriores, apenas a mais recente de cada
  rotina.
- Execuções disparadas fora da tela de Configurações (ex.: rotinas automáticas ou chamadas
  diretas ao backend) ficam fora do escopo, a menos que o backend já as registre.
- Caso a solução exija mudanças no backend (`InvestmentPortfolio.Api`), os contratos em
  `src/api/*.js` devem ser verificados e documentados conforme a constituição do projeto, e
  qualquer migração de banco deve vir com plano de rollback.
