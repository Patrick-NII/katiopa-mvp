import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { prisma } from '../prisma';
import { PedagogicalAnalysisService } from '../services/pedagogicalAnalysis.js';

const router = express.Router();

// Route pour sauvegarder un prompt parent
router.post("/parent-prompts", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { content, childSessionId, promptType = 'PARENT_NOTES' } = req.body;

    if (!userId || !content || !childSessionId) {
      return res.status(400).json({
        error: 'Données manquantes',
        code: 'MISSING_DATA'
      });
    }

    // Vérifier que l'utilisateur est un parent
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: { account: true }
    });

    if (!userSession || userSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'PARENT_ONLY'
      });
    }

    // Vérifier que la session enfant appartient au même compte
    const childSession = await prisma.userSession.findFirst({
      where: {
        id: childSessionId,
        accountId: userSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session enfant non trouvée',
        code: 'CHILD_NOT_FOUND'
      });
    }

    // Sauvegarder le prompt
    const savedPrompt = await prisma.parentPrompt.create({
      data: {
        content,
        promptType,
        parentSessionId: userId,
        childSessionId,
        accountId: userSession.accountId,
        status: 'PENDING',
        processedContent: null,
        aiResponse: null
      }
    });

    // Traiter le prompt avec l'IA pour le clarifier et le contextualiser
    try {
      const processedPrompt = await PedagogicalAnalysisService.processParentPrompt({
        content,
        childName: `${childSession.firstName} ${childSession.lastName}`,
        childAge: childSession.age || 0,
        childLevel: childSession.level || 'BEGINNER',
        context: {
          accountType: userSession.account.subscriptionType,
          childSessionId,
          parentSessionId: userId
        }
      });

      // Mettre à jour le prompt avec le contenu traité
      await prisma.parentPrompt.update({
        where: { id: savedPrompt.id },
        data: {
          processedContent: processedPrompt.processedContent,
          aiResponse: processedPrompt.aiResponse,
          status: 'PROCESSED'
        }
      });

      res.json({
        success: true,
        data: {
          promptId: savedPrompt.id,
          processedContent: processedPrompt.processedContent,
          aiResponse: processedPrompt.aiResponse,
          status: 'PROCESSED'
        }
      });

    } catch (processingError) {
      console.error('❌ Erreur lors du traitement du prompt:', processingError);
      
      // Mettre à jour le statut en cas d'erreur
      await prisma.parentPrompt.update({
        where: { id: savedPrompt.id },
        data: { status: 'ERROR' }
      });

      res.json({
        success: true,
        data: {
          promptId: savedPrompt.id,
          status: 'ERROR',
          message: 'Prompt sauvegardé mais traitement en attente'
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du prompt parent:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les prompts d'un enfant
router.get("/child/:childSessionId/prompts", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { childSessionId } = req.params;

    if (!userId || !childSessionId) {
      return res.status(400).json({
        error: 'Données manquantes',
        code: 'MISSING_DATA'
      });
    }

    // Vérifier les permissions
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: { account: true }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Récupérer les prompts pour cet enfant
    const prompts = await prisma.parentPrompt.findMany({
      where: {
        childSessionId,
        accountId: userSession.accountId,
        status: 'PROCESSED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        content: true,
        processedContent: true,
        aiResponse: true,
        promptType: true,
        createdAt: true,
        parentSession: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: prompts
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des prompts:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les sessions enfants
router.get('/children', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer le compte de l'utilisateur connecté
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Récupérer toutes les sessions du compte
    const sessions = await prisma.userSession.findMany({
      where: {
        accountId: userSession.accountId,
        isActive: true
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        userType: true,
        lastLoginAt: true,
        currentSessionStartTime: true,
        totalConnectionDurationMs: true,
        createdAt: true
      },
      orderBy: {
        lastLoginAt: 'desc'
      }
    });

    // Calculer le temps total de connexion pour chaque session
    const sessionsWithTime = sessions.map(session => {
      let totalTimeMs = Number(session.totalConnectionDurationMs || 0);
      
      // Si la session a un startTime, calculer le temps de session actuelle
      if (session.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(session.currentSessionStartTime);
        const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
        totalTimeMs += currentSessionTimeMs;
      }
      
      const totalTimeMinutes = Math.floor(totalTimeMs / (1000 * 60));
      
      return {
        id: session.id,
        sessionId: session.sessionId,
        name: `${session.firstName} ${session.lastName}`,
        userType: session.userType,
        totalTime: totalTimeMinutes,
        lastActivity: session.lastLoginAt,
        isCurrentlyActive: !!session.currentSessionStartTime,
        createdAt: session.createdAt,
        currentSessionStartTime: session.currentSessionStartTime
      };
    });

    // Filtrer les sessions actives (avec currentSessionStartTime)
    const activeSessions = sessionsWithTime.filter(session => session.isCurrentlyActive);

    // Pour les parents, retourner toutes les sessions enfants
    if (userSession.userType === 'PARENT') {
      const childSessions = sessionsWithTime.filter(session => session.userType === 'CHILD');
      res.json(childSessions);
    } else {
      // Pour les autres, retourner les sessions actives
      res.json(activeSessions);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions actives:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer toutes les sessions d'un utilisateur
router.get("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: {
          include: {
            userSessions: {
              where: { isActive: true },
              select: {
                id: true,
                sessionId: true,
                firstName: true,
                lastName: true,
                userType: true,
                lastLoginAt: true,
                currentSessionStartTime: true,
                totalConnectionDurationMs: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    const sessions = userSession.account.userSessions.map(session => {
      let totalTimeMs = Number(session.totalConnectionDurationMs || 0);
      
      // Si la session a un startTime, calculer le temps de session actuelle
      if (session.currentSessionStartTime) {
        const now = new Date();
        const sessionStart = new Date(session.currentSessionStartTime);
        const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
        totalTimeMs += currentSessionTimeMs;
      }
      
      const totalTimeMinutes = Math.floor(totalTimeMs / (1000 * 60));
      
      return {
        id: session.id,
        sessionId: session.sessionId,
        name: `${session.firstName} ${session.lastName}`,
        userType: session.userType,
        totalTime: totalTimeMinutes,
        lastActivity: session.lastLoginAt,
        isCurrentlyActive: !!session.currentSessionStartTime,
        createdAt: session.createdAt,
        currentSessionStartTime: session.currentSessionStartTime
      };
    });

    res.json({
      success: true,
      data: sessions,
      accountInfo: {
        accountId: userSession.accountId,
        subscriptionType: userSession.account.subscriptionType,
        maxSessions: userSession.account.maxSessions
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions utilisateur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour mettre à jour le temps de connexion
router.post("/update-time", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Récupérer la session utilisateur
    const userSession = await prisma.userSession.findUnique({
      where: { id: userId }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_NOT_FOUND'
      });
    }

    // Si la session a un startTime, calculer et mettre à jour le temps total
    if (userSession.currentSessionStartTime) {
      const now = new Date();
      const sessionStart = new Date(userSession.currentSessionStartTime);
      const currentSessionTimeMs = now.getTime() - sessionStart.getTime();
      
      // Mettre à jour le temps total de connexion
      await prisma.userSession.update({
        where: { id: userId },
        data: {
          totalConnectionDurationMs: BigInt(Number(userSession.totalConnectionDurationMs || 0) + currentSessionTimeMs),
          currentSessionStartTime: now // Redémarrer le compteur de session actuelle
        }
      });

      // Mettre à jour aussi le temps total du compte
      await prisma.account.update({
        where: { id: userSession.accountId },
        data: {
          totalAccountConnectionDurationMs: {
            increment: BigInt(currentSessionTimeMs)
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Temps de connexion mis à jour'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du temps de connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ===== NOUVELLES ROUTES POUR L'ANALYSE GLOBALE ET LES PRÉFÉRENCES =====

// Récupérer l'analyse globale d'une session enfant
router.post('/:sessionId/global-analysis', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId,
        accountId: parentSession.accountId,
        userType: 'CHILD'
      },
      include: {
        childActivities: {
          orderBy: { completedAt: 'desc' }
        },
        learningSessions: {
          orderBy: { startTime: 'desc' }
        },
        parentPreferences: true
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Limitation plan Découverte (FREE) : 1 analyse par 7 jours (tous types confondus)
    if (parentSession.account.subscriptionType === 'FREE') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAnalyses = await prisma.aIAnalysis.count({
        where: {
          userSessionId: childSession.id,
          analysisType: { in: ['progress', 'global', 'exercise'] },
          createdAt: { gte: sevenDaysAgo }
        }
      });
      if (recentAnalyses >= 1) {
        return res.status(429).json({
          error: 'Limite atteinte: 1 analyse/semaine pour le plan Découverte',
          code: 'ANALYSIS_LIMIT_REACHED',
          retryAfterDays: 7
        });
      }
    }

    // Construire le contexte d'apprentissage
    const learningContext = await buildLearningContext(childSession);
    
    // Générer l'analyse IA globale
    const globalAnalysis = await generateGlobalAnalysis(childSession, learningContext);

    // Stocker l'analyse globale
    await prisma.aIAnalysis.create({
      data: {
        userSessionId: childSession.id,
        analysisType: 'global',
        content: typeof globalAnalysis === 'string' ? globalAnalysis : JSON.stringify(globalAnalysis),
        prompt: 'Fallback Analysis - Appréciation Globale',
        context: learningContext,
        metadata: {
          childAge: childSession.age,
          totalActivities: childSession.childActivities.length,
          averageScore: learningContext.averageScore,
          analysisDate: new Date().toISOString()
        }
      }
    });

    res.json({
      sessionId,
      childName: `${childSession.firstName} ${childSession.lastName}`,
      context: learningContext,
      analysis: globalAnalysis,
      recommendations: generateTimeRecommendations(learningContext)
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse globale:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Sauvegarder les préférences parentales
router.post('/:sessionId/preferences', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      childStrengths,
      focusAreas,
      learningGoals,
      concerns,
      preferredSchedule,
      studyDuration,
      breakFrequency,
      learningStyle,
      motivationFactors
    } = req.body;
    
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId,
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Créer ou mettre à jour les préférences
    const preferences = await prisma.parentPreferences.upsert({
      where: {
        userSessionId: childSession.id
      },
      update: {
        childStrengths,
        focusAreas,
        learningGoals,
        concerns,
        preferredSchedule,
        studyDuration,
        breakFrequency,
        learningStyle,
        motivationFactors
      },
      create: {
        userSessionId: childSession.id,
        childStrengths,
        focusAreas,
        learningGoals,
        concerns,
        preferredSchedule,
        studyDuration,
        breakFrequency,
        learningStyle,
        motivationFactors
      }
    });

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des préférences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Récupérer les préférences parentales
router.get('/:sessionId/preferences', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId,
        accountId: parentSession.accountId,
        userType: 'CHILD'
      },
      include: {
        parentPreferences: true
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      preferences: childSession.parentPreferences
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des préférences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Fonctions utilitaires pour l'analyse globale
async function buildLearningContext(childSession: any) {
  const now = new Date();
  const registrationDate = childSession.createdAt;
  const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculer les statistiques temporelles
  const totalLearningTime = childSession.childActivities.reduce((sum: number, activity: any) => sum + activity.duration, 0);
  const averageSessionDuration = childSession.learningSessions.length > 0 
    ? childSession.learningSessions.reduce((sum: number, session: any) => sum + session.duration, 0) / childSession.learningSessions.length
    : 0;
  
  // Analyser les patterns d'apprentissage
  const sessionPatterns = analyzeSessionPatterns(childSession.learningSessions);
  const learningFrequency = determineLearningFrequency(childSession.learningSessions, daysSinceRegistration);
  
  // Analyser les préférences temporelles
  const preferredTimeSlots = analyzePreferredTimeSlots(childSession.learningSessions);
  
  return {
    daysSinceRegistration,
    totalLearningTime,
    averageSessionDuration,
    learningFrequency,
    sessionPatterns,
    preferredTimeSlots,
    age: childSession.age,
    grade: childSession.grade,
    totalActivities: childSession.childActivities.length,
    averageScore: childSession.childActivities.length > 0 
      ? childSession.childActivities.reduce((sum: number, activity: any) => sum + activity.score, 0) / childSession.childActivities.length
      : 0
  };
}

function analyzeSessionPatterns(sessions: any[]) {
  const patterns = {
    morning: 0,
    afternoon: 0,
    evening: 0
  };
  
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    if (hour >= 6 && hour < 12) patterns.morning++;
    else if (hour >= 12 && hour < 18) patterns.afternoon++;
    else patterns.evening++;
  });
  
  return patterns;
}

function determineLearningFrequency(sessions: any[], daysSinceRegistration: number) {
  if (daysSinceRegistration === 0) return 'nouveau';
  if (daysSinceRegistration <= 7) return 'quotidien';
  if (sessions.length / daysSinceRegistration >= 0.7) return 'régulier';
  if (sessions.length / daysSinceRegistration >= 0.3) return 'modéré';
  return 'irrégulier';
}

function analyzePreferredTimeSlots(sessions: any[]) {
  const slots = {
    morning: 0,
    afternoon: 0,
    evening: 0
  };
  
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    if (hour >= 6 && hour < 12) slots.morning++;
    else if (hour >= 12 && hour < 18) slots.afternoon++;
    else slots.evening++;
  });
  
  const maxSlot = Object.entries(slots).reduce((a, b) => slots[a[0] as keyof typeof slots] > slots[b[0] as keyof typeof slots] ? a : b);
  return maxSlot[0];
}

async function generateGlobalAnalysis(childSession: any, context: any) {
  try {
    // Construire le contexte pédagogique
    const pedagogicalContext = {
      childName: `${childSession.firstName} ${childSession.lastName}`,
      age: childSession.age || 8,
      grade: childSession.grade || 'CE2',
      daysSinceRegistration: context.daysSinceRegistration,
      totalLearningTime: context.totalLearningTime,
      averageSessionDuration: context.averageSessionDuration,
      learningFrequency: context.learningFrequency,
      sessionPatterns: context.sessionPatterns,
      preferredTimeSlots: context.preferredTimeSlots,
      totalActivities: context.totalActivities,
      averageScore: context.averageScore,
      recentActivities: childSession.childActivities.slice(0, 10).map((activity: any) => ({
        type: activity.type,
        title: activity.title,
        score: activity.score,
        duration: activity.duration,
        completedAt: activity.completedAt
      })),
      parentPreferences: childSession.parentPreferences ? {
        childStrengths: childSession.parentPreferences.childStrengths,
        focusAreas: childSession.parentPreferences.focusAreas,
        learningGoals: childSession.parentPreferences.learningGoals,
        concerns: childSession.parentPreferences.concerns,
        studyDuration: childSession.parentPreferences.studyDuration,
        learningStyle: childSession.parentPreferences.learningStyle || undefined
      } : undefined
    };

    // Générer l'analyse avec l'IA
    const aiAnalysis = await PedagogicalAnalysisService.generateGlobalAnalysis(pedagogicalContext);

    return {
      engagement: context.totalLearningTime > 60 ? 'excellent' : context.totalLearningTime > 30 ? 'bon' : 'à améliorer',
      progression: context.averageScore > 80 ? 'remarquable' : context.averageScore > 60 ? 'satisfaisante' : 'à renforcer',
      rythme: context.learningFrequency === 'quotidien' ? 'excellent' : context.learningFrequency === 'régulier' ? 'bon' : 'à optimiser',
      recommandations: generateRecommendations(context, childSession),
      aiAnalysis: aiAnalysis
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse globale IA:', error);
    return {
      engagement: 'à améliorer',
      progression: 'à renforcer',
      rythme: 'à optimiser',
      recommandations: [],
      aiAnalysis: "Erreur lors de l'analyse. Veuillez réessayer."
    };
  }
}

function generateRecommendations(context: any, childSession: any) {
  const recommendations = [];
  
  // Recommandations basées sur le temps depuis l'inscription
  if (context.daysSinceRegistration <= 7) {
    recommendations.push({
      type: 'nouveau_inscrit',
      message: `Excellent début ! ${childSession.firstName} s'est inscrit(e) il y a ${context.daysSinceRegistration} jour(s) et a déjà passé ${context.totalLearningTime} minutes à apprendre.`,
      action: 'Maintenir cette dynamique avec des sessions courtes et régulières.'
    });
  }
  
  // Recommandations basées sur la durée des sessions
  if (context.averageSessionDuration > 45) {
    recommendations.push({
      type: 'sessions_longues',
      message: 'Les sessions sont un peu longues pour son âge.',
      action: 'Diviser en sessions de 20-25 minutes avec des pauses de 10 minutes.'
    });
  }
  
  // Recommandations basées sur les scores
  if (context.averageScore < 70) {
    recommendations.push({
      type: 'scores_faibles',
      message: `Le score moyen de ${context.averageScore.toFixed(1)}% indique quelques difficultés.`,
      action: 'Revoir les concepts de base et proposer des exercices plus simples.'
    });
  }
  
  return recommendations;
}

function generateTimeRecommendations(context: any) {
  const recommendations = [];
  
  // Recommandations temporelles
  if (context.preferredTimeSlots === 'morning') {
    recommendations.push({
      type: 'horaire_optimal',
      message: `${context.preferredTimeSlots} semble être le moment optimal pour l'apprentissage.`,
      action: 'Planifier les sessions importantes le matin.'
    });
  }
  
  if (context.learningFrequency === 'irrégulier') {
    recommendations.push({
      type: 'rythme',
      message: 'L\'apprentissage est irrégulier.',
      action: 'Établir une routine quotidienne de 15-20 minutes.'
    });
  }
  
  return recommendations;
}

// ===== ROUTES EXISTANTES POUR LES SESSIONS ENFANTS =====

// Types pour les sessions enfants
interface ChildSession {
  id: string
  sessionId: string
  name: string
  emoji: string
  isOnline: boolean
  lastActivity: Date
  totalTime: number
  userType: 'CHILD'
}

interface ChildActivity {
  id: string
  sessionId: string
  type: 'MATH' | 'READING' | 'SCIENCE' | 'CODING' | 'GAME'
  title: string
  score: number
  duration: number
  completedAt: Date
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

// Route pour mettre à jour le statut en temps réel
router.post('/:sessionId/status', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isOnline } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: { account: true }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher la session enfant
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId,
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    const now = new Date();
    let updateData: any = {
      lastLoginAt: now
    };

    if (isOnline) {
      // Si l'enfant se connecte
      if (!childSession.currentSessionStartTime) {
        updateData.currentSessionStartTime = now;
      }
    } else {
      // Si l'enfant se déconnecte
      if (childSession.currentSessionStartTime) {
        const sessionStart = new Date(childSession.currentSessionStartTime);
        const sessionDuration = now.getTime() - sessionStart.getTime();
        const currentTotalMs = Number(childSession.totalConnectionDurationMs || 0);
        
        updateData.currentSessionStartTime = null;
        updateData.totalConnectionDurationMs = currentTotalMs + sessionDuration;
      }
    }

    // Mettre à jour la session
    const updatedSession = await prisma.userSession.update({
      where: { id: childSession.id },
      data: updateData
    });

    // Calculer le temps total mis à jour
    let totalTimeMs = Number(updatedSession.totalConnectionDurationMs || 0);
    if (updatedSession.currentSessionStartTime) {
      const sessionStart = new Date(updatedSession.currentSessionStartTime);
      const currentSessionTime = now.getTime() - sessionStart.getTime();
      totalTimeMs += currentSessionTime;
    }

    res.json({
      success: true,
      sessionId,
      isOnline: !!updatedSession.currentSessionStartTime,
      totalTime: Math.floor(totalTimeMs / (1000 * 60)),
      lastActivity: updatedSession.lastLoginAt
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Récupérer les activités d'une session
router.get('/:sessionId/activities', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher par sessionId (pas par id interne)
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId, // Utiliser sessionId ici
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Récupérer les activités
    const activities = await prisma.childActivity.findMany({
      where: {
        sessionId: childSession.id // Utiliser l'ID interne ici
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    res.json(activities);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des activités:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Analyser les performances d'une session
router.post('/:sessionId/analyze', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher par sessionId (pas par id interne)
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId, // Utiliser sessionId ici
        accountId: parentSession.accountId,
        userType: 'CHILD'
      },
      include: {
        childActivities: {
          orderBy: { completedAt: 'desc' },
          take: 20
        },
        parentPreferences: true
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Limitation plan Découverte (FREE) : 1 analyse par 7 jours (tous types confondus)
    if (parentSession.account.subscriptionType === 'FREE') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAnalyses = await prisma.aIAnalysis.count({
        where: {
          userSessionId: childSession.id,
          analysisType: { in: ['progress', 'global', 'exercise'] },
          createdAt: { gte: sevenDaysAgo }
        }
      });
      if (recentAnalyses >= 1) {
        return res.status(429).json({
          error: 'Limite atteinte: 1 analyse/semaine pour le plan Découverte',
          code: 'ANALYSIS_LIMIT_REACHED',
          retryAfterDays: 7
        });
      }
    }

    // Construire le contexte pédagogique
    const pedagogicalContext = {
      childName: `${childSession.firstName} ${childSession.lastName}`,
      age: childSession.age || 8,
      grade: childSession.grade || 'CE2',
      daysSinceRegistration: Math.floor((new Date().getTime() - childSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      totalLearningTime: childSession.childActivities.reduce((sum: number, act: any) => sum + act.duration, 0),
      averageSessionDuration: 0, // À calculer si on a des LearningSession
      learningFrequency: 'régulier',
      sessionPatterns: { morning: 0, afternoon: 0, evening: 0 },
      preferredTimeSlots: 'matin',
      totalActivities: childSession.childActivities.length,
      averageScore: childSession.childActivities.length > 0 
        ? childSession.childActivities.reduce((sum: number, act: any) => sum + act.score, 0) / childSession.childActivities.length
        : 0,
      recentActivities: childSession.childActivities.slice(0, 10).map((activity: any) => ({
        type: activity.type,
        title: activity.title,
        score: activity.score,
        duration: activity.duration,
        completedAt: activity.completedAt
      })),
      parentPreferences: childSession.parentPreferences ? {
        childStrengths: childSession.parentPreferences.childStrengths,
        focusAreas: childSession.parentPreferences.focusAreas,
        learningGoals: childSession.parentPreferences.learningGoals,
        concerns: childSession.parentPreferences.concerns,
        studyDuration: childSession.parentPreferences.studyDuration,
        learningStyle: childSession.parentPreferences.learningStyle || undefined
      } : undefined
    };

    // Générer l'analyse avec l'IA
    const aiAnalysis = await PedagogicalAnalysisService.analyzeProgress(pedagogicalContext);

    // Stocker l'analyse en base de données
    await prisma.aIAnalysis.create({
      data: {
        userSessionId: childSession.id,
        analysisType: 'progress',
        content: aiAnalysis,
        prompt: 'Fallback Analysis - Compte Rendu',
        context: pedagogicalContext,
        metadata: {
          childAge: childSession.age,
          totalActivities: childSession.childActivities.length,
          averageScore: pedagogicalContext.averageScore,
          analysisDate: new Date().toISOString()
        }
      }
    });

    res.json({
      sessionId,
      analysis: aiAnalysis
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse de session:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Générer un nouvel exercice recommandé
router.post('/:sessionId/exercise', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher par sessionId (pas par id interne)
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId, // Utiliser sessionId ici
        accountId: parentSession.accountId,
        userType: 'CHILD'
      },
      include: {
        childActivities: {
          orderBy: { completedAt: 'desc' },
          take: 20
        },
        parentPreferences: true
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Limitation plan Découverte (FREE) : 1 analyse par 7 jours (tous types confondus)
    if (parentSession.account.subscriptionType === 'FREE') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAnalyses = await prisma.aIAnalysis.count({
        where: {
          userSessionId: childSession.id,
          analysisType: { in: ['progress', 'global', 'exercise'] },
          createdAt: { gte: sevenDaysAgo }
        }
      });
      if (recentAnalyses >= 1) {
        return res.status(429).json({
          error: 'Limite atteinte: 1 analyse/semaine pour le plan Découverte',
          code: 'ANALYSIS_LIMIT_REACHED',
          retryAfterDays: 7
        });
      }
    }

    // Construire le contexte pédagogique
    const pedagogicalContext = {
      childName: `${childSession.firstName} ${childSession.lastName}`,
      age: childSession.age || 8,
      grade: childSession.grade || 'CE2',
      daysSinceRegistration: Math.floor((new Date().getTime() - childSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      totalLearningTime: childSession.childActivities.reduce((sum: number, act: any) => sum + act.duration, 0),
      averageSessionDuration: 0,
      learningFrequency: 'régulier',
      sessionPatterns: { morning: 0, afternoon: 0, evening: 0 },
      preferredTimeSlots: 'matin',
      totalActivities: childSession.childActivities.length,
      averageScore: childSession.childActivities.length > 0 
        ? childSession.childActivities.reduce((sum: number, act: any) => sum + act.score, 0) / childSession.childActivities.length
        : 0,
      recentActivities: childSession.childActivities.slice(0, 10).map((activity: any) => ({
        type: activity.type,
        title: activity.title,
        score: activity.score,
        duration: activity.duration,
        completedAt: activity.completedAt
      })),
      parentPreferences: childSession.parentPreferences ? {
        childStrengths: childSession.parentPreferences.childStrengths,
        focusAreas: childSession.parentPreferences.focusAreas,
        learningGoals: childSession.parentPreferences.learningGoals,
        concerns: childSession.parentPreferences.concerns,
        studyDuration: childSession.parentPreferences.studyDuration,
        learningStyle: childSession.parentPreferences.learningStyle || undefined
      } : undefined
    };

    // Générer l'exercice avec l'IA
    const aiExercise = await PedagogicalAnalysisService.generateExercise(pedagogicalContext);

    // Stocker l'exercice en base de données
    await prisma.aIAnalysis.create({
      data: {
        userSessionId: childSession.id,
        analysisType: 'exercise',
        content: aiExercise,
        prompt: 'Fallback Analysis - Conseils et Exercices',
        context: pedagogicalContext,
        metadata: {
          childAge: childSession.age,
          totalActivities: childSession.childActivities.length,
          averageScore: pedagogicalContext.averageScore,
          exerciseDate: new Date().toISOString()
        }
      }
    });

    res.json({
      sessionId,
      exercise: aiExercise
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'exercice:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Enregistrer une nouvelle activité
router.post('/:sessionId/activities', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, title, score, duration, difficulty } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher par sessionId (pas par id interne)
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId, // Utiliser sessionId ici
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Créer l'activité
    const activity = await prisma.childActivity.create({
      data: {
        sessionId: childSession.id, // Utiliser l'ID interne ici
        type,
        title,
        score,
        duration,
        difficulty,
        completedAt: new Date()
      }
    });

    // Mettre à jour le temps total de la session
    await prisma.userSession.update({
      where: { id: childSession.id },
      data: {
        totalConnectionDurationMs: BigInt(Number(childSession.totalConnectionDurationMs || 0) + (duration * 60 * 1000)),
        lastLoginAt: new Date()
      }
    });

    res.json(activity);
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement d\'activité:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Mettre à jour le statut en ligne/hors ligne
router.patch('/:sessionId/status', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isOnline } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'UNAUTHORIZED'
      });
    }

    // Vérifier que la session appartient au parent
    const parentSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true
      }
    });

    if (!parentSession || parentSession.userType !== 'PARENT') {
      return res.status(403).json({
        error: 'Accès réservé aux parents',
        code: 'FORBIDDEN'
      });
    }

    // Chercher par sessionId (pas par id interne)
    const childSession = await prisma.userSession.findFirst({
      where: {
        sessionId: sessionId, // Utiliser sessionId ici
        accountId: parentSession.accountId,
        userType: 'CHILD'
      }
    });

    if (!childSession) {
      return res.status(404).json({
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Mettre à jour le statut
    await prisma.userSession.update({
      where: { id: childSession.id },
      data: {
        currentSessionStartTime: isOnline ? new Date() : null,
        lastLoginAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
