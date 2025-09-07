import fetch from 'node-fetch';

async function testCubeMatchRoutes() {
  try {
    console.log('🔍 Test des routes CubeMatch frontend...');
    
    // 1. Test route scores sans auth (devrait échouer)
    console.log('\n📡 Test route /api/cubematch/scores sans auth...');
    try {
      const response = await fetch('http://localhost:3000/api/cubematch/scores?limit=5');
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data);
    } catch (error) {
      console.log('Erreur:', error.message);
    }
    
    // 2. Test route stats sans auth
    console.log('\n📊 Test route /api/cubematch/stats sans auth...');
    try {
      const response = await fetch('http://localhost:3000/api/cubematch/stats');
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data);
    } catch (error) {
      console.log('Erreur:', error.message);
    }
    
    // 3. Test route leaderboard sans auth
    console.log('\n🏆 Test route /api/cubematch/leaderboard sans auth...');
    try {
      const response = await fetch('http://localhost:3000/api/cubematch/leaderboard');
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data);
    } catch (error) {
      console.log('Erreur:', error.message);
    }
    
    // 4. Test route user-stats sans auth
    console.log('\n👤 Test route /api/cubematch/user-stats sans auth...');
    try {
      const response = await fetch('http://localhost:3000/api/cubematch/user-stats');
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data);
    } catch (error) {
      console.log('Erreur:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCubeMatchRoutes();
