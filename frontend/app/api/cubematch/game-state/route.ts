import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Proxy: Sauvegarde état de jeu CubeMatch');
    
    // Transférer la requête au backend avec les cookies
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/game-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Erreur backend sauvegarde état:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('✅ État de jeu sauvegardé avec succès');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur proxy sauvegarde état:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la sauvegarde de l\'état',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Proxy: Nettoyage état de jeu CubeMatch');
    
    // Transférer la requête au backend avec les cookies
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/game-state`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Erreur backend nettoyage état:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('✅ État de jeu nettoyé avec succès');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur proxy nettoyage état:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du nettoyage de l\'état',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
