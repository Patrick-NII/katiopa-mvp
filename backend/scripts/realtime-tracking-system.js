import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RealTimeConnectionTracker {
  constructor() {
    this.activeConnections = new Map();
    this.updateInterval = null;
    this.startRealTimeTracking();
  }

  // Démarrer le tracking en temps réel
  startRealTimeTracking() {
    console.log('🔄 Démarrage du tracking en temps réel...');
    
    // Mettre à jour toutes les 30 secondes
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
          
          console.log(`⏱️ Mise à jour session ${session.firstName}: +30s (total: ${Math.floor(newTotalMs / 60000)}min)`);
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

        console.log(`🔴 Session terminée pour l'utilisateur ${userId} (durée: ${Math.floor(sessionDuration / 60000)}min)`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur fin de session:', error);
      return false;
    }
  }

  // Récupérer le statut de connexion en temps réel
  async getConnectionStatus(userId) {
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
    } catch (error) {
      console.error('❌ Erreur récupération statut connexion:', error);
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
    } catch (error) {
      console.error('❌ Erreur récupération statut enfants:', error);
      return [];
    }
  }

  // Formater les informations de connexion pour l'IA avec temps réel
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
    const totalMinutes = Math.floor((connectionStatus.totalConnectionDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    info += `Temps total de connexion : ${totalHours}h ${totalMinutes}min.`;

    return info;
  }

  // Obtenir les statistiques de connexion en temps réel
  async getRealTimeStats(userId) {
    const status = await this.getConnectionStatus(userId);
    if (!status) return null;

    const now = new Date();
    let realTimeDuration = 0;

    if (status.isCurrentlyOnline && status.currentSessionStartTime) {
      const sessionStart = new Date(status.currentSessionStartTime);
      realTimeDuration = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60));
    }

    return {
      ...status,
      realTimeDuration,
      totalHours: Math.floor(status.totalConnectionDurationMs / (1000 * 60 * 60)),
      totalMinutes: Math.floor((status.totalConnectionDurationMs % (1000 * 60 * 60)) / (1000 * 60))
    };
  }
}

// Test du système de tracking en temps réel
async function testRealTimeTracking() {
  console.log('🔄 Test du système de tracking en temps réel...\n');

  const tracker = new RealTimeConnectionTracker();

  // 1. Démarrer une session pour Emma
  console.log('👶 Démarrage session Emma...');
  await tracker.startSession('cmf2yznwx000445g0k3buwfdr');
  
  // Attendre 5 secondes
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 2. Vérifier le statut en temps réel
  console.log('📊 Vérification statut temps réel...');
  const emmaStatus = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log('📝 Statut Emma:', JSON.stringify(emmaStatus, null, 2));
  
  // 3. Attendre encore 10 secondes
  console.log('⏱️ Attente de 10 secondes...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 4. Vérifier à nouveau le statut
  console.log('📊 Vérification statut après 10 secondes...');
  const emmaStatus2 = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log('📝 Statut Emma (après 10s):', JSON.stringify(emmaStatus2, null, 2));
  
  // 5. Terminer la session
  console.log('🔴 Fin de session Emma...');
  await tracker.endSession('cmf2yznwx000445g0k3buwfdr');
  
  // 6. Vérifier le statut final
  console.log('📊 Statut final...');
  const emmaStatusFinal = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log('📝 Statut final Emma:', JSON.stringify(emmaStatusFinal, null, 2));
  
  // Arrêter le tracking
  tracker.stopRealTimeTracking();
  
  console.log('✅ Test terminé !');
}

testRealTimeTracking().catch(console.error);
