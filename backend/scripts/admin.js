// Cria um administrador ou troca a senha de um que já existe.
// Uso:  npm run admin -- <email> <nova-senha> [nome]
// Ex.:  npm run admin -- admin@unifor.br "Uma-Senha-Bem-Forte-2026"
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const conectar = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

async function main() {
  const [emailBruto, senha, ...nome] = process.argv.slice(2);
  const email = (emailBruto || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !senha) {
    console.error('Uso: npm run admin -- <email> <nova-senha> [nome]');
    process.exit(1);
  }
  if (senha.length < 12 || !/[a-z]/i.test(senha) || !/\d/.test(senha)) {
    console.error('Use uma senha forte: pelo menos 12 caracteres, com letras e números.');
    process.exit(1);
  }

  await conectar();
  const senha_hash = await bcrypt.hash(senha, 10);
  const existente = await Usuario.findOne({ email });
  if (existente) {
    existente.senha_hash = senha_hash;
    existente.tipo_usuario = 'admin'; // se era cliente, vira admin
    await existente.save();
    console.log(`Senha atualizada. ${email} agora é administrador.`);
  } else {
    await Usuario.create({ nome: nome.join(' ') || 'Administrador', email, tipo_usuario: 'admin', senha_hash });
    console.log(`Administrador criado: ${email}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
