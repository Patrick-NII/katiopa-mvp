/**
 * 🚀 CUBEMATCH API PROXY v2.0
 * 
 * Proxy unifié pour toutes les routes CubeMatch
 * Architecture Meta/Apple/Disney avec monitoring et cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

// Types pour le monitoring
interface RequestMetrics {
  method: string;
  path: string;
  duration: number;
  status: number;
  timestamp: string;
  userId?: string;
}

// Cache simple en mémoire (à remplacer par Redis en production)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * 🔄 Proxy handler universel
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const startTime = Date.now();
  const method = request.method;
  const path = params.path.join('/');
  const fullPath = `/api/cubematch/${path}`;
  
  try {
    console.log(`🚀 [${method}] CubeMatch API: /${path}`);
    
    // Construire l'URL du backend
    const backendUrl = `${BACKEND_URL}/api/cubematch/${path}`;
    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;
    
    // Vérifier le cache pour les requêtes GET
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || '';

    if (method === 'GET') {
      const cacheKey = `${finalUrl}:${cookieHeader}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`📦 Cache hit pour /${path}`);
        return NextResponse.json(cached.data);
      }
    }
    
    // Préparer les headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CubeMatch-Frontend/2.0',
    };
    
    // Transférer les cookies d'authentification
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    // Transférer le body pour POST/PUT
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch (error) {
        console.warn('⚠️ Pas de body JSON à transférer');
      }
    }
    
    // Faire la requête au backend
    const backendResponse = await fetch(finalUrl, {
      method,
      headers,
      body,
    });
    
    const responseData = await backendResponse.json();
    const duration = Date.now() - startTime;
    
    // Logging et métriques
    const metrics: RequestMetrics = {
      method,
      path: fullPath,
      duration,
      status: backendResponse.status,
      timestamp: new Date().toISOString(),
      userId: extractUserIdFromCookies(cookieHeader)
    };
    
    console.log(`✅ [${method}] /${path} - ${backendResponse.status} (${duration}ms)`);
    
    // Envoyer les métriques à un service de monitoring en production
    await sendMetrics(metrics);
    
    // Mettre en cache les réponses GET réussies
    if (method === 'GET' && backendResponse.ok && shouldCache(path)) {
      const cacheKey = `${finalUrl}:${cookieHeader}`;
      const ttl = getCacheTTL(path);
      
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
        ttl
      });
      
      console.log(`💾 Mis en cache /${path} (TTL: ${ttl}ms)`);
    }
    
    // Retourner la réponse
    const response = NextResponse.json(responseData, {
      status: backendResponse.status,
    });
    
    // Ajouter des headers de performance
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Cache', method === 'GET' && cache.has(`${finalUrl}:${cookieHeader}`) ? 'HIT' : 'MISS');
    response.headers.set('X-API-Version', '2.0');
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [${method}] /${path} - Erreur proxy:`, error);
    
    // Métriques d'erreur
    const errorMetrics: RequestMetrics = {
      method,
      path: fullPath,
      duration,
      status: 500,
      timestamp: new Date().toISOString()
    };
    
    await sendMetrics(errorMetrics);
    
    // Réponse d'erreur standardisée
    return NextResponse.json(
      {
        error: 'Erreur proxy CubeMatch',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        path: fullPath,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      },
      { status: 500 }
    );
  }
}

// Exporter pour tous les verbes HTTP
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;

// 🔧 Fonctions utilitaires

function shouldCache(path: string): boolean {
  // Ne pas mettre en cache les routes sensibles
  const noCacheRoutes = [
    'game-state',
    'settings',
    'sessions/start',
    'sessions/end'
  ];
  
  return !noCacheRoutes.some(route => path.includes(route));
}

function getCacheTTL(path: string): number {
  // TTL différent selon le type de route
  if (path.includes('leaderboard')) return 30000; // 30 secondes
  if (path.includes('scores')) return 60000; // 1 minute
  if (path.includes('analytics')) return 300000; // 5 minutes
  if (path.includes('user-stats')) return 120000; // 2 minutes
  
  return 60000; // Par défaut 1 minute
}

function extractUserIdFromCookies(cookies: string | null): string | undefined {
  if (!cookies) return undefined;
  
  // Extraire l'ID utilisateur des cookies (implémentation simple)
  // En production, décoder le JWT proprement
  const match = cookies.match(/auth[^=]*=([^;]+)/);
  return match ? `user_${match[1].slice(0, 8)}` : undefined;
}

async function sendMetrics(metrics: RequestMetrics): Promise<void> {
  // En production, envoyer vers un service de monitoring
  // (DataDog, New Relic, CloudWatch, etc.)
  
  if (process.env.NODE_ENV === 'development') {
    // Log détaillé en développement
    const logLevel = metrics.status >= 500 ? '❌' : 
                    metrics.status >= 400 ? '⚠️' : 
                    metrics.duration > 1000 ? '🐌' : '✅';
    
    console.log(`${logLevel} API Metrics:`, {
      method: metrics.method,
      path: metrics.path,
      duration: `${metrics.duration}ms`,
      status: metrics.status,
      userId: metrics.userId || 'anonymous'
    });
  }
  
  // TODO: Intégrer avec un vrai service de monitoring
  // await analytics.track('api_request', metrics);
}
