import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    // Transférer la requête au backend avec les cookies d'authentification
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/user-scores?limit=${limit}`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des scores utilisateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

