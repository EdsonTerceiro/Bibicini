const router = require('express').Router();
const Cupom = require('../models/Cupom');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const { HttpError, asyncHandler, validarObjectId, pick, texto } = require('../middleware/errors');

router.param('id', validarObjectId);

// GET /api/cupons/validar/:codigo  (cliente logado confere o desconto antes de comprar)
router.get('/validar/:codigo', autenticar, asyncHandler(async (req, res) => {
  const cupom = await Cupom.findOne({ codigo: (texto(req.params.codigo) || '').toUpperCase() }).lean();
  if (!cupom) throw new HttpError(404, 'Cupom inválido.');
  res.json({ codigo: cupom.codigo, desconto: cupom.desconto });
}));

router.get('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.json(await Cupom.find().sort({ codigo: 1 }).lean());
}));

router.post('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.status(201).json(await Cupom.create(pick(req.body, ['codigo', 'desconto'])));
}));

router.delete('/:id', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const c = await Cupom.findByIdAndDelete(req.params.id);
  if (!c) throw new HttpError(404, 'Cupom não encontrado.');
  res.status(204).end();
}));

module.exports = router;
