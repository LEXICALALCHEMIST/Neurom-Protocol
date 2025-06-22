import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import db from '../db/db.js';

const router = express.Router();

router.get('/:userId/skel', authMiddleware, (req, res) => {
  console.log('GET /users/:userId/skel hit for user:', req.user.id); // Log
  db.get('SELECT current_skel FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: 'Failed to fetch skeleton' });
    }
    res.json({ current_skel: row.current_skel });
  });
});

router.post('/update-skel', authMiddleware, (req, res) => {
  console.log('POST /users/update-skel hit for user:', req.user.id, 'with newSKEL:', req.body.newSKEL); // Added log
  const { newSKEL } = req.body; // Only need newSKEL, userId from req.user.id
  if (newSKEL === undefined) {
    return res.status(400).json({ error: 'Missing required field: newSKEL' });
  }
  try {
    db.run('UPDATE users SET current_skel = ? WHERE id = ?', [newSKEL, req.user.id], (err) => {
      if (err) {
        console.error('Database update error:', err); // Added log
        return res.status(500).json({ error: 'Update failed' });
      }
      console.log('Database updated successfully for user:', req.user.id, 'to newSKEL:', newSKEL); // Added log
      res.status(200).json({ message: 'Skeleton updated', newSKEL });
    });
  } catch (error) {
    console.error('Server error during update:', error); // Added log
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;