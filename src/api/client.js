// Thin fetch wrapper for the InvestmentPortfolio API (.NET minimal API, v1 routes).
// Base URL comes from VITE_API_BASE_URL (see .env.example). Local defaults match launchSettings.json.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7220';

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${BASE_URL.replace(/\/+$/, '')}/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || (payload && payload.isSuccess === false)) {
    const message = payload?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload; // Response<T> or PagedResponse<T>
}

export const apiGet = (path, params) => request(path, { method: 'GET', params });
export const apiPost = (path, body) => request(path, { method: 'POST', body });
export const apiPut = (path, body) => request(path, { method: 'PUT', body });
export const apiPatch = (path, body) => request(path, { method: 'PATCH', body });
export const apiDelete = (path) => request(path, { method: 'DELETE' });
