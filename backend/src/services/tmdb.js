const { HttpError } = require('../middleware/errors');

const BASE = 'https://api.themoviedb.org/3';
const cache = new Map(); // cache simples em memória (5 minutos)
const TTL = 5 * 60 * 1000;

async function tmdbGet(caminho, params = {}) {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) throw new HttpError(503, 'TMDB_API_KEY não está configurada no servidor.');

  const url = new URL(`${BASE}/${caminho}`);
  const headers = { accept: 'application/json' };
  // Token v4 (JWT) vai no header; chave v3 vai na query
  if (chave.startsWith('eyJ')) headers.Authorization = `Bearer ${chave}`;
  else url.searchParams.set('api_key', chave);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }

  const id = url.pathname + url.search.replace(/api_key=[^&]*&?/, '');
  const guardado = cache.get(id);
  if (guardado && guardado.expira > Date.now()) return guardado.dados;

  let resp;
  try {
    resp = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  } catch {
    throw new HttpError(502, 'Não foi possível acessar o TMDB.');
  }
  if (!resp.ok) {
    throw new HttpError(resp.status === 404 ? 404 : 502, `O TMDB respondeu com erro (${resp.status}).`);
  }
  const dados = await resp.json();
  cache.set(id, { dados, expira: Date.now() + TTL });
  return dados;
}

module.exports = { tmdbGet };
