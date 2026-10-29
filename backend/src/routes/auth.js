const router = require('express').Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { gerarToken, autenticar } = require('../middleware/auth');
const { HttpError, asyncHandler, texto } = require('../middleware/errors');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publico = (u) => ({ id: u._id, nome: u.nome, email: u.email, tipo_usuario: u.tipo_usuario });

// POST /api/auth/registrar  { nome, email, senha }
router.post('/registrar', asyncHandler(async (req, res) => {
  const nome = texto(req.body.nome)?.trim();
  const email = texto(req.body.email)?.trim().toLowerCase();
  const senha = texto(req.body.senha);

  if (!nome || nome.length < 2 || nome.length > 100) throw new HttpError(400, 'Informe um nome válido.');
  if (!email || !EMAIL.test(email)) throw new HttpError(400, 'Informe um e-mail válido.');
  if (!senha || senha.length < 8 || senha.length > 72) {
    throw new HttpError(400, 'A senha deve ter entre 8 e 72 caracteres.');
  }
  if (await Usuario.exists({ email })) throw new HttpError(409, 'Este e-mail já está cadastrado.');

  // tipo_usuario nunca vem do cliente: todo cadastro público é "cliente"
  const usuario = await Usuario.create({
    nome, email, tipo_usuario: 'cliente', senha_hash: await bcrypt.hash(senha, 10),
  });
  res.status(201).json({ token: gerarToken(usuario), usuario: publico(usuario) });
}));

// POST /api/auth/login  { email, senha }
router.post('/login', asyncHandler(async (req, res) => {
  const email = texto(req.body.email)?.trim().toLowerCase();
  const senha = texto(req.body.senha);
  if (!email || !senha) throw new HttpError(400, 'Informe e-mail e senha.');

  const usuario = await Usuario.findOne({ email }).select('+senha_hash');
  const ok = usuario && (await bcrypt.compare(senha, usuario.senha_hash));
  if (!ok) throw new HttpError(401, 'E-mail ou senha incorretos.');

  res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
}));

// GET /api/auth/eu
router.get('/eu', autenticar, (req, res) => res.json({ usuario: publico(req.usuario) }));

module.exports = router;
