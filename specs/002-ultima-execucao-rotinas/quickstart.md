# Quickstart: validar "Última execução das rotinas"

Guia de validação ponta a ponta. Contrato: [contracts/routines-api.md](./contracts/routines-api.md);
modelo: [data-model.md](./data-model.md).

## Pré-requisitos

- Postgres acessível; repo do backend em `../InvestmentPortfolio` na branch com a feature.
- Ao menos 1 ativo cadastrado (para a rotina de cotações ter o que atualizar).

## 1. Backend

```bash
cd ../InvestmentPortfolio
dotnet test src/InvestmentPortfolio.Tests/InvestmentPortfolio.Tests.csproj   # deve passar
dotnet ef database update --project src/InvestmentPortfolio.Infra --startup-project src/InvestmentPortfolio.Api
dotnet run --project src/InvestmentPortfolio.Api    # Swagger em /swagger
```

- `GET /v1/routines/GetLastExecutions` → `data: []` (nada executado ainda).

## 2. Frontend

```bash
npm run lint    # sem novos erros
npm run dev     # http://localhost:5173
```

## 3. Cenários manuais

1. **Nunca executada**: abrir Configurações → ambos os cartões mostram `Nunca executada`.
2. **Executar cotações**: clicar "Executar" em "Sincronizar cotações" → ao terminar, o cartão
   mostra `Última execução: <agora>` (diferença ≤ 1 min); o outro cartão segue
   `Nunca executada` (independência).
3. **Persistência**: recarregar a página e abrir um navegador diferente → mesma data/hora.
4. **Executar histórico**: repetir no segundo cartão; o primeiro não muda.
5. **Falha total**: parar a API ou bloquear o Yahoo Finance e executar → mensagem de erro
   no cartão e a data anterior permanece.
6. **Falha parcial (histórico)**: com um ticker inválido cadastrado → resumo de falhas como
   hoje **e** a data é atualizada.
7. **GET indisponível**: derrubar a API, recarregar Configurações → cartões mostram
   `Não foi possível carregar a última execução.` e o botão "Executar" continua habilitado.
8. **Fuso**: mudar o fuso do SO/navegador → mesma execução aparece no horário local.

## 4. Rollback (Princípio III)

```bash
dotnet ef database update AddAssetPriceHistory --project src/InvestmentPortfolio.Infra --startup-project src/InvestmentPortfolio.Api
```

Confirmar que a tabela `RoutineExecutions` foi removida e que `sync-prices` /
`BackfillPrices` continuam funcionando (best-effort: sem tabela, a gravação falha em
silêncio — reverter também o código do backend).
