import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionConfigs = new Map();
  }

  // Configuration des prompts selon le type de session
  getPromptConfig(userType, persona) {
    const configs = {
      CHILD: {
        kid: {
          tone: 'encouraging',
          complexity: 'simple',
          focus: 'learning_progress',
          maxResponseLength: 150
        },
        pro: {
          tone: 'educational',
          complexity: 'medium',
          focus: 'skill_development',
          maxResponseLength: 200
        }
      },
      PARENT: {
        pro: {
          tone: 'professional',
          complexity: 'detailed',
          focus: 'child_progress',
          maxResponseLength: 300
        }
      }
    };

    return configs[userType]?.[persona] || configs.CHILD.kid;
  }

  // Récupération des données selon le contexte
  async getContextData(userInfo, context) {
    const data = {
      user: userInfo,
      children: [],
      activities: [],
      insights: '',
      recommendations: []
    };

    if (userInfo.userType === 'PARENT') {
      // Récupérer les enfants du parent
      const children = await prisma.userSession.findMany({
        where: {
          accountId: userInfo.accountId,
          userType: 'CHILD',
          isActive: true
        },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          profile: true
        }
      });

      data.children = children.map(child => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        age: child.age,
        activities: child.activities.length,
        averageScore: child.activities.length > 0 
          ? Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / child.activities.length)
          : 0,
        lastActivity: child.activities[0]?.createdAt || null
      }));

      // Générer des insights
      data.insights = this.generateParentInsights(data.children);
      data.recommendations = this.generateRecommendations(data.children);

    } else if (userInfo.userType === 'CHILD') {
      // Récupérer les activités de l'enfant
      const activities = await prisma.activity.findMany({
        where: { userSessionId: userInfo.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      data.activities = activities.map(activity => ({
        domain: activity.domain,
        score: activity.score,
        duration: activity.duration,
        createdAt: activity.createdAt
      }));

      // Récupérer les données CubeMatch
      const cubeMatchStats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as totalGames,
          COALESCE(SUM(score), 0) as totalScore,
          COALESCE(AVG(score), 0) as averageScore,
          COALESCE(MAX(score), 0) as bestScore,
          COALESCE(MAX(level), 1) as highestLevel
        FROM cubematch_scores 
        WHERE user_id = ${userInfo.id}
      `;

      data.cubeMatch = {
        totalGames: Number(cubeMatchStats[0]?.totalgames || 0),
        averageScore: Number(cubeMatchStats[0]?.averagescore || 0),
        bestScore: Number(cubeMatchStats[0]?.bestscore || 0),
        highestLevel: Number(cubeMatchStats[0]?.highestlevel || 1)
      };
    }

    return data;
  }

  // Génération d'insights pour les parents
  generateParentInsights(children) {
    if (children.length === 0) return "Aucun enfant enregistré.";

    const totalActivities = children.reduce((sum, child) => sum + child.activities, 0);
    const averageScore = children.reduce((sum, child) => sum + child.averageScore, 0) / children.length;
    
    let insights = `Vos ${children.length} enfant${children.length > 1 ? 's' : ''} ont réalisé ${totalActivities} activités au total. `;
    insights += `Score moyen global : ${Math.round(averageScore)}/100. `;

    // Identifier les forces et faiblesses
    const bestChild = children.reduce((best, child) => child.averageScore > best.averageScore ? child : best);
    insights += `${bestChild.name} a les meilleures performances avec ${bestChild.averageScore}/100. `;

    return insights;
  }

  // Génération de recommandations
  generateRecommendations(children) {
    const recommendations = [];

    children.forEach(child => {
      if (child.averageScore < 70) {
        recommendations.push({
          child: child.name,
          type: 'encouragement',
          message: `${child.name} pourrait bénéficier d'un soutien supplémentaire.`
        });
      } else if (child.averageScore > 90) {
        recommendations.push({
          child: child.name,
          type: 'challenge',
          message: `${child.name} est prêt pour des défis plus difficiles.`
        });
      }
    });

    return recommendations;
  }

  // Gestion des sessions actives
  async trackActiveSession(userInfo) {
    const sessionId = `${userInfo.userType}_${userInfo.id}`;
    this.activeSessions.set(sessionId, {
      user: userInfo,
      connectedAt: new Date(),
      lastActivity: new Date(),
      context: await this.getContextData(userInfo, 'session')
    });

    console.log(`📊 Session active ajoutée: ${userInfo.firstName} (${userInfo.userType})`);
    return sessionId;
  }

  // Récupération des sessions actives
  getActiveSessions() {
    const sessions = Array.from(this.activeSessions.values());
    return {
      total: sessions.length,
      parents: sessions.filter(s => s.user.userType === 'PARENT').length,
      children: sessions.filter(s => s.user.userType === 'CHILD').length,
      details: sessions.map(s => ({
        name: s.user.firstName,
        type: s.user.userType,
        connectedAt: s.connectedAt,
        lastActivity: s.lastActivity
      }))
    };
  }

  // Mise à jour de l'activité
  updateActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // Nettoyage des sessions inactives
  cleanupInactiveSessions(timeoutMinutes = 30) {
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > timeoutMs) {
        this.activeSessions.delete(sessionId);
        console.log(`🧹 Session inactive supprimée: ${session.user.firstName}`);
      }
    }
  }

  // Configuration des prompts LLM
  buildLLMPrompt(userInfo, contextData, persona, message) {
    const config = this.getPromptConfig(userInfo.userType, persona);
    
    let prompt = `Tu es Bubix, l'assistant IA de CubeAI. `;
    
    if (userInfo.userType === 'CHILD') {
      prompt += `Tu parles à ${userInfo.firstName}, un enfant de ${contextData.user.age || 'N/A'} ans. `;
      prompt += `Tone: ${config.tone}, Complexité: ${config.complexity}. `;
      prompt += `Focus sur: ${config.focus}. `;
      
      if (contextData.activities.length > 0) {
        prompt += `Activités récentes: ${contextData.activities.length} activités, score moyen ${Math.round(contextData.activities.reduce((sum, a) => sum + a.score, 0) / contextData.activities.length)}/100. `;
      }
      
      if (contextData.cubeMatch && contextData.cubeMatch.totalGames > 0) {
        prompt += `CubeMatch: ${contextData.cubeMatch.totalGames} parties, meilleur score ${contextData.cubeMatch.bestScore}, niveau max ${contextData.cubeMatch.highestLevel}. `;
      }
      
    } else if (userInfo.userType === 'PARENT') {
      prompt += `Tu parles à ${userInfo.firstName}, parent de ${contextData.children.length} enfant(s). `;
      prompt += `Tone: ${config.tone}, Complexité: ${config.complexity}. `;
      prompt += `Focus sur: ${config.focus}. `;
      
      if (contextData.children.length > 0) {
        prompt += `Enfants: ${contextData.children.map(c => `${c.name} (${c.age} ans, ${c.activities} activités, ${c.averageScore}/100)`).join(', ')}. `;
      }
      
      if (contextData.insights) {
        prompt += `Insights: ${contextData.insights} `;
      }
    }

    prompt += `\n\nMessage de l'utilisateur: ${message}`;
    return prompt;
  }
}

