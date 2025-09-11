// API client pour les scores CubeMatch

export interface CubeMatchScore {
  score: number;
  level: number;
  timePlayedMs: number;
  operator: string;
  target: number;
  allowDiagonals: boolean;
  gridSize?: number;
  difficulty?: string;
  hintsUsed?: number;
  gameDurationSeconds?: number;
  // Nouvelles données pour les statistiques
  comboMax?: number;
  cellsCleared?: number;
  totalMoves?: number;
  successfulMoves?: number;
  accuracy?: number;
  precision?: number;
  soundEnabled?: boolean;
  hintsEnabled?: boolean;
}

export interface SavedScore {
  id: string;
  userId: string;
  username: string;
  score: number;
  level: number;
  timePlayedMs: number;
  operator: string;
  target: number;
  allowDiagonals: boolean;
  gridSize: number;
  difficulty: string;
  hintsUsed: number;
  gameDurationSeconds: number;
  createdAt: string;
}

class CubeMatchScoresAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important pour les cookies d'authentification
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async saveScore(scoreData: CubeMatchScore): Promise<SavedScore> {
    console.log('💾 Sauvegarde du score:', scoreData);
    
    try {
      const result = await this.request('/cubematch/scores', {
        method: 'POST',
        body: JSON.stringify(scoreData),
      });
      
      console.log('✅ Score sauvegardé:', result);
      return result.data || result;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du score:', error);
      throw error;
    }
  }

  async getScores(limit: number = 10): Promise<SavedScore[]> {
    try {
      const result = await this.request(`/cubematch/scores?limit=${limit}`);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des scores:', error);
      throw error;
    }
  }

  async getUserScores(limit: number = 10): Promise<SavedScore[]> {
    try {
      const result = await this.request(`/cubematch/user-scores?limit=${limit}`);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des scores utilisateur:', error);
      throw error;
    }
  }
}

export const cubeMatchScoresAPI = new CubeMatchScoresAPI();

