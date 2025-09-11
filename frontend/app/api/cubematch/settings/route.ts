import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    console.log('🎮 Proxy: Récupération des paramètres CubeMatch');
    
    // Transférer la requête au backend avec les cookies
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/settings`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Erreur backend paramètres:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('✅ Paramètres récupérés avec succès');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur proxy paramètres:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des paramètres',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('💾 Proxy: Sauvegarde des paramètres CubeMatch');
    
    // Transférer la requête au backend avec les cookies
    const backendResponse = await fetch(`${BACKEND_URL}/api/cubematch/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Erreur backend sauvegarde paramètres:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('✅ Paramètres sauvegardés avec succès');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur proxy sauvegarde paramètres:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la sauvegarde des paramètres',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
