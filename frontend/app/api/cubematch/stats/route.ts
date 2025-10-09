import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

// GET - Récupérer les statistiques d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    const childId = searchParams.get('childId');
    
    let url = `${BACKEND_URL}/api/cubematch/stats?gameId=${gameId}`;
    if (childId) {
      url += `&childId=${childId}`;
    }
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader
      }
    });

    const data = await backendResponse.json();
    
    return NextResponse.json(data, { 
      status: backendResponse.status 
    });
    
  } catch (error) {
    console.error('Error proxying stats request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
