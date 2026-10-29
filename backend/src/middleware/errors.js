class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const ehObjectId = (v) => typeof v === 'string' && OBJECT_ID.test(v);

// Permite usar async/await nas rotas sem try/catch
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Uso: router.param('id', validarObjectId)
function validarObjectId(req, res, next, valor) {
  if (!ehObjectId(valor)) return next(new HttpError(400, 'ID inválido.'));
  next();
}

// Copia só os campos permitidos (evita mass assignment)
function pick(obj = {}, campos = []) {
  const saida = {};
  for (const c of campos) if (obj[c] !== undefined) saida[c] = obj[c];
  return saida;
}

const texto = (v) => (typeof v === 'string' ? v : undefined);

function naoEncontrado(req, res, next) {
  next(new HttpError(404, 'Rota não encontrada.'));
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ erro: err.message });

  if (err.name === 'ValidationError') {
    const detalhes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ erro: `Valor inválido para "${err.path}".` });
  }
  if (err.code === 11000) {
    const campos = Object.keys(err.keyPattern || {});
    return res.status(409).json({ erro: 'Já existe um registro com esses dados.', campos });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = {
  HttpError, asyncHandler, validarObjectId, ehObjectId, pick, texto,
  naoEncontrado, tratarErros,
};
