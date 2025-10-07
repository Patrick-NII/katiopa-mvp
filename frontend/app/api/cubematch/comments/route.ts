import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET - Récupérer les commentaires d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    
    // Proxy vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments?gameId=${gameId}`, {
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
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
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