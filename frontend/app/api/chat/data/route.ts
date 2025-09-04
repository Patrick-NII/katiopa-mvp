// app/api/chat/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DataQuery {
  type: 'performance' | 'profile' | 'activities' | 'sessions' | 'analytics'
  childId?: string
  domain?: string
  timeRange?: 'week' | 'month' | 'all'
  limit?: number
}

// Fonction pour vérifier l'authentification côté serveur
async function verifyAuthServerSide(): Promise<any> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authToken')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded || !decoded.userId) {
      return null
    }

    const userSession = await prisma.userSession.findUnique({
      where: { id: decoded.userId },
      include: { account: true }
    })

    if (!userSession || userSession.userType !== 'PARENT') {
      return null
    }

    return userSession
  } catch (error) {
    console.error('❌ Erreur vérification auth:', error)
    return null
  }
}

// Fonction pour récupérer les performances d'un enfant
async function getChildPerformance(childId: string, domain?: string, timeRange: string = 'all') {
  const whereClause: any = { userSessionId: childId }
  
  if (domain) {
    whereClause.domain = domain
  }
  
  if (timeRange !== 'all') {
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }
    
    whereClause.createdAt = { gte: startDate }
  }

  const activities = await prisma.activity.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  if (activities.length === 0) {
    return {
      totalActivities: 0,
      averageScore: 0,
      bestScore: 0,
      domains: {},
      recentActivity: null
    }
  }

  const scores = activities.map(a => a.score || 0).filter(s => s > 0)
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const bestScore = Math.max(...scores, 0)

  const domains = activities.reduce((acc: any, activity) => {
    if (!acc[activity.domain]) {
      acc[activity.domain] = { count: 0, totalScore: 0 }
    }
    acc[activity.domain].count++
    acc[activity.domain].totalScore += activity.score || 0
    return acc
  }, {})

  // Calculer les moyennes par domaine
  Object.keys(domains).forEach(domain => {
    domains[domain].averageScore = Math.round(domains[domain].totalScore / domains[domain].count)
  })

  return {
    totalActivities: activities.length,
    averageScore,
    bestScore,
    domains,
    recentActivity: activities[0] ? {
      domain: activities[0].domain,
      nodeKey: activities[0].nodeKey,
      score: activities[0].score,
      date: activities[0].createdAt
    } : null
  }
}

