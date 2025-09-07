import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      return NextResponse.json({ error: 'Token d\'authentification manquant' }, { status: 401 })
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any
    if (decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès réservé aux parents' }, { status: 403 })
    }

    // Récupération des analyses sauvegardées pour tous les enfants du parent
    const analyses = await prisma.aIAnalysis.findMany({
      where: {
        userSession: {
          accountId: decoded.accountId,
          userType: 'CHILD'
        }
      },
      include: {
        userSession: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sessionId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatage des données pour le frontend
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      sessionId: analysis.userSession.sessionId,
      childName: `${analysis.userSession.firstName} ${analysis.userSession.lastName}`,
      analysisType: analysis.analysisType,
      content: analysis.content,
      createdAt: analysis.createdAt,
      metadata: analysis.metadata
    }))

    console.log('✅ Analyses récupérées:', {
      count: formattedAnalyses.length,
      parentEmail: decoded.email
    })

    return NextResponse.json({
      success: true,
      analyses: formattedAnalyses
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des analyses',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