// Test du gestionnaire de sessions
async function testSessionManager() {
  console.log('🔧 Test du gestionnaire de sessions...\n');

  const sessionManager = new SessionManager();

  // 1. Test avec un enfant
  console.log('👶 Test avec un enfant...');
  const childLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'enfant_01',
      password: 'password123'
    })
  });

  const childData = await childLogin.json();
  const childInfo = {
    id: childData.data.userSession.id,
    firstName: childData.data.userSession.firstName,
    lastName: childData.data.userSession.lastName,
    userType: childData.data.userSession.userType,
    age: childData.data.userSession.age,
    accountId: childData.data.userSession.accountId
  };

  const childSessionId = await sessionManager.trackActiveSession(childInfo);
  const childContext = await sessionManager.getContextData(childInfo, 'session');
  const childPrompt = sessionManager.buildLLMPrompt(childInfo, childContext, 'kid', 'Salut Bubix !');

  console.log('📝 Prompt enfant:', childPrompt.substring(0, 200) + '...');
  console.log('');

  // 2. Test avec un parent
  console.log('👨‍👩‍👧‍👦 Test avec un parent...');
  const parentLogin = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'parent_01',
      password: 'password123'
    })
  });

  const parentData = await parentLogin.json();
  const parentInfo = {
    id: parentData.data.userSession.id,
    firstName: parentData.data.userSession.firstName,
    lastName: parentData.data.userSession.lastName,
    userType: parentData.data.userSession.userType,
    accountId: parentData.data.userSession.accountId
  };

  const parentSessionId = await sessionManager.trackActiveSession(parentInfo);
  const parentContext = await sessionManager.getContextData(parentInfo, 'session');
  const parentPrompt = sessionManager.buildLLMPrompt(parentInfo, parentContext, 'pro', 'Comment vont mes enfants ?');

  console.log('📝 Prompt parent:', parentPrompt.substring(0, 200) + '...');
  console.log('');

  // 3. Affichage des sessions actives
  console.log('📊 Sessions actives:');
  const activeSessions = sessionManager.getActiveSessions();
  console.log(JSON.stringify(activeSessions, null, 2));

  console.log('✅ Test terminé !');
}

testSessionManager().catch(console.error);
