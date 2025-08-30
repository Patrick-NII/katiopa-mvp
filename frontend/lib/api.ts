// Configuration de l'API Katiopa
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types pour l'API
export interface LoginRequest {
  sessionId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    userType: string;
    subscriptionType: string;
  };
}

export interface User {
  id: string;
  sessionId: string;
  firstName: string;
  lastName: string;
  userType: string;
  subscriptionType: string;
}

export interface StatsSummary {
  totalTime: number;
  averageScore: number;
  totalActivities: number;
  domains: Array<{
    name: string;
    count: number;
    averageScore: number;
    activities: any[];
  }>;
}

// Configuration fetch avec cookies
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // IMPORTANT: Envoie les cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(fullUrl, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response;
};

// Helpers simples avec préfixe /api par défaut (compatibilité composants)
const withApiPrefix = (url: string) => {
  if (url.startsWith('/api')) return url;
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
};

export const apiGet = async (url: string) => {
  const res = await apiFetch(withApiPrefix(url), { method: 'GET' });
  return res.json();
};

export const apiPost = async (url: string, body?: any) => {
  const res = await apiFetch(withApiPrefix(url), { method: 'POST', body: JSON.stringify(body ?? {}) });
  return res.json();
};

export const apiPatch = async (url: string, body?: any) => {
  const res = await apiFetch(withApiPrefix(url), { method: 'PATCH', body: JSON.stringify(body ?? {}) });
  return res.json();
};

export const apiDelete = async (url: string) => {
  const res = await apiFetch(withApiPrefix(url), { method: 'DELETE' });
  return res.json();
};

// API d'authentification
export const authAPI = {
  // Connexion
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Vérification du token (remplace /me)
  verify: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiFetch('/api/auth/verify');
    return response.json();
  },

  // Déconnexion
  logout: async (): Promise<{ success: boolean }> => {
    const response = await apiFetch('/api/auth/logout', {
      method: 'POST',
    });
    return response.json();
  },

  // Inscription
  register: async (data: any): Promise<any> => {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Récupération des comptes de test
  getTestAccounts: async (): Promise<any[]> => {
    try {
      const response = await apiFetch('/api/auth/test-accounts');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les comptes de test:', error);
      return [];
    }
  },
};

// API des sessions
export const sessionsAPI = {
  // Récupération des sessions actives
  getActiveSessions: async (): Promise<any[]> => {
    try {
      const response = await apiFetch('/api/sessions/active');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('⚠️ Impossible de charger les sessions actives depuis l\'API:', error);
      return [];
    }
  },

  // Récupération des sessions d'un utilisateur
  getUserSessions: async (): Promise<any[]> => {
    try {
      const response = await apiFetch('/api/sessions/user');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('⚠️ Impossible de charger les sessions utilisateur depuis l\'API:', error);
      return [];
    }
  },

  // Mise à jour du temps de connexion
  updateConnectionTime: async (): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/sessions/update-time', {
        method: 'POST'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.warn('⚠️ Impossible de mettre à jour le temps de connexion:', error);
      return false;
    }
  }
};

// API des statistiques
export const statsAPI = {
  // Récupération du résumé des statistiques (remplace /activities)
  getSummary: async (): Promise<StatsSummary> => {
    try {
      const response = await apiFetch('/api/stats/summary');
      const data = await response.json();
      return data.success ? data.data : {
        totalTime: 0,
        averageScore: 0,
        totalActivities: 0,
        domains: []
      };
    } catch (error) {
      console.warn('⚠️ Impossible de charger les statistiques depuis l\'API, utilisation des données de fallback:', error);
      // Données de fallback pour éviter les erreurs 404
      return {
        totalTime: 0,
        averageScore: 0,
        totalActivities: 0,
        domains: []
      };
    }
  },

  // Récupération des activités
  getActivities: async (): Promise<any[]> => {
    try {
      const response = await apiFetch('/api/stats/activities');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('⚠️ Impossible de charger les activités depuis l\'API:', error);
      return [];
    }
  },
};

// API des activités
export const activityAPI = {
  // Création d'une activité
  create: async (data: any): Promise<any> => {
    const response = await apiFetch('/api/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Récupération des activités d'un utilisateur
  getUserActivities: async (): Promise<any[]> => {
    const response = await apiFetch('/api/activity/user');
    return response.json();
  },
};

// API de tracking des interactions utilisateur
export const trackingAPI = {
  // Enregistrer une interaction utilisateur
  trackInteraction: async (data: {
    interactionType: string;
    elementType: string;
    elementId?: string;
    elementName?: string;
    elementValue?: string;
    pageUrl?: string;
    pageTitle?: string;
    metadata?: any;
    sessionDuration?: number;
  }): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/tracking/interaction', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('⚠️ Impossible d\'enregistrer l\'interaction:', error);
      return false;
    }
  },

  // Enregistrer un prompt utilisateur
  trackPrompt: async (data: {
    promptType: string;
    content: string;
    context?: any;
    response?: string;
    responseTime?: number;
    tokensUsed?: number;
    modelUsed?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/tracking/prompt', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('⚠️ Impossible d\'enregistrer le prompt:', error);
      return false;
    }
  },

  // Démarrer une session de navigation
  startNavigationSession: async (data: {
    initialPage?: string;
    sessionData?: any;
  }): Promise<any> => {
    try {
      const response = await apiFetch('/api/tracking/navigation/start', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('⚠️ Impossible de démarrer la session de navigation:', error);
      return null;
    }
  },

  // Mettre à jour une session de navigation
  updateNavigationSession: async (sessionId: string, data: {
    pageUrl?: string;
    actionPerformed?: boolean;
    sessionData?: any;
  }): Promise<boolean> => {
    try {
      const response = await apiFetch(`/api/tracking/navigation/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('⚠️ Impossible de mettre à jour la session de navigation:', error);
      return false;
    }
  },

  // Terminer une session de navigation
  endNavigationSession: async (sessionId: string): Promise<boolean> => {
    try {
      const response = await apiFetch(`/api/tracking/navigation/${sessionId}/end`, {
        method: 'PUT'
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('⚠️ Impossible de terminer la session de navigation:', error);
      return false;
    }
  },

  // Enregistrer une métrique de performance
  trackMetric: async (data: {
    metricType: string;
    value: number;
    unit?: string;
    context?: any;
  }): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/tracking/metric', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('⚠️ Impossible d\'enregistrer la métrique:', error);
      return false;
    }
  },

  // Récupérer les statistiques de tracking
  getTrackingStats: async (): Promise<any> => {
    try {
      const response = await apiFetch('/api/tracking/stats');
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les statistiques de tracking:', error);
      return null;
    }
  }
};

// API générale
export const api = {
  fetch: (url: string, options: RequestInit = {}) => {
    return apiFetch(url, options);
  },

  // Headers d'authentification (plus de localStorage)
  getAuthHeaders: () => {
    // Les cookies sont automatiquement envoyés avec credentials: 'include'
    return {
      'Content-Type': 'application/json',
    };
  },

  // Vérification de l'authentification
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const response = await authAPI.verify();
      return response.success;
    } catch (error) {
      return false;
    }
  },

  // Récupération de l'utilisateur connecté
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await authAPI.verify();
      return response.success ? response.user : null;
    } catch (error) {
      return null;
    }
  },
};

// Export des types
export type { LoginRequest, LoginResponse, User, StatsSummary };
