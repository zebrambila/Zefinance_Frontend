<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1
- Modified principles: translated to Brazilian Portuguese (wording only, no
  normative change): I. API Compatibility → I. Compatibilidade de API,
  II. Respect Existing Service Boundaries → II. Respeitar os Limites de Serviço
  Existentes, III. Migration Rollback Discipline → III. Disciplina de Rollback
  de Migração, IV. Established Test Suites Must Pass → IV. Suítes de Teste
  Estabelecidas Devem Passar
- Added sections: none
- Removed sections: none
- Deferred items:
  - TODO(RATIFICATION_DATE): data de adoção original não informada; definir
    quando for conhecida.
-->

# Constituição do ZeFinance

## Princípios Fundamentais

### I. Compatibilidade de API
Os contratos públicos com o backend DEVEM permanecer compatíveis. `src/api/*.js`
espelha as rotas `Endpoints/{Resource}/*` do backend `.NET`, os formatos de
requisição/resposta e as peculiaridades de nomes de campo (ex.: `type` vs
`side`, `assetId` vs `id`) conforme documentado nos comentários de cada
arquivo. Qualquer alteração de formato de requisição/resposta, rota ou valor
de enum nessa camada DEVE ser verificada contra o contrato real do backend
primeiro (nunca assumida), e NÃO DEVE quebrar silenciosamente os chamadores
existentes (páginas, modais) — atualize todos os pontos de chamada na mesma
alteração, e trate os comentários de `src/api/*.js` como o contrato a manter
sincronizado, não apenas o código.

**Justificativa**: Este repositório não possui servidor próprio; a camada de
API é a única fronteira entre a UI e o backend. Uma alteração incompatível
aqui quebra a aplicação em tempo de execução sem compilador ou sistema de
tipos para detectar o erro (sem TypeScript, sem PropTypes).

### II. Respeitar os Limites de Serviço Existentes
O trabalho DEVE permanecer dentro dos limites arquiteturais já estabelecidos
neste código, em vez de introduzir mecanismos paralelos. Concretamente: não há
roteador (a troca de página vive no estado `page` do `App.jsx`); os modais são
orquestrados centralmente pelo `App.jsx`, não localmente pelas páginas; os
filtros (`period`, `month`) vivem no `App.jsx`, não nas páginas individuais; a
busca de dados é feita por página com `useState` local, não por um store
compartilhado ou cache de queries; a estilização permanece 100% inline, sem
CSS Modules/Tailwind/styled-components. Introduzir um novo mecanismo
transversal (biblioteca de roteamento, estado global, metodologia de CSS, nova
dependência de runtime) é uma mudança arquitetural, não uma edição de rotina,
e DEVE ser levantado com o usuário antes de ser adotado.

**Justificativa**: O projeto mantém deliberadamente um único padrão
consistente por responsabilidade (ver CLAUDE.md "Architecture" e
"Conventions"). Misturar padrões torna o código mais difícil de navegar e
anula o propósito de ter uma convenção documentada.

### III. Disciplina de Rollback de Migração
Toda migração de banco de dados DEVE incluir um plano de rollback (reversão)
antes de ser considerada concluída. Este repositório não possui banco de dados
nem migrações próprias — o backend (`InvestmentPortfolio.Api`, repositório
irmão) é responsável pelo schema e pelas migrações do EF Core — portanto este
princípio rege qualquer alteração aqui que especifique, solicite ou escreva
uma migração para esse backend, ou para o serviço Postgres do Docker Compose
do qual o `docker-compose.yml` deste repositório depende. Uma migração sem
rollback testado NÃO DEVE ser proposta como trabalho concluído.

**Justificativa**: Alterações de schema são a classe mais difícil de desfazer
depois de aplicadas a dados reais; exigir um plano de rollback de antemão
força essa consideração de risco antes da implantação, não durante um
incidente.

### IV. Suítes de Teste Estabelecidas Devem Passar
Quaisquer suítes de teste automatizadas e portões de qualidade estabelecidos
em um repositório DEVEM ser executados, e DEVEM passar, antes que o trabalho
que os utiliza seja considerado concluído. No momento desta redação, este
repositório não possui suíte de testes automatizada — apenas `npm run lint`
está configurado e DEVE ser executado antes de considerar uma alteração de
frontend concluída. Se uma suíte de testes unitários ou de integração for
introduzida aqui, ou no repositório irmão do backend para alterações
cross-repo, executá-la (e fazê-la passar) passa a integrar o "concluído"
imediatamente, sem necessidade de uma emenda separada à constituição.

**Justificativa**: Um portão de qualidade que existe mas não é executado de
forma consistente não oferece garantia real. Vincular este princípio a
qualquer suíte que exista atualmente (em vez de nomear uma que talvez ainda
não exista) mantém o princípio preciso conforme as ferramentas evoluem.

## Restrições de Tecnologia e Dependências

As dependências de runtime permanecem mínimas: o `package.json` atualmente
possui apenas `react`/`react-dom`. Adicionar um roteador, biblioteca de
estado/query, kit de UI, biblioteca de gráficos, pacote de ícones ou framework
CSS é uma mudança arquitetural significativa sob o Princípio II e DEVE ser
confirmada com o usuário antes, não tratada como uma atualização de dependência
de rotina. Os enums de domínio (`EAssetType`, `EOperationType`, `ECustodian`)
DEVEM ser usados conforme definidos ao lado de seu módulo de API, em vez de
valores literais fixos no código, já que o backend os serializa como strings
via um `JsonStringEnumConverter` global, e qualquer divergência aqui é um
risco de compatibilidade de API sob o Princípio I.

## Fluxo de Desenvolvimento e Portões de Qualidade

Antes que uma alteração seja considerada concluída:
- `npm run lint` DEVE ser executado e DEVE estar limpo (avisos de
  `no-unused-vars` são aceitáveis; novos erros não são).
- Qualquer alteração que toque em `src/api/*.js` DEVE ser verificada contra o
  comentário de rota/formato `Endpoints/{Resource}/*` do backend
  correspondente, conforme o Princípio I, e esse comentário DEVE ser
  atualizado caso o contrato mude.
- Qualquer alteração que introduza ou modifique uma migração de banco de dados
  (Princípio III) DEVE declarar seu plano de rollback explicitamente na
  descrição da alteração, não apenas em comentários de código.
- Quaisquer suítes de teste unitário/integração existentes no momento
  (Princípio IV) DEVEM ser executadas e DEVEM passar.

## Governança

Esta constituição tem precedência sobre práticas ad hoc em qualquer conflito
entre as duas. Emendas são feitas através do fluxo `/speckit-constitution`:
as alterações propostas são redigidas neste arquivo, versionadas conforme a
política abaixo, e entram em vigor ao serem gravadas em
`.specify/memory/constitution.md`.

Política de versionamento (versionamento semântico para o texto de
governança):
- **MAJOR**: Remoção ou redefinição de um princípio de forma incompatível com
  versões anteriores.
- **MINOR**: Um novo princípio ou seção materialmente expandida é adicionado.
- **PATCH**: Correções de redação, esclarecimentos ou erros de digitação sem
  mudança normativa.

Todas as especificações de features, planos e listas de tarefas produzidos
por outros comandos do Spec Kit DEVEM estar em conformidade com estes
princípios; um revisor que encontrar um conflito deve tratá-lo como um defeito
na especificação ou no plano, não neste documento, a menos que o próprio
princípio esteja sendo emendado através deste mesmo fluxo.

**Versão**: 1.0.1 | **Ratificada em**: TODO(RATIFICATION_DATE): data de adoção original desconhecida | **Última Emenda**: 2026-10-10
