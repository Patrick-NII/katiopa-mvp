import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/saved-reports - Récupérer tous les rapports sauvegardés d'un parent
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { childId, limit = '20', offset = '0', tags, favorite } = req.query

    const where: any = { parentId: userId }
    
    if (childId) where.childId = childId
    if (tags) where.tags = { hasSome: (tags as string).split(',') }
    if (favorite === 'true') where.isFavorite = true

    const reports = await prisma.savedBubixReport.findMany({
      where,
      orderBy: { savedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })

    // Récupérer les analyses correspondantes
    const analysisIds = reports.map(r => r.analysisId)
    const analyses = await prisma.bubixAnalysis.findMany({
      where: { id: { in: analysisIds } }
    })

    // Combiner les données
    const reportsWithAnalysis = reports.map(report => {
      const analysis = analyses.find(a => a.id === report.analysisId)
      return {
        ...report,
        analysis: analysis || null
      }
    })

    res.json({
      reports: reportsWithAnalysis,
      total: await prisma.savedBubixReport.count({ where }),
      hasMore: reports.length === parseInt(limit as string)
    })

  } catch (error) {
    console.error('Erreur récupération rapports sauvegardés:', error)
    res.status(500).json({ 
      error: 'FETCH_FAILED', 
      message: 'Erreur lors de la récupération des rapports' 
    })
  }
})

// POST /api/saved-reports - Sauvegarder un rapport
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { childId, analysisId, title, notes, tags } = req.body

    if (!childId || !analysisId || !title) {
      return res.status(400).json({ 
        error: 'MISSING_FIELDS', 
        message: 'childId, analysisId et title sont requis' 
      })
    }

    // Vérifier que l'analyse existe
    const analysis = await prisma.bubixAnalysis.findUnique({
      where: { id: analysisId }
    })

    if (!analysis) {
      return res.status(404).json({ 
        error: 'ANALYSIS_NOT_FOUND', 
        message: 'Analyse non trouvée' 
      })
    }

    // Vérifier si le rapport n'est pas déjà sauvegardé
    const existingReport = await prisma.savedBubixReport.findFirst({
      where: {
        parentId: userId,
        analysisId: analysisId
      }
    })

    if (existingReport) {
      return res.status(409).json({ 
        error: 'ALREADY_SAVED', 
        message: 'Ce rapport est déjà sauvegardé' 
      })
    }

    const savedReport = await prisma.savedBubixReport.create({
      data: {
        parentId: userId,
        childId,
        analysisId,
        title,
        notes: notes || null,
        tags: tags || []
      }
    })

    res.status(201).json(savedReport)

  } catch (error) {
    console.error('Erreur sauvegarde rapport:', error)
    res.status(500).json({ 
      error: 'SAVE_FAILED', 
      message: 'Erreur lors de la sauvegarde' 
    })
  }
})

// PUT /api/saved-reports/:id - Mettre à jour un rapport sauvegardé
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    const { title, notes, tags, isFavorite } = req.body

    const updatedReport = await prisma.savedBubixReport.updateMany({
      where: {
        id,
        parentId: userId // S'assurer que le parent peut seulement modifier ses propres rapports
      },
      data: {
        title,
        notes,
        tags,
        isFavorite,
        updatedAt: new Date()
      }
    })

    if (updatedReport.count === 0) {
      return res.status(404).json({ 
        error: 'REPORT_NOT_FOUND', 
        message: 'Rapport non trouvé ou non autorisé' 
      })
    }

    const report = await prisma.savedBubixReport.findUnique({
      where: { id }
    })

    res.json(report)

  } catch (error) {
    console.error('Erreur mise à jour rapport:', error)
    res.status(500).json({ 
      error: 'UPDATE_FAILED', 
      message: 'Erreur lors de la mise à jour' 
    })
  }
})

// DELETE /api/saved-reports/:id - Supprimer un rapport sauvegardé
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params

    const deletedReport = await prisma.savedBubixReport.deleteMany({
      where: {
        id,
        parentId: userId // S'assurer que le parent peut seulement supprimer ses propres rapports
      }
    })

    if (deletedReport.count === 0) {
      return res.status(404).json({ 
        error: 'REPORT_NOT_FOUND', 
        message: 'Rapport non trouvé ou non autorisé' 
      })
    }

    res.json({ success: true, message: 'Rapport supprimé avec succès' })

  } catch (error) {
    console.error('Erreur suppression rapport:', error)
    res.status(500).json({ 
      error: 'DELETE_FAILED', 
      message: 'Erreur lors de la suppression' 
    })
  }
})

// GET /api/saved-reports/tags - Récupérer tous les tags utilisés par un parent
router.get('/tags', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user

    const reports = await prisma.savedBubixReport.findMany({
      where: { parentId: userId },
      select: { tags: true }
    })

    // Extraire tous les tags uniques
    const allTags = reports.flatMap(r => r.tags)
    const uniqueTags = allTags.filter((tag, index) => allTags.indexOf(tag) === index).sort()

    res.json({ tags: uniqueTags })

  } catch (error) {
    console.error('Erreur récupération tags:', error)
    res.status(500).json({ 
      error: 'TAGS_FAILED', 
      message: 'Erreur lors de la récupération des tags' 
    })
  }
})

export default router
