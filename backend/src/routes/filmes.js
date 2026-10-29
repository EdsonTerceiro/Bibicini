const router = require('express').Router();
const Filme = require('../models/Filme');
const Genero = require('../models/Genero');
const Sessao = require('../models/Sessao');
const Avaliacao = require('../models/Avaliacao');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const { tmdbGet } = require('../services/tmdb');
const {
  HttpError, asyncHandler, validarObjectId, ehObjectId, pick, texto,
} = require('../middleware/errors');

router.param('id', validarObjectId);

const CAMPOS = ['titulo', 'duracao_min', 'classificacao', 'id_genero', 'tmdb_id', 'poster_path', 'sinopse'];
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/filmes?busca=&genero=&pagina=1&limite=20
router.get('/', asyncHandler(async (req, res) => {
  const busca = texto(req.query.busca)?.trim();
  const genero = texto(req.query.genero);
  const filtro = {};
  if (busca) filtro.titulo = new RegExp(escapar(busca), 'i');
  if (genero) {
    if (!ehObjectId(genero)) throw new HttpError(400, 'Gênero inválido.');
    filtro.id_genero = genero;
  }
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(50, Math.max(1, parseInt(req.query.limite, 10) || 20));

  const [itens, total] = await Promise.all([
    Filme.find(filtro).populate('id_genero', 'nome').sort({ titulo: 1 })
      .skip((pagina - 1) * limite).limit(limite).lean(),
    Filme.countDocuments(filtro),
  ]);
  res.json({ itens, total, pagina, paginas: Math.ceil(total / limite) });
}));

// GET /api/filmes/tmdb/:tmdbId  -> encontra o filme do banco pelo id do TMDB
router.get('/tmdb/:tmdbId', asyncHandler(async (req, res) => {
  const tmdbId = parseInt(req.params.tmdbId, 10);
  if (!Number.isInteger(tmdbId)) throw new HttpError(400, 'ID do TMDB inválido.');
  const filme = await Filme.findOne({ tmdb_id: tmdbId }).populate('id_genero', 'nome').lean();
  if (!filme) throw new HttpError(404, 'Filme não cadastrado no cinema.');
  res.json(filme);
}));

// POST /api/filmes/importar-tmdb  { tmdb_id }   (admin)
router.post('/importar-tmdb', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const tmdbId = parseInt(req.body.tmdb_id, 10);
  if (!Number.isInteger(tmdbId)) throw new HttpError(400, 'Informe o tmdb_id.');
  if (await Filme.exists({ tmdb_id: tmdbId })) throw new HttpError(409, 'Este filme já foi importado.');

  const dados = await tmdbGet(`movie/${tmdbId}`, { language: 'pt-BR', append_to_response: 'release_dates' });

  const br = dados.release_dates?.results?.find((r) => r.iso_3166_1 === 'BR');
  const classificacao = br?.release_dates?.find((d) => d.certification)?.certification || 'Livre';
  const nomeGenero = dados.genres?.[0]?.name || 'Outros';
  const genero = await Genero.findOneAndUpdate(
    { nome: nomeGenero }, { nome: nomeGenero }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const filme = await Filme.create({
    titulo: dados.title,
    duracao_min: dados.runtime || 90,
    classificacao,
    id_genero: genero._id,
    tmdb_id: tmdbId,
    poster_path: dados.poster_path || undefined,
    sinopse: dados.overview || undefined,
  });
  res.status(201).json(filme);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const filme = await Filme.findById(req.params.id).populate('id_genero', 'nome').lean();
  if (!filme) throw new HttpError(404, 'Filme não encontrado.');
  res.json(filme);
}));

router.post('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const dados = pick(req.body, CAMPOS);
  if (!(ehObjectId(dados.id_genero) && (await Genero.exists({ _id: dados.id_genero })))) {
    throw new HttpError(400, 'Gênero inexistente.');
  }
  res.status(201).json(await Filme.create(dados));
}));

router.put('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const dados = pick(req.body, CAMPOS);
  if (dados.id_genero !== undefined
      && !(ehObjectId(dados.id_genero) && (await Genero.exists({ _id: dados.id_genero })))) {
    throw new HttpError(400, 'Gênero inexistente.');
  }
  const filme = await Filme.findByIdAndUpdate(req.params.id, dados, { returnDocument: 'after', runValidators: true });
  if (!filme) throw new HttpError(404, 'Filme não encontrado.');
  res.json(filme);
}));

router.delete('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  if (await Sessao.exists({ id_filme: req.params.id })) {
    throw new HttpError(409, 'Há sessões cadastradas para este filme. Exclua as sessões primeiro.');
  }
  const filme = await Filme.findByIdAndDelete(req.params.id);
  if (!filme) throw new HttpError(404, 'Filme não encontrado.');
  await Avaliacao.deleteMany({ id_filme: req.params.id });
  res.status(204).end();
}));

module.exports = router;
