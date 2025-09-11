import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Vérification du statut d\'authentification...');
    
    // Transférer les cookies au backend pour vérification
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (backendResponse.ok) {
      const authData = await backendResponse.json();
      console.log('✅ Utilisateur authentifié:', authData.user?.firstName || authData.user?.username);
      return NextResponse.json({
        authenticated: true,
        user: authData.user
      });
    } else {
      console.log('❌ Utilisateur non authentifié');
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: 'Non authentifié'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification d\'authentification:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
