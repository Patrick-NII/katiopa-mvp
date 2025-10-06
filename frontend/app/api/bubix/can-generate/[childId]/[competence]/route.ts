import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string; competence: string } }
) {
  try {
    const { childId, competence } = params
    
    // Transférer la requête au backend avec les cookies d'authentification
    const response = await fetch(`${BACKEND_URL}/api/bubix/can-generate/${childId}/${competence}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      }
    })
    
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Erreur API /api/bubix/can-generate:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
