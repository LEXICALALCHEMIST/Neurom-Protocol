import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/auth';

// Helper to make POST request
const postRequest = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
};

// Run tests sequentially
async function runTests() {
  // Test signup for testuser3
  console.log('Test: Starting signup test for testuser3');
  try {
    const signupResponse = await postRequest(`${BASE_URL}/signup`, {
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: 'securepassword123',
    });
    console.log('Test: Signup response:', signupResponse);
  } catch (err) {
    console.error('Test: Signup error:', err.message);
  }

  // Test login (success)
  console.log('Test: Starting login test');
  try {
    const loginResponse = await postRequest(`${BASE_URL}/login`, {
      username: 'testuser3',
      password: 'securepassword123',
    });
    console.log('Test: Login response:', loginResponse);
  } catch (err) {
    console.error('Test: Login error:', err.message);
  }

  // Test login (invalid password)
  console.log('Test: Starting invalid password test');
  try {
    const invalidPassResponse = await postRequest(`${BASE_URL}/login`, {
      username: 'testuser3',
      password: 'wrongpassword',
    });
    console.log('Test: Invalid password response:', invalidPassResponse);
  } catch (err) {
    console.error('Test: Invalid password error:', err.message);
  }

  // Test login (missing fields)
  console.log('Test: Starting missing fields test');
  try {
    const missingFieldsResponse = await postRequest(`${BASE_URL}/login`, {
      username: 'testuser3',
    });
    console.log('Test: Missing fields response:', missingFieldsResponse);
  } catch (err) {
    console.error('Test: Missing fields error:', err.message);
  }
}

runTests();