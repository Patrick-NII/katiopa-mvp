import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { childId } = params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '20'
    
    // Transférer la requête au backend avec les cookies d'authentification
    const response = await fetch(`${BACKEND_URL}/api/bubix/history/${childId}?limit=${limit}`, {
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
    console.error('Erreur API /api/bubix/history:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
