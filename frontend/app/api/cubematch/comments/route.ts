import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

// GET - Récupérer les commentaires d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments?gameId=${gameId}`, {
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
    console.error('Error proxying comments request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un commentaire (proxy vers backend)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments`, {
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
    console.error('Error proxying comment creation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
