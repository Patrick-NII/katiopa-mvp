import { useState, useEffect, useCallback } from 'react';

interface LearningCycle {
  id: string;
  weekStart: string;
  weekEnd: string;
  completedDays: string[];
  totalProgress: number;
  childInfo: {
    name: string;
    sessionId: string;
    age: number | null;
  };
  preferences?: {
    learningStyle: string[];
    interests: string[];
    preferredModules: string[];
    communicationStyle?: string;
    difficultyPreference?: string;
    sessionLength?: number;
    timeOfDay: string[];
    weeklyGoals?: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface CommunicationAnalytics {
  id: string;
  communicationStyle: string;
  module?: string;
  dayOfWeek?: string;
  messageType: string;
  effectiveness: number;
  responseTime?: number;
  userSatisfaction?: number;
  context?: any;
  createdAt: string;
}

interface UseLearningCyclesReturn {
  currentCycle: LearningCycle | null;
  loading: boolean;
  error: string | null;
  markDayCompleted: (dayOfWeek: string) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  refreshCycle: () => Promise<void>;
}

export function useLearningCycles(childSessionId?: string): UseLearningCyclesReturn {
  const [currentCycle, setCurrentCycle] = useState<LearningCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (childSessionId) {
        params.append('childSessionId', childSessionId);
      }

      const response = await fetch(`/api/learning-cycles?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText || 'Erreur interne du serveur'}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentCycle(data.data);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération du cycle');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du cycle:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [childSessionId]);

  const markDayCompleted = useCallback(async (dayOfWeek: string) => {
    try {
      setError(null);

      const response = await fetch('/api/learning-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ dayOfWeek })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText || 'Erreur interne du serveur'}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour le cycle local
        setCurrentCycle(prev => {
          if (!prev) return prev;
          
          const updatedDays = [...prev.completedDays];
          if (!updatedDays.includes(dayOfWeek)) {
            updatedDays.push(dayOfWeek);
          }
          
          return {
            ...prev,
            completedDays: updatedDays,
            totalProgress: data.data.totalProgress
          };
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du cycle:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: any) => {
    try {
      setError(null);

      const response = await fetch('/api/learning-cycles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText || 'Erreur interne du serveur'}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour les préférences localement
        setCurrentCycle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            preferences: data.data
          };
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour des préférences');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des préférences:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  }, []);

  const refreshCycle = useCallback(() => {
    return fetchCycle();
  }, [fetchCycle]);

  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  return {
    currentCycle,
    loading,
    error,
    markDayCompleted,
    updatePreferences,
    refreshCycle
  };
}

// Hook pour les analytics de communication
interface UseCommunicationAnalyticsReturn {
  analytics: CommunicationAnalytics[];
  stats: any;
  loading: boolean;
  error: string | null;
  recordAnalytics: (data: any) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

export function useCommunicationAnalytics(childSessionId: string, timeRange: number = 30): UseCommunicationAnalyticsReturn {
  const [analytics, setAnalytics] = useState<CommunicationAnalytics[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        childSessionId,
        timeRange: timeRange.toString()
      });

      const response = await fetch(`/api/communication-analytics?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText || 'Erreur interne du serveur'}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data.recentAnalytics);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des analytics');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [childSessionId, timeRange]);

  const recordAnalytics = useCallback(async (analyticsData: any) => {
    try {
      setError(null);

      const response = await fetch('/api/communication-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(analyticsData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText || 'Erreur interne du serveur'}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Ajouter la nouvelle analytics à la liste locale
        setAnalytics(prev => [data.data, ...prev.slice(0, 19)]); // Garder seulement les 20 plus récentes
      } else {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  }, []);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (childSessionId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  return {
    analytics,
    stats,
    loading,
    error,
    recordAnalytics,
    refreshAnalytics
  };
}
