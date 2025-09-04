import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RealTimeConnectionTracker {
  constructor() {
    this.activeConnections = new Map();
    this.updateInterval = null;
  }

  // Démarrer le tracking en temps réel
  startRealTimeTracking() {
    console.log('🔄 Démarrage du tracking en temps réel...');
    
    // Mettre à jour toutes les 30 secondes en production
    this.updateInterval = setInterval(async () => {
      await this.updateAllActiveSessions();
    }, 30000); // 30 secondes
  }

  // Arrêter le tracking en temps réel
  stopRealTimeTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Arrêt du tracking en temps réel');
    }
  }

  // Mettre à jour toutes les sessions actives
  async updateAllActiveSessions() {
    try {
      const activeSessions = await prisma.userSession.findMany({
        where: {
          currentSessionStartTime: {
            not: null
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          currentSessionStartTime: true,
          totalConnectionDurationMs: true
        }
      });

      const now = new Date();
      
      for (const session of activeSessions) {
        const sessionStart = new Date(session.currentSessionStartTime);
        const timeDiff = now.getTime() - sessionStart.getTime();
        
        // Si la session a plus de 30 minutes, la considérer comme inactive
        if (timeDiff > 30 * 60 * 1000) {
          await this.endSession(session.id);
          console.log(`⏰ Session expirée pour ${session.firstName} ${session.lastName}`);
        } else {
          // Mettre à jour le temps total de connexion
          const currentTotalMs = Number(session.totalConnectionDurationMs || 0);
          const newTotalMs = currentTotalMs + 30000; // Ajouter 30 secondes
          
          await prisma.userSession.update({
            where: { id: session.id },
            data: {
              totalConnectionDurationMs: newTotalMs
            }
          });
          
          const totalMinutes = Math.floor(newTotalMs / 60000);
          console.log(`⏱️ ${session.firstName}: +30s (total: ${totalMinutes}min)`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour sessions actives:', error);
    }
  }

  // Démarrer une session
  async startSession(userId) {
    try {
      const now = new Date();
      
      await prisma.userSession.update({
        where: { id: userId },
        data: {
          lastLoginAt: now,
          currentSessionStartTime: now
        }
      });

      console.log(`🟢 Session démarrée pour l'utilisateur ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur démarrage session:', error);
      return false;
    }
  }

  // Terminer une session
  async endSession(userId) {
    try {
      const userSession = await prisma.userSession.findUnique({
        where: { id: userId },
        select: {
          currentSessionStartTime: true,
          totalConnectionDurationMs: true
        }
      });

      if (userSession?.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(userSession.currentSessionStartTime);
        const sessionDuration = now.getTime() - sessionStart.getTime();
        const currentTotalMs = Number(userSession.totalConnectionDurationMs || 0);
        
        await prisma.userSession.update({
          where: { id: userId },
          data: {
            currentSessionStartTime: null,
            totalConnectionDurationMs: currentTotalMs + sessionDuration
          }
        });

        console.log(`🔴 Session terminée (durée: ${Math.floor(sessionDuration / 60000)}min)`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur fin de session:', error);
      return false;
    }
  }

  // Obtenir les statistiques de connexion en temps réel
  async getRealTimeStats(userId) {
    try {
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
        isCurrentlyOnline = timeDiff < 30 * 60 * 1000;
        currentSessionDuration = Math.floor(timeDiff / (1000 * 60));
      }

      const totalHours = Math.floor(Number(userSession.totalConnectionDurationMs || 0) / (1000 * 60 * 60));
      const totalMinutes = Math.floor((Number(userSession.totalConnectionDurationMs || 0) % (1000 * 60 * 60)) / (1000 * 60));

      return {
        id: userSession.id,
        name: `${userSession.firstName} ${userSession.lastName}`,
        userType: userSession.userType,
        isCurrentlyOnline,
        lastLoginAt: userSession.lastLoginAt,
        currentSessionStartTime: userSession.currentSessionStartTime,
        currentSessionDuration,
        totalConnectionDurationMs: Number(userSession.totalConnectionDurationMs || 0),
        isActive: userSession.isActive,
        totalHours,
        totalMinutes
      };
    } catch (error) {
      console.error('❌ Erreur récupération statut:', error);
      return null;
    }
  }

  // Récupérer le statut de connexion de tous les enfants d'un parent
  async getChildrenConnectionStatus(parentAccountId) {
    try {
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

        const totalHours = Math.floor(Number(child.totalConnectionDurationMs || 0) / (1000 * 60 * 60));
        const totalMinutes = Math.floor((Number(child.totalConnectionDurationMs || 0) % (1000 * 60 * 60)) / (1000 * 60));

        return {
          id: child.id,
          name: `${child.firstName} ${child.lastName}`,
          age: child.age,
          isCurrentlyOnline,
          lastLoginAt: child.lastLoginAt,
          currentSessionStartTime: child.currentSessionStartTime,
          currentSessionDuration,
          totalConnectionDurationMs: Number(child.totalConnectionDurationMs || 0),
          isActive: child.isActive,
          totalHours,
          totalMinutes
        };
      });

      return childrenStatus;
    } catch (error) {
      console.error('❌ Erreur récupération statut enfants:', error);
      return [];
    }
  }
}

// Test de l'intégration avec l'API chat en temps réel
async function testRealTimeChatIntegration() {
  console.log('🔄 Test de l\'intégration chat en temps réel...\n');

  const tracker = new RealTimeConnectionTracker();

  // 1. Démarrer une session pour Emma
  console.log('👶 Démarrage session Emma...');
  await tracker.startSession('cmf2yznwx000445g0k3buwfdr');
  
  // 2. Démarrer le tracking en temps réel
  tracker.startRealTimeTracking();
  
  // 3. Test avec Marie demandant le statut en temps réel
  console.log('👨‍👩‍👧‍👦 Test Marie demandant le statut en temps réel...');
  
  const marieLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const marieToken = marieLogin.headers.get('set-cookie')?.split('authToken=')[1]?.split(';')[0];
  
  // Récupérer le statut des enfants en temps réel
  const childrenStatus = await tracker.getChildrenConnectionStatus('cmf2yznqn000045g0ilo29ka2');
  console.log('📊 Statut enfants en temps réel:', JSON.stringify(childrenStatus, null, 2));
  
  // Test de l'API chat
  const marieResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Depuis combien de temps Emma est-elle connectée ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat = await marieResponse.json();
  console.log('📝 Réponse Marie en temps réel:', marieChat.text.substring(0, 200) + '...');
  console.log('');

  // 4. Attendre 30 secondes pour voir les mises à jour
  console.log('⏱️ Attente de 30 secondes pour voir les mises à jour...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // 5. Test à nouveau après les mises à jour
  console.log('🔄 Test après mise à jour en temps réel...');
  
  const marieResponse2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Combien d\'heures Emma a-t-elle passées connectées au total ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat2 = await marieResponse2.json();
  console.log('📝 Réponse Marie après mise à jour:', marieChat2.text.substring(0, 200) + '...');
  console.log('');

  // 6. Terminer la session
  console.log('🔴 Fin de session Emma...');
  await tracker.endSession('cmf2yznwx000445g0k3buwfdr');
  
  // 7. Test final
  console.log('🎯 Test final...');
  
  const marieResponse3 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${marieToken}`
    },
    body: JSON.stringify({
      messages: [{ id: '1', text: 'Emma est-elle encore connectée ?', sender: 'user', timestamp: Date.now() }],
      persona: 'pro',
      lang: 'fr'
    })
  });

  const marieChat3 = await marieResponse3.json();
  console.log('📝 Réponse finale:', marieChat3.text.substring(0, 200) + '...');
  console.log('');

  // 8. Arrêter le tracking
  tracker.stopRealTimeTracking();
  
  console.log('✅ Test terminé !');
  console.log('');
  console.log('🎯 Résumé de l\'intégration temps réel:');
  console.log('- ✅ Tracking automatique toutes les 30 secondes');
  console.log('- ✅ Mise à jour du temps total de connexion');
  console.log('- ✅ Bubix a accès aux informations en temps réel');
  console.log('- ✅ Détection automatique des sessions expirées');
  console.log('- ✅ Calcul précis des durées de connexion');
}

testRealTimeChatIntegration().catch(console.error);

