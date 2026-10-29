const mongoose = require('mongoose');
const router = require('express').Router();
const Avaliacao = require('../models/Avaliacao');
const Filme = require('../models/Filme');
const { autenticar } = require('../middleware/auth');
const {
  HttpError, asyncHandler, validarObjectId, ehObjectId, texto,
} = require('../middleware/errors');

router.param('id', validarObjectId);

// GET /api/avaliacoes?id_filme=<id>
router.get('/', asyncHandler(async (req, res) => {
  const idFilme = texto(req.query.id_filme);
  if (!ehObjectId(idFilme)) throw new HttpError(400, 'Informe um id_filme válido.');

  const [itens, [stats]] = await Promise.all([
    Avaliacao.find({ id_filme: idFilme }).populate('id_usuario', 'nome').sort({ createdAt: -1 }).limit(100).lean(),
    Avaliacao.aggregate([
      { $match: { id_filme: new mongoose.Types.ObjectId(idFilme) } },
      { $group: { _id: null, media: { $avg: '$nota' }, total: { $sum: 1 } } },
    ]),
  ]);
  res.json({
    media: stats ? Math.round(stats.media * 10) / 10 : null,
    total: stats?.total ?? 0,
    itens,
  });
}));

// POST /api/avaliacoes  { id_filme, nota, comentario? }
router.post('/', autenticar, asyncHandler(async (req, res) => {
  const { id_filme: idFilme, nota } = req.body;
  if (!ehObjectId(idFilme) || !(await Filme.exists({ _id: idFilme }))) throw new HttpError(400, 'Filme inexistente.');
  try {
    const a = await Avaliacao.create({
      id_filme: idFilme, id_usuario: req.usuario._id, nota, comentario: texto(req.body.comentario),
    });
    res.status(201).json(a);
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Você já avaliou este filme.');
    throw err;
  }
}));

router.delete('/:id', autenticar, asyncHandler(async (req, res) => {
  const a = await Avaliacao.findById(req.params.id);
  if (!a) throw new HttpError(404, 'Avaliação não encontrada.');
  if (String(a.id_usuario) !== String(req.usuario._id) && req.usuario.tipo_usuario !== 'admin') {
    throw new HttpError(403, 'Esta avaliação não é sua.');
  }
  await a.deleteOne();
  res.status(204).end();
}));

module.exports = router;
