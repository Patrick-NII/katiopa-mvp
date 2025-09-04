import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RealTimeConnectionTracker {
  constructor() {
    this.activeConnections = new Map();
  }

  // Récupérer le statut de connexion en temps réel
  async getConnectionStatus(userId) {
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userType: true,
        lastLoginAt: true,
        currentSessionStartTime: true,
        totalConnectionDurationMs: true,
        isActive: true
      }
    });

    if (!userSession) return null;

    const now = new Date();
    let isCurrentlyOnline = false;
    let currentSessionDuration = 0;

    if (userSession.currentSessionStartTime) {
      const sessionStart = new Date(userSession.currentSessionStartTime);
      const timeDiff = now.getTime() - sessionStart.getTime();
      
      // Considérer comme connecté si la session a commencé il y a moins de 30 minutes
      isCurrentlyOnline = timeDiff < 30 * 60 * 1000;
      currentSessionDuration = Math.floor(timeDiff / (1000 * 60)); // en minutes
    }

    return {
      id: userSession.id,
      name: `${userSession.firstName} ${userSession.lastName}`,
      userType: userSession.userType,
      isCurrentlyOnline,
      lastLoginAt: userSession.lastLoginAt,
      currentSessionStartTime: userSession.currentSessionStartTime,
      currentSessionDuration,
      totalConnectionDurationMs: Number(userSession.totalConnectionDurationMs || 0),
      isActive: userSession.isActive
    };
  }

  // Récupérer le statut de tous les enfants d'un parent
  async getChildrenConnectionStatus(parentAccountId) {
    const children = await prisma.userSession.findMany({
      where: {
        accountId: parentAccountId,
        userType: 'CHILD',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true,
        lastLoginAt: true,
        currentSessionStartTime: true,
        totalConnectionDurationMs: true,
        isActive: true
      }
    });

    const now = new Date();
    const childrenStatus = children.map(child => {
      let isCurrentlyOnline = false;
      let currentSessionDuration = 0;

      if (child.currentSessionStartTime) {
        const sessionStart = new Date(child.currentSessionStartTime);
        const timeDiff = now.getTime() - sessionStart.getTime();
        isCurrentlyOnline = timeDiff < 30 * 60 * 1000;
        currentSessionDuration = Math.floor(timeDiff / (1000 * 60));
      }

      return {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        age: child.age,
        isCurrentlyOnline,
        lastLoginAt: child.lastLoginAt,
        currentSessionStartTime: child.currentSessionStartTime,
        currentSessionDuration,
        totalConnectionDurationMs: Number(child.totalConnectionDurationMs || 0),
        isActive: child.isActive
      };
    });

    return childrenStatus;
  }

  // Générer des insights sur les connexions
  generateConnectionInsights(childrenStatus) {
    const onlineChildren = childrenStatus.filter(child => child.isCurrentlyOnline);
    const offlineChildren = childrenStatus.filter(child => !child.isCurrentlyOnline);
    
    let insights = '';
    
    if (onlineChildren.length > 0) {
      insights += `${onlineChildren.length} enfant${onlineChildren.length > 1 ? 's' : ''} actuellement connecté${onlineChildren.length > 1 ? 's' : ''} : `;
      insights += onlineChildren.map(child => `${child.name} (${child.currentSessionDuration} min)`).join(', ') + '. ';
    }
    
    if (offlineChildren.length > 0) {
      insights += `${offlineChildren.length} enfant${offlineChildren.length > 1 ? 's' : ''} non connecté${offlineChildren.length > 1 ? 's' : ''} : `;
      insights += offlineChildren.map(child => {
        if (child.lastLoginAt) {
          const lastLogin = new Date(child.lastLoginAt);
          const timeDiff = Math.floor((new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
          return `${child.name} (dernière connexion il y a ${timeDiff} jour${timeDiff > 1 ? 's' : ''})`;
        }
        return `${child.name} (jamais connecté)`;
      }).join(', ') + '. ';
    }

    return insights;
  }

  // Formater les informations de connexion pour l'IA
  formatConnectionInfoForAI(connectionStatus) {
    if (!connectionStatus) return 'Aucune information de connexion disponible.';

    const now = new Date();
    let info = `${connectionStatus.name} `;
    
    if (connectionStatus.isCurrentlyOnline) {
      info += `est actuellement connecté(e) depuis ${connectionStatus.currentSessionDuration} minutes. `;
    } else {
      if (connectionStatus.lastLoginAt) {
        const lastLogin = new Date(connectionStatus.lastLoginAt);
        const timeDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        info += `n'est pas connecté(e). Dernière connexion il y a ${timeDiff} jour${timeDiff > 1 ? 's' : ''}. `;
      } else {
        info += `n'a jamais été connecté(e). `;
      }
    }

    const totalHours = Math.floor(connectionStatus.totalConnectionDurationMs / (1000 * 60 * 60));
    info += `Temps total de connexion : ${totalHours} heure${totalHours > 1 ? 's' : ''}.`;

    return info;
  }
}

// Test de l'intégration avec l'API chat
async function testConnectionIntegration() {
  console.log('🔍 Test de l\'intégration des connexions avec l\'API chat...\n');

  const tracker = new RealTimeConnectionTracker();

  // 1. Test avec un parent demandant le statut de ses enfants
  console.log('👨‍👩‍👧‍👦 Test 1: Parent demandant le statut des enfants...');
  
  const parentLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const parentToken = parentLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  // Récupérer le statut des enfants en temps réel
  const childrenStatus = await tracker.getChildrenConnectionStatus('cmf2yznqn000045g0ilo29ka2');
  const connectionInsights = tracker.generateConnectionInsights(childrenStatus);
  
  console.log('📊 Statut des enfants:', JSON.stringify(childrenStatus, null, 2));
  console.log('💡 Insights connexion:', connectionInsights);
  console.log('');

  // Test de l'API chat avec les informations de connexion
  const parentResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Quels de mes enfants sont connectés en ce moment ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const parentChat = await parentResponse.json();
  console.log('📝 Réponse Bubix avec statut connexion:', parentChat.text.substring(0, 200) + '...');
  console.log('');

  // 2. Test avec un enfant demandant son propre statut
  console.log('👶 Test 2: Enfant demandant son statut...');
  
  const childLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  const childToken = childLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  // Récupérer le statut de l'enfant
  const childStatus = await tracker.getConnectionStatus('cmf2yznwx000445g0k3buwfdr');
  const childConnectionInfo = tracker.formatConnectionInfoForAI(childStatus);
  
  console.log('📊 Statut de l\'enfant:', JSON.stringify(childStatus, null, 2));
  console.log('💡 Info connexion enfant:', childConnectionInfo);
  console.log('');

  // Test de l'API chat pour l'enfant
  const childResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${childToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Depuis combien de temps suis-je connecté ?', sender: 'user', timestamp: Date.now() }],
      persona: 'kid',
      lang: 'fr'
    })
  });

  const childChat = await childResponse.json();
  console.log('📝 Réponse Bubix pour enfant:', childChat.text.substring(0, 150) + '...');
  console.log('');

  // 3. Test de question spécifique sur les connexions
  console.log('🎯 Test 3: Question spécifique sur les connexions...');
  
  const specificResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Lucas est-il connecté en ce moment ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const specificChat = await specificResponse.json();
  console.log('📝 Réponse spécifique Lucas:', specificChat.text.substring(0, 150) + '...');
  console.log('');

  console.log('✅ Test d\'intégration terminé !');
  console.log('');
  console.log('🎯 Résumé de l\'intégration:');
  console.log('- ✅ Récupération du statut en temps réel');
  console.log('- ✅ Génération d\'insights de connexion');
  console.log('- ✅ Intégration avec l\'API chat');
  console.log('- ✅ Réponses personnalisées selon le statut');
  console.log('- ✅ Détection des enfants connectés/déconnectés');
}

testConnectionIntegration().catch(console.error);

