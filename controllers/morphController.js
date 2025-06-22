import MorphOp from '../models/MorphOp.js';
import Cube from '../models/Cube.js';

// Controller for morph operation logic
const morphController = {
  // Get pending morph operations for the authenticated user
  async getPending(req, res) {
    try {
      MorphOp.getPendingByUserId(req.user.id, (err, morphOps) => {
        if (err) {
          console.error('MorphController: Failed to get pending morph ops:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({
          message: 'Pending morph operations retrieved',
          morphOps,
        });
      });
    } catch (error) {
      console.error('MorphController: Get pending error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create a new morph operation
  async create(req, res) {
    const { intent, value, targetMorphId, signature } = req.body;

    // Validate input
    if (!intent || !value || !targetMorphId || !signature) {
      return res.status(400).json({ error: 'Missing required fields: intent, value, targetMorphId, signature' });
    }
    if (!['PUSH', 'PULL'].includes(intent)) {
      return res.status(400).json({ error: 'Invalid intent: must be PUSH or PULL' });
    }
    if (value < 0) {
      return res.status(400).json({ error: 'Value must be non-negative' });
    }

    try {
      // Validate targetMorphId exists in users.morph_id
      const User = (await import('../models/User.js')).default;
      User.findByMorphId(targetMorphId, (err, targetUser) => { // Assuming findByMorphId method
        if (err) {
          console.error('MorphController: Failed to find target user:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        if (!targetUser) {
          return res.status(404).json({ error: 'Target morph ID not found' });
        }

        // Create morph operation
        MorphOp.create(
          {
            userId: req.user.id, // Sender from authenticated user
            intent,
            value,
            targetId: targetUser.id, // Map targetMorphId to user.id
            signature,
          },
          (err, morphOp) => {
            if (err) {
              console.error('MorphController: Failed to create morph op:', err.message);
              return res.status(400).json({ error: err.message });
            }
            res.status(201).json({
              message: 'Morph operation created',
              morphOp,
            });
          }
        );
      });
    } catch (error) {
      console.error('MorphController: Create morph op error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update morph operation status
  async update(req, res) {
    const { morphOpId, status } = req.body;

    // Validate input
    if (!morphOpId || !status) {
      return res.status(400).json({ error: 'Missing required fields: morphOpId, status' });
    }
    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status: must be COMPLETED or FAILED' });
    }

    try {
      // Verify morphOp belongs to the user
      MorphOp.getPendingByUserId(req.user.id, (err, morphOps) => {
        if (err) {
          console.error('MorphController: Failed to verify morph op:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        const morphOp = morphOps.find((op) => op.id === parseInt(morphOpId));
        if (!morphOp) {
          return res.status(403).json({ error: 'Morph operation not found or not authorized' });
        }

        // Update status
        MorphOp.updateStatus(morphOpId, status, (err, result) => {
          if (err) {
            console.error('MorphController: Failed to update morph op:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.status(200).json({
            message: 'Morph operation updated',
            result,
          });
        });
      });
    } catch (error) {
      console.error('MorphController: Update morph op error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Process morph operations and collapse skeleton
  async process(req, res) {
    try {
      Cube.processMorphOps(req.user.id, (err, result) => {
        if (err) {
          console.error('MorphController: Failed to process morph ops:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({
          message: result.message,
          proof: result.proof,
        });
      });
    } catch (error) {
      console.error('MorphController: Process morph ops error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default morphController;