const { Schema, model } = require('mongoose');

// GENERO (1) CLASSIFICA (N) FILME
// tmdb_id liga o filme do seu banco ao filme do TMDB (pôster, sinopse, trailer).
const filmeSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 150 },
    duracao_min: { type: Number, required: true, min: 1, validate: Number.isInteger },
    classificacao: { type: String, required: true, trim: true, maxlength: 20 },
    id_genero: { type: Schema.Types.ObjectId, ref: 'Genero', required: true, index: true },
    tmdb_id: { type: Number, validate: Number.isInteger },
    poster_path: { type: String, trim: true },
    sinopse: { type: String, trim: true },
  },
  { timestamps: true, collection: 'filmes' }
);

filmeSchema.index({ tmdb_id: 1 }, { unique: true, partialFilterExpression: { tmdb_id: { $type: 'number' } } });
filmeSchema.index({ titulo: 1 });

module.exports = model('Filme', filmeSchema);
