import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// ===== ROUTES POUR LES JEUX =====

// Récupérer tous les jeux actifs
router.get('/games', requireAuth, async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' }
    })
    
    res.json({
      success: true,
      games
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des jeux:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des jeux',
      code: 'GAMES_FETCH_ERROR'
    })
  }
})

// Récupérer les jeux recommandés pour un utilisateur
router.get('/games/recommended', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    // Récupérer les préférences de l'utilisateur
    const userProfile = await prisma.userProfile.findUnique({
      where: { userSessionId: userId }
    })
    
    // Récupérer les jeux les mieux notés
    const recommendedGames = await prisma.game.findMany({
      where: { 
        isActive: true,
        // Filtrer par âge si disponible
        ...(userProfile?.age && {
          OR: [
            { minAge: null },
            { minAge: { lte: userProfile.age } },
            { maxAge: null },
            { maxAge: { gte: userProfile.age } }
          ]
        })
      },
      orderBy: { rating: 'desc' },
      take: 10
    })
    
    res.json({
      success: true,
      games: recommendedGames
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des jeux recommandés:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des jeux recommandés',
      code: 'RECOMMENDED_GAMES_FETCH_ERROR'
    })
  }
})

// Récupérer les top jeux par domaine
router.get('/games/top/:domain', requireAuth, async (req, res) => {
  try {
    const { domain } = req.params
    
    const topGames = await prisma.game.findMany({
      where: { 
        isActive: true,
        domain: domain
      },
      orderBy: { rating: 'desc' },
      take: 5
    })
    
    res.json({
      success: true,
      games: topGames
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des top jeux:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des top jeux',
      code: 'TOP_GAMES_FETCH_ERROR'
    })
  }
})

// ===== ROUTES POUR LES EXERCICES =====

// Récupérer tous les exercices actifs
router.get('/exercises', requireAuth, async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' }
    })
    
    res.json({
      success: true,
      exercises
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des exercices:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des exercices',
      code: 'EXERCISES_FETCH_ERROR'
    })
  }
})

// Récupérer les exercices recommandés pour un utilisateur
router.get('/exercises/recommended', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    // Récupérer les préférences de l'utilisateur
    const userProfile = await prisma.userProfile.findUnique({
      where: { userSessionId: userId }
    })
    
    // Récupérer les exercices les mieux notés
    const recommendedExercises = await prisma.exercise.findMany({
      where: { 
        isActive: true,
        // Filtrer par difficulté si disponible
        ...(userProfile?.difficulty && {
          difficulty: userProfile.difficulty
        })
      },
      orderBy: { rating: 'desc' },
      take: 10
    })
    
    res.json({
      success: true,
      exercises: recommendedExercises
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des exercices recommandés:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des exercices recommandés',
      code: 'RECOMMENDED_EXERCISES_FETCH_ERROR'
    })
  }
})

// Récupérer les top exercices par domaine
router.get('/exercises/top/:domain', requireAuth, async (req, res) => {
  try {
    const { domain } = req.params
    
    const topExercises = await prisma.exercise.findMany({
      where: { 
        isActive: true,
        domain: domain
      },
      orderBy: { rating: 'desc' },
      take: 5
    })
    
    res.json({
      success: true,
      exercises: topExercises
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des top exercices:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des top exercices',
      code: 'TOP_EXERCISES_FETCH_ERROR'
    })
  }
})

// ===== ROUTES POUR LE PLANNING =====

// Récupérer le planning d'un utilisateur
router.get('/schedule', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    const schedules = await prisma.schedule.findMany({
      where: { 
        userSessionId: userId,
        accountId: accountId
      },
      orderBy: { startTime: 'asc' }
    })
    
    res.json({
      success: true,
      schedules
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du planning:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération du planning',
      code: 'SCHEDULE_FETCH_ERROR'
    })
  }
})

