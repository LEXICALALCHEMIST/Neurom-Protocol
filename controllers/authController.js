import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

// Controller for authentication logic
const authController = {
  // Handle user signup
  async signup(req, res) {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: username, email, password' });
    }

    try {
      // Call User model to sign up
      User.signup({ username, email, password }, (err, user) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            morph_id: user.morph_id,
            current_skel: user.current_skel,
          },
        });
      });
    } catch (error) {
      console.error('AuthController: Signup error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Handle user login
  async login(req, res) {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing required fields: username, password' });
    }

    try {
      // Find user
      User.findByUsername(username, async (err, user) => {
        if (err) {
          console.error('AuthController: Login error:', err.message);
          return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT
        const token = generateToken({ id: user.id, username: user.username });

        res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            morph_id: user.morph_id,
            current_skel: user.current_skel,
          },
        });
      });
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default authController;