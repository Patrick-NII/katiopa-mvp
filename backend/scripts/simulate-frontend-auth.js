import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateFrontendAuth() {
  console.log('🔍 Simulation de l\'authentification frontend...\n');

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

  if (!loginResponse.ok) {
    console.error('❌ Échec de la connexion');
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✅ Connexion réussie');
  console.log('📋 Utilisateur connecté:', loginData.data.userSession.firstName, loginData.data.userSession.userType);
  
  // Extraire le token du cookie
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
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 Token disponible:', token ? 'Oui' : 'Non');
  console.log('🔍 Token complet:', token);

  // Simuler la récupération depuis Authorization header
  const authHeader = `Bearer ${token}`;
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  console.log('🔍 Token depuis Authorization header:', authToken ? 'Oui' : 'Non');
  console.log('🔍 Authorization header complet:', authHeader);
  
  const finalToken = token || authToken;
  console.log('🔍 Token final utilisé:', finalToken ? 'Oui' : 'Non');
  console.log('🔍 Token final complet:', finalToken);

  // En mode développement, utiliser une approche simplifiée
  if (!finalToken || process.env.NODE_ENV === 'development') {
    console.log('🔧 Mode développement - authentification simplifiée');
    console.log('🔍 Token disponible:', finalToken ? 'Oui' : 'Non');
    
    // Essayer de récupérer l'utilisateur connecté via le token
    if (finalToken) {
      try {
        console.log('🔍 Tentative de décodage du token...');
        const decoded = jwt.verify(finalToken, process.env.JWT_SECRET || 'your-secret-key');
        console.log('🔍 Token décodé:', decoded);
        
        if (decoded && decoded.userId) {
          console.log('🔍 Recherche de l\'utilisateur avec ID:', decoded.userId);
          const userSession = await prisma.userSession.findUnique({
            where: { id: decoded.userId },
            include: { account: true }
          });
          
          if (userSession) {
            console.log('✅ Utilisateur trouvé en mode dev:', userSession.firstName, userSession.userType);
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
        console.log('❌ Erreur décodage token en mode dev:', error);
      }
    }
    
    // Si aucun utilisateur trouvé, retourner null
    console.log('❌ Aucun utilisateur authentifié trouvé');
    return null;
  }

  console.log('✅ Simulation terminée !');
}

simulateFrontendAuth().catch(console.error);
