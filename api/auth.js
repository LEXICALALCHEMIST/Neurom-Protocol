import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// POST /auth/signup - Register a new user
router.post('/signup', authController.signup);

// POST /auth/login - Authenticate a user
router.post('/login', authController.login);

export default router;