import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST - Ajouter/retirer un like sur un commentaire (proxy vers backend)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments/like`, {
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
    console.error('Error proxying comment like request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle comment like' },
      { status: 500 }
    );
  }
}
