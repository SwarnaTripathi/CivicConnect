const crypto = require('crypto');
const AuditLedger = require('../models/AuditLedger');

class HashChainUtil {
  static calculateHash(blockIndex, previousHash, timestamp, ticketId, action, actorId, payload) {
    const serializedPayload = JSON.stringify(payload);
    const dataString = `${blockIndex}${previousHash}${timestamp}${ticketId}${action}${actorId}${serializedPayload}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  static async appendBlock(ticketId, action, actorId, payload) {
    const lastBlock = await AuditLedger.findOne({ ticketId }).sort({ blockIndex: -1 });
    const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;
    const previousHash = lastBlock ? lastBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000";
    const timestamp = new Date().toISOString();

    const hash = this.calculateHash(blockIndex, previousHash, timestamp, ticketId.toString(), action, actorId, payload);

    const newBlock = new AuditLedger({
      ticketId,
      blockIndex,
      timestamp,
      action,
      actorId,
      payload,
      previousHash,
      hash
    });

    return await newBlock.save();
  }
}

module.exports = HashChainUtil;
