const router = require('express').Router();
const Filme = require('../models/Filme');
const Sessao = require('../models/Sessao');
const Sala = require('../models/Sala');
const Usuario = require('../models/Usuario');
const Ingresso = require('../models/Ingresso');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

// GET /api/admin/resumo  -> indicadores do painel administrativo
router.get('/resumo', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const [filmes, salas, usuarios, sessoesFuturas, porStatus, [receita]] = await Promise.all([
    Filme.countDocuments(),
    Sala.countDocuments(),
    Usuario.countDocuments(),
    Sessao.countDocuments({ data_hora: { $gte: new Date() } }),
    Ingresso.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
    Ingresso.aggregate([
      { $match: { status: { $in: ['pago', 'utilizado'] } } },
      { $group: { _id: null, total: { $sum: '$valor_pago' } } },
    ]),
  ]);
  res.json({
    filmes, salas, usuarios, sessoes_futuras: sessoesFuturas,
    ingressos_por_status: Object.fromEntries(porStatus.map((s) => [s._id, s.total])),
    receita: Math.round((receita?.total ?? 0) * 100) / 100,
  });
}));

module.exports = router;