// Créer un nouvel événement dans le planning
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    const { title, description, startTime, endTime, type, priority } = req.body
    
    const schedule = await prisma.schedule.create({
      data: {
        userSessionId: userId,
        accountId: accountId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)),
        type,
        priority: priority || 'MEDIUM'
      }
    })
    
    res.json({
      success: true,
      schedule
    })
  } catch (error) {
    console.error('❌ Erreur lors de la création du planning:', error)
    res.status(500).json({
      error: 'Erreur lors de la création du planning',
      code: 'SCHEDULE_CREATE_ERROR'
    })
  }
})

// ===== ROUTES POUR LES MESSAGES D'ACCUEIL =====

// Récupérer le message d'accueil personnalisé
router.get('/welcome-message', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    // Récupérer le message d'accueil actif le plus récent
    const welcomeMessage = await prisma.welcomeMessage.findFirst({
      where: { 
        userSessionId: userId,
        accountId: accountId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!welcomeMessage) {
      // Générer un message par défaut
      const userSession = await prisma.userSession.findUnique({
        where: { id: userId },
        include: { account: true }
      })
      
      if (userSession) {
        const daysSinceRegistration = Math.floor(
          (new Date().getTime() - userSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        const defaultMessage = {
          content: `Bonjour ${userSession.firstName} ! ${
            daysSinceRegistration === 0 
              ? "Bienvenue sur CubeAI ! Nous sommes ravis de vous accueillir pour votre première journée d'apprentissage."
              : daysSinceRegistration < 7
              ? `C'est votre ${daysSinceRegistration + 1}e jour sur CubeAI ! Continuez sur cette lancée !`
              : `Vous êtes sur CubeAI depuis ${daysSinceRegistration} jours ! Votre progression est impressionnante !`
          }`,
          messageType: 'DAILY_GREETING',
          isGenerated: true
        }
        
        return res.json({
          success: true,
          message: defaultMessage
        })
      }
    }
    
    res.json({
      success: true,
      message: welcomeMessage
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du message d\'accueil:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération du message d\'accueil',
      code: 'WELCOME_MESSAGE_FETCH_ERROR'
    })
  }
})

// ===== ROUTES POUR LES RECOMMANDATIONS =====

// Récupérer les recommandations personnalisées
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    const recommendations = await prisma.recommendation.findMany({
      where: { 
        userSessionId: userId,
        accountId: accountId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { score: 'desc' }
    })
    
    res.json({
      success: true,
      recommendations
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des recommandations:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des recommandations',
      code: 'RECOMMENDATIONS_FETCH_ERROR'
    })
  }
})

// ===== ROUTES POUR LES STATISTIQUES =====

// Récupérer les statistiques d'activité
router.get('/stats/activity', requireAuth, async (req, res) => {
  try {
    const { userId, accountId } = req.user!
    
    // Statistiques des jeux
    const gameStats = await prisma.gameSession.groupBy({
      by: ['gameId'],
      where: { userSessionId: userId },
      _count: { id: true },
      _avg: { score: true },
      _sum: { duration: true }
    })
    
    // Statistiques des exercices
    const exerciseStats = await prisma.exerciseAttempt.groupBy({
      by: ['exerciseId'],
      where: { userSessionId: userId },
      _count: { id: true },
      _avg: { score: true },
      _sum: { duration: true }
    })
    
    // Temps total d'activité
    const totalGameTime = gameStats.reduce((sum, stat) => sum + (stat._sum.duration || 0), 0)
    const totalExerciseTime = exerciseStats.reduce((sum, stat) => sum + (stat._sum.duration || 0), 0)
    
    res.json({
      success: true,
      stats: {
        totalGameTime,
        totalExerciseTime,
        totalTime: totalGameTime + totalExerciseTime,
        gamesPlayed: gameStats.length,
        exercisesCompleted: exerciseStats.filter(s => s._count.id > 0).length,
        averageGameScore: gameStats.length > 0 ? gameStats.reduce((sum, stat) => sum + (stat._avg.score || 0), 0) / gameStats.length : 0,
        averageExerciseScore: exerciseStats.length > 0 ? exerciseStats.reduce((sum, stat) => sum + (stat._avg.score || 0), 0) / exerciseStats.length : 0
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      code: 'STATS_FETCH_ERROR'
    })
  }
})

export default router
