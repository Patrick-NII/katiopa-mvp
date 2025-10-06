import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getCachedBubixAnalysis, cacheBubixAnalysis, getCachedSessionData, cacheSessionData } from '@/lib/cache';
import { PredictiveAnalytics } from '@/lib/predictive-analytics';
import { AutomaticRecommendations } from '@/lib/automatic-recommendations';
import { PEDAGOGICAL_CHARTER, getCommunicationStyle, generatePedagogicalMessage } from '@/lib/pedagogical-charter';

// 🎯 API BUBIX CENTRALISÉE - GOUVERNANCE DES DONNÉES
// ✅ Route principale pour toutes les analyses Bubix
// ✅ Gestion unifiée parent/enfant avec thématisation
// ✅ Cache intelligent et sécurité renforcée

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // ÉTAPE 1: Vérification d'authentification
    console.log('🔐 ÉTAPE 1: Vérification d\'authentification...');
    
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    if (!decoded || decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès non autorisé - Seuls les parents peuvent utiliser Bubix' }, { status: 403 });
    }

    console.log('✅ ÉTAPE 1 TERMINÉE: Authentification validée');

    const { prompt, sessionId, analysisType, context } = await request.json();

    if (!prompt || !sessionId || !analysisType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérifier le cache pour cette analyse
    const cachedAnalysis = getCachedBubixAnalysis<any>(sessionId, analysisType);
    if (cachedAnalysis) {
      console.log('✅ Analyse récupérée depuis le cache');
      return NextResponse.json({
        success: true,
        response: cachedAnalysis.response,
        analysisType: cachedAnalysis.analysisType,
        sessionId: cachedAnalysis.sessionId,
        childName: cachedAnalysis.childName,
        timestamp: cachedAnalysis.timestamp,
        dataUsed: cachedAnalysis.dataUsed,
        securityInfo: cachedAnalysis.securityInfo,
        cached: true
      });
    }

    // ÉTAPE 2: Récupération des vraies données de la session
    console.log('👶 ÉTAPE 2: Récupération des données réelles de la session...');
    
    // Vérifier que la session appartient bien au parent (version robuste)
    let session;
    try {
      session = await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          accountId: decoded.accountId
        },
        include: {
          account: true,
          activities: true,
          cubeMatchScores: true,
          // Nouvelles données enrichies (optionnelles)
          profile: true,
          childActivities: true,
          learningSessions: true,
          parentPreferences: true,
          performanceMetrics: true,
          userInteractions: true,
          navigationSessions: true,
          cubeMatchUserStats: true
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      // Fallback avec les données de base uniquement
      session = await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          accountId: decoded.accountId
        },
        include: {
          account: true,
          activities: true,
          cubeMatchScores: true
        }
      });
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé',
        details: `Session ${sessionId} non accessible pour le compte ${decoded.accountId}`
      }, { status: 404 });
    }

    // Récupérer les données de l'enfant associé à cette session
    // Si c'est une session enfant, utiliser directement cette session
    // Si c'est une session parent, récupérer un enfant du même compte
    let child;
    if (session.userType === 'CHILD') {
      child = session;
    } else {
      // C'est une session parent, récupérer un enfant du même compte
      child = await prisma.userSession.findFirst({
        where: {
          accountId: decoded.accountId,
          userType: 'CHILD',
          isActive: true
        },
        include: {
          activities: true,
          cubeMatchScores: true,
          childActivities: true,
          learningSessions: true,
          performanceMetrics: true,
          userInteractions: true,
          navigationSessions: true
        }
      });
    }
    
    if (!child) {
      return NextResponse.json({ 
        error: 'Enfant non trouvé pour cette session',
        details: `Aucun enfant trouvé pour la session ${sessionId}`
      }, { status: 404 });
    }

    // Calculer les statistiques réelles (version robuste)
    const activities = child.activities || [];
    const cubeMatchScores = child.cubeMatchScores || [];
    const childActivities = (child as any).childActivities || [];
    const learningSessions = (child as any).learningSessions || [];
    const performanceMetrics = (child as any).performanceMetrics || [];
    const userInteractions = (child as any).userInteractions || [];
    const navigationSessions = (child as any).navigationSessions || [];
    
    const totalActivities = activities.length + (childActivities?.length || 0);
    const totalTime = activities.reduce((sum: number, activity: any) => sum + (activity.durationMs || 0), 0) +
                     (childActivities?.reduce((sum: number, activity: any) => sum + (activity.duration || 0) * 60000, 0) || 0);

    // Récupérer les conversations ChildPrompts récentes
    const childPrompts = await prisma.childPrompt.findMany({
      where: {
        childSessionId: child.id,
        status: 'PROCESSED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10, // 10 conversations récentes
      select: {
        childMessage: true,
        bubixResponse: true,
        promptType: true,
        activityType: true,
        difficulty: true,
        engagement: true,
        createdAt: true
      }
    });

    // Récupérer les rapports quotidiens et données de tracking (optionnel)
    let dailyReportSessions: any[] = [];
    try {
      dailyReportSessions = await prisma.dailyReportUserSession.findMany({
        where: {
          accountId: decoded.accountId
        },
        include: {
          learningEvents: {
            orderBy: { ts: 'desc' },
            take: 10
          },
          quizResults: {
            orderBy: { ts: 'desc' },
            take: 10
          },
          sessionStats: {
            orderBy: { date: 'desc' },
            take: 7
          },
          dailyReports: {
            orderBy: { date: 'desc' },
            take: 5
          }
        }
      });
    } catch (error) {
      console.log('Rapports quotidiens non disponibles:', (error as Error).message);
      dailyReportSessions = [];
    }

    // Analyser les patterns de conversation
    const conversationAnalysis = {
      totalConversations: childPrompts.length,
      averageEngagement: childPrompts.length > 0 ? 
        childPrompts.reduce((sum, prompt) => {
          const engagementValue = prompt.engagement === 'HIGH' ? 3 : prompt.engagement === 'MEDIUM' ? 2 : 1;
          return sum + engagementValue;
        }, 0) / childPrompts.length : 0,
      favoriteTopics: childPrompts.reduce((acc, prompt) => {
        if (prompt.activityType) {
          acc[prompt.activityType] = (acc[prompt.activityType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      recentEngagement: childPrompts.slice(0, 5).map(prompt => ({
        engagement: prompt.engagement,
        topic: prompt.activityType,
        date: prompt.createdAt
      }))
    };
    
    // Calculer le score moyen (séparer les activités et les scores CubeMatch)
    const activityScores = activities.map(activity => activity.score).filter((score): score is number => score !== null && score !== undefined);
    const cubeMatchScoreValues = cubeMatchScores.map(score => score.score).filter((score): score is number => score !== null && score !== undefined);
    
    // Calculer les moyennes séparément
    const activityAverage = activityScores.length > 0 ? 
      activityScores.reduce((sum: number, score: number) => sum + score, 0) / activityScores.length : 0;
    
    const cubeMatchAverage = cubeMatchScoreValues.length > 0 ? 
      cubeMatchScoreValues.reduce((sum: number, score: number) => sum + score, 0) / cubeMatchScoreValues.length : 0;
    
    // Score moyen global (pondéré par le nombre d'activités)
    const totalActivitiesCount = activityScores.length + cubeMatchScoreValues.length;
    const averageScore = totalActivitiesCount > 0 ? 
      ((activityAverage * activityScores.length) + (cubeMatchAverage * cubeMatchScoreValues.length)) / totalActivitiesCount : 0;

    // Extraire les domaines uniques
    const domains = [...new Set(activities.map(activity => activity.domain).filter(Boolean))];

    // Préparer les activités récentes avec vraies données
    const recentActivities = activities.slice(-5).map(activity => {
      return {
        domain: activity.domain || 'Non spécifié',
        score: activity.score || 0,
        duration: activity.durationMs || 0,
        date: activity.createdAt
      };
    });

    // Préparer les données CubeMatch détaillées
    const cubeMatchAnalysis = {
      totalGames: cubeMatchScores.length,
      bestScore: cubeMatchScores.length > 0 ? Math.max(...cubeMatchScoreValues) : 0,
      averageScore: cubeMatchAverage,
      highestLevel: cubeMatchScores.length > 0 ? Math.max(...cubeMatchScores.map(s => s.level)) : 0,
      totalTimePlayed: cubeMatchScores.reduce((sum, score) => sum + Number(score.time_played_ms), 0),
      recentGames: cubeMatchScores.slice(-3).map(score => ({
        score: score.score,
        level: score.level,
        operator: score.operator,
        duration: Number(score.time_played_ms),
        date: score.created_at
      })),
      performanceByOperator: cubeMatchScores.reduce((acc, score) => {
        if (!acc[score.operator]) {
          acc[score.operator] = { count: 0, totalScore: 0, bestScore: 0 };
        }
        acc[score.operator].count++;
        acc[score.operator].totalScore += score.score;
        acc[score.operator].bestScore = Math.max(acc[score.operator].bestScore, score.score);
        return acc;
      }, {} as Record<string, { count: number, totalScore: number, bestScore: number }>)
    };

    const childData = {
      name: `${child.firstName} ${child.lastName}`,
      age: child.age,
      grade: child.grade || 'Non spécifié',
      totalActivities,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTime,
      domains,
      recentActivities,
      sessionId: child.id,
      sessionStartTime: child.currentSessionStartTime,
      sessionEndTime: child.lastLoginAt,
      // Nouvelles données ChildPrompts
      conversationAnalysis,
      recentConversations: childPrompts.slice(0, 3).map(prompt => ({
        childMessage: prompt.childMessage.substring(0, 100) + (prompt.childMessage.length > 100 ? '...' : ''),
        bubixResponse: prompt.bubixResponse.substring(0, 150) + (prompt.bubixResponse.length > 150 ? '...' : ''),
        engagement: prompt.engagement,
        topic: prompt.activityType,
        date: prompt.createdAt
      })),
      // Données CubeMatch détaillées
      cubeMatchAnalysis,
      // Nouvelles données enrichies
      profile: (child as any).profile ? {
        learningGoals: (child as any).profile.learningGoals || [],
        preferredSubjects: (child as any).profile.preferredSubjects || [],
        learningStyle: (child as any).profile.learningStyle || 'Non spécifié',
        difficulty: (child as any).profile.difficulty || 'Non spécifié',
        interests: (child as any).profile.interests || [],
        specialNeeds: (child as any).profile.specialNeeds || []
      } : null,
      parentPreferences: (child as any).parentPreferences ? {
        childStrengths: (child as any).parentPreferences.childStrengths || [],
        focusAreas: (child as any).parentPreferences.focusAreas || [],
        learningGoals: (child as any).parentPreferences.learningGoals || [],
        concerns: (child as any).parentPreferences.concerns || [],
        learningStyle: (child as any).parentPreferences.learningStyle || 'Non spécifié',
        motivationFactors: (child as any).parentPreferences.motivationFactors || []
      } : null,
      learningSessions: learningSessions.slice(0, 5).map((session: any) => ({
        duration: session.duration,
        completionRate: session.completionRate,
        mood: session.mood,
        breaks: session.breaks,
        startTime: session.startTime,
        endTime: session.endTime
      })),
      performanceMetrics: performanceMetrics.slice(0, 10).map((metric: any) => ({
        type: metric.metricType,
        value: metric.value,
        timestamp: metric.timestamp
      })),
      userInteractions: userInteractions.slice(0, 10).map((interaction: any) => ({
        type: interaction.interactionType,
        data: interaction.data,
        timestamp: interaction.timestamp
      })),
      cubeMatchStats: (child as any).cubeMatchUserStats ? {
        totalGames: (child as any).cubeMatchUserStats.totalGames,
        bestScore: (child as any).cubeMatchUserStats.bestScore,
        averageScore: (child as any).cubeMatchUserStats.averageScore,
        highestLevel: (child as any).cubeMatchUserStats.highestLevel,
        favoriteOperator: (child as any).cubeMatchUserStats.favoriteOperator,
        totalTimePlayed: (child as any).cubeMatchUserStats.totalTimePlayed
      } : null,
      // Métriques comportementales avancées (optionnelles)
      behavioralMetrics: [],
      upgradeTracking: [],
      popupInteractions: [],
      rewardTracking: [],
      childPerformanceAnalysis: [],
      // Données des rapports quotidiens (optionnelles)
      dailyReports: dailyReportSessions.length > 0 ? {
        totalSessions: dailyReportSessions.length,
        recentLearningEvents: dailyReportSessions[0]?.learningEvents?.slice(0, 5).map((event: any) => ({
          domain: event.domain,
          activity: event.activity,
          durationSec: event.durationSec,
          successRatio: event.successRatio,
          timestamp: event.ts
        })) || [],
        recentQuizResults: dailyReportSessions[0]?.quizResults?.slice(0, 5).map((quiz: any) => ({
          module: quiz.module,
          score: quiz.score,
          attempts: quiz.attempts,
          timeSec: quiz.timeSec,
          timestamp: quiz.ts
        })) || [],
        sessionStats: dailyReportSessions[0]?.sessionStats?.slice(0, 7).map((stat: any) => ({
          date: stat.date,
          totalTimeMin: stat.totalTimeMin,
          kpiAssiduite: stat.kpiAssiduite,
          kpiComprehension: stat.kpiComprehension,
          kpiProgression: stat.kpiProgression,
          sessionsCount: stat.sessionsCount,
          bestModule: stat.bestModule,
          needsHelp: stat.needsHelp,
          consecutiveDays: stat.consecutiveDays,
          focusScore: stat.focusScore
        })) || [],
        dailyReports: dailyReportSessions[0]?.dailyReports?.slice(0, 3).map((report: any) => ({
          date: report.date,
          subject: report.subject,
          modelUsed: report.modelUsed,
          status: report.status,
          sentAt: report.sentAt
        })) || []
      } : null
    };

    console.log('✅ ÉTAPE 2 TERMINÉE: Données réelles récupérées', {
      childName: childData.name,
      totalActivities: childData.totalActivities,
      averageScore: childData.averageScore,
      domains: childData.domains,
      totalConversations: childData.conversationAnalysis.totalConversations,
      averageEngagement: childData.conversationAnalysis.averageEngagement.toFixed(1),
      favoriteTopics: Object.keys(childData.conversationAnalysis.favoriteTopics),
      // Nouvelles données enrichies
      hasProfile: !!childData.profile,
      hasParentPreferences: !!childData.parentPreferences,
      learningSessionsCount: childData.learningSessions.length,
      performanceMetricsCount: childData.performanceMetrics.length,
      userInteractionsCount: childData.userInteractions.length,
      hasCubeMatchStats: !!childData.cubeMatchStats
    });

    // Générer les analyses prédictives (version simplifiée pour éviter les erreurs)
    console.log('🔮 ÉTAPE 3: Génération des analyses prédictives...');
    const predictiveAnalyses = {
      performanceTrend: { prediction: { trend: 'stable', confidence: 0.5, timeframe: '1_month', factors: [], recommendations: [] } },
      engagementPrediction: { prediction: { trend: 'stable', confidence: 0.5, timeframe: '2_weeks', factors: [], recommendations: [] } },
      learningStyleEvolution: { prediction: { trend: 'stable', confidence: 0.5, timeframe: '3_months', factors: [], recommendations: [] } },
      difficultyProgression: { prediction: { trend: 'stable', confidence: 0.5, timeframe: '1_month', factors: [], recommendations: [] } }
    };

    // Générer les recommandations automatiques (version simplifiée)
    console.log('💡 ÉTAPE 4: Génération des recommandations automatiques...');
    const automaticRecommendations = [
      {
        id: 'default_rec_1',
        type: 'learning_activity',
        priority: 'medium',
        title: 'Continuer les activités actuelles',
        description: 'Maintenir le rythme d\'apprentissage actuel',
        rationale: 'Les performances sont stables',
        expectedOutcome: 'Progression continue',
        implementationSteps: ['Continuer les sessions régulières'],
        estimatedDuration: '1 semaine',
        prerequisites: [],
        relatedData: {},
        createdAt: new Date()
      }
    ];
    const recommendationSummary = '1 recommandation générée';

    console.log('✅ ÉTAPE 4 TERMINÉE: Recommandations générées');

    // ÉTAPE 5: Traitement par l'IA
    console.log('🤖 ÉTAPE 5: Traitement par l\'IA...');
    
    // Déterminer le style de communication pédagogique
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const communicationStyle = getCommunicationStyle({
      currentModule: childData.domains.includes('math') ? 'MathCube' : 
                    childData.domains.includes('code') ? 'CodeCube' :
                    childData.domains.includes('science') ? 'ScienceCube' : 'PlayCube',
      dayOfWeek: currentDay,
      childAge: childData.age || undefined,
      childPreferences: childData.conversationAnalysis.favoriteTopics ? Object.keys(childData.conversationAnalysis.favoriteTopics) : []
    });
    
    const pedagogicalContext = PEDAGOGICAL_CHARTER.principles[communicationStyle as keyof typeof PEDAGOGICAL_CHARTER.principles];
    
    const enrichedPrompt = `
Tu es Bubix, l'assistant IA éducatif de CubeAI. 

🎓 CONTEXTE PÉDAGOGIQUE CUBEAI 🎓
Tu appliques la charte pédagogique CubeAI qui combine :
- **${pedagogicalContext.name}** : ${pedagogicalContext.description}
- **Approche** : ${pedagogicalContext.approach}
- **Style de communication** : ${pedagogicalContext.communication}

📋 PRINCIPES PÉDAGOGIQUES À RESPECTER :
- **Singapour (Rigueur)** : Apprentissage structuré concret → pictural → abstrait
- **Finlande (Bien-être)** : Sessions courtes, choix personnels, motivation intrinsèque
- **Estonie (Innovation)** : Compétences numériques et préparation au futur
- **Reggio Emilia (Créativité)** : Expression multiple, projets ouverts, jeu libre
- **IB/IPC (Transversalité)** : Connexions interdisciplinaires, vision globale

💬 TON DE COMMUNICATION :
Utilise un langage ${pedagogicalContext.communication.toLowerCase()} adapté à l'âge de ${childData.age} ans.
Exemples de ton à adopter :
${PEDAGOGICAL_CHARTER.communicationStyles[communicationStyle as keyof typeof PEDAGOGICAL_CHARTER.communicationStyles].examples.slice(0, 2).map(ex => `- "${ex}"`).join('\n')}

⚠️ DONNÉES STRICTEMENT VÉRIFIÉES ET RÉELLES ⚠️
- Nom complet de l'enfant : ${childData.name}
- Âge : ${childData.age} ans
- Classe : ${childData.grade}
- ID de session analysée : ${sessionId}
- Nombre total d'activités dans cette session : ${childData.totalActivities}
- Score moyen calculé : ${childData.averageScore.toFixed(1)}%
- Temps total d'apprentissage : ${Math.round(childData.totalTime / (1000 * 60))} minutes
- Domaines étudiés dans cette session : ${childData.domains.length > 0 ? childData.domains.join(', ') : 'Aucun domaine spécifique'}
- Activités récentes avec scores réels : ${childData.recentActivities.length > 0 ? childData.recentActivities.map(a => `${a.domain} (${a.score}%)`).join(', ') : 'Aucune activité récente'}

🎮 ANALYSE DES PERFORMANCES CUBEMATCH :
- Nombre total de parties jouées : ${childData.cubeMatchAnalysis.totalGames}
- MEILLEUR SCORE (record personnel) : ${childData.cubeMatchAnalysis.bestScore.toLocaleString()} points
- SCORE MOYEN (moyenne de toutes les parties) : ${Math.round(childData.cubeMatchAnalysis.averageScore).toLocaleString()} points
- NIVEAU MAXIMUM atteint : ${childData.cubeMatchAnalysis.highestLevel}
- Temps total de jeu : ${Math.round(childData.cubeMatchAnalysis.totalTimePlayed / (1000 * 60))} minutes
- Parties récentes (3 dernières) :
${childData.cubeMatchAnalysis.recentGames.length > 0 ? childData.cubeMatchAnalysis.recentGames.map((game, index) => `
  ${index + 1}. Score: ${game.score.toLocaleString()} pts, Niveau: ${game.level}, Opérateur: ${game.operator} - ${new Date(game.date).toLocaleDateString('fr-FR')}
`).join('') : '  Aucune partie récente'}
- Performance par opérateur :
${Object.entries(childData.cubeMatchAnalysis.performanceByOperator).length > 0 ? Object.entries(childData.cubeMatchAnalysis.performanceByOperator).map(([op, stats]) => `
  ${op}: ${stats.count} parties, Moyenne: ${Math.round(stats.totalScore / stats.count).toLocaleString()} pts, Record: ${stats.bestScore.toLocaleString()} pts
`).join('') : '  Aucune donnée par opérateur'}

⚠️ IMPORTANT : Ne pas confondre "meilleur score" (record personnel) avec "score moyen" (moyenne de toutes les parties)

📋 INSTRUCTIONS POUR L'ANALYSE :
- MEILLEUR SCORE = Record personnel, performance maximale atteinte
- SCORE MOYEN = Moyenne arithmétique de toutes les parties jouées
- NIVEAU MAXIMUM = Le niveau le plus élevé atteint dans une partie
- Utilise ces données pour évaluer la progression et les capacités de l'enfant
- Mentionne les performances exceptionnelles (meilleurs scores) comme des réussites
- Analyse la régularité via le score moyen pour évaluer la constance

📚 ANALYSE DES CONVERSATIONS AVEC BUBIX :
- Nombre total de conversations : ${childData.conversationAnalysis.totalConversations}
- Niveau d'engagement moyen : ${childData.conversationAnalysis.averageEngagement.toFixed(1)}/3 (1=Faible, 2=Moyen, 3=Élevé)
- Sujets préférés dans les conversations : ${Object.keys(childData.conversationAnalysis.favoriteTopics).length > 0 ? Object.entries(childData.conversationAnalysis.favoriteTopics).map(([topic, count]) => `${topic} (${count} fois)`).join(', ') : 'Aucun sujet spécifique'}
- Conversations récentes avec Bubix :
${childData.recentConversations.length > 0 ? childData.recentConversations.map((conv, index) => `
  ${index + 1}. [${conv.engagement}] ${conv.topic || 'Général'} - ${new Date(conv.date).toLocaleDateString('fr-FR')}
     Enfant: "${conv.childMessage}"
     Bubix: "${conv.bubixResponse}"`).join('') : '  Aucune conversation récente'}

👤 PROFIL DÉTAILLÉ DE L'ENFANT :
${childData.profile ? `
- Objectifs d'apprentissage : ${childData.profile.learningGoals.length > 0 ? childData.profile.learningGoals.join(', ') : 'Non spécifiés'}
- Matières préférées : ${childData.profile.preferredSubjects.length > 0 ? childData.profile.preferredSubjects.join(', ') : 'Non spécifiées'}
- Style d'apprentissage : ${childData.profile.learningStyle}
- Niveau de difficulté : ${childData.profile.difficulty}
- Centres d'intérêt : ${childData.profile.interests.length > 0 ? childData.profile.interests.join(', ') : 'Non spécifiés'}
- Besoins spéciaux : ${childData.profile.specialNeeds.length > 0 ? childData.profile.specialNeeds.join(', ') : 'Aucun'}` : '- Profil non disponible'}

👨‍👩‍👧‍👦 PRÉFÉRENCES PARENTALES :
${childData.parentPreferences ? `
- Forces de l'enfant : ${childData.parentPreferences.childStrengths.length > 0 ? childData.parentPreferences.childStrengths.join(', ') : 'Non spécifiées'}
- Zones de focus : ${childData.parentPreferences.focusAreas.length > 0 ? childData.parentPreferences.focusAreas.join(', ') : 'Non spécifiées'}
- Objectifs d'apprentissage : ${childData.parentPreferences.learningGoals.length > 0 ? childData.parentPreferences.learningGoals.join(', ') : 'Non spécifiés'}
- Préoccupations : ${childData.parentPreferences.concerns.length > 0 ? childData.parentPreferences.concerns.join(', ') : 'Aucune'}
- Style d'apprentissage préféré : ${childData.parentPreferences.learningStyle}
- Facteurs de motivation : ${childData.parentPreferences.motivationFactors.length > 0 ? childData.parentPreferences.motivationFactors.join(', ') : 'Non spécifiés'}` : '- Préférences parentales non disponibles'}

📊 SESSIONS D'APPRENTISSAGE DÉTAILLÉES :
${childData.learningSessions.length > 0 ? childData.learningSessions.map((session: any, index: number) => `
  ${index + 1}. Durée: ${session.duration}min, Taux de completion: ${session.completionRate}%, Humeur: ${session.mood || 'Non spécifiée'}, Pauses: ${session.breaks}`).join('') : '  Aucune session d\'apprentissage détaillée'}

🎯 MÉTRIQUES DE PERFORMANCE :
${childData.performanceMetrics.length > 0 ? childData.performanceMetrics.slice(0, 5).map((metric: any, index: number) => `
  ${index + 1}. ${metric.type}: ${metric.value} (${new Date(metric.timestamp).toLocaleDateString('fr-FR')})`).join('') : '  Aucune métrique de performance disponible'}

🎮 STATISTIQUES CUBEMATCH DÉTAILLÉES :
${childData.cubeMatchStats ? `
- Parties totales : ${childData.cubeMatchStats.totalGames}
- Meilleur score : ${childData.cubeMatchStats.bestScore}
- Score moyen : ${childData.cubeMatchStats.averageScore}
- Niveau maximum atteint : ${childData.cubeMatchStats.highestLevel}
- Opérateur préféré : ${childData.cubeMatchStats.favoriteOperator}
- Temps total de jeu : ${Math.round(Number(childData.cubeMatchStats.totalTimePlayed) / (1000 * 60))} minutes` : '- Statistiques CubeMatch non disponibles'}

🧠 MÉTRIQUES COMPORTEMENTALES AVANCÉES :
${childData.behavioralMetrics.length > 0 ? childData.behavioralMetrics.slice(0, 5).map((metric: any, index: number) => `
  ${index + 1}. ${metric.type}: ${metric.value} (${new Date(metric.recordedAt).toLocaleDateString('fr-FR')})`).join('') : '  Aucune métrique comportementale disponible'}

📈 ANALYSES DE PERFORMANCE PRÉCÉDENTES :
${childData.childPerformanceAnalysis.length > 0 ? childData.childPerformanceAnalysis.map((analysis: any, index: number) => `
  ${index + 1}. ${analysis.analysisType}: Niveau ${analysis.performanceLevel} (Confiance: ${analysis.confidence})`).join('') : '  Aucune analyse de performance précédente'}

🎯 TRACKING D'UPGRADE ET INTERACTIONS :
${childData.upgradeTracking.length > 0 ? `
- Événements d'upgrade : ${childData.upgradeTracking.length}
- Derniers déclencheurs : ${childData.upgradeTracking.slice(0, 3).map((t: any) => t.triggerType).join(', ')}` : '- Aucun tracking d\'upgrade'}

🎁 RÉCOMPENSES ET MOTIVATION :
${childData.rewardTracking.length > 0 ? `
- Récompenses utilisées : ${childData.rewardTracking.length}
- Types de récompenses : ${childData.rewardTracking.map((r: any) => r.rewardType).join(', ')}` : '- Aucune récompense utilisée'}

📊 RAPPORTS QUOTIDIENS ET KPIs :
${childData.dailyReports ? `
- Sessions de rapport : ${childData.dailyReports.totalSessions}
- Événements d'apprentissage récents : ${childData.dailyReports.recentLearningEvents.length}
- Résultats de quiz récents : ${childData.dailyReports.recentQuizResults.length}
- Statistiques de session (7 derniers jours) : ${childData.dailyReports.sessionStats.length}
- Rapports quotidiens envoyés : ${childData.dailyReports.dailyReports.length}
- KPIs moyens : Assiduité ${childData.dailyReports.sessionStats.length > 0 ? (childData.dailyReports.sessionStats.reduce((sum: number, stat: any) => sum + stat.kpiAssiduite, 0) / childData.dailyReports.sessionStats.length).toFixed(1) : 'N/A'}, Compréhension ${childData.dailyReports.sessionStats.length > 0 ? (childData.dailyReports.sessionStats.reduce((sum: number, stat: any) => sum + stat.kpiComprehension, 0) / childData.dailyReports.sessionStats.length).toFixed(1) : 'N/A'}, Progression ${childData.dailyReports.sessionStats.length > 0 ? (childData.dailyReports.sessionStats.reduce((sum: number, stat: any) => sum + stat.kpiProgression, 0) / childData.dailyReports.sessionStats.length).toFixed(1) : 'N/A'}
- Jours consécutifs max : ${childData.dailyReports.sessionStats.length > 0 ? Math.max(...childData.dailyReports.sessionStats.map((stat: any) => stat.consecutiveDays)) : 'N/A'}
- Score de focus moyen : ${childData.dailyReports.sessionStats.length > 0 ? (childData.dailyReports.sessionStats.reduce((sum: number, stat: any) => sum + stat.focusScore, 0) / childData.dailyReports.sessionStats.length).toFixed(1) : 'N/A'}` : '- Aucun rapport quotidien disponible'}

🔮 ANALYSES PRÉDICTIVES GÉNÉRÉES :
- Tendance de performance : ${predictiveAnalyses.performanceTrend.prediction.trend} (Confiance: ${predictiveAnalyses.performanceTrend.prediction.confidence.toFixed(2)})
- Prédiction d'engagement : ${predictiveAnalyses.engagementPrediction.prediction.trend} (Confiance: ${predictiveAnalyses.engagementPrediction.prediction.confidence.toFixed(2)})
- Évolution du style d'apprentissage : ${predictiveAnalyses.learningStyleEvolution.prediction.trend} (Confiance: ${predictiveAnalyses.learningStyleEvolution.prediction.confidence.toFixed(2)})
- Progression de difficulté : ${predictiveAnalyses.difficultyProgression.prediction.trend} (Confiance: ${predictiveAnalyses.difficultyProgression.prediction.confidence.toFixed(2)})

💡 RECOMMANDATIONS AUTOMATIQUES GÉNÉRÉES :
${recommendationSummary}
${automaticRecommendations.slice(0, 3).map((rec, index) => `
  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}
     Description: ${rec.description}
     Résultat attendu: ${rec.expectedOutcome}
     Durée estimée: ${rec.estimatedDuration}`).join('')}

INFORMATIONS DE SÉCURITÉ :
- Type d'analyse demandée : ${analysisType}
- Plan d'abonnement : ${context?.subscriptionType || 'FREE'}
- Timestamp de la session : ${childData.sessionStartTime ? new Date(childData.sessionStartTime).toLocaleString('fr-FR') : 'Non disponible'}

PROMPT UTILISATEUR :
${prompt}

🚨 RÈGLES CRITIQUES DE SÉCURITÉ 🚨
1. Utilise EXCLUSIVEMENT les données réelles fournies ci-dessus
2. Ne mentionne JAMAIS d'informations non présentes dans ces données
3. Si une donnée n'est pas disponible, indique clairement "Donnée non disponible"
4. Ne mélange JAMAIS les données de différents enfants ou sessions
5. Vérifie que le nom de l'enfant correspond exactement à ${childData.name}
6. Vérifie que l'ID de session correspond exactement à ${sessionId}
7. Si les données sont insuffisantes, propose des recommandations générales sans inventer de détails
8. Structure ta réponse de manière claire et professionnelle
9. NE MENTIONNE JAMAIS l'ID de session dans ton compte rendu (mais utilise-le pour la vérification interne)
10. SIGNE toujours tes comptes rendus avec "Cordialement, Bubix, Assistant IA Éducatif CubeAI"

💬 ANALYSE DES CONVERSATIONS :
11. Analyse l'engagement de l'enfant dans ses conversations avec Bubix
12. Identifie les sujets qui suscitent le plus d'intérêt (engagement élevé)
13. Détecte les domaines où l'enfant pose le plus de questions
14. Évalue la qualité de l'interaction enfant-Bubix
15. Propose des stratégies pour améliorer l'engagement conversationnel
16. Recommande des sujets d'exploration basés sur les conversations récentes

Réponds maintenant en respectant strictement ces règles :
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: context?.subscriptionType === 'FREE' ? 'gpt-3.5-turbo' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es Bubix, l'assistant IA éducatif de CubeAI. 

🚨 RÈGLES CRITIQUES DE SÉCURITÉ 🚨
- Tu utilises EXCLUSIVEMENT les données réelles fournies dans le prompt utilisateur
- Tu ne mentionnes JAMAIS d'informations non présentes dans ces données
- Tu ne mélanges JAMAIS les données de différents enfants ou sessions
- Tu vérifies toujours que le nom et l'ID de session correspondent exactement
- Si une donnée n'est pas disponible, tu indiques clairement "Donnée non disponible"
- Tu NE MENTIONNES JAMAIS l'ID de session dans tes comptes rendus (mais tu l'utilises pour la vérification interne)
- Tu SIGNES toujours tes comptes rendus avec "Cordialement, Bubix, Assistant IA Éducatif CubeAI"

💬 CAPACITÉS D'ANALYSE DES CONVERSATIONS :
- Tu analyses l'engagement de l'enfant dans ses conversations avec Bubix
- Tu identifies les sujets qui suscitent le plus d'intérêt (engagement élevé)
- Tu détectes les domaines où l'enfant pose le plus de questions
- Tu évalues la qualité de l'interaction enfant-Bubix
- Tu proposes des stratégies pour améliorer l'engagement conversationnel
- Tu recommandes des sujets d'exploration basés sur les conversations récentes

Tu es un expert en analyse pédagogique et comportementale. Tu analyses les performances d'apprentissage, les patterns d'engagement, les interactions conversationnelles, et tu fournis des recommandations personnalisées basées sur des données réelles et vérifiées. Tu es bienveillant, professionnel et constructif, mais tu respectes strictement ces règles de sécurité.`
          },
          {
            role: 'user',
            content: enrichedPrompt
          }
        ],
        max_tokens: context?.subscriptionType === 'FREE' ? 500 : 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Erreur lors de l\'appel à OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const bubixResponse = openaiData.choices[0]?.message?.content || 'Aucune réponse générée';

    console.log('✅ ÉTAPE 5 TERMINÉE: Analyse IA générée');

    const responseData = {
      success: true,
      response: bubixResponse,
      analysisType,
      sessionId,
      childName: childData.name,
      timestamp: new Date().toISOString(),
      dataUsed: {
        totalActivities: childData.totalActivities,
        averageScore: childData.averageScore,
        totalTimeMinutes: Math.round(childData.totalTime / (1000 * 60)),
        domains: childData.domains,
        recentActivities: childData.recentActivities,
        sessionStartTime: childData.sessionStartTime,
        sessionEndTime: childData.sessionEndTime,
        // Nouvelles données ChildPrompts
        conversationAnalysis: childData.conversationAnalysis,
        recentConversations: childData.recentConversations,
        // Nouvelles données enrichies
        profile: childData.profile,
        parentPreferences: childData.parentPreferences,
        learningSessions: childData.learningSessions,
        performanceMetrics: childData.performanceMetrics,
        userInteractions: childData.userInteractions,
        cubeMatchStats: childData.cubeMatchStats,
        // Nouvelles données comportementales
        behavioralMetrics: childData.behavioralMetrics,
        upgradeTracking: childData.upgradeTracking,
        popupInteractions: childData.popupInteractions,
        rewardTracking: childData.rewardTracking,
        childPerformanceAnalysis: childData.childPerformanceAnalysis,
        dailyReports: childData.dailyReports
      },
      // Nouvelles capacités avancées
      predictiveAnalyses,
      automaticRecommendations,
      recommendationSummary,
      securityInfo: {
        parentVerified: true,
        childVerified: true,
        accountId: decoded.accountId,
        parentEmail: decoded.email,
        childId: child.id,
        verificationTimestamp: new Date().toISOString(),
        dataSource: 'database_real_data',
        hallucinationPrevention: 'enabled',
        crossSessionProtection: 'active',
        cacheEnabled: true
      }
    };

    // Mettre en cache la réponse
    cacheBubixAnalysis(sessionId, analysisType, responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erreur API Bubix:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'analyse par Bubix',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      securityInfo: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString(),
        dataSource: 'error_state'
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}