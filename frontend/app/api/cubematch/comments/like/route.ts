import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

// POST - Ajouter/retirer un like sur un commentaire (proxy vers backend)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy vers le backend
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/comments/like`, {
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
    console.error('Error proxying comment like request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle comment like' },
      { status: 500 }
    );
  }
}
