import MorphOp from '../models/MorphOp.js';
import User from '../models/User.js';
import db from '../db/db.js';

// Run tests sequentially
db.serialize(() => {
  // Create testuser3 if not exists
  console.log('Test: Creating testuser3');
  User.signup(
    {
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: 'securepassword123',
    },
    (err, user3) => {
      if (err) {
        console.log('Test: testuser3 already exists or error:', err.message);
      } else {
        console.log('Test: Created testuser3:', user3);
      }

      // Create testuser4 if not exists
      console.log('Test: Creating testuser4');
      User.signup(
        {
          username: 'testuser4',
          email: 'testuser4@example.com',
          password: 'securepassword123',
        },
        (err, user4) => {
          if (err) {
            console.log('Test: testuser4 already exists or error:', err.message);
          } else {
            console.log('Test: Created testuser4:', user4);
          }

          // Create a morph operation
          console.log('Test: Creating morph op');
          MorphOp.create(
            {
              userId: user3?.id || '2',
              intent: 'PUSH',
              value: 100,
              targetId: user4?.id || '1',
              signature: 'dummy-signature',
            },
            (err, morphOp) => {
              if (err) {
                console.error('Test: Failed to create morph op:', err.message);
                return;
              }
              console.log('Test: Created morph op:', morphOp);
            }
          );

          // Get pending morph ops for testuser4
          console.log('Test: Fetching pending morph ops');
          MorphOp.getPendingByUserId(user4?.id || '1', (err, morphOps) => {
            if (err) {
              console.error('Test: Failed to fetch morph ops:', err.message);
              return;
            }
            console.log('Test: Pending morph ops:', morphOps);
          });

          // Update morph op status
          console.log('Test: Updating morph op status');
          MorphOp.updateStatus(1, 'COMPLETED', (err, result) => {
            if (err) {
              console.error('Test: Failed to update morph op:', err.message);
              return;
            }
            console.log('Test: Updated morph op:', result);
          });
        }
      );
    }
  );
});