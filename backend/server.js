require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const conectar = require('./src/config/db');
const { naoEncontrado, tratarErros } = require('./src/middleware/errors');

function criarApp() {
  const app = express();
  // Na hospedagem (Render etc.) o site fica atrás de um proxy: sem isto, todos os usuários pareceriam ter o
  // mesmo IP e o limite de tentativas de login bloquearia todo mundo junto.
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

  // CSP desligada para não bloquear as fontes do Google e as imagens do TMDB usadas pelo frontend
  app.use(helmet({ contentSecurityPolicy: false }));
  const origens = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origens.length ? origens : true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
  });
  app.use('/api/auth', limiteAuth, require('./src/routes/auth'));
  app.use('/api/generos', require('./src/routes/generos'));
  app.use('/api/filmes', require('./src/routes/filmes'));
  app.use('/api/salas', require('./src/routes/salas'));
  app.use('/api/sessoes', require('./src/routes/sessoes'));
  app.use('/api/ingressos', require('./src/routes/ingressos'));
  app.use('/api/tmdb', require('./src/routes/tmdb'));
  app.use('/api/admin', require('./src/routes/admin'));
  app.use('/api', naoEncontrado);

  // Serve o frontend React já compilado (cd frontend && npm run build gera frontend/dist).
  // Mesma origem da API, então não há problemas de CORS.
  const pastaFront = process.env.FRONTEND_DIR
    || [path.join(__dirname, '..', 'frontend', 'dist'), path.join(__dirname, '..', 'cinema-unifor-site(1)')]
      .find((p) => fs.existsSync(p));
  if (pastaFront && fs.existsSync(pastaFront)) {
    app.use(express.static(pastaFront));
    // Páginas do React (/filmes, /entrar, /cadastro...) também devolvem o index.html
    const index = path.join(pastaFront, 'index.html');
    app.get(/^\/(?!api(\/|$)).*/, (req, res, next) => (fs.existsSync(index) ? res.sendFile(index) : next()));
  }

  app.use(tratarErros);
  return app;
}

async function iniciar() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    throw new Error('Defina JWT_SECRET (mínimo 16 caracteres) no arquivo .env.');
  }
  if (process.env.JWT_SECRET.length < 32 || /troque|segredo|secret|123/i.test(process.env.JWT_SECRET)) {
    console.warn('⚠️  JWT_SECRET fraco. Antes de publicar, gere um com:'
      + ' node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }
  await conectar();
  const porta = process.env.PORT || 3000;
  criarApp().listen(porta, () => console.log(`API rodando em http://localhost:${porta}`));
}

if (require.main === module) {
  iniciar().catch((err) => {
    console.error('Falha ao iniciar:', err.message);
    process.exit(1);
  });
}

module.exports = { criarApp };
