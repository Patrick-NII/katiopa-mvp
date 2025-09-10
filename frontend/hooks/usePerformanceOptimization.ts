'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Interface pour les données en cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live en millisecondes
}

// Interface pour les options de cache
interface CacheOptions {
  ttl?: number // Time to live par défaut
  maxSize?: number // Taille maximale du cache
  enablePersistence?: boolean // Persistance dans localStorage
}

// Hook pour gérer le cache des données
export function useDataCache<T>(options: CacheOptions = {}) {
  const {
    ttl = 300000, // 5 minutes par défaut
    maxSize = 100,
    enablePersistence = false
  } = options

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map())

  // Charger le cache depuis localStorage au montage
  useEffect(() => {
    if (enablePersistence) {
      try {
        const stored = localStorage.getItem('dataCache')
        if (stored) {
          const parsedCache = new Map<string, CacheEntry<T>>(JSON.parse(stored))
          cacheRef.current = parsedCache
          setCache(parsedCache)
        }
      } catch (error) {
        console.warn('Erreur lors du chargement du cache:', error)
      }
    }
  }, [enablePersistence])

  // Sauvegarder le cache dans localStorage
  const saveToStorage = useCallback(() => {
    if (enablePersistence) {
      try {
        const cacheArray = Array.from(cacheRef.current.entries())
        localStorage.setItem('dataCache', JSON.stringify(cacheArray))
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde du cache:', error)
      }
    }
  }, [enablePersistence])

  // Obtenir des données du cache
  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key)
    if (!entry) return null

    // Vérifier si les données sont expirées
    if (Date.now() - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key)
      setCache(new Map(cacheRef.current))
      return null
    }

    return entry.data
  }, [])

  // Mettre des données en cache
  const set = useCallback((key: string, data: T, customTtl?: number) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTtl || ttl
    }

    // Vérifier la taille maximale
    if (cacheRef.current.size >= maxSize) {
      // Supprimer l'entrée la plus ancienne
      const oldestKey = cacheRef.current.keys().next().value
      if (oldestKey) {
        cacheRef.current.delete(oldestKey)
      }
    }

    cacheRef.current.set(key, entry)
    setCache(new Map(cacheRef.current))
    saveToStorage()
  }, [ttl, maxSize, saveToStorage])

  // Supprimer des données du cache
  const remove = useCallback((key: string) => {
    cacheRef.current.delete(key)
    setCache(new Map(cacheRef.current))
    saveToStorage()
  }, [saveToStorage])

  // Vider le cache
  const clear = useCallback(() => {
    cacheRef.current.clear()
    setCache(new Map())
    if (enablePersistence) {
      localStorage.removeItem('dataCache')
    }
  }, [enablePersistence])

  // Nettoyer les entrées expirées
  const cleanup = useCallback(() => {
    const now = Date.now()
    let hasChanges = false

    for (const [key, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cacheRef.current.delete(key)
        hasChanges = true
      }
    }

    if (hasChanges) {
      setCache(new Map(cacheRef.current))
      saveToStorage()
    }
  }, [saveToStorage])

  // Nettoyage automatique toutes les minutes
  useEffect(() => {
    const interval = setInterval(cleanup, 60000)
    return () => clearInterval(interval)
  }, [cleanup])

  return {
    get,
    set,
    remove,
    clear,
    cleanup,
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}

// Hook pour gérer les requêtes avec cache et debounce
export function useCachedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    refetchOnWindowFocus?: boolean
  } = {}
) {
  const {
    enabled = true,
    staleTime = 300000, // 5 minutes
    cacheTime = 600000, // 10 minutes
    refetchOnWindowFocus = true
  } = options

  const cache = useDataCache<T>({ ttl: cacheTime })
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    // Vérifier le cache si pas de force
    if (!force) {
      const cachedData = cache.get(cacheKey)
      if (cachedData) {
        setData(cachedData)
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)
      cache.set(cacheKey, result, staleTime)
      setLastFetch(Date.now())
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, cacheKey, enabled, staleTime, cache])

  // Refetch si les données sont périmées
  useEffect(() => {
    if (enabled && lastFetch > 0) {
      const timeSinceLastFetch = Date.now() - lastFetch
      if (timeSinceLastFetch > staleTime) {
        fetchData(true)
      }
    }
  }, [enabled, lastFetch, staleTime, fetchData])

  // Refetch au focus de la fenêtre
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetch
      if (timeSinceLastFetch > staleTime) {
        fetchData(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, lastFetch, staleTime, fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
    invalidate: () => cache.remove(cacheKey)
  }
}

// Hook pour gérer les requêtes avec pagination et cache
export function usePaginatedQuery<T>(
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  options: {
    pageSize?: number
    cacheKey?: string
    enabled?: boolean
  } = {}
) {
  const { pageSize = 10, cacheKey = 'paginated', enabled = true } = options

  const [currentPage, setCurrentPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cache = useDataCache<{ data: T[]; total: number; hasMore: boolean }>({
    ttl: 300000 // 5 minutes
  })

  const fetchPage = useCallback(async (page: number, append = false) => {
    if (!enabled) return

    const cacheKeyForPage = `${cacheKey}_page_${page}`
    const cached = cache.get(cacheKeyForPage)
    
    if (cached) {
      if (append) {
        setAllData(prev => [...prev, ...cached.data])
      } else {
        setAllData(cached.data)
      }
      setTotal(cached.total)
      setHasMore(cached.hasMore)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn(page, pageSize)
      
      if (append) {
        setAllData(prev => [...prev, ...result.data])
      } else {
        setAllData(result.data)
      }
      
      setTotal(result.total)
      setHasMore(result.hasMore)
      
      // Mettre en cache
      cache.set(cacheKeyForPage, result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, pageSize, enabled, cache, cacheKey])

  const loadNextPage = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchPage(nextPage, true)
    }
  }, [hasMore, isLoading, currentPage, fetchPage])

  const reset = useCallback(() => {
    setCurrentPage(1)
    setAllData([])
    setTotal(0)
    setHasMore(true)
    setError(null)
  }, [])

  // Charger la première page
  useEffect(() => {
    if (enabled) {
      fetchPage(1, false)
    }
  }, [enabled, fetchPage])

  return {
    data: allData,
    total,
    hasMore,
    isLoading,
    error,
    currentPage,
    loadNextPage,
    reset,
    refetch: () => fetchPage(currentPage, false)
  }
}

// Hook pour gérer les performances et les métriques
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{
    renderTime: number
    memoryUsage: number
    networkRequests: number
  }>({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  })

  const startTime = useRef<number>(0)
  const requestCount = useRef<number>(0)

  const startRender = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const endRender = useCallback(() => {
    const renderTime = performance.now() - startTime.current
    setMetrics(prev => ({ ...prev, renderTime }))
  }, [])

  const trackRequest = useCallback(() => {
    requestCount.current += 1
    setMetrics(prev => ({ ...prev, networkRequests: requestCount.current }))
  }, [])

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }, [])

  useEffect(() => {
    const updateMemoryUsage = () => {
      setMetrics(prev => ({ ...prev, memoryUsage: getMemoryUsage() }))
    }

    const interval = setInterval(updateMemoryUsage, 5000)
    return () => clearInterval(interval)
  }, [getMemoryUsage])

  return {
    metrics,
    startRender,
    endRender,
    trackRequest
  }
}
