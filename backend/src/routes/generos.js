const router = require('express').Router();
const Genero = require('../models/Genero');
const Filme = require('../models/Filme');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const { HttpError, asyncHandler, validarObjectId, pick } = require('../middleware/errors');

router.param('id', validarObjectId);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Genero.find().sort({ nome: 1 }).lean());
}));

router.post('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.status(201).json(await Genero.create(pick(req.body, ['nome'])));
}));

router.put('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const g = await Genero.findByIdAndUpdate(req.params.id, pick(req.body, ['nome']), {
    returnDocument: 'after', runValidators: true,
  });
  if (!g) throw new HttpError(404, 'Gênero não encontrado.');
  res.json(g);
}));

router.delete('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  if (await Filme.exists({ id_genero: req.params.id })) {
    throw new HttpError(409, 'Há filmes usando este gênero.');
  }
  const g = await Genero.findByIdAndDelete(req.params.id);
  if (!g) throw new HttpError(404, 'Gênero não encontrado.');
  res.status(204).end();
}));

module.exports = router;
