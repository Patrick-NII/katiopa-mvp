import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET - Récupérer le classement d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    const limit = searchParams.get('limit') || '10';
    
    // Proxy vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/ranking?gameId=${gameId}&limit=${limit}`, {
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
    console.error('Error proxying ranking request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ranking' },
      { status: 500 }
    );
  }
}