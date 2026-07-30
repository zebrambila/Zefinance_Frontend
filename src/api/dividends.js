// Maps to InvestmentPortfolio.Api Endpoints/Dividends/* (route base: v1/dividends/{Action})
import { apiGet, apiPost, apiPut, apiDelete } from './client';

// GET v1/dividends/GetAllDividends?pageNumber=&pageSize=&assetId=&dateFrom=&dateTo= -> PagedResponse<Dividend[]>
export const listDividends = ({ pageNumber = 1, pageSize = 25, assetId, dateFrom, dateTo } = {}) =>
  apiGet('dividends/GetAllDividends', { pageNumber, pageSize, assetId, dateFrom, dateTo });

// GET v1/dividends/GetDividendById/{id} -> Response<Dividend>
export const getDividend = (id) => apiGet(`dividends/GetDividendById/${id}`);

// POST v1/dividends/CreateDividend
// body: { assetId, receiptDate, totalFinancial, custodian } -> Response<Dividend>
export const createDividend = (data) => apiPost('dividends/CreateDividend', data);

// PUT v1/dividends/UpdateDividend/{id}
// body: { receiptDate, totalFinancial, custodian } -> Response<Dividend>
export const updateDividend = (id, data) => apiPut(`dividends/UpdateDividend/${id}`, data);

// DELETE v1/dividends/DeleteDividend/{id} -> Response<Dividend> (soft delete)
export const deleteDividend = (id) => apiDelete(`dividends/DeleteDividend/${id}`);

// GET v1/dividends/GetSummaryByMonth?assetId=&dateFrom=&dateTo=
// -> Response<{ months: { year, month, total }[], averageMonthly }>
export const getDividendsSummaryByMonth = ({ assetId, dateFrom, dateTo } = {}) =>
  apiGet('dividends/GetSummaryByMonth', { assetId, dateFrom, dateTo });

// GET v1/dividends/GetSummaryByAsset?dateFrom=&dateTo=&top=
// -> Response<{ assets: { assetId, ticker, name, total }[], totalReceived }>
export const getDividendsSummaryByAsset = ({ dateFrom, dateTo, top } = {}) =>
  apiGet('dividends/GetSummaryByAsset', { dateFrom, dateTo, top });
