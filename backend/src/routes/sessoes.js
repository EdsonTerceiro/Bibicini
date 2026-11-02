const router = require('express').Router();
const Sessao = require('../models/Sessao');
const Sala = require('../models/Sala');
const Filme = require('../models/Filme');
const Ingresso = require('../models/Ingresso');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const {
  HttpError, asyncHandler, validarObjectId, ehObjectId, pick, texto,
} = require('../middleware/errors');
const { normalizarPublicos } = require('../services/acesso');

router.param('id', validarObjectId);

const CAMPOS = ['data_hora', 'publicos', 'id_filme', 'id_sala'];

// Regra do Cinema UNIFOR: sessões a partir das 13:00 e nenhuma aos domingos (horário de Fortaleza)
const FUSO = process.env.FUSO_CINEMA || 'America/Fortaleza';
const HORA_ABERTURA = 13;
function validarHorario(data) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(data).map((p) => [p.type, p.value])
  );
  if (partes.weekday === 'Sun') throw new HttpError(400, 'O cinema não tem sessões aos domingos.');
  if (Number(partes.hour) < HORA_ABERTURA) {
    throw new HttpError(400, `As sessões começam a partir das ${HORA_ABERTURA}:00.`);
  }
}

async function validarReferencias(dados) {
  if (dados.data_hora !== undefined && Number.isNaN(new Date(dados.data_hora).getTime())) {
    throw new HttpError(400, 'data_hora inválida (use o formato ISO, ex.: 2026-11-05T20:00:00-03:00).');
  }
  if (dados.data_hora !== undefined) validarHorario(new Date(dados.data_hora));
  if (dados.publicos !== undefined) dados.publicos = normalizarPublicos(dados.publicos);
  if (dados.id_filme !== undefined
      && !(ehObjectId(dados.id_filme) && (await Filme.exists({ _id: dados.id_filme })))) {
    throw new HttpError(400, 'Filme inexistente.');
  }
  if (dados.id_sala !== undefined
      && !(ehObjectId(dados.id_sala) && (await Sala.exists({ _id: dados.id_sala })))) {
    throw new HttpError(400, 'Sala inexistente.');
  }
}

// GET /api/sessoes?id_filme=&data=2026-11-05&todas=1
// Por padrão lista só sessões futuras.
router.get('/', asyncHandler(async (req, res) => {
  const filtro = {};
  const idFilme = texto(req.query.id_filme);
  if (idFilme) {
    if (!ehObjectId(idFilme)) throw new HttpError(400, 'id_filme inválido.');
    filtro.id_filme = idFilme;
  }
  const data = texto(req.query.data);
  if (data) {
    const ini = new Date(`${data}T00:00:00`);
    if (Number.isNaN(ini.getTime())) throw new HttpError(400, 'Data inválida (use AAAA-MM-DD).');
    const fim = new Date(ini); fim.setDate(fim.getDate() + 1);
    filtro.data_hora = { $gte: ini, $lt: fim };
  } else if (!req.query.todas) {
    filtro.data_hora = { $gte: new Date() };
  }

  const sessoes = await Sessao.find(filtro)
    .populate('id_filme', 'titulo poster_path tmdb_id classificacao duracao_min')
    .populate('id_sala', 'nome capacidade')
    .sort({ data_hora: 1 }).limit(200).lean();
  res.json(sessoes);
}));

// GET /api/sessoes/:id/assentos  -> mapa de assentos com ocupação em tempo real
router.get('/:id/assentos', asyncHandler(async (req, res) => {
  const sessao = await Sessao.findById(req.params.id).lean();
  if (!sessao) throw new HttpError(404, 'Sessão não encontrada.');
  const sala = await Sala.findById(sessao.id_sala).lean();
  const ocupados = new Set(
    (await Ingresso.find({ id_sessao: sessao._id, ativo: true }).select('id_assento').lean())
      .map((i) => String(i.id_assento))
  );
  const assentos = sala.assentos
    .map((a) => ({
      _id: a._id, fileira: a.fileira, numero: a.numero,
      rotulo: `${a.fileira}${a.numero}`, ocupado: ocupados.has(String(a._id)),
    }))
    .sort((a, b) => a.fileira.localeCompare(b.fileira) || a.numero - b.numero);

  res.json({
    sessao: { _id: sessao._id, data_hora: sessao.data_hora, publicos: sessao.publicos, id_filme: sessao.id_filme },
    sala: { _id: sala._id, nome: sala.nome },
    assentos,
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const sessao = await Sessao.findById(req.params.id)
    .populate('id_filme', 'titulo poster_path tmdb_id classificacao duracao_min')
    .populate('id_sala', 'nome capacidade').lean();
  if (!sessao) throw new HttpError(404, 'Sessão não encontrada.');
  res.json(sessao);
}));

router.post('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const dados = pick(req.body, CAMPOS);
  if (dados.publicos === undefined) dados.publicos = null; // obrigatório ao criar
  await validarReferencias(dados);
  res.status(201).json(await Sessao.create(dados));
}));

router.put('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const dados = pick(req.body, CAMPOS);
  await validarReferencias(dados);
  const sessao = await Sessao.findByIdAndUpdate(req.params.id, dados, { returnDocument: 'after', runValidators: true });
  if (!sessao) throw new HttpError(404, 'Sessão não encontrada.');
  res.json(sessao);
}));

router.delete('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  if (await Ingresso.exists({ id_sessao: req.params.id, ativo: true })) {
    throw new HttpError(409, 'Há ingressos ativos nesta sessão. Cancele-os antes de excluir.');
  }
  const sessao = await Sessao.findByIdAndDelete(req.params.id);
  if (!sessao) throw new HttpError(404, 'Sessão não encontrada.');
  res.status(204).end();
}));

module.exports = router;
module.exports.validarHorario = validarHorario;
