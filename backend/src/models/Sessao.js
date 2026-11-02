const { Schema, model } = require('mongoose');

// Regra de acesso de um público: gratuito, pago (com preço) ou fechado (não pode pegar ingresso)
const regraSchema = new Schema(
  {
    modo: { type: String, enum: ['gratuito', 'pago', 'fechado'], required: true },
    preco: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

// FILME (1) EXIBE (N) SESSAO | SALA (1) SEDIA (N) SESSAO
const sessaoSchema = new Schema(
  {
    data_hora: { type: Date, required: true },
    // quem pode assistir e quanto paga: Comunidade UNIFOR (e-mail @unifor.br) e Público externo
    publicos: {
      comunidade: { type: regraSchema, required: true },
      externo: { type: regraSchema, required: true },
    },
    id_filme: { type: Schema.Types.ObjectId, ref: 'Filme', required: true, index: true },
    id_sala: { type: Schema.Types.ObjectId, ref: 'Sala', required: true },
  },
  { timestamps: true, collection: 'sessoes' }
);

// uma sala não pode ter duas sessões no mesmo horário
sessaoSchema.index({ id_sala: 1, data_hora: 1 }, { unique: true });
sessaoSchema.index({ data_hora: 1 });

module.exports = model('Sessao', sessaoSchema);
