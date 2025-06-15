import db from '../db/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// User model for managing user signup and data
export default class User {
  // Sign up a new user and initialize their MES
  static signup({ username, email, password }, callback) {
    // Validate input
    if (!username || !email || !password) {
      return callback(new Error('Missing required fields: username, email, password'));
    }

    // Check for existing username or email
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
        console.error('User: Failed to check existing user:', err.message);
        return callback(err);
      }
      if (row) {
        return callback(new Error('Username or email already exists'));
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('User: Failed to hash password:', err.message);
          return callback(err);
        }

        // Generate unique morph_id
        const morphId = uuidv4();

        // Insert user
        const query = `
          INSERT INTO users (username, email, password, morph_id, current_skel)
          VALUES (?, ?, ?, ?, ?)
        `;
        const params = [username, email, hashedPassword, morphId, 0];
        db.run(query, params, function (err) {
          if (err) {
            console.error('User: Failed to create user:', err.message);
            return callback(err);
          }
          console.log(`User: Created user ${username} with morph_id ${morphId}`);
          callback(null, {
            id: this.lastID.toString(), // Convert INTEGER to string for consistency
            username,
            email,
            morph_id: morphId,
            current_skel: 0,
          });
        });
      });
    });
  }

  // Find user by username (for login)
  static findByUsername(username, callback) {
    const query = `
      SELECT id, username, email, password, morph_id, current_skel
      FROM users
      WHERE username = ?
    `;
    db.get(query, [username], (err, row) => {
      if (err) {
        console.error('User: Failed to find user:', err.message);
        return callback(err);
      }
      if (row) {
        row.id = row.id.toString(); // Ensure id is string
      }
      callback(null, row);
    });
  }
}