/**
 * Test script to verify backend returns all 30 users
 * Run with: node test-backend.js
 */

// Replace this with your actual Render backend URL
const BACKEND_URL = 'https://your-backend-url.onrender.com';

async function testBackend() {
  console.log('🔍 Testing backend API...\n');
  
  try {
    console.log(`Fetching: ${BACKEND_URL}/users/active`);
    const response = await fetch(`${BACKEND_URL}/users/active`);
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📊 Results:');
    console.log(`Total Users: ${data.users.length}`);
    console.log(`Total Active Users: ${data.stats.totalActiveUsers}`);
    console.log(`Total Clients: ${data.stats.totalUniqueClients}`);
    console.log(`Total Freelancers: ${data.stats.totalUniqueFreelancers}`);
    console.log(`Total XLM Released: ${data.stats.totalXlmEscrowed.toFixed(2)}`);
    
    if (data.users.length === 30) {
      console.log('\n✅ SUCCESS! Backend is returning all 30 users!');
      console.log('\nSample users:');
      data.users.slice(0, 5).forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`);
        console.log(`     Role: ${user.timesAsClient > 0 && user.timesAsFreelancer > 0 ? 'Client & Freelancer' : user.timesAsClient > 0 ? 'Client' : 'Freelancer'}`);
        console.log(`     Completed: ${user.completedMilestones}, Rating: ${user.averageRating}`);
      });
    } else {
      console.log(`\n⚠️  WARNING: Expected 30 users, got ${data.users.length}`);
      console.log('Backend needs to be redeployed or database needs to be seeded.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Backend URL is incorrect');
    console.log('2. Backend is not running');
    console.log('3. CORS is blocking the request');
  }
}

testBackend();
