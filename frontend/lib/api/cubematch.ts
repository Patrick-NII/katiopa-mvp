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

export const cubematchAPI = {
  // Récupérer les meilleurs scores
  getTopScores: async (limit: number = 10): Promise<CubeMatchScore[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/scores?limit=${limit}`);
      return response || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des scores:', error);
      return [];
    }
  },

  // Récupérer les statistiques globales
  getStats: async (): Promise<CubeMatchStats | null> => {
    try {
      const response = await apiFetch('/api/cubematch/stats');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  },

  // Récupérer le classement complet
  getLeaderboard: async (limit: number = 10): Promise<CubeMatchLeaderboardEntry[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/leaderboard?limit=${limit}`);
      return response || [];
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      return [];
    }
  },

  // Sauvegarder un score
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
  getUserScores: async (limit: number = 10): Promise<CubeMatchScore[]> => {
    try {
      const response = await apiFetch(`/api/cubematch/user-scores?limit=${limit}`);
      return response || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des scores utilisateur:', error);
      return [];
    }
  },

  // Récupérer les statistiques de l'utilisateur connecté
  getUserStats: async (): Promise<CubeMatchUserStats | null> => {
    try {
      const response = await apiFetch('/api/cubematch/user-stats');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
      return null;
    }
  },
};
