import db from './db/db.js';
import { v4 as uuidv4 } from 'uuid';

// Insert a morph operation into morph_ops
const insertMorphOp = () => {
  const morphId = uuidv4();
  const query = `
    INSERT INTO morph_ops (user_id, intent, value, target_id, signature, status, morph_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [2, 'PUSH', 200, 1, 'dummy-signature-2', 'PENDING', morphId];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Insert: Failed to insert morph op:', err.message);
      process.exit(1);
    }
    console.log(`Insert: Created morph op with ID ${this.lastID}, morph_id ${morphId}`);
    process.exit(0);
  });
};

// Run the insertion
insertMorphOp();