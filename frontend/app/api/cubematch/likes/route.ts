import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

// GET - Récupérer les likes d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/likes?gameId=${gameId}`, {
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
    console.error('Error proxying likes request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

// POST - Ajouter/retirer un like (proxy vers backend)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(body)
    });

    const data = await backendResponse.json();
    
    return NextResponse.json(data, { 
      status: backendResponse.status 
    });
    
  } catch (error) {
    console.error('Error proxying like request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle like' },
      { status: 500 }
    );
  }
}
