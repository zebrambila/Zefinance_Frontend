// Maps to InvestmentPortfolio.Api Endpoints/Patrimony/* (route base: v1/patrimony/{Action})
import { apiGet } from './client';

// GET v1/patrimony/GetEvolutionByMonth?dateFrom=&dateTo=
// -> Response<{ months: { year, month, invested, marketValue }[] }>
export const getPatrimonyEvolutionByMonth = ({ dateFrom, dateTo } = {}) =>
  apiGet('patrimony/GetEvolutionByMonth', { dateFrom, dateTo });
