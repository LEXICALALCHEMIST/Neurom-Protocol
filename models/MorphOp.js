import db from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

// MorphOp model for managing morph operations in the MES
export default class MorphOp {
  // Create a new morph operation (add to MES mailbox)
  static create({ userId, intent, value, targetId, signature }, callback) {
    // Validate input
    if (!userId || !['PUSH', 'PULL'].includes(intent) || !value || !targetId || !signature) {
      return callback(new Error('Missing or invalid fields: userId, intent, value, targetId, signature'));
    }
    if (value < 0) {
      return callback(new Error('Value must be non-negative'));
    }

    // Generate unique morph_id
    const morphId = uuidv4();

    const query = `
      INSERT INTO morph_ops (user_id, intent, value, target_id, signature, status, morph_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [userId, intent, value, targetId, signature, 'PENDING', morphId];
    db.run(query, params, function (err) {
      if (err) {
        console.error('MorphOp: Failed to create morph op:', err.message);
        return callback(err);
      }
      console.log(`MorphOp: Created morph op with ID ${this.lastID}, morph_id ${morphId}`);
      callback(null, {
        id: this.lastID,
        user_id: userId,
        intent,
        value,
        target_id: targetId,
        signature,
        status: 'PENDING',
        morph_id: morphId,
      });
    });
  }

  // Get pending morph operations for a user (open MES mailbox)
  static getPendingByUserId(userId, callback) {
    const query = `
      SELECT id, user_id, intent, value, target_id, signature, status, morph_id, created_at
      FROM morph_ops
      WHERE target_id = ? AND status = 'PENDING'
    `;
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('MorphOp: Failed to get pending morph ops:', err.message);
        return callback(err);
      }
      console.log(`MorphOp: Fetched ${rows.length} pending morph ops for user ${userId}`);
      callback(null, rows);
    });
  }

  // Update morph operation status (e.g., after processing)
  static updateStatus(morphOpId, status, callback) {
    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return callback(new Error('Invalid status: must be COMPLETED or FAILED'));
    }
    const query = `
      UPDATE morph_ops
      SET status = ?
      WHERE id = ?
    `;
    db.run(query, [status, morphOpId], function (err) {
      if (err) {
        console.error('MorphOp: Failed to update morph op status:', err.message);
        return callback(err);
      }
      console.log(`MorphOp: Updated morph op ${morphOpId} to status ${status}`);
      callback(null, { id: morphOpId, status });
    });
  }
}