const dns = require('dns');
const mongoose = require('mongoose');

async function conectar() {
  // aceita MONGODB_URI (padrão) ou MONGO_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI não definida. Configure o arquivo .env.');

  // Opcional: em redes cujo DNS não resolve endereços "mongodb+srv" (erro querySrv ECONNREFUSED),
  // defina no .env:  DNS_SERVERS=8.8.8.8,1.1.1.1
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  }

  // dbName garante o banco "cinema" mesmo que a URI não termine com /cinema
  await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'cinema' });
  console.log(`MongoDB Atlas conectado (banco: ${mongoose.connection.name})`);
}

module.exports = conectar;
