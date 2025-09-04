import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVerifyAuthDirectly() {
  console.log('🧪 Test direct de verifyAuthServerSide...\n');

  // 1. Connexion pour obtenir un token
  console.log('🔐 Connexion pour obtenir un token...');
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('✅ Connexion réussie');
  
  // Récupérer le token du cookie
  const cookies = loginResponse.headers.get('set-cookie');
  let token = null;
  if (cookies) {
    const authCookie = cookies.split(',').find(cookie => cookie.includes('authToken='));
    if (authCookie) {
      token = authCookie.split('authToken=')[1]?.split(';')[0];
    }
  }
  
  console.log('🔑 Token extrait:', token ? token.substring(0, 50) + '...' : 'Aucun token');
  console.log('');

  // 2. Simuler la logique de verifyAuthServerSide
  console.log('🔍 Simulation de verifyAuthServerSide...');
  
  // Simuler le mode développement
  const NODE_ENV = 'development';
  console.log('🔧 NODE_ENV:', NODE_ENV);
  
  if (!token || NODE_ENV === 'development') {
    console.log('🔧 Mode développement - authentification simplifiée');
    console.log('🔍 Token disponible:', token ? 'Oui' : 'Non');
    
    // Essayer de récupérer l'utilisateur connecté via le token
    if (token) {
      try {
        console.log('🔍 Tentative de décodage du token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('🔍 Token décodé:', decoded);
        
        if (decoded && decoded.userId) {
          console.log('🔍 Recherche de l\'utilisateur avec ID:', decoded.userId);
          const userSession = await prisma.userSession.findUnique({
            where: { id: decoded.userId },
            include: { account: true }
          });
          
          if (userSession) {
            console.log('✅ Utilisateur trouvé:', userSession.firstName, userSession.userType);
            console.log('   - ID:', userSession.id);
            console.log('   - Session ID:', userSession.sessionId);
            console.log('   - Nom:', userSession.firstName, userSession.lastName);
            console.log('   - Type:', userSession.userType);
            console.log('   - Email:', userSession.account.email);
            console.log('   - Abonnement:', userSession.account.subscriptionType);
            console.log('');
            
            // Retourner les informations de l'utilisateur
            const userInfo = {
              id: userSession.id,
              sessionId: userSession.sessionId,
              firstName: userSession.firstName,
              lastName: userSession.lastName,
              email: userSession.account.email,
              userType: userSession.userType,
              subscriptionType: userSession.account.subscriptionType,
              isActive: userSession.isActive
            };
            
            console.log('✅ Utilisateur retourné:', userInfo);
            return userInfo;
            
          } else {
            console.log('❌ Utilisateur non trouvé en base de données');
          }
        } else {
          console.log('❌ Token invalide ou pas de userId');
        }
      } catch (error) {
        console.log('❌ Erreur décodage token:', error);
      }
    }
    
    // Fallback: récupérer le parent de test
    console.log('🔄 Utilisation du fallback parent...');
    const parent = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT',
        isActive: true
      },
      include: {
        account: true
      }
    });
    
    if (parent) {
      console.log('✅ Parent trouvé (fallback):', parent.firstName);
      console.log('   - ID:', parent.id);
      console.log('   - Type:', parent.userType);
      console.log('');
      
      const userInfo = {
        id: parent.id,
        sessionId: parent.sessionId,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.account.email,
        userType: parent.userType,
        subscriptionType: parent.account.subscriptionType,
        isActive: parent.isActive
      };
      
      console.log('✅ Parent retourné (fallback):', userInfo);
      return userInfo;
    } else {
      console.log('❌ Aucun parent trouvé');
      return null;
    }
  }

  await prisma.$disconnect();
  console.log('\n✅ Test terminé !');
}

testVerifyAuthDirectly().catch(console.error);

