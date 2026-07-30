// Maps to InvestmentPortfolio.Api Endpoints/Assets/* (route base: v1/assets/{Action})
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';

// EAssetType enum names, serialized as strings (JsonStringEnumConverter is global)
export const EAssetType = { Acoes: 'Ações', FIIs: 'FIIs' };

// GET v1/assets/GetAllAssets?pageNumber=&pageSize=&type= -> PagedResponse<AssetSummary[]>
// Response items use "assetId" (not "id") and include computed position fields:
// { assetId, ticker, name, type, currentPrice, positionQuantity, averagePrice, totalInvested, currentTotalValue }
export const listAssets = ({ pageNumber = 1, pageSize = 25, type } = {}) =>
  apiGet('assets/GetAllAssets', { pageNumber, pageSize, type });

// GET v1/assets/GetAssetById/{id} -> Response<Asset>
export const getAsset = (id) => apiGet(`assets/GetAssetById/${id}`);

// POST v1/assets/CreateAsset  body: { ticker, name?, type, price? } -> Response<Asset>
export const createAsset = (data) => apiPost('assets/CreateAsset', data);

// PUT v1/assets/UpdateAsset/{id}  body: { ticker, name?, type, price? } -> Response<Asset>
export const updateAsset = (id, data) => apiPut(`assets/UpdateAsset/${id}`, data);

// PATCH v1/assets/{id}/price  body: { currentPrice } -> Response<Asset>
export const updateAssetPrice = (id, currentPrice) =>
  apiPatch(`assets/${id}/price`, { currentPrice });

// POST v1/assets/sync-prices -> Response<int> (count of assets updated via Yahoo Finance)
export const syncAssetPrices = () => apiPost('assets/sync-prices');

// DELETE v1/assets/DeleteAsset/{id} -> Response<Asset> (soft delete)
export const deleteAsset = (id) => apiDelete(`assets/DeleteAsset/${id}`);

// POST v1/assets/BulkCreateAssets
// body: { assets: { ticker, name?, type, price? }[] }
// -> Response<{ created: { row, assetId, ticker }[], failed: { row, ticker, error }[] }>
export const bulkCreateAssets = (assets) => apiPost('assets/BulkCreateAssets', { assets });

// POST v1/assets/BackfillPrices  body: { months? } (default 12)
// -> Response<{ processed: { assetId, ticker, monthsFilled }[], failed: { assetId, ticker, error }[] }>
// Runs the BackfillAsync routine to populate historical closing prices (AssetPriceHistory).
export const backfillAssetPrices = ({ months = 12 } = {}) => apiPost('assets/BackfillPrices', { months });

// GET v1/assets/{ticker}/dividends?months=&from=&to=
// -> Response<{ date, amount }[]>
// Queries Yahoo Finance for the ticker's dividend payment events and inserts any new ones
// into the asset's registered dividends server-side. NOTE: this endpoint uses "from"/"to"
// (not "dateFrom"/"dateTo" like the other list endpoints) — they take priority over months
// when provided. Callers should refresh their dividend list after this resolves.
export const syncAssetDividends = (ticker, { months, dateFrom, dateTo } = {}) =>
  apiGet(`assets/${ticker}/dividends`, { months, from: dateFrom, to: dateTo });
