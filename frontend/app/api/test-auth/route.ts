import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 DEBUT test-auth endpoint')
    
    const cookieStore = await cookies()
    const token = cookieStore.get('authToken')?.value

    console.log('🔍 Token depuis cookie:', token ? 'Oui' : 'Non')
    console.log('🔍 Token complet:', token)

    // Essayer de récupérer le token depuis les headers Authorization
    const headers = await import('next/headers')
    const headersList = headers.headers()
    const authHeader = headersList.get('authorization')
    const authToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    console.log('🔍 Token depuis Authorization header:', authToken ? 'Oui' : 'Non')
    console.log('🔍 Authorization header complet:', authHeader)
    
    const finalToken = token || authToken
    console.log('🔍 Token final utilisé:', finalToken ? 'Oui' : 'Non')
    console.log('🔍 Token final complet:', finalToken)

    if (!finalToken) {
      console.log('❌ Aucun token trouvé')
      return NextResponse.json({ 
        success: false, 
        message: 'Aucun token trouvé',
        tokenFromCookie: !!token,
        tokenFromHeader: !!authToken
      })
    }

    try {
      console.log('🔍 Tentative de décodage du token...')
      const decoded = jwt.verify(finalToken, process.env.JWT_SECRET || 'your-secret-key') as any
      console.log('🔍 Token décodé:', decoded)
      
      if (decoded && decoded.userId) {
        console.log('🔍 Recherche de l\'utilisateur avec ID:', decoded.userId)
        const userSession = await prisma.userSession.findUnique({
          where: { id: decoded.userId },
          include: { account: true }
        })
        
        if (userSession) {
          console.log('✅ Utilisateur trouvé:', userSession.firstName, userSession.userType)
          return NextResponse.json({ 
            success: true, 
            user: {
              id: userSession.id,
              sessionId: userSession.sessionId,
              firstName: userSession.firstName,
              lastName: userSession.lastName,
              userType: userSession.userType,
              email: userSession.account.email
            }
          })
        } else {
          console.log('❌ Utilisateur non trouvé en base de données')
          return NextResponse.json({ 
            success: false, 
            message: 'Utilisateur non trouvé en base de données',
            decoded: decoded
          })
        }
      } else {
        console.log('❌ Token invalide ou pas de userId')
        return NextResponse.json({ 
          success: false, 
          message: 'Token invalide ou pas de userId',
          decoded: decoded
        })
      }
    } catch (error) {
      console.log('❌ Erreur décodage token:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur décodage token',
        error: (error as Error).message
      })
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur générale',
      error: (error as Error).message
    })
  }
}

