const mongoose = require('mongoose');

const AuditLedgerSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  blockIndex: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  actorId: { type: String, required: true },
  payload: { type: Object, required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true }
});

module.exports = mongoose.model('AuditLedger', AuditLedgerSchema);
