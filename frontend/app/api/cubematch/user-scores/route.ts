import { NextResponse, NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    // Transférer la requête au backend avec les cookies d'authentification
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/user-scores?limit=${limit}`, {
      headers: {
        'Cookie': cookieHeader
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
