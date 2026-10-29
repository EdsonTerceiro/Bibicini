const router = require('express').Router();
const Sala = require('../models/Sala');
const Sessao = require('../models/Sessao');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const { HttpError, asyncHandler, validarObjectId, pick } = require('../middleware/errors');

router.param('id', validarObjectId);

const resumo = (s) => ({ _id: s._id, numero: s.numero, capacidade: s.capacidade, total_assentos: s.assentos.length });

router.get('/', asyncHandler(async (req, res) => {
  const salas = await Sala.find().sort({ numero: 1 }).lean();
  res.json(salas.map(resumo));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const sala = await Sala.findById(req.params.id).lean();
  if (!sala) throw new HttpError(404, 'Sala não encontrada.');
  res.json(sala);
}));

// POST /api/salas  { numero, capacidade?, fileiras: ["A","B"], assentos_por_fileira: 8 }   (admin)
// Se "fileiras" e "assentos_por_fileira" forem enviados, os assentos são gerados automaticamente.
router.post('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const { numero, fileiras, assentos_por_fileira: porFileira } = req.body;
  let { capacidade } = req.body;
  const assentos = [];

  if (fileiras !== undefined || porFileira !== undefined) {
    const n = Number(porFileira);
    if (!Array.isArray(fileiras) || fileiras.length < 1 || fileiras.length > 26
        || !fileiras.every((f) => typeof f === 'string' && f.trim().length > 0)
        || !Number.isInteger(n) || n < 1 || n > 50) {
      throw new HttpError(400, 'Informe "fileiras" (até 26) e "assentos_por_fileira" (1 a 50).');
    }
    for (const f of fileiras) for (let i = 1; i <= n; i++) assentos.push({ fileira: f, numero: i });
    if (capacidade === undefined) capacidade = assentos.length;
  }
  res.status(201).json(await Sala.create({ numero, capacidade, assentos }));
}));

router.put('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const sala = await Sala.findById(req.params.id);
  if (!sala) throw new HttpError(404, 'Sala não encontrada.');
  Object.assign(sala, pick(req.body, ['numero', 'capacidade']));
  await sala.save();
  res.json(sala);
}));

router.delete('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  if (await Sessao.exists({ id_sala: req.params.id })) {
    throw new HttpError(409, 'Há sessões nesta sala. Exclua as sessões primeiro.');
  }
  const sala = await Sala.findByIdAndDelete(req.params.id);
  if (!sala) throw new HttpError(404, 'Sala não encontrada.');
  res.status(204).end();
}));

module.exports = router;
