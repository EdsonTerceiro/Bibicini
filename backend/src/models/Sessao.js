const { Schema, model } = require('mongoose');

// FILME (1) EXIBE (N) SESSAO | SALA (1) SEDIA (N) SESSAO
const sessaoSchema = new Schema(
  {
    data_hora: { type: Date, required: true },
    preco: { type: Number, required: true, min: 0 },
    id_filme: { type: Schema.Types.ObjectId, ref: 'Filme', required: true, index: true },
    id_sala: { type: Schema.Types.ObjectId, ref: 'Sala', required: true },
  },
  { timestamps: true, collection: 'sessoes' }
);

// uma sala não pode ter duas sessões no mesmo horário
sessaoSchema.index({ id_sala: 1, data_hora: 1 }, { unique: true });
sessaoSchema.index({ data_hora: 1 });

module.exports = model('Sessao', sessaoSchema);
