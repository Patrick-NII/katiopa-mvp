import { apiFetch } from '../api';

export interface CubeMatchScore {
  id: string;
  userId: string;
  username: string;
  score: number;
  level: number;
  timePlayedMs: number;
  operator: string;
  target: number;
  allowDiagonals: boolean;
  comboMax?: number;
  cellsCleared?: number;
  hintsUsed?: number;
  gameDurationSeconds?: number;
  createdAt: string;
}

export interface CubeMatchStats {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  totalTimePlayed: number;
  averageTimePlayed: number;
  highestLevel: number;
  totalPlayers?: number;
  averageLevel?: number;
  mostUsedOperator?: string;
  lastUpdated?: string;
}

export interface CubeMatchLeaderboardEntry {
  userId: string;
  username: string;
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  highestLevel: number;
  totalTimePlayed: number;
  averageTimePlayed: number;
  totalComboMax: number;
  totalCellsCleared: number;
  totalHintsUsed: number;
  favoriteOperator: string;
  lastPlayed: string;
  rank: number;
}

export interface CubeMatchUserStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  highestLevel: number;
  totalTimePlayed: number;
  averageTimePlayed: number;
  totalComboMax: number;
  totalCellsCleared: number;
  totalHintsUsed: number;
  favoriteOperator: string;
  lastPlayed: string | null;
}

// Étendre l'API CubeMatch avec les nouvelles fonctionnalités
export const cubematchAPI = {
  // Récupérer les meilleurs scores
  getTopScores: async (limit: number = 10): Promise<CubeMatchScore[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/scores?limit=${limit}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des scores:', error);
      return [];
    }
  },

  // Récupérer les statistiques globales
  getStats: async (): Promise<CubeMatchStats | null> => {
    try {
      const response = await apiFetch('/api/cubematch/stats');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  },

  // Récupérer le classement complet
  getLeaderboard: async (limit: number = 10): Promise<CubeMatchLeaderboardEntry[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/leaderboard?limit=${limit}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      return [];
    }
  },

  // Récupérer les statistiques par opération
  getOperatorStats: async (timeRange: 'week' | 'month' | 'all' = 'all'): Promise<any[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/operator-stats?timeRange=${timeRange}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des stats par opération:', error);
      return [];
    }
  },

  // Récupérer les insights IA
  getInsights: async (): Promise<any | null> => {
    try {
      const response = await apiFetch('/api/cubematch/insights');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des insights:', error);
      return null;
    }
  },

  // Récupérer les sessions de jeu
  getSessions: async (timeRange: 'week' | 'month' | 'all' = 'all'): Promise<any[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/sessions?timeRange=${timeRange}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error);
      return [];
    }
  },

  // Sauvegarder un score avec données détaillées
  saveScore: async (scoreData: {
    score: number;
    level: number;
    timePlayedMs: number;
    operator: string;
    target: number;
    allowDiagonals: boolean;
    gridSizeRows?: number;
    gridSizeCols?: number;
    maxSize?: number;
    spawnRateMin?: number;
    spawnRateMax?: number;
    tickMs?: number;
    comboMax?: number;
    cellsCleared?: number;
    hintsUsed?: number;
    gameDurationSeconds?: number;
    // Nouvelles données détaillées
    gameMode?: string;
    difficultyLevel?: string;
    totalMoves?: number;
    successfulMoves?: number;
    failedMoves?: number;
    accuracyRate?: number;
    averageMoveTimeMs?: number;
    fastestMoveTimeMs?: number;
    slowestMoveTimeMs?: number;
    additionsCount?: number;
    subtractionsCount?: number;
    multiplicationsCount?: number;
    divisionsCount?: number;
    additionsScore?: number;
    subtractionsScore?: number;
    multiplicationsScore?: number;
    divisionsScore?: number;
    gridCompletionRate?: number;
    maxConsecutiveHits?: number;
    maxConsecutiveMisses?: number;
    longestComboChain?: number;
    targetNumbersUsed?: string;
    operatorSequence?: string;
    timeSpentOnAdditionsMs?: number;
    timeSpentOnSubtractionsMs?: number;
    timeSpentOnMultiplicationsMs?: number;
    timeSpentOnDivisionsMs?: number;
    sessionStartTime?: string;
    sessionEndTime?: string;
    breaksTaken?: number;
    totalBreakTimeMs?: number;
    engagementScore?: number;
    focusTimePercentage?: number;
    difficultyAdjustments?: number;
    themeUsed?: string;
    soundEnabled?: boolean;
    assistEnabled?: boolean;
    hintsEnabled?: boolean;
  }): Promise<boolean> => {
    try {
      await apiFetch('/api/cubematch/scores', {
        method: 'POST',
        body: JSON.stringify(scoreData),
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du score:', error);
      return false;
    }
  },

  // Récupérer les scores de l'utilisateur connecté
  getUserScores: async (limit: number = 50): Promise<CubeMatchScore[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/user-scores?limit=${limit}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des scores utilisateur:', error);
      return [];
    }
  },

  // Récupérer les statistiques utilisateur détaillées
  getUserStats: async (): Promise<CubeMatchUserStats | null> => {
    try {
      const response = await apiFetch('/api/cubematch/user-stats');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats utilisateur:', error);
      return null;
    }
  },

  // Générer des insights personnalisés
  generateInsights: async (): Promise<boolean> => {
    try {
      await apiFetch('/api/cubematch/generate-insights', {
        method: 'POST'
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la génération des insights:', error);
      return false;
    }
  },

  // Récupérer les statistiques de performance détaillées
  getPerformanceStats: async (timeRange: 'week' | 'month' | 'all' = 'all'): Promise<any> => {
    try {
      const response = await apiFetch(`/api/cubematch/performance-stats?timeRange=${timeRange}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de performance:', error);
      return null;
    }
  },

  // Récupérer les tendances de progression
  getProgressionTrends: async (days: number = 30): Promise<any> => {
    try {
      const response = await apiFetch(`/api/cubematch/progression-trends?days=${days}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      return null;
    }
  },

  // Récupérer les recommandations personnalisées
  getRecommendations: async (): Promise<any> => {
    try {
      const response = await apiFetch('/api/cubematch/recommendations');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      return null;
    }
  },

  // Exporter les données utilisateur
  exportUserData: async (format: 'json' | 'csv' = 'json'): Promise<any> => {
    try {
      const response = await apiFetch(`/api/cubematch/export?format=${format}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      return null;
    }
  }
};
