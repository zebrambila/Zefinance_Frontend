// Maps to InvestmentPortfolio.Api Endpoints/Transactions/* (route base: v1/transactions/{Action})
import { apiGet, apiPost, apiPut, apiDelete } from './client';

// EOperationType enum names, serialized as strings (JsonStringEnumConverter is global)
export const EOperationType = { Compra: 'Compra', Venda: 'Venda' };
// ECustodian enum names, serialized as strings
export const ECustodian = { BTG: 'BTG', Itau: 'Itau' };

// GET v1/transactions/GetAllTransactions?pageNumber=&pageSize=&assetId=&custodian=&dateFrom=&dateTo= -> PagedResponse<Transaction[]>
export const listTransactions = ({ pageNumber = 1, pageSize = 25, assetId, custodian, dateFrom, dateTo } = {}) =>
  apiGet('transactions/GetAllTransactions', { pageNumber, pageSize, assetId, custodian, dateFrom, dateTo });

// GET v1/transactions/GetTransactionById/{id} -> Response<Transaction>
export const getTransaction = (id) => apiGet(`transactions/GetTransactionById/${id}`);

// POST v1/transactions/CreateTransaction
// body: { assetId, type, quantity, unitPrice, dateBuySell, custodian } -> Response<Transaction>
// Note: the request field is "type", but the entity/response field for the same value is "side".
// totalValue is computed server-side (quantity * unitPrice)
export const createTransaction = (data) => apiPost('transactions/CreateTransaction', data);

// PUT v1/transactions/UpdateTransaction/{id}
// body: { type, quantity, unitPrice, dateBuySell, custodian } (assetId cannot change) -> Response<Transaction>
export const updateTransaction = (id, data) => apiPut(`transactions/UpdateTransaction/${id}`, data);

// DELETE v1/transactions/DeleteTransaction/{id} -> Response<Transaction> (soft delete)
export const deleteTransaction = (id) => apiDelete(`transactions/DeleteTransaction/${id}`);
