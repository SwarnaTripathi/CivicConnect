const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const HashChainUtil = require('../utils/hashChain');

const QUORUM_THRESHOLD = 3;

// ── POST /api/quorum/:ticketId/vote ───────────────────────
router.post('/:ticketId/vote', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') return res.status(400).json({ message: 'Ticket already resolved' });
    if (ticket.status !== 'Pending_Verification') {
      return res.status(400).json({ message: 'Ticket is not pending verification' });
    }

    const voterIp = req.ip || req.connection.remoteAddress || 'anonymous';

    if (!Array.isArray(ticket.quorumVotes)) ticket.quorumVotes = [];

    // Prevent duplicate vote from same IP
    if (ticket.quorumVotes.includes(voterIp)) {
      return res.status(400).json({ message: 'Already voted' });
    }

    ticket.quorumVotes.push(voterIp);

    if (ticket.quorumVotes.length >= QUORUM_THRESHOLD) {
      ticket.status = 'Resolved';
      ticket.resolvedAt = new Date();

      await HashChainUtil.appendBlock(
        ticket._id,
        'QUORUM_RESOLVED',
        'quorum',
        { votes: ticket.quorumVotes.length }
      );

      const io = req.app.get('io');
      if (io) io.emit('ticket:resolved', ticket);
    }

    await ticket.save();

    res.json({
      votes: ticket.quorumVotes.length,
      threshold: QUORUM_THRESHOLD,
      resolved: ticket.status === 'Resolved',
      status: ticket.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
