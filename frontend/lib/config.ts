/**
 * 🔧 CONFIGURATION GLOBALE
 * 
 * Configuration centralisée pour éviter les URLs hardcodées
 */

// 🎯 URL du backend - Supporte les variables d'environnement
export const BACKEND_URL = 
  process.env.BACKEND_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:4000'; // Fallback pour développement local

// Configuration API
export const API_CONFIG = {
  baseUrl: BACKEND_URL,
  timeout: 30000, // 30 secondes
  retries: 3,
} as const;

// Logging
if (typeof window !== 'undefined') {
  console.log('🔧 Configuration API:', {
    backendUrl: BACKEND_URL,
    env: process.env.NODE_ENV
  });
}



