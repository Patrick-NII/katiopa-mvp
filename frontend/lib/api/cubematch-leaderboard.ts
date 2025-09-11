// API client pour le classement CubeMatch

export interface LeaderboardEntry {
  rank: number;
  id: string;
  userId: string;
  username: string;
  score: number;
  level: number;
  timePlayedMs: number;
  timePlayedFormatted: string;
  operator: string;
  target: number;
  comboMax: number;
  cellsCleared: number;
  playedAt: string;
  playedAtFormatted: string;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  total: number;
}

class CubeMatchLeaderboardAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getTop10(): Promise<LeaderboardEntry[]> {
    try {
      const result: LeaderboardResponse = await this.request('/cubematch/leaderboard-top10');
      console.log('🏆 Top 10 récupéré:', result.data.length, 'entrées');
      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du Top 10:', error);
      throw error;
    }
  }

  async getTopN(limit: number = 5): Promise<LeaderboardEntry[]> {
    const top10 = await this.getTop10();
    return top10.slice(0, limit);
  }

  async getUserRank(userId: string): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
    const top10 = await this.getTop10();
    const userEntry = top10.find(entry => entry.userId === userId);
    
    if (userEntry) {
      return {
        rank: userEntry.rank,
        entry: userEntry
      };
    }
    
    return null;
  }
}

export const cubeMatchLeaderboardAPI = new CubeMatchLeaderboardAPI();
