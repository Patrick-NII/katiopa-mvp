// Configuration de l'API Katiopa
// Supporte NEXT_PUBLIC_API_URL (prioritaire) puis NEXT_PUBLIC_API_BASE (fallback)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:4000';

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
export const apiFetch = async (url: string, options: RequestInit = {}) => {
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
    const err = new Error(errorData.error || `HTTP error! status: ${response.status}`) as any;
    err.status = response.status;
    err.code = errorData.code;
    err.details = errorData.details;
    
    // Ne pas afficher les erreurs 401 dans la console (authentification normale)
    if (response.status !== 401) {
      console.warn(`API Error ${response.status}:`, errorData.error || 'Unknown error');
    }
    
    throw err;
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
    const json = await response.json();
    // Unifie la forme de réponse (minimal: {success,user} | routes: {success,data:{userSession,...}})
    if (json?.user) {
      return json as LoginResponse;
    }
    if (json?.data?.userSession) {
      const u = json.data.userSession;
      return {
        success: true,
        user: {
          id: u.id,
          sessionId: u.sessionId,
          firstName: u.firstName,
          lastName: u.lastName,
          userType: u.userType,
          subscriptionType: json.data.account?.subscriptionType || 'FREE',
        },
      } as LoginResponse;
    }
    return json;
  },

  // Vérification du token (supporte /verify et fallback sur /me)
  verify: async (): Promise<{ success: boolean; user?: User }> => {
    try {
      const res = await apiFetch('/api/auth/verify');
      const json = await res.json();
      if (json?.user) return json;
      // Si la forme ne correspond pas, on tente la normalisation
      if (json?.data?.userSession) {
        const u = json.data.userSession;
        return {
          success: true,
          user: {
            id: u.id,
            sessionId: u.sessionId,
            firstName: u.firstName,
            lastName: u.lastName,
            userType: u.userType,
            subscriptionType: json.data.account?.subscriptionType || 'FREE',
          },
        };
      }
      return json;
    } catch (e: any) {
      // Si erreur 401 (non authentifié), c'est normal
      if (e.status === 401) {
        return { success: false };
      }
      
      try {
        // Fallback si /verify n'existe pas (backend routes)
        const res = await apiFetch('/api/auth/me');
        const json = await res.json();
        if (json?.data?.userSession) {
          const u = json.data.userSession;
          return {
            success: true,
            user: {
              id: u.id,
              sessionId: u.sessionId,
              firstName: u.firstName,
              lastName: u.lastName,
              userType: u.userType,
              subscriptionType: json.data.account?.subscriptionType || 'FREE',
            },
          };
        }
        return json;
      } catch (fallbackError: any) {
        // Si erreur 401 (non authentifié), c'est normal
        if (fallbackError.status === 401) {
          return { success: false };
        }
        throw fallbackError;
      }
    }
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
  // Vérifier la disponibilité d'un email
  checkEmail: async (email: string): Promise<{ success: boolean; available: boolean; exists: boolean }> => {
    const response = await apiFetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.json();
  },
  // Vérifier la disponibilité d'un identifiant (sessionId)
  checkSession: async (sessionId: string): Promise<{ success: boolean; available: boolean; exists: boolean }> => {
    const response = await apiFetch(`/api/auth/check-session?sessionId=${encodeURIComponent(sessionId)}`);
    return response.json();
  },
  // Mot de passe oublié
  forgotPassword: async (payload: { email?: string; sessionId?: string }): Promise<{ success: boolean }> => {
    const res = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  // Réinitialiser le mot de passe
  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ success: boolean }> => {
    const res = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
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
      return response.success && response.user ? response.user : null;
    } catch (error) {
      return null;
    }
  },
};

// Les types sont déjà exportés en haut du fichier
