// Test Signup Debug Script
// Run this in browser console to see the actual error

const testSignup = async () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Test123456!';
  
  console.log('🔍 Testing signup with:', email);
  
  try {
    const response = await fetch('https://ofovfxsfazlwvcakpuer.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mb3ZmeHNmYXpsd3ZjYWtwdWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MDcsImV4cCI6MjA4NzcwMjQwN30.QYx8-c9IiSMpuHeikKz25MKO5o6g112AKj4Tnr4aWzI',
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          full_name: 'Test User',
        },
      }),
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (!response.ok) {
      console.error('❌ Signup failed:', data);
    } else {
      console.log('✅ Signup successful!');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testSignup();
