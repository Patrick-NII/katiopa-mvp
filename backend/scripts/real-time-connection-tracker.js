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

  // Mettre à jour le statut de connexion
  async updateConnectionStatus(userId, isOnline) {
    const now = new Date();
    let updateData = {
      lastLoginAt: now
    };

    if (isOnline) {
      updateData.currentSessionStartTime = now;
    } else {
      // Calculer la durée de session et l'ajouter au total
      const userSession = await prisma.userSession.findUnique({
        where: { id: userId },
        select: { currentSessionStartTime: true, totalConnectionDurationMs: true }
      });

      if (userSession?.currentSessionStartTime) {
        const sessionStart = new Date(userSession.currentSessionStartTime);
        const sessionDuration = now.getTime() - sessionStart.getTime();
        const currentTotalMs = Number(userSession.totalConnectionDurationMs || 0);
        
        updateData.currentSessionStartTime = null;
        updateData.totalConnectionDurationMs = currentTotalMs + sessionDuration;
      }
    }

    await prisma.userSession.update({
      where: { id: userId },
      data: updateData
    });

    console.log(`📊 Statut de connexion mis à jour pour ${userId}: ${isOnline ? 'connecté' : 'déconnecté'}`);
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

// Test du système de tracking en temps réel
async function testRealTimeConnection() {
  console.log('🔍 Test du système de tracking en temps réel...\n');

  const tracker = new RealTimeConnectionTracker();

  // 1. Test avec Emma (enfant)
  console.log('👶 Test statut Emma...');
  const emmaStatus = await tracker.getConnectionStatus('cmf2yznwx000445g0k3buwfdr');
  if (emmaStatus) {
    console.log('📊 Statut Emma:', JSON.stringify(emmaStatus, null, 2));
    console.log('📝 Info IA:', tracker.formatConnectionInfoForAI(emmaStatus));
  }
  console.log('');

  // 2. Test avec Marie (parent) et ses enfants
  console.log('👨‍👩‍👧‍👦 Test statut enfants de Marie...');
  const childrenStatus = await tracker.getChildrenConnectionStatus('cmf2yznqn000045g0ilo29ka2');
  console.log('📊 Statut enfants:', JSON.stringify(childrenStatus, null, 2));
  
  const insights = tracker.generateConnectionInsights(childrenStatus);
  console.log('💡 Insights connexion:', insights);
  console.log('');

  // 3. Test mise à jour statut
  console.log('🔄 Test mise à jour statut...');
  await tracker.updateConnectionStatus('cmf2yznwx000445g0k3buwfdr', true);
  
  const updatedStatus = await tracker.getConnectionStatus('cmf2yznwx000445g0k3buwfdr');
  console.log('📊 Statut mis à jour:', JSON.stringify(updatedStatus, null, 2));
  console.log('');

  console.log('✅ Test terminé !');
}

testRealTimeConnection().catch(console.error);
