const crypto = require('crypto');
const mongoose = require('mongoose');
const router = require('express').Router();
const Ingresso = require('../models/Ingresso');
const Sessao = require('../models/Sessao');
const Cupom = require('../models/Cupom');
const { autenticar, exigirAdmin } = require('../middleware/auth');
const {
  HttpError, asyncHandler, validarObjectId, ehObjectId, texto,
} = require('../middleware/errors');

router.param('id', validarObjectId);

const MAX_ASSENTOS = 6;
const TIPOS = { inteira: 1, meia: 0.5, comunidade: 1 }; // fator aplicado sobre o preço da sessão
const arredondar = (n) => Math.round(n * 100) / 100;

const POPULAR = {
  path: 'id_sessao',
  populate: [
    { path: 'id_filme', select: 'titulo poster_path tmdb_id' },
    { path: 'id_sala', select: 'numero assentos' },
  ],
};

function descrever(i) {
  const sessao = i.id_sessao;
  const sala = sessao?.id_sala;
  const a = sala?.assentos?.id?.(i.id_assento);
  return {
    id: i._id,
    codigo_pedido: i.codigo_pedido,
    status: i.status,
    tipo_ingresso: i.tipo_ingresso,
    valor_pago: i.valor_pago,
    criado_em: i.createdAt,
    filme: sessao?.id_filme
      ? { id: sessao.id_filme._id, titulo: sessao.id_filme.titulo, poster_path: sessao.id_filme.poster_path }
      : null,
    sessao: sessao ? { id: sessao._id, data_hora: sessao.data_hora, sala: sala?.numero } : null,
    assento: a ? { fileira: a.fileira, numero: a.numero, rotulo: `${a.fileira}${a.numero}` } : null,
    usuario: i.id_usuario?.nome ? { id: i.id_usuario._id, nome: i.id_usuario.nome, email: i.id_usuario.email } : undefined,
  };
}

