// Cache des données pour améliorer les performances
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live en millisecondes
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes par défaut

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Nettoyage automatique des entrées expirées
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Statistiques du cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Instance globale du cache
export const dataCache = new DataCache()

// Fonctions utilitaires pour le cache
export function getCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.join(':')}`
}

export function cacheUserData(userId: string, dataType: string, data: any, ttl?: number): void {
  const key = getCacheKey('user', userId, dataType)
  dataCache.set(key, data, ttl)
}

export function getCachedUserData<T>(userId: string, dataType: string): T | null {
  const key = getCacheKey('user', userId, dataType)
  return dataCache.get<T>(key)
}

export function invalidateUserCache(userId: string): void {
  const stats = dataCache.getStats()
  stats.keys.forEach(key => {
    if (key.startsWith(`user:${userId}:`)) {
      dataCache.delete(key)
    }
  })
}

// Cache spécialisé pour les analyses Bubix
export function cacheBubixAnalysis(sessionId: string, analysisType: string, data: any): void {
  const key = getCacheKey('bubix', sessionId, analysisType)
  dataCache.set(key, data, 10 * 60 * 1000) // 10 minutes pour les analyses
}

export function getCachedBubixAnalysis<T>(sessionId: string, analysisType: string): T | null {
  const key = getCacheKey('bubix', sessionId, analysisType)
  return dataCache.get<T>(key)
}

// Cache pour les données de session
export function cacheSessionData(sessionId: string, data: any): void {
  const key = getCacheKey('session', sessionId)
  dataCache.set(key, data, 2 * 60 * 1000) // 2 minutes pour les sessions
}

export function getCachedSessionData<T>(sessionId: string): T | null {
  const key = getCacheKey('session', sessionId)
  return dataCache.get<T>(key)
}
