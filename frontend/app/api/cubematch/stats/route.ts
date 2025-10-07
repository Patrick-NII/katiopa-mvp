import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

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
    const backendResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
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