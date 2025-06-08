import express from 'express';
import pkg from 'sqlite3';
import cors from 'cors';

const { Database } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

const db = new Database('./sio.db', (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log('Connected to SQLite database: sio.db');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        currentSKEL INTEGER NOT NULL DEFAULT 6483
      )
    `);
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required.' });
  }

  const { createHash } = await import('node:crypto');
  const hashedPassword = createHash('sha256').update(password).digest('hex');
  db.get('SELECT * FROM users WHERE name = ? AND password = ?', [name, hashedPassword], (err, row) => {
    if (err) {
      console.error('Login query error:', err.message);
      return res.status(500).json({ error: 'Server error during login.' });
    }
    if (row) {
      return res.json({ id: row.id, currentSKEL: row.currentSKEL });
    } else {
      const id = `did:zeta:user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      db.run(
        'INSERT INTO users (id, name, password, currentSKEL) VALUES (?, ?, ?, ?)',
        [id, name, hashedPassword, 6483],
        (err) => {
          if (err) {
            console.error('Registration error:', err.message);
            return res.status(500).json({ error: 'Failed to register user.' });
          }
          res.json({ id, currentSKEL: 6483 });
        }
      );
    }
  });
});

// Update skeleton endpoint
app.post('/api/update-skel', (req, res) => {
  const { id, currentSKEL } = req.body;
  if (!id || currentSKEL === undefined) {
    return res.status(400).json({ error: 'ID and currentSKEL are required.' });
  }

  db.run(
    'UPDATE users SET currentSKEL = ? WHERE id = ?',
    [currentSKEL, id],
    (err) => {
      if (err) {
        console.error('Update error:', err.message);
        return res.status(500).json({ error: 'Failed to update skeleton.' });
      }
      res.json({ success: true, currentSKEL });
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`SIO API server running on port ${PORT}`);
});