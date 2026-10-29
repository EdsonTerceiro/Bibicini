const { Schema, model } = require('mongoose');

// USUARIO COMPRA | SESSAO GERA | ASSENTO RESERVA | CUPOM APLICA (opcional)
// id_assento guarda o _id do assento dentro de Sala.assentos
// codigo_pedido agrupa os ingressos comprados juntos (um ingresso por assento)
// ativo=false libera o assento (ingresso cancelado)
const ingressoSchema = new Schema(
  {
    codigo_pedido: { type: String, required: true, index: true },
    status: { type: String, enum: ['reservado', 'pago', 'cancelado', 'utilizado'], default: 'pago' },
    tipo_ingresso: { type: String, enum: ['inteira', 'meia', 'comunidade'], default: 'inteira' },
    valor_pago: { type: Number, required: true, min: 0 },
    ativo: { type: Boolean, default: true },
    id_usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    id_sessao: { type: Schema.Types.ObjectId, ref: 'Sessao', required: true },
    id_assento: { type: Schema.Types.ObjectId, required: true },
    id_cupom: { type: Schema.Types.ObjectId, ref: 'Cupom', default: null },
  },
  { timestamps: true, collection: 'ingressos' }
);

// impede vender o mesmo assento duas vezes na mesma sessão (ingressos cancelados não contam)
ingressoSchema.index(
  { id_sessao: 1, id_assento: 1 },
  { unique: true, partialFilterExpression: { ativo: true } }
);

module.exports = model('Ingresso', ingressoSchema);
