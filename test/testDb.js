import db from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique morph_id for testing
const morphId = uuidv4();

// Test database by checking or inserting a dummy user
db.get('SELECT id FROM users WHERE id = ?', ['test-user-1'], (err, row) => {
  if (err) {
    console.error('Test: Failed to query user:', err.message);
    return;
  }
  if (row) {
    console.log('Test: Test user already exists, skipping insert');
  } else {
    db.run(
      'INSERT INTO users (id, public_key, current_skel) VALUES (?, ?, ?)',
      ['test-user-1', 'dummy-public-key', 1000],
      (err) => {
        if (err) {
          console.error('Test: Failed to insert user:', err.message);
          return;
        }
        console.log('Test: Inserted test user');
      }
    );
  }
});

// Insert a test morph operation
db.run(
  `INSERT INTO morph_ops (user_id, intent, value, target_id, signature, status, morph_id)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ['test-user-1', 'PUSH', 100, 'test-user-2', 'dummy-signature', 'PENDING', morphId],
  (err) => {
    if (err) {
      console.error('Test: Failed to insert morph op:', err.message);
      return;
    }
    console.log('Test: Inserted test morph op');
  }
);

// Query users table
db.all('SELECT * FROM users', (err, rows) => {
  if (err) {
    console.error('Test: Failed to query users:', err.message);
    return;
  }
  console.log('Test: Users table contents:', rows);
});

// Query morph_ops table
db.all('SELECT * FROM morph_ops WHERE status = "PENDING"', (err, rows) => {
  if (err) {
    console.error('Test: Failed to query morph_ops:', err.message);
    return;
  }
  console.log('Test: Morph_ops table contents (PENDING):', rows);
});

// Query peers table
db.all('SELECT * FROM peers', (err, rows) => {
  if (err) {
    console.error('Test: Failed to query peers:', err.message);
    return;
  }
  console.log('Test: Peers table contents:', rows);
});
db.run(
  'INSERT INTO users (id, public_key, current_skel) VALUES (?, ?, ?)',
  ['test-user-2', 'dummy-public-key-2', 0],
  (err) => {
    if (err) console.error('Test: Failed to insert test-user-2:', err.message);
    else console.log('Test: Inserted test-user-2');
  }
);