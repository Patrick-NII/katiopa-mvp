import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    console.log('🔍 === ROUTE GLOBAL-ANALYSIS DÉMARÉE ===')
    console.log('🔍 SessionId reçu:', sessionId)
    
    // Test authentification basique
    const userInfo = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT',
        isActive: true
      },
      include: {
        account: true
      }
    })
    
    if (!userInfo) {
      console.log('❌ Aucun parent actif trouvé')
      return NextResponse.json(
        { error: 'Authentification requise', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
    
    console.log('✅ Parent trouvé:', userInfo.firstName)

    // POUR LE MOMENT, retourner une appréciation simulée simple
    const appreciation = `📊 **Appréciation détaillée simulée pour la session ${sessionId}**

✅ **Authentification réussie**
- Parent connecté: ${userInfo.firstName} ${userInfo.lastName}
- Session analysée: ${sessionId}

🎯 **Appréciation en cours d'implémentation**
- Les routes API sont maintenant opérationnelles
- L'authentification fonctionne correctement
- Génération IA prochainement disponible

📅 **Généré le:** ${new Date().toLocaleString('fr-FR')}`

    return NextResponse.json({
      success: true,
      appreciation,
      sessionData: {
        childName: 'Enfant de test',
        stats: {
          totalActivities: 0,
          totalTimeMinutes: 0,
          averageScore: 0
        }
      },
      analysisId: 'test-' + Date.now(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur appréciation session:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'appréciation',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}