import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

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
