const router = require('express').Router();
const { tmdbGet } = require('../services/tmdb');
const { HttpError, asyncHandler } = require('../middleware/errors');

// Proxy do TMDB: a chave fica no servidor e nunca chega ao navegador.
// Só os caminhos abaixo são repassados.
const CAMINHOS = [
  /^movie\/now_playing$/, /^movie\/popular$/, /^movie\/upcoming$/,
  /^movie\/\d+$/, /^genre\/movie\/list$/, /^search\/movie$/,
];
const PARAMETROS = ['language', 'page', 'region', 'query', 'append_to_response'];

// Ex.: GET /api/tmdb/movie/now_playing?language=pt-BR&region=BR&page=1
router.get('/*', asyncHandler(async (req, res) => {
  const caminho = req.params[0].replace(/\/+$/, '');
  if (!CAMINHOS.some((r) => r.test(caminho))) throw new HttpError(404, 'Caminho do TMDB não permitido.');

  const params = {};
  for (const p of PARAMETROS) {
    const v = req.query[p];
    if (typeof v === 'string' && v.length <= 100 && /^[\p{L}\p{N} _,.\-:']*$/u.test(v)) params[p] = v;
  }
  res.json(await tmdbGet(caminho, params));
}));

module.exports = router;