// POST /api/ingressos
// { id_sessao, assentos: ["<id>", ...], tipo_ingresso: "inteira|meia|comunidade", codigo_cupom?: "UNIFOR10" }
// O preço é SEMPRE calculado no servidor. Pagamento simulado: o ingresso já nasce como "pago".
router.post('/', autenticar, asyncHandler(async (req, res) => {
  const { id_sessao: idSessao, assentos } = req.body;
  const tipo = texto(req.body.tipo_ingresso) || 'inteira';
  const codigoCupom = texto(req.body.codigo_cupom)?.trim().toUpperCase();

  if (!ehObjectId(idSessao)) throw new HttpError(400, 'id_sessao inválido.');
  if (!Array.isArray(assentos) || assentos.length < 1 || assentos.length > MAX_ASSENTOS
      || !assentos.every(ehObjectId) || new Set(assentos).size !== assentos.length) {
    throw new HttpError(400, `Escolha de 1 a ${MAX_ASSENTOS} assentos distintos.`);
  }
  if (!(tipo in TIPOS)) throw new HttpError(400, 'tipo_ingresso inválido.');

  const sessao = await Sessao.findById(idSessao).populate('id_sala');
  if (!sessao) throw new HttpError(404, 'Sessão não encontrada.');
  if (sessao.data_hora <= new Date()) throw new HttpError(409, 'Esta sessão já começou ou já passou.');
  if (!assentos.every((id) => sessao.id_sala.assentos.id(id))) {
    throw new HttpError(400, 'Algum assento não pertence à sala desta sessão.');
  }

  let cupom = null;
  if (codigoCupom) {
    cupom = await Cupom.findOne({ codigo: codigoCupom });
    if (!cupom) throw new HttpError(400, 'Cupom inválido.');
  }

  const valor = arredondar(sessao.preco * TIPOS[tipo] * (cupom ? 1 - cupom.desconto / 100 : 1));
  const codigoPedido = `UNF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const docs = assentos.map((id) => ({
    codigo_pedido: codigoPedido, status: 'pago', tipo_ingresso: tipo, valor_pago: valor,
    id_usuario: req.usuario._id, id_sessao: sessao._id, id_assento: id, id_cupom: cupom?._id ?? null,
  }));

  // Transação: ou todos os assentos são reservados, ou nenhum.
  // O índice único (sessão + assento) garante que dois clientes nunca fiquem com o mesmo lugar.
  const sessaoDb = await mongoose.startSession();
  try {
    await sessaoDb.withTransaction(() => Ingresso.insertMany(docs, { session: sessaoDb }));
  } catch (err) {
    if (err.code === 11000 || err.writeErrors?.some?.((w) => w.code === 11000)) {
      throw new HttpError(409, 'Um ou mais assentos acabaram de ser ocupados. Escolha outros lugares.');
    }
    throw err;
  } finally {
    await sessaoDb.endSession();
  }

  const criados = await Ingresso.find({ codigo_pedido: codigoPedido }).populate(POPULAR);
  res.status(201).json({
    codigo_pedido: codigoPedido,
    total: arredondar(valor * assentos.length),
    ingressos: criados.map(descrever),
  });
}));

// GET /api/ingressos/meus
router.get('/meus', autenticar, asyncHandler(async (req, res) => {
  const lista = await Ingresso.find({ id_usuario: req.usuario._id }).sort({ createdAt: -1 }).populate(POPULAR);
  res.json(lista.map(descrever));
}));

// GET /api/ingressos?status=&pagina=1&limite=30   (admin)
router.get('/', autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const filtro = {};
  const status = texto(req.query.status);
  if (status) filtro.status = status;
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite, 10) || 30));
  const [lista, total] = await Promise.all([
    Ingresso.find(filtro).sort({ createdAt: -1 }).skip((pagina - 1) * limite).limit(limite)
      .populate(POPULAR).populate('id_usuario', 'nome email'),
    Ingresso.countDocuments(filtro),
  ]);
  res.json({ itens: lista.map(descrever), total, pagina, paginas: Math.ceil(total / limite) });
}));

// POST /api/ingressos/:id/cancelar  (dono do ingresso ou admin) -> libera o assento
router.post('/:id/cancelar', autenticar, asyncHandler(async (req, res) => {
  const ingresso = await Ingresso.findById(req.params.id).populate('id_sessao', 'data_hora');
  if (!ingresso) throw new HttpError(404, 'Ingresso não encontrado.');
  const dono = String(ingresso.id_usuario) === String(req.usuario._id);
  if (!dono && req.usuario.tipo_usuario !== 'admin') throw new HttpError(403, 'Este ingresso não é seu.');
  if (!['reservado', 'pago'].includes(ingresso.status)) {
    throw new HttpError(409, `Ingresso com status "${ingresso.status}" não pode ser cancelado.`);
  }
  if (ingresso.id_sessao.data_hora <= new Date()) throw new HttpError(409, 'A sessão já começou.');

  ingresso.status = 'cancelado';
  ingresso.ativo = false;
  await ingresso.save();
  res.json({ id: ingresso._id, status: ingresso.status });
}));

// POST /api/ingressos/:id/utilizar  (admin/funcionário) -> validação na entrada do cinema
router.post('/:id/utilizar', autenticar, asyncHandler(async (req, res) => {
  if (!['admin', 'funcionario'].includes(req.usuario.tipo_usuario)) {
    throw new HttpError(403, 'Acesso restrito à equipe do cinema.');
  }
  const ingresso = await Ingresso.findOneAndUpdate(
    { _id: req.params.id, status: 'pago' }, { status: 'utilizado' }, { returnDocument: 'after' }
  );
  if (!ingresso) throw new HttpError(409, 'Ingresso inexistente, não pago ou já utilizado.');
  res.json({ id: ingresso._id, status: ingresso.status });
}));

module.exports = router;
