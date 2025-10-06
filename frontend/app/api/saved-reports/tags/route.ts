import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// GET /api/saved-reports/tags - Récupérer les tags
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/saved-reports/tags`, {
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
    console.error('Erreur API /api/saved-reports/tags:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
