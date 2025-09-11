const API_BASE_URL = '/api'; // Utiliser les routes Next.js API
const GAME_ID = 'cubematch-main'; // ID unique pour CubeMatch

export interface SocialStats {
  likes: number;
  shares: number;
  views: number;
  comments: number;
  gamesPlayed: number;
}

export interface Comment {
  id: string;
  userId: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface LeaderboardPlayer {
  userId: string;
  username: string;
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  highestLevel: number;
  rank: number;
}

class CubeMatchSocialAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ===== LIKES =====
  async getLikes(): Promise<{ totalLikes: number; userIds: string[] }> {
    return this.request(`/social/likes/${GAME_ID}`);
  }

  async toggleLike(): Promise<{ liked: boolean; message: string }> {
    return this.request(`/social/likes/${GAME_ID}`, {
      method: 'POST',
    });
  }

  // ===== PARTAGES =====
  async getShares(): Promise<{ totalShares: number }> {
    return this.request(`/social/shares/${GAME_ID}`);
  }

  async recordShare(platform: string = 'web'): Promise<{ success: boolean; message: string }> {
    return this.request(`/social/shares/${GAME_ID}`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  // ===== VUES =====
  async getViews(): Promise<{ totalViews: number }> {
    return this.request(`/social/views/${GAME_ID}`);
  }

  async recordView(): Promise<{ success: boolean; message: string }> {
    return this.request(`/social/views/${GAME_ID}`, {
      method: 'POST',
    });
  }

  async addComment(content: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/social/comments/${GAME_ID}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean; message: string }> {
    return this.request(`/social/comments/${commentId}/like`, {
      method: 'POST',
    });
  }

  // ===== STATISTIQUES GLOBALES =====
  async getSocialStats(): Promise<SocialStats> {
    return this.request(`/cubematch/social/stats/${GAME_ID}`);
  }

  // ===== CLASSEMENT =====
  async getLeaderboard(limit: number = 10): Promise<LeaderboardPlayer[]> {
    return this.request(`/cubematch/leaderboard?limit=${limit}`);
  }

  // ===== COMMENTAIRES =====
  async getComments(limit: number = 20): Promise<Comment[]> {
    return this.request(`/cubematch/social/comments/${GAME_ID}?limit=${limit}`);
  }

  // ===== STATISTIQUES GÉNÉRALES (pour plus tard, backend direct) =====
  async getGlobalStats() {
    // Temporairement désactivé - à implémenter si nécessaire
    return Promise.resolve({});
  }

  async getUserStats() {
    // Temporairement désactivé - à implémenter si nécessaire
    return Promise.resolve({});
  }

  // ===== SAUVEGARDE DE SCORE =====
  async saveScore(scoreData: {
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
  }) {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    });
  }
}

export const cubeMatchSocialAPI = new CubeMatchSocialAPI();
