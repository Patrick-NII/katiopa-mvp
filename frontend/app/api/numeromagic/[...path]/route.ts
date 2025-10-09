/**
 * 🔢 PROXY NEXT.JS POUR NUMÉROMAGIC API
 * 
 * Proxy dynamique pour toutes les routes NuméroMagic
 * Évite les problèmes CORS et centralise l'authentification
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Proxy pour toutes les requêtes NuméroMagic
 */
async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    const backendUrl = `${BACKEND_URL}/api/numeromagic/${path}${queryString}`;
    
    console.log(`🔢 Proxy NuméroMagic: ${request.method} ${backendUrl}`);

    // Récupérer le cookie d'authentification
    const cookieHeader = request.headers.get('cookie') || '';

    // Préparer les headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    };

    // Préparer la requête
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include'
    };

    // Ajouter le body pour POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
      
      console.log('📦 Body envoyé:', {
        method: request.method,
        bodyKeys: Object.keys(body),
        score: body.score,
        level: body.level
      });
    }

    // Faire la requête au backend
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();

    console.log(`✅ Réponse NuméroMagic: ${response.status}`, {
      success: data.success,
      hasScoreId: !!data.scoreId
    });

    // Retourner la réponse
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Erreur proxy NuméroMagic:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context.params);
}

