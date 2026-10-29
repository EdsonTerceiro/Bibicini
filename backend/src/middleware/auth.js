const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { HttpError, asyncHandler } = require('./errors');

function gerarToken(usuario) {
  return jwt.sign({ sub: String(usuario._id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
}

// Exige "Authorization: Bearer <token>" e carrega o usuário em req.usuario
const autenticar = asyncHandler(async (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Autenticação necessária.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado.');
  }

  const usuario = await Usuario.findById(payload.sub).lean();
  if (!usuario) throw new HttpError(401, 'Usuário não encontrado.');
  req.usuario = usuario;
  next();
});

function exigirAdmin(req, res, next) {
  if (req.usuario?.tipo_usuario === 'admin') return next();
  next(new HttpError(403, 'Acesso restrito a administradores.'));
}

module.exports = { gerarToken, autenticar, exigirAdmin };
