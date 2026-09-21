const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  rawDescription: String,
  category: { 
    type: String, 
    enum: ['Roads', 'Drainage', 'Sanitation', 'Water Supply', 'Electricity', 'Other'],
    required: true 
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { 
    type: String, 
    enum: ['Submitted', 'Triaged', 'Assigned', 'In_Progress', 'Pending_Verification', 'Resolved'],
    default: 'Submitted'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  h3Index: { type: String, index: true },
  textEmbedding: { type: [Number], select: false },   // hidden from default queries
  wardId: { type: String, required: true },
  department: { type: String, required: true },
  isMaster: { type: Boolean, default: true },
  masterTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
  affectedCitizensCount: { type: Number, default: 1 },
  photos: {
    before: [String],
    after: [String]
  },
  // Checkpoint 5 — Proof-of-Fix Quorum
  proofOfFixUrl: { type: String, default: null },
  quorumVotes: { type: [String], default: [] },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

TicketSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Ticket', TicketSchema);
