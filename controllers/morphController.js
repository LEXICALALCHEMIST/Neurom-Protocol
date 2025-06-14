import MorphOp from '../models/MorphOp.js';

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
    const { intent, value, targetUsername, signature } = req.body;

    // Validate input
    if (!intent || !value || !targetUsername || !signature) {
      return res.status(400).json({ error: 'Missing required fields: intent, value, targetUsername, signature' });
    }
    if (!['PUSH', 'PULL'].includes(intent)) {
      return res.status(400).json({ error: 'Invalid intent: must be PUSH or PULL' });
    }
    if (value < 0) {
      return res.status(400).json({ error: 'Value must be non-negative' });
    }

    try {
      // Find target user by username
      const User = (await import('../models/User.js')).default;
      User.findByUsername(targetUsername, (err, targetUser) => {
        if (err) {
          console.error('MorphController: Failed to find target user:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        if (!targetUser) {
          return res.status(404).json({ error: 'Target user not found' });
        }

        // Create morph operation
        MorphOp.create(
          {
            userId: req.user.id,
            intent,
            value,
            targetId: targetUser.id,
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
};

export default morphController;