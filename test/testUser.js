import User from '../models/User.js';

   // Test user signup
   User.signup(
     {
       username: 'testuser1',
       email: 'testuser1@example.com',
       password: 'securepassword123',
     },
     (err, user) => {
       if (err) {
         console.error('Test: Failed to sign up user:', err.message);
         return;
       }
       console.log('Test: Signed up user:', user);
     }
   );

   // Test duplicate signup
   User.signup(
     {
       username: 'testuser1',
       email: 'testuser1@example.com',
       password: 'securepassword123',
     },
     (err, user) => {
       if (err) {
         console.log('Test: Expected error for duplicate user:', err.message);
         return;
       }
       console.error('Test: Unexpected success for duplicate user');
     }
   );

   // Test find user
   User.findByUsername('testuser1', (err, user) => {
     if (err) {
       console.error('Test: Failed to find user:', err.message);
       return;
     }
     console.log('Test: Found user:', user);
   });