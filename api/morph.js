import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import morphController from '../controllers/morphController.js';

const router = express.Router();

// GET /morph/pending - Get pending morph operations for authenticated user
router.get('/pending', authMiddleware, morphController.getPending);

// POST /morph/create - Create a new morph operation
router.post('/create', authMiddleware, morphController.create);

export default router;