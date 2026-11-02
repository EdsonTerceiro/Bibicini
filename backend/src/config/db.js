const dns = require('dns');
const mongoose = require('mongoose');

// Guarda a conexão em andamento para reaproveitá-la. Na Vercel, a mesma instância da função atende
// várias requisições: sem isto, cada uma abriria uma conexão nova com o Atlas.
let conexao = null;

async function conectar() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (conexao) return conexao;

  // aceita MONGODB_URI (padrão) ou MONGO_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI não definida. Configure o arquivo .env.');

  // Opcional: em redes cujo DNS não resolve endereços "mongodb+srv" (erro querySrv ECONNREFUSED),
  // defina no .env:  DNS_SERVERS=8.8.8.8,1.1.1.1
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  }

  // dbName garante o banco "cinema" mesmo que a URI não termine com /cinema
  conexao = mongoose
    .connect(uri, { dbName: process.env.DB_NAME || 'cinema', serverSelectionTimeoutMS: 8000 })
    .then(() => {
      console.log(`MongoDB Atlas conectado (banco: ${mongoose.connection.name})`);
      return mongoose.connection;
    })
    .catch((err) => {
      conexao = null; // permite tentar de novo na próxima requisição
      throw err;
    });
  return conexao;
}

module.exports = conectar;
