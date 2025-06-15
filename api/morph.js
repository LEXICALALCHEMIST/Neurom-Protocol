import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import morphController from '../controllers/morphController.js';

const router = express.Router();

// GET /morph/pending - Get pending morph operations for authenticated user
router.get('/pending', authMiddleware, morphController.getPending);

// POST /morph/create - Create a new morph operation
router.post('/create', authMiddleware, morphController.create);

// POST /morph/update - Update morph operation status
router.post('/update', authMiddleware, morphController.update);

// POST /morph/process - Process morph operations and collapse skeleton
router.post('/process', authMiddleware, morphController.process);

export default router;