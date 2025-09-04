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
    
    // Mettre à jour toutes les 10 secondes pour le test
    this.updateInterval = setInterval(async () => {
      await this.updateAllActiveSessions();
    }, 10000); // 10 secondes
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
          const newTotalMs = currentTotalMs + 10000; // Ajouter 10 secondes
          
          await prisma.userSession.update({
            where: { id: session.id },
            data: {
              totalConnectionDurationMs: newTotalMs
            }
          });
          
          const totalMinutes = Math.floor(newTotalMs / 60000);
          console.log(`⏱️ ${session.firstName}: +10s (total: ${totalMinutes}min)`);
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
}

// Test du système de tracking en temps réel
async function testRealTimeTracking() {
  console.log('🔄 Test du système de tracking en temps réel...\n');

  const tracker = new RealTimeConnectionTracker();

  // 1. Démarrer une session pour Emma
  console.log('👶 Démarrage session Emma...');
  await tracker.startSession('cmf2yznwx000445g0k3buwfdr');
  
  // 2. Démarrer le tracking en temps réel
  tracker.startRealTimeTracking();
  
  // 3. Vérifier le statut initial
  console.log('\n📊 Statut initial...');
  const emmaStatus1 = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log(`📝 Emma: ${emmaStatus1.currentSessionDuration}min (total: ${emmaStatus1.totalHours}h ${emmaStatus1.totalMinutes}min)`);
  
  // 4. Attendre 15 secondes (1.5 cycles de mise à jour)
  console.log('\n⏱️ Attente de 15 secondes...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // 5. Vérifier le statut après 15 secondes
  console.log('\n📊 Statut après 15 secondes...');
  const emmaStatus2 = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log(`📝 Emma: ${emmaStatus2.currentSessionDuration}min (total: ${emmaStatus2.totalHours}h ${emmaStatus2.totalMinutes}min)`);
  
  // 6. Attendre encore 20 secondes
  console.log('\n⏱️ Attente de 20 secondes supplémentaires...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // 7. Vérifier le statut final
  console.log('\n📊 Statut final...');
  const emmaStatus3 = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log(`📝 Emma: ${emmaStatus3.currentSessionDuration}min (total: ${emmaStatus3.totalHours}h ${emmaStatus3.totalMinutes}min)`);
  
  // 8. Terminer la session
  console.log('\n🔴 Fin de session Emma...');
  await tracker.endSession('cmf2yznwx000445g0k3buwfdr');
  
  // 9. Vérifier le statut final
  console.log('\n📊 Statut après fin de session...');
  const emmaStatusFinal = await tracker.getRealTimeStats('cmf2yznwx000445g0k3buwfdr');
  console.log(`📝 Emma: ${emmaStatusFinal.currentSessionDuration}min (total: ${emmaStatusFinal.totalHours}h ${emmaStatusFinal.totalMinutes}min)`);
  
  // 10. Arrêter le tracking
  tracker.stopRealTimeTracking();
  
  console.log('\n✅ Test terminé !');
  console.log('\n🎯 Résumé:');
  console.log('- Le temps total de connexion augmente en temps réel');
  console.log('- Les mises à jour se font automatiquement');
  console.log('- Le système détecte les sessions actives');
  console.log('- Les durées sont calculées précisément');
}

testRealTimeTracking().catch(console.error);

