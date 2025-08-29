// Configuration des constantes de l'API
export const API_CONFIG = {
  VERSION: '1.0.0',
  BASE_PATH: '/api',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  JWT: {
    EXPIRES_IN: '7d'
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
};

// Types d'activités supportés
export const SUPPORTED_DOMAINS = ['maths', 'francais', 'sciences', 'coding'] as const;

// Types d'utilisateurs
export const USER_TYPES = ['CHILD', 'PARENT'] as const;

// Types d'abonnements
export const SUBSCRIPTION_TYPES = ['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'] as const;

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Erreur de validation',
  INTERNAL_ERROR: 'Erreur interne du serveur',
  DATABASE_ERROR: 'Erreur de base de données',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  SESSION_EXPIRED: 'Session expirée',
  RATE_LIMIT_EXCEEDED: 'Limite de taux dépassée'
};
