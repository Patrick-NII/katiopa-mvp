import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;
    
    // Proxy vers le backend
    const backendUrl = `http://localhost:4000/api/cubematch/social/stats/${gameId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social stats' },
      { status: 500 }
    );
  }
}

