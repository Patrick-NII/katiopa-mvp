import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Récupérer les réglages d'un utilisateur
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params
    
    // Vérifier que l'utilisateur existe
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId: sessionId },
      include: { settings: true }
    })

    if (!userSession) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Si pas de réglages, créer des réglages par défaut
    if (!userSession.settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userSessionId: userSession.id,
          notifications: {
            email: true,
            push: true,
            daily: false,
            weekly: true,
            achievements: true,
            reminders: true,
            social: false
          },
          privacy: {
            profileVisible: true,
            activityVisible: true,
            allowMessages: true,
            showProgress: true,
            shareStats: false,
            allowFriendRequests: true
          },
          appearance: {
            theme: 'auto',
            language: 'fr',
            fontSize: 'medium',
            colorBlind: false,
            highContrast: false,
            reduceAnimations: false,
            compactMode: false
          },
          accessibility: {
            screenReader: false,
            keyboardNavigation: true,
            voiceCommands: false,
            textToSpeech: false,
            audioDescriptions: false,
            focusIndicators: true,
            motionReduction: false,
            colorBlindSupport: false,
            dyslexiaFriendly: false,
            largeCursors: false
          },
          learning: {
            difficulty: 'adaptive',
            autoSave: true,
            hints: true,
            explanations: true,
            practiceMode: false,
            timeLimit: false,
            soundEffects: true,
            backgroundMusic: false
          },
          performance: {
            autoOptimize: true,
            cacheData: true,
            preloadContent: true,
            lowBandwidth: false,
            offlineMode: false
          }
        }
      })
      return res.json({ settings: defaultSettings })
    }

    res.json({ settings: userSession.settings })
  } catch (error) {
    console.error('Erreur lors de la récupération des réglages:', error)
    res.status(500).json({ error: 'Erreur serveur interne' })
  }
})

// Mettre à jour les réglages d'un utilisateur
router.put('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params
    const settingsData = req.body

    // Vérifier que l'utilisateur existe
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId: sessionId }
    })

    if (!userSession) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Mettre à jour ou créer les réglages
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userSessionId: userSession.id },
      update: {
        notifications: settingsData.notifications,
        privacy: settingsData.privacy,
        appearance: settingsData.appearance,
        accessibility: settingsData.accessibility,
        learning: settingsData.learning,
        performance: settingsData.performance,
        updatedAt: new Date()
      },
      create: {
        userSessionId: userSession.id,
        notifications: settingsData.notifications,
        privacy: settingsData.privacy,
        appearance: settingsData.appearance,
        accessibility: settingsData.accessibility,
        learning: settingsData.learning,
        performance: settingsData.performance
      }
    })

    res.json({ 
      message: 'Réglages mis à jour avec succès',
      settings: updatedSettings 
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des réglages:', error)
    res.status(500).json({ error: 'Erreur serveur interne' })
  }
})

// Réinitialiser les réglages aux valeurs par défaut
router.post('/:sessionId/reset', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params

    // Vérifier que l'utilisateur existe
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId: sessionId }
    })

    if (!userSession) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const defaultSettings = await prisma.userSettings.upsert({
      where: { userSessionId: userSession.id },
      update: {
        notifications: {
          email: true,
          push: true,
          daily: false,
          weekly: true,
          achievements: true,
          reminders: true,
          social: false
        },
        privacy: {
          profileVisible: true,
          activityVisible: true,
          allowMessages: true,
          showProgress: true,
          shareStats: false,
          allowFriendRequests: true
        },
        appearance: {
          theme: 'auto',
          language: 'fr',
          fontSize: 'medium',
          colorBlind: false,
          highContrast: false,
          reduceAnimations: false,
          compactMode: false
        },
        accessibility: {
          screenReader: false,
          keyboardNavigation: true,
          voiceCommands: false,
          textToSpeech: false,
          audioDescriptions: false,
          focusIndicators: true,
          motionReduction: false,
          colorBlindSupport: false,
          dyslexiaFriendly: false,
          largeCursors: false
        },
        learning: {
          difficulty: 'adaptive',
          autoSave: true,
          hints: true,
          explanations: true,
          practiceMode: false,
          timeLimit: false,
          soundEffects: true,
          backgroundMusic: false
        },
        performance: {
          autoOptimize: true,
          cacheData: true,
          preloadContent: true,
          lowBandwidth: false,
          offlineMode: false
        },
        updatedAt: new Date()
      },
      create: {
        userSessionId: userSession.id,
        notifications: {
          email: true,
          push: true,
          daily: false,
          weekly: true,
          achievements: true,
          reminders: true,
          social: false
        },
        privacy: {
          profileVisible: true,
          activityVisible: true,
          allowMessages: true,
          showProgress: true,
          shareStats: false,
          allowFriendRequests: true
        },
        appearance: {
          theme: 'auto',
          language: 'fr',
          fontSize: 'medium',
          colorBlind: false,
          highContrast: false,
          reduceAnimations: false,
          compactMode: false
        },
        accessibility: {
          screenReader: false,
          keyboardNavigation: true,
          voiceCommands: false,
          textToSpeech: false,
          audioDescriptions: false,
          focusIndicators: true,
          motionReduction: false,
          colorBlindSupport: false,
          dyslexiaFriendly: false,
          largeCursors: false
        },
        learning: {
          difficulty: 'adaptive',
          autoSave: true,
          hints: true,
          explanations: true,
          practiceMode: false,
          timeLimit: false,
          soundEffects: true,
          backgroundMusic: false
        },
        performance: {
          autoOptimize: true,
          cacheData: true,
          preloadContent: true,
          lowBandwidth: false,
          offlineMode: false
        }
      }
    })

    res.json({ 
      message: 'Réglages réinitialisés avec succès',
      settings: defaultSettings 
    })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des réglages:', error)
    res.status(500).json({ error: 'Erreur serveur interne' })
  }
})

export default router
