import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const { sessionId, analysisType, content, prompt, context, metadata } = await request.json()

    if (!sessionId || !analysisType || !content) {
      return NextResponse.json({ 
        error: 'Données manquantes', 
        details: 'sessionId, analysisType et content sont requis' 
      }, { status: 400 })
    }

    // Vérification que la session appartient au parent
    const childSession = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        accountId: decoded.accountId,
        userType: 'CHILD'
      }
    })

    if (!childSession) {
      return NextResponse.json({ 
        error: 'Session enfant non trouvée ou non autorisée' 
      }, { status: 404 })
    }

    // Sauvegarde de l'analyse
    const savedAnalysis = await prisma.aIAnalysis.create({
      data: {
        userSessionId: sessionId,
        analysisType: analysisType,
        content: content,
        prompt: prompt || '',
        context: context || {},
        metadata: metadata || {}
      }
    })

    console.log('✅ Analyse sauvegardée:', {
      id: savedAnalysis.id,
      childName: `${childSession.firstName} ${childSession.lastName}`,
      analysisType: savedAnalysis.analysisType,
      createdAt: savedAnalysis.createdAt
    })

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedAnalysis.id,
        analysisType: savedAnalysis.analysisType,
        content: savedAnalysis.content,
        createdAt: savedAnalysis.createdAt,
        childName: `${childSession.firstName} ${childSession.lastName}`
      }
    })

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return NextResponse.json({
      error: 'Erreur lors de la sauvegarde de l\'analyse',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
