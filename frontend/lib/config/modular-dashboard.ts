// Configuration des routes pour la nouvelle architecture modulaire
export const ROUTE_CONFIG = {
  // Routes principales
  DASHBOARD: '/dashboard',
  DASHBOARD_V2: '/dashboard-v2',
  
  // Pages spécialisées
  ANALYTICS: '/dashboard/analytics',
  EXPERIENCES: '/dashboard/experiences', 
  FAMILY: '/dashboard/family',
  BUBIX_ASSISTANT: '/dashboard/bubix-assistant',
  
  // Pages des cubes d'apprentissage
  MATH_CUBE: '/dashboard/mathcube',
  CODE_CUBE: '/dashboard/codecube',
  PLAY_CUBE: '/dashboard/playcube',
  SCIENCE_CUBE: '/dashboard/sciencecube',
  DREAM_CUBE: '/dashboard/dreamcube',
  COM_CUBE: '/dashboard/comcube',
  
  // Pages de gestion
  SETTINGS: '/dashboard/settings',
  SUBSCRIPTION: '/dashboard/subscription',
  BILLING: '/dashboard/billing',
  FAMILY_MEMBERS: '/dashboard/family-members'
}

// Configuration des permissions par type d'utilisateur
export const USER_PERMISSIONS = {
  CHILD: {
    allowedPages: [
      'experiences',
      'bubix',
      'mathcube',
      'codecube', 
      'playcube',
      'sciencecube',
      'dreamcube',
      'reglages'
    ],
    defaultPage: 'experiences'
  },
  PARENT: {
    allowedPages: [
      'dashboard',
      'analytics',
      'family',
      'bubix-assistant',
      'bubix',
      'abonnements',
      'facturation',
      'family-members',
      'reglages',
      'comcube'
    ],
    defaultPage: 'dashboard'
  },
  TEACHER: {
    allowedPages: [
      'dashboard',
      'analytics',
      'bubix-assistant',
      'reglages'
    ],
    defaultPage: 'dashboard'
  },
  ADMIN: {
    allowedPages: [
      'dashboard',
      'analytics',
      'family',
      'bubix-assistant',
      'reglages',
      'abonnements',
      'facturation',
      'family-members'
    ],
    defaultPage: 'dashboard'
  }
}

// Configuration des fonctionnalités par plan d'abonnement
export const SUBSCRIPTION_FEATURES = {
  FREE: {
    maxChildren: 1,
    maxSessions: 5,
    analytics: false,
    advancedBubix: false,
    familyManagement: false
  },
  DECOUVERTE: {
    maxChildren: 2,
    maxSessions: 10,
    analytics: true,
    advancedBubix: true,
    familyManagement: true
  },
  EXPLORATEUR: {
    maxChildren: 5,
    maxSessions: 25,
    analytics: true,
    advancedBubix: true,
    familyManagement: true
  },
  MAITRE: {
    maxChildren: 10,
    maxSessions: 50,
    analytics: true,
    advancedBubix: true,
    familyManagement: true
  },
  ENTERPRISE: {
    maxChildren: -1, // Illimité
    maxSessions: -1, // Illimité
    analytics: true,
    advancedBubix: true,
    familyManagement: true
  }
}

// Configuration des performances
export const PERFORMANCE_CONFIG = {
  // Lazy loading des composants
  lazyLoadThreshold: 100, // ms
  
  // Cache des données
  cacheTimeout: 300000, // 5 minutes
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 50,
  
  // Debounce pour les recherches
  searchDebounce: 300, // ms
  
  // Intervalle de rafraîchissement des données
  refreshInterval: 60000 // 1 minute
}

// Configuration des transitions et animations
export const ANIMATION_CONFIG = {
  // Durées des transitions
  fast: 150,
  normal: 300,
  slow: 500,
  
  // Easing functions
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
  },
  
  // Délais pour les animations en cascade
  staggerDelay: 100
}

// Configuration des breakpoints responsive
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
}

// Configuration des couleurs par thème
export const THEME_COLORS = {
  light: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827'
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    accent: '#F472B6',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB'
  }
}

// Configuration des icônes par module
export const MODULE_ICONS = {
  mathcube: 'BookOpen',
  codecube: 'Code',
  playcube: 'Gamepad2',
  sciencecube: 'Lightbulb',
  dreamcube: 'Heart',
  comcube: 'Globe'
}

// Configuration des métriques de performance
export const METRICS_CONFIG = {
  // Seuils de performance
  thresholds: {
    good: 1000, // ms
    needsImprovement: 3000, // ms
    poor: 5000 // ms
  },
  
  // Métriques à suivre
  trackedMetrics: [
    'firstContentfulPaint',
    'largestContentfulPaint',
    'firstInputDelay',
    'cumulativeLayoutShift'
  ]
}