// Fonction pour récupérer le profil d'un enfant
async function getChildProfile(childId: string) {
  const child = await prisma.userSession.findUnique({
    where: { id: childId },
    include: {
      profile: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!child) {
    return null
  }

  return {
    basicInfo: {
      firstName: child.firstName,
      lastName: child.lastName,
      age: child.age,
      grade: child.grade,
      gender: child.gender,
      createdAt: child.createdAt,
      lastLoginAt: child.lastLoginAt
    },
    profile: child.profile ? {
      learningGoals: child.profile.learningGoals,
      preferredSubjects: child.profile.preferredSubjects,
      learningStyle: child.profile.learningStyle,
      difficulty: child.profile.difficulty,
      interests: child.profile.interests,
      specialNeeds: child.profile.specialNeeds,
      customNotes: child.profile.customNotes,
      parentWishes: child.profile.parentWishes
    } : null,
    recentActivities: child.activities.map(activity => ({
      domain: activity.domain,
      nodeKey: activity.nodeKey,
      score: activity.score,
      date: activity.createdAt
    }))
  }
}

// Fonction pour récupérer les sessions d'apprentissage
async function getChildSessions(childId: string, limit: number = 20) {
  const sessions = await prisma.learningSession.findMany({
    where: { userSessionId: childId },
    include: {
      activities: true
    },
    orderBy: { startTime: 'desc' },
    take: limit
  })

  return sessions.map(session => ({
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    breaks: session.breaks,
    completionRate: session.completionRate,
    mood: session.mood,
    notes: session.notes,
    activities: session.activities.map(activity => ({
      type: activity.type,
      title: activity.title,
      score: activity.score,
      duration: activity.duration,
      difficulty: activity.difficulty
    }))
  }))
}

// Fonction pour générer des analytics
async function getChildAnalytics(childId: string) {
  const activities = await prisma.activity.findMany({
    where: { userSessionId: childId },
    orderBy: { createdAt: 'desc' }
  })

  const sessions = await prisma.learningSession.findMany({
    where: { userSessionId: childId },
    orderBy: { startTime: 'desc' }
  })

  // Analyse par domaine
  const domainAnalysis = activities.reduce((acc: any, activity) => {
    if (!acc[activity.domain]) {
      acc[activity.domain] = { count: 0, totalScore: 0, scores: [] }
    }
    acc[activity.domain].count++
    acc[activity.domain].totalScore += activity.score || 0
    acc[activity.domain].scores.push(activity.score || 0)
    return acc
  }, {})

  // Calculer les statistiques par domaine
  Object.keys(domainAnalysis).forEach(domain => {
    const scores = domainAnalysis[domain].scores.filter((s: number) => s > 0)
    domainAnalysis[domain].averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    domainAnalysis[domain].bestScore = Math.max(...scores, 0)
    domainAnalysis[domain].totalTime = activities
      .filter(a => a.domain === domain)
      .reduce((sum, a) => sum + (a.durationMs || 0), 0)
  })

  // Analyse temporelle
  const weeklyActivity = activities.reduce((acc: any, activity) => {
    const week = new Date(activity.createdAt).toISOString().slice(0, 10)
    if (!acc[week]) acc[week] = 0
    acc[week]++
    return acc
  }, {})

  return {
    summary: {
      totalActivities: activities.length,
      totalSessions: sessions.length,
      averageSessionDuration: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length) : 0,
      totalTimeSpent: activities.reduce((sum, a) => sum + (a.durationMs || 0), 0)
    },
    domainAnalysis,
    weeklyActivity,
    progress: {
      overallAverage: activities.length > 0 ? Math.round(activities.reduce((sum, a) => sum + (a.score || 0), 0) / activities.length) : 0,
      trend: 'stable' // TODO: Calculer la tendance réelle
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await verifyAuthServerSide()
    
    if (!userInfo) {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'Accès non autorisé. Seuls les parents peuvent accéder aux données.'
      }, { status: 401 })
    }

    const body = await request.json() as DataQuery
    const { type, childId, domain, timeRange, limit } = body

    // Récupérer tous les enfants du parent
    const children = await prisma.userSession.findMany({
      where: {
        accountId: userInfo.accountId,
        userType: 'CHILD',
        isActive: true
      },
      select: { id: true, firstName: true, lastName: true }
    })

    if (children.length === 0) {
      return NextResponse.json({
        error: 'NO_CHILDREN',
        message: 'Aucun enfant trouvé pour ce compte.'
      }, { status: 404 })
    }

    // Si un childId spécifique est demandé, vérifier qu'il appartient au parent
    if (childId && !children.find(c => c.id === childId)) {
      return NextResponse.json({
        error: 'CHILD_NOT_FOUND',
        message: 'Enfant non trouvé ou non autorisé.'
      }, { status: 404 })
    }

    let result: any = {}

    switch (type) {
      case 'performance':
        if (childId) {
          result = await getChildPerformance(childId, domain, timeRange)
        } else {
          // Performance de tous les enfants
          result = {}
          for (const child of children) {
            result[`${child.firstName}_${child.lastName}`] = await getChildPerformance(child.id, domain, timeRange)
          }
        }
        break

      case 'profile':
        if (childId) {
          result = await getChildProfile(childId)
        } else {
          // Profils de tous les enfants
          result = {}
          for (const child of children) {
            result[`${child.firstName}_${child.lastName}`] = await getChildProfile(child.id)
          }
        }
        break

      case 'sessions':
        if (childId) {
          result = await getChildSessions(childId, limit)
        } else {
          // Sessions de tous les enfants
          result = {}
          for (const child of children) {
            result[`${child.firstName}_${child.lastName}`] = await getChildSessions(child.id, limit)
          }
        }
        break

      case 'analytics':
        if (childId) {
          result = await getChildAnalytics(childId)
        } else {
          // Analytics de tous les enfants
          result = {}
          for (const child of children) {
            result[`${child.firstName}_${child.lastName}`] = await getChildAnalytics(child.id)
          }
        }
        break

      default:
        return NextResponse.json({
          error: 'INVALID_TYPE',
          message: 'Type de requête invalide. Types disponibles: performance, profile, sessions, analytics'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        queryType: type,
        childId: childId || 'all',
        domain,
        timeRange,
        limit,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erreur route données:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
