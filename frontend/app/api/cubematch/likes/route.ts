import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET - Récupérer les likes d'un jeu (proxy vers backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    
    // Proxy vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/likes?gameId=${gameId}`, {
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
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/likes`, {
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
    console.error('Error proxying like request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle like' },
      { status: 500 }
    );
  }
}