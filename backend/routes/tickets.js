const express = require('express');
const router = express.Router();
const axios = require('axios');
const Ticket = require('../models/Ticket');
const HashChainUtil = require('../utils/hashChain');
const authMiddleware = require('../middleware/auth');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Helper: derive wardId from coordinates (simple mock) ──
function coordsToWard(lat, lng) {
  return `Ward-${Math.abs(Math.floor(lat * 10 + lng * 10) % 100 + 1)}`;
}

// ── POST /api/tickets — Submit new grievance ──────────────
router.post('/', async (req, res) => {
  try {
    const { description, rawDescription, latitude, longitude, category: hintCategory, wardId: hintWard } = req.body;

    if (!description || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'description, latitude, longitude are required' });
    }

    // 1. AI Triage
    let triageResult = { category: hintCategory || 'Other', priority: 'Medium', english_translation: description, suggested_department: 'Municipal Corporation' };
    try {
      const aiRes = await axios.post(`${AI_URL}/api/v1/triage`, { raw_text: description }, { timeout: 8000 });
      triageResult = { ...triageResult, ...aiRes.data };
    } catch (e) {
      console.warn('AI triage failed, using defaults:', e.message);
    }

    // 2. Get existing open tickets for deduplication
    const candidates = await Ticket.find({ isMaster: true, status: { $ne: 'Resolved' } })
      .select('_id h3Index textEmbedding')
      .limit(200)
      .lean();

    const dedupCandidates = candidates
      .filter(c => c.h3Index && c.textEmbedding)
      .map(c => ({ id: c._id.toString(), h3_index: c.h3Index, text_embedding: c.textEmbedding }));

    // 3. Deduplication
    let dedupResult = { is_duplicate: false, master_ticket_id: null, h3_index: null, embedding: [] };
    if (dedupCandidates.length > 0) {
      try {
        const dedupRes = await axios.post(`${AI_URL}/api/v1/deduplicate`, {
          latitude, longitude, description,
          candidates: dedupCandidates,
        }, { timeout: 10000 });
        dedupResult = dedupRes.data;
      } catch (e) {
        console.warn('Dedup failed:', e.message);
      }
    }

    if (dedupResult.is_duplicate && dedupResult.master_ticket_id) {
      // Increment affected citizens count on master
      await Ticket.findByIdAndUpdate(dedupResult.master_ticket_id, { $inc: { affectedCitizensCount: 1 } });
      return res.status(200).json({
        isDuplicate: true,
        masterTicketId: dedupResult.master_ticket_id,
        message: 'Duplicate detected — linked to existing ticket',
        similarityScore: dedupResult.similarity_score,
      });
    }

    // 4. Create new master ticket
    const ward = hintWard && hintWard !== 'auto' ? hintWard : coordsToWard(latitude, longitude);
    const ticket = new Ticket({
      title: description.slice(0, 80),
      description,
      rawDescription: rawDescription || description,
      category: triageResult.category,
      priority: triageResult.priority,
      status: 'Triaged',
      location: { type: 'Point', coordinates: [longitude, latitude] },
      h3Index: dedupResult.h3_index || null,
      textEmbedding: dedupResult.embedding || [],
      wardId: ward,
      department: triageResult.suggested_department,
      isMaster: true,
    });

    await ticket.save();

    // 5. Audit ledger genesis block
    await HashChainUtil.appendBlock(
      ticket._id,
      'TICKET_CREATED',
      'system',
      { category: ticket.category, priority: ticket.priority, ward }
    );

    // 6. Socket.IO broadcast
    const io = req.app.get('io');
    if (io) io.emit('ticket:new', ticket);

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Submit ticket error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// ── GET /api/tickets — List tickets with filters ──────────
router.get('/', async (req, res) => {
  try {
    const { category, status, priority, ward, limit = 200, skip = 0 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status = status;
    if (priority) filter.priority = priority;
    if (ward)     filter.wardId = ward;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-textEmbedding') // don't send large vectors to frontend
      .lean();

    res.json({ tickets, total: tickets.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/tickets/:id — Single ticket ─────────────────
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).select('-textEmbedding').lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/tickets/:id/resolve — Rep resolves ────────
router.patch('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { proofOfFixUrl } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const prevStatus = ticket.status;
    ticket.status = 'Pending_Verification';
    if (proofOfFixUrl) ticket.photos.after.push(proofOfFixUrl);
    ticket.resolvedAt = new Date();
    await ticket.save();

    // Append audit block
    await HashChainUtil.appendBlock(
      ticket._id,
      'RESOLVED',
      req.user.username,
      { proofOfFixUrl: proofOfFixUrl || null }
    );

    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', ticket);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
