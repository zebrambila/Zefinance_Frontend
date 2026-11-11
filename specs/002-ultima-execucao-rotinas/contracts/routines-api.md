# Contract: Sync Status API (real, implementado no backend)

> Substitui o contrato originalmente planejado (`GET v1/routines/GetLastExecutions`).
> O backend (`InvestmentPortfolio-develop`, commit "Last execution jobs") implementou:

## GET v1/assets/sync-status

- **Request**: sem parâmetros.
- **Response 200** — `Response<SyncStatusResponse>`:

```json
{
  "data": {
    "syncPrices":     { "executedAt": "2026-11-10T14:32:08.412", "success": true,  "message": "5 preço(s) atualizado(s)" },
    "backfillPrices": null
  },
  "code": 200,
  "isSuccess": true
}
```

- `null` em uma rotina = nunca executada.
- `executedAt`: ISO 8601 **sem sufixo de fuso** (`DateTime.Now` do servidor); o front o lê como horário local.
- Execuções com erro também são gravadas (`success: false`, `message` com o erro) e sobrescrevem
  a data anterior — diferente da spec original (FR-008); o front sinaliza "Falhou" no cartão.
- `POST sync-prices` e `POST BackfillPrices` mantêm rota e resposta.
- **Response 500** — mensagem "Erro ao buscar status das sincronizações".

## Contrato de UI (Configuracoes)

| Estado | Texto |
|---|---|
| Carregando o GET | `Carregando última execução...` |
| GET falhou | `Não foi possível carregar a última execução.` (`#f6465d`) |
| Sem registro | `Nunca executada` |
| Com registro | `Última execução: DD/MM/AAAA HH:MM` |
| Registro com `success:false` | idem + ` · Falhou: <message>` em `#f6465d` |

Após cada execução (sucesso ou erro) o cartão refaz o GET.
