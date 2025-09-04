import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CubeAISessionConfig {
  constructor() {
    this.activeSessions = new Map();
    this.promptTemplates = this.initializePromptTemplates();
    this.dataRetrievers = this.initializeDataRetrievers();
  }

  // Configuration des templates de prompts
  initializePromptTemplates() {
    return {
      CHILD: {
        kid: {
          system: `Tu es Bubix, l'assistant IA de CubeAI. Tu parles à {firstName}, un enfant de {age} ans.
Tone: encourageant et motivant
Complexité: simple et adaptée à l'âge
Focus: progrès d'apprentissage et motivation
Longueur max: 150 mots
Utilise le prénom de l'enfant et adapte ton langage à son niveau.`,
          
          context: `Activités récentes: {activitiesCount} activités, score moyen {averageScore}/100
CubeMatch: {cubeMatchGames} parties, meilleur score {cubeMatchBest}, niveau max {cubeMatchLevel}
Dernières activités: {recentActivities}`,
          
          examples: [
            "Salut {firstName} ! Tu as fait du bon travail aujourd'hui !",
            "Bravo {firstName}, tu progresses vraiment bien !",
            "Continue comme ça {firstName}, tu es sur la bonne voie !"
          ]
        },
        pro: {
          system: `Tu es Bubix, l'assistant IA de CubeAI. Tu parles à {firstName}, un enfant de {age} ans.
Tone: éducatif et structuré
Complexité: moyenne avec explications
Focus: développement des compétences
Longueur max: 200 mots
Fournis des explications claires et des encouragements constructifs.`,
          
          context: `Activités récentes: {activitiesCount} activités, score moyen {averageScore}/100
CubeMatch: {cubeMatchGames} parties, meilleur score {cubeMatchBest}, niveau max {cubeMatchLevel}
Points forts: {strengths}
Domaines à améliorer: {weaknesses}`,
          
          examples: [
            "Excellent travail {firstName} ! Tu as bien compris ce concept.",
            "Je vois que tu as fait des progrès en {domain}, {firstName}.",
            "Pour améliorer en {domain}, {firstName}, tu peux essayer..."
          ]
        }
      },
      PARENT: {
        pro: {
          system: `Tu es Bubix, l'assistant IA de CubeAI. Tu parles à {firstName}, parent de {childrenCount} enfant(s).
Tone: professionnel et informatif
Complexité: détaillée avec insights
Focus: suivi des progrès des enfants
Longueur max: 300 mots
Fournis des analyses détaillées et des recommandations personnalisées.`,
          
          context: `Enfants: {childrenDetails}
Activités totales: {totalActivities}
Score moyen global: {globalAverage}/100
Insights: {insights}
Recommandations: {recommendations}`,
          
          examples: [
            "Bonjour {firstName}, voici un aperçu des progrès de vos enfants...",
            "Je remarque que {childName} a fait des progrès significatifs en {domain}.",
            "Pour soutenir {childName}, je recommande de..."
          ]
        }
      }
    };
  }

  // Configuration des récupérateurs de données
  initializeDataRetrievers() {
    return {
      CHILD: {
        activities: async (userId) => {
          const activities = await prisma.activity.findMany({
            where: { userSessionId: userId },
            orderBy: { createdAt: 'desc' },
            take: 10
          });
          
          return {
            count: activities.length,
            averageScore: activities.length > 0 
              ? Math.round(activities.reduce((sum, a) => sum + (a.score || 0), 0) / activities.length)
              : 0,
            recent: activities.slice(0, 3).map(a => `${a.domain} (${a.score}/100)`).join(', '),
            strengths: this.analyzeStrengths(activities),
            weaknesses: this.analyzeWeaknesses(activities)
          };
        },
        
        cubeMatch: async (userId) => {
          const stats = await prisma.$queryRaw`
            SELECT 
              COUNT(*) as totalGames,
              COALESCE(SUM(score), 0) as totalScore,
              COALESCE(AVG(score), 0) as averageScore,
              COALESCE(MAX(score), 0) as bestScore,
              COALESCE(MAX(level), 1) as highestLevel
            FROM cubematch_scores 
            WHERE user_id = ${userId}
          `;
          
          return {
            totalGames: Number(stats[0]?.totalgames || 0),
            averageScore: Number(stats[0]?.averagescore || 0),
            bestScore: Number(stats[0]?.bestscore || 0),
            highestLevel: Number(stats[0]?.highestlevel || 1)
          };
        }
      },
      
      PARENT: {
        children: async (accountId) => {
          const children = await prisma.userSession.findMany({
            where: {
              accountId: accountId,
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
          
          return children.map(child => ({
            id: child.id,
            name: `${child.firstName} ${child.lastName}`,
            age: child.age,
            activities: child.activities.length,
            averageScore: child.activities.length > 0 
              ? Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / child.activities.length)
              : 0,
            lastActivity: child.activities[0]?.createdAt || null,
            recentActivities: child.activities.slice(0, 3).map(a => `${a.domain} (${a.score}/100)`).join(', ')
          }));
        },
        
        insights: async (children) => {
          if (children.length === 0) return "Aucun enfant enregistré.";
          
          const totalActivities = children.reduce((sum, child) => sum + child.activities, 0);
          const averageScore = children.reduce((sum, child) => sum + child.averageScore, 0) / children.length;
          const bestChild = children.reduce((best, child) => child.averageScore > best.averageScore ? child : best);
          
          return `Vos ${children.length} enfant${children.length > 1 ? 's' : ''} ont réalisé ${totalActivities} activités au total. Score moyen global : ${Math.round(averageScore)}/100. ${bestChild.name} a les meilleures performances avec ${bestChild.averageScore}/100.`;
        },
        
        recommendations: async (children) => {
          const recommendations = [];
          
          children.forEach(child => {
            if (child.averageScore < 70) {
              recommendations.push(`${child.name} pourrait bénéficier d'un soutien supplémentaire.`);
            } else if (child.averageScore > 90) {
              recommendations.push(`${child.name} est prêt pour des défis plus difficiles.`);
            }
          });
          
          return recommendations.join(' ');
        }
      }
    };
  }

  // Analyse des forces et faiblesses
  analyzeStrengths(activities) {
    const domainScores = {};
    activities.forEach(activity => {
      if (!domainScores[activity.domain]) {
        domainScores[activity.domain] = [];
      }
      domainScores[activity.domain].push(activity.score || 0);
    });
    
    const strengths = Object.entries(domainScores)
      .map(([domain, scores]) => ({
        domain,
        average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      }))
      .filter(item => item.average >= 80)
      .map(item => item.domain);
    
    return strengths.join(', ') || 'Aucun domaine identifié';
  }

  analyzeWeaknesses(activities) {
    const domainScores = {};
    activities.forEach(activity => {
      if (!domainScores[activity.domain]) {
        domainScores[activity.domain] = [];
      }
      domainScores[activity.domain].push(activity.score || 0);
    });
    
    const weaknesses = Object.entries(domainScores)
      .map(([domain, scores]) => ({
        domain,
        average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      }))
      .filter(item => item.average < 70)
      .map(item => item.domain);
    
    return weaknesses.join(', ') || 'Aucun domaine identifié';
  }

  // Construction du prompt complet
  async buildCompletePrompt(userInfo, persona, message) {
    const template = this.promptTemplates[userInfo.userType]?.[persona];
    if (!template) {
      throw new Error(`Template non trouvé pour ${userInfo.userType}/${persona}`);
    }

    let prompt = template.system;
    
    // Remplacer les variables système
    prompt = prompt.replace(/{firstName}/g, userInfo.firstName);
    prompt = prompt.replace(/{age}/g, userInfo.age || 'N/A');
    prompt = prompt.replace(/{childrenCount}/g, 'N/A'); // Sera rempli plus tard

    // Récupérer les données contextuelles
    let contextData = {};
    
    if (userInfo.userType === 'CHILD') {
      const activities = await this.dataRetrievers.CHILD.activities(userInfo.id);
      const cubeMatch = await this.dataRetrievers.CHILD.cubeMatch(userInfo.id);
      
      contextData = {
        activitiesCount: activities.count,
        averageScore: activities.averageScore,
        recentActivities: activities.recent,
        strengths: activities.strengths,
        weaknesses: activities.weaknesses,
        cubeMatchGames: cubeMatch.totalGames,
        cubeMatchBest: cubeMatch.bestScore,
        cubeMatchLevel: cubeMatch.highestLevel
      };
      
    } else if (userInfo.userType === 'PARENT') {
      const children = await this.dataRetrievers.PARENT.children(userInfo.accountId);
      const insights = await this.dataRetrievers.PARENT.insights(children);
      const recommendations = await this.dataRetrievers.PARENT.recommendations(children);
      
      contextData = {
        childrenCount: children.length,
        childrenDetails: children.map(c => `${c.name} (${c.age} ans, ${c.activities} activités, ${c.averageScore}/100)`).join(', '),
        totalActivities: children.reduce((sum, c) => sum + c.activities, 0),
        globalAverage: children.length > 0 ? Math.round(children.reduce((sum, c) => sum + c.averageScore, 0) / children.length) : 0,
        insights: insights,
        recommendations: recommendations
      };
      
      prompt = prompt.replace(/{childrenCount}/g, children.length.toString());
    }

    // Ajouter le contexte
    if (template.context) {
      let context = template.context;
      Object.entries(contextData).forEach(([key, value]) => {
        context = context.replace(new RegExp(`{${key}}`, 'g'), value);
      });
      prompt += '\n\n' + context;
    }

    // Ajouter des exemples si disponibles
    if (template.examples && template.examples.length > 0) {
      prompt += '\n\nExemples de réponses:';
      template.examples.forEach(example => {
        let formattedExample = example;
        Object.entries(contextData).forEach(([key, value]) => {
          formattedExample = formattedExample.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        prompt += '\n- ' + formattedExample;
      });
    }

    // Ajouter le message de l'utilisateur
    prompt += `\n\nMessage de l'utilisateur: ${message}`;
    
    return prompt;
  }

  // Gestion des sessions actives
  async trackSession(userInfo) {
    const sessionId = `${userInfo.userType}_${userInfo.id}`;
    this.activeSessions.set(sessionId, {
      user: userInfo,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    console.log(`📊 Session active: ${userInfo.firstName} (${userInfo.userType})`);
    return sessionId;
  }

  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      name: session.user.firstName,
      type: session.user.userType,
      connectedAt: session.connectedAt,
      lastActivity: session.lastActivity
    }));
  }

  // Configuration pour l'API chat
  getChatConfig(userInfo, persona) {
    return {
      maxTokens: userInfo.userType === 'CHILD' ? 150 : 300,
      temperature: userInfo.userType === 'CHILD' ? 0.7 : 0.5,
      systemPrompt: this.buildCompletePrompt.bind(this),
      trackSession: this.trackSession.bind(this),
      getActiveSessions: this.getActiveSessions.bind(this)
    };
  }
}

// Test de la configuration
async function testCubeAIConfig() {
  console.log('🔧 Test de la configuration CubeAI...\n');

  const config = new CubeAISessionConfig();

  // Test avec un enfant
  console.log('👶 Test configuration enfant...');
  const childInfo = {
    id: 'cmf2yznwx000445g0k3buwfdr',
    firstName: 'Emma',
    lastName: 'Martin',
    userType: 'CHILD',
    age: 8,
    accountId: 'cmf2yznqn000045g0ilo29ka2'
  };

  const childPrompt = await config.buildCompletePrompt(childInfo, 'kid', 'Salut Bubix !');
  console.log('📝 Prompt enfant (début):', childPrompt.substring(0, 300) + '...');
  console.log('');

  // Test avec un parent
  console.log('👨‍👩‍👧‍👦 Test configuration parent...');
  const parentInfo = {
    id: 'cmf2yznqn000045g0ilo29ka2',
    firstName: 'Marie',
    lastName: 'Martin',
    userType: 'PARENT',
    accountId: 'cmf2yznqn000045g0ilo29ka2'
  };

  const parentPrompt = await config.buildCompletePrompt(parentInfo, 'pro', 'Comment vont mes enfants ?');
  console.log('📝 Prompt parent (début):', parentPrompt.substring(0, 300) + '...');
  console.log('');

  // Test des sessions actives
  console.log('📊 Test des sessions actives...');
  await config.trackSession(childInfo);
  await config.trackSession(parentInfo);
  
  const activeSessions = config.getActiveSessions();
  console.log('Sessions actives:', JSON.stringify(activeSessions, null, 2));

  console.log('✅ Test terminé !');
}

testCubeAIConfig().catch(console.error);

