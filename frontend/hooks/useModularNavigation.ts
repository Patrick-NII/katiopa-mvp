import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTE_CONFIG, USER_PERMISSIONS, SUBSCRIPTION_FEATURES } from '@/lib/config/modular-dashboard'

interface UseModularNavigationProps {
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  subscriptionType: string
  initialTab?: string
}

interface NavigationState {
  activeTab: string
  availableTabs: string[]
  canAccess: (tab: string) => boolean
  navigateTo: (tab: string) => void
  getDefaultTab: () => string
}

export function useModularNavigation({
  userType,
  subscriptionType,
  initialTab
}: UseModularNavigationProps): NavigationState {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>(initialTab || '')

  // Obtenir les onglets disponibles selon le type d'utilisateur
  const getAvailableTabs = useCallback(() => {
    const permissions = USER_PERMISSIONS[userType]
    if (!permissions) return []
    
    return permissions.allowedPages
  }, [userType])

  // Vérifier si l'utilisateur peut accéder à un onglet
  const canAccess = useCallback((tab: string) => {
    const availableTabs = getAvailableTabs()
    return availableTabs.includes(tab)
  }, [getAvailableTabs])

  // Obtenir l'onglet par défaut
  const getDefaultTab = useCallback(() => {
    const permissions = USER_PERMISSIONS[userType]
    return permissions?.defaultPage || 'dashboard'
  }, [userType])

  // Navigation vers un onglet
  const navigateTo = useCallback((tab: string) => {
    if (!canAccess(tab)) {
      console.warn(`Accès refusé à l'onglet: ${tab}`)
      return
    }

    setActiveTab(tab)
    
    // Optionnel: navigation par URL (pour les liens directs)
    const routeMap: Record<string, string> = {
      'dashboard': ROUTE_CONFIG.DASHBOARD_V2,
      'analytics': ROUTE_CONFIG.ANALYTICS,
      'experiences': ROUTE_CONFIG.EXPERIENCES,
      'family': ROUTE_CONFIG.FAMILY,
      'bubix-assistant': ROUTE_CONFIG.BUBIX_ASSISTANT,
      'mathcube': ROUTE_CONFIG.MATH_CUBE,
      'codecube': ROUTE_CONFIG.CODE_CUBE,
      'playcube': ROUTE_CONFIG.PLAY_CUBE,
      'sciencecube': ROUTE_CONFIG.SCIENCE_CUBE,
      'dreamcube': ROUTE_CONFIG.DREAM_CUBE,
      'comcube': ROUTE_CONFIG.COM_CUBE,
      'reglages': ROUTE_CONFIG.SETTINGS,
      'abonnements': ROUTE_CONFIG.SUBSCRIPTION,
      'facturation': ROUTE_CONFIG.BILLING,
      'family-members': ROUTE_CONFIG.FAMILY_MEMBERS
    }

    const route = routeMap[tab]
    if (route) {
      router.push(route)
    }
  }, [canAccess, router])

  // Initialiser l'onglet actif
  useEffect(() => {
    if (!activeTab) {
      const defaultTab = getDefaultTab()
      setActiveTab(defaultTab)
    }
  }, [activeTab, getDefaultTab])

  return {
    activeTab,
    availableTabs: getAvailableTabs(),
    canAccess,
    navigateTo,
    getDefaultTab
  }
}

// Hook pour gérer les fonctionnalités selon l'abonnement
export function useSubscriptionFeatures(subscriptionType: string) {
  const normalizedType = subscriptionType?.toUpperCase() || 'FREE'
  const features = SUBSCRIPTION_FEATURES[normalizedType as keyof typeof SUBSCRIPTION_FEATURES] || SUBSCRIPTION_FEATURES.FREE

  const hasFeature = useCallback((feature: keyof typeof features) => {
    return features[feature] === true
  }, [features])

  const getLimit = useCallback((limit: 'maxChildren' | 'maxSessions') => {
    return features[limit]
  }, [features])

  return {
    features,
    hasFeature,
    getLimit,
    subscriptionType: normalizedType
  }
}

// Hook pour gérer les performances et le cache
export function usePerformanceOptimization() {
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map())

  const getCachedData = useCallback((key: string, maxAge: number = 300000) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data
    }
    return null
  }, [cache])

  const setCachedData = useCallback((key: string, data: any) => {
    setCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })))
  }, [])

  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true)
    try {
      const result = await asyncFn()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    getCachedData,
    setCachedData,
    clearCache,
    withLoading
  }
}

// Hook pour gérer les animations et transitions
export function useAnimations() {
  const [isAnimating, setIsAnimating] = useState(false)

  const animate = useCallback(async (animationFn: () => Promise<void> | void) => {
    setIsAnimating(true)
    try {
      await animationFn()
    } finally {
      setIsAnimating(false)
    }
  }, [])

  const staggerAnimation = useCallback((items: any[], delay: number = 100) => {
    return items.map((_, index) => ({
      ...items[index],
      animationDelay: index * delay
    }))
  }, [])

  return {
    isAnimating,
    animate,
    staggerAnimation
  }
}
