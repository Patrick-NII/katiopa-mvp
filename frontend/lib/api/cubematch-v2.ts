/**
 * 📚 CUBEMATCH API CLIENT v2.0
 * 
 * Client TypeScript pour la nouvelle architecture CubeMatch
 * Optimisé pour performance, cache, et intégration BubiX
 */

// 🎯 Types principaux
export interface ScoreData {
  // Core game data
  score: number;
  level: number;
  timePlayedMs: number;
  operator: 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED';
  target: number;
  
  // Game configuration
  allowDiagonals?: boolean;
  gridSize?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  
  // Performance metrics
  totalMoves?: number;
  successfulMoves?: number;
  failedMoves?: number;
  accuracyRate?: number;
  averageMoveTimeMs?: number;
  fastestMoveTimeMs?: number;
  slowestMoveTimeMs?: number;
  
  // Advanced metrics for BubiX
  comboMax?: number;
  cellsCleared?: number;
  hintsUsed?: number;
  gameDurationSeconds?: number;
  maxConsecutiveHits?: number;
  maxConsecutiveMisses?: number;
  longestComboChain?: number;
  gridCompletionRate?: number;
  
  // Operator-specific data
  additionsCount?: number;
  subtractionsCount?: number;
  multiplicationsCount?: number;
  divisionsCount?: number;
  additionsScore?: number;
  subtractionsScore?: number;
  multiplicationsScore?: number;
  divisionsScore?: number;
  
  // Time distribution per operator
  timeSpentOnAdditionsMs?: number;
  timeSpentOnSubtractionsMs?: number;
  timeSpentOnMultiplicationsMs?: number;
  timeSpentOnDivisionsMs?: number;
  
  // Session context
  sessionStartTime?: string;
  sessionEndTime?: string;
  breaksTaken?: number;
  totalBreakTimeMs?: number;
  
  // UX metrics
  engagementScore?: number;
  focusTimePercentage?: number;
  difficultyAdjustments?: number;
  
  // Settings used
  themeUsed?: string;
  soundEnabled?: boolean;
  assistEnabled?: boolean;
  hintsEnabled?: boolean;
  
  // Sequential data for BubiX pattern recognition
  targetNumbersUsed?: string; // JSON array
  operatorSequence?: string;  // JSON array
  moveTimings?: string;       // JSON array
  errorPatterns?: string;     // JSON array
}

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
  accuracy: number;
  totalMoves: number;
  successfulMoves: number;
  difficulty: string;
  gridSize: number;
  playedAt: string;
  playedAtFormatted: string;
}

export interface UserStats {
  userId: string;
  username: string;
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  highestLevel: number;
  totalTimePlayedMs: number;
  totalTimePlayedFormatted: string;
  averageTimePlayedMs: number;
  totalComboMax: number;
  totalCellsCleared: number;
  totalHintsUsed: number;
  favoriteOperator: string;
  lastPlayed: string | null;
  memberSince: string | null;
  liveCalculations: any;
  preferences: any;
}

export interface GameSettings {
  gameSettings: {
    gridSize: number;
    operator: 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    timeLimit: number;
    unlimitedTime: boolean;
    allowDiagonals: boolean;
    autoSubmit: boolean;
    spawnRate: number;
    maxNumbers: number;
    infiniteCubes: boolean;
    cleanCubes: boolean;
  };
  uiSettings: {
    theme: 'classic' | 'modern' | 'dark' | 'colorful';
    soundEnabled: boolean;
    hintsEnabled: boolean;
    animationsEnabled: boolean;
    vibrationEnabled: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    showGrid: boolean;
    showTimer: boolean;
    showScore: boolean;
    showLevel: boolean;
    showCombo: boolean;
  };
  learningSettings: {
    adaptiveDifficulty: boolean;
    intelligentHints: boolean;
    progressTracking: boolean;
    personalizedChallenges: boolean;
    dailyGoal: number;
    weeklyGoal: number;
    targetAccuracy: number;
    targetSpeed: number;
  };
  privacySettings: {
    shareStats: boolean;
    allowLeaderboard: boolean;
    dataCollection: boolean;
    anonymousAnalytics: boolean;
    bubixTraining: boolean;
  };
  notificationSettings: {
    dailyReminder: boolean;
    achievementAlerts: boolean;
    progressUpdates: boolean;
    tipOfTheDay: boolean;
    weeklyReport: boolean;
    reminderTime: string;
    timezone: string;
  };
  gameState?: {
    hasActiveGame: boolean;
    currentScore: number;
    currentLevel: number;
    currentTarget: number;
    timeRemaining: number;
    gameBoard?: any;
    gameStats?: any;
    savedAt?: string;
  };
}

/**
 * 🚀 Classe client API principale
 */
class CubeMatchAPIv2 {
  private baseUrl = '/api/cubematch';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Vérifier le cache pour les GET
    if (options.method === 'GET' || !options.method) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`📦 Cache hit: ${endpoint}`);
        return cached.data;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}` 
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Mettre en cache les réponses GET réussies
    if (!options.method || options.method === 'GET') {
      this.cache.set(url, {
        data,
        timestamp: Date.now(),
        ttl: this.getCacheTTL(endpoint)
      });
    }
    
    return data;
  }

  private getCacheTTL(endpoint: string): number {
    if (endpoint.includes('leaderboard')) return 30000; // 30s
    if (endpoint.includes('scores')) return 60000; // 1min
    if (endpoint.includes('analytics')) return 300000; // 5min
    return 60000; // Par défaut 1min
  }

  // 🏆 SCORES API
  async saveScore(scoreData: ScoreData): Promise<{ success: boolean; scoreId: string }> {
    console.log('💾 Sauvegarde score CubeMatch v2...');
    
    try {
      const response = await this.request<any>('/scores', {
        method: 'POST',
        body: JSON.stringify(scoreData),
      });
      
      console.log('✅ Score sauvegardé:', response.scoreId);
      
      // Invalider les caches liés
      this.invalidateCache(['/scores', '/leaderboard', '/user-stats']);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur sauvegarde score:', error);
      throw error;
    }
  }

  async getScores(limit = 10, offset = 0): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/scores?limit=${limit}&offset=${offset}`);
  }

  async getScoreDetails(scoreId: string): Promise<{ success: boolean; data: any }> {
    return this.request(`/scores/${scoreId}`);
  }

  // 🏆 LEADERBOARD API
  async getTop10(): Promise<LeaderboardEntry[]> {
    console.log('🏆 Récupération Top 10 v2...');
    
    const response = await this.request<{ success: boolean; data: LeaderboardEntry[] }>('/leaderboard/top10');
    return response.data || [];
  }

  async getLeaderboardByOperator(operator: string, limit = 10): Promise<LeaderboardEntry[]> {
    const response = await this.request<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard/by-operator/${operator}?limit=${limit}`);
    return response.data || [];
  }

  async getLeaderboardByDifficulty(difficulty: string, limit = 10): Promise<LeaderboardEntry[]> {
    const response = await this.request<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard/by-difficulty/${difficulty}?limit=${limit}`);
    return response.data || [];
  }

  async getSpeedLeaderboard(minScore = 1000, limit = 10): Promise<LeaderboardEntry[]> {
    const response = await this.request<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard/speed?minScore=${minScore}&limit=${limit}`);
    return response.data || [];
  }

  async getAccuracyLeaderboard(minMoves = 50, limit = 10): Promise<LeaderboardEntry[]> {
    const response = await this.request<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard/accuracy?minMoves=${minMoves}&limit=${limit}`);
    return response.data || [];
  }

  async getUserRank(userId: string): Promise<any> {
    return this.request(`/leaderboard/user/${userId}`);
  }

  async getLeaderboardStats(): Promise<any> {
    return this.request('/leaderboard/stats');
  }

  // 👤 USER STATS API
  async getUserStats(userId: string): Promise<UserStats> {
    console.log('📊 Récupération stats utilisateur v2...');
    
    const response = await this.request<{ success: boolean; data: UserStats }>(`/user-stats/${userId}`);
    return response.data;
  }

  async getUserProgression(userId: string, timeRange = '30d'): Promise<any> {
    return this.request(`/user-stats/${userId}/progression?timeRange=${timeRange}`);
  }

  async getUserAchievements(userId: string): Promise<any> {
    return this.request(`/user-stats/${userId}/achievements`);
  }

  async compareUser(userId: string): Promise<any> {
    return this.request(`/user-stats/${userId}/compare`);
  }

  // ⚙️ SETTINGS API
  async getSettings(userId: string): Promise<{ success: boolean; settings: GameSettings }> {
    console.log('⚙️ Récupération paramètres v2...');
    
    return this.request(`/settings/${userId}`);
  }

  async saveSettings(userId: string, settings: GameSettings): Promise<{ success: boolean }> {
    console.log('💾 Sauvegarde paramètres v2...');
    
    const response = await this.request<{ success: boolean }>(`/settings/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    
    // Invalider le cache des paramètres
    this.invalidateCache([`/settings/${userId}`]);
    
    return response;
  }

  async saveGameState(userId: string, gameState: any): Promise<{ success: boolean }> {
    console.log('🎮 Sauvegarde état de jeu v2...');
    
    return this.request(`/settings/${userId}/game-state`, {
      method: 'POST',
      body: JSON.stringify(gameState),
    });
  }

  async clearGameState(userId: string): Promise<{ success: boolean }> {
    console.log('🗑️ Suppression état de jeu v2...');
    
    return this.request(`/settings/${userId}/game-state`, {
      method: 'DELETE',
    });
  }

  async resetSettings(userId: string, category = 'all'): Promise<{ success: boolean; newSettings: GameSettings }> {
    return this.request(`/settings/${userId}/reset`, {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  }

  // 🎮 GAME SESSIONS API
  async startSession(deviceType?: string, screenResolution?: string): Promise<{ sessionId: string }> {
    console.log('🎮 Démarrage session de jeu v2...');
    
    return this.request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ deviceType, screenResolution }),
    });
  }

  async pauseSession(sessionId: string, reason?: string): Promise<{ success: boolean }> {
    return this.request(`/sessions/${sessionId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async resumeSession(sessionId: string, pauseDurationMs: number): Promise<{ success: boolean }> {
    return this.request(`/sessions/${sessionId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ pauseDurationMs }),
    });
  }

  async gameCompleted(sessionId: string, gameData: any): Promise<{ success: boolean }> {
    return this.request(`/sessions/${sessionId}/game-completed`, {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async endSession(sessionId: string, sessionData: any): Promise<{ success: boolean; summary: any }> {
    console.log('🏁 Fin session de jeu v2...');
    
    return this.request(`/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getSessionHistory(userId: string, limit = 20, offset = 0): Promise<any> {
    return this.request(`/sessions/${userId}/history?limit=${limit}&offset=${offset}`);
  }

  async getSessionAnalytics(userId: string, timeRange = '30d'): Promise<any> {
    return this.request(`/sessions/${userId}/analytics?timeRange=${timeRange}`);
  }

  // 📊 ANALYTICS API
  async getLearningPatterns(userId: string, timeRange = '30d'): Promise<any> {
    return this.request(`/analytics/learning-patterns/${userId}?timeRange=${timeRange}`);
  }

  async getDifficultyCurve(userId: string): Promise<any> {
    return this.request(`/analytics/difficulty-curve/${userId}`);
  }

  async getOperatorMastery(userId: string): Promise<any> {
    return this.request(`/analytics/operator-mastery/${userId}`);
  }

  async getPeakPerformance(userId: string): Promise<any> {
    return this.request(`/analytics/peak-performance/${userId}`);
  }

  // 🤖 BUBIX DATA API
  async getBubixTrainingDataset(userId: string, includeAnonymized = false): Promise<any> {
    return this.request(`/bubix-data/training-dataset/${userId}?includeAnonymized=${includeAnonymized}`);
  }

  async getGlobalPatterns(): Promise<any> {
    return this.request('/bubix-data/global-patterns');
  }

  async sendBubixFeedback(feedbackData: any): Promise<{ success: boolean }> {
    return this.request('/bubix-data/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  // 🔧 Utilitaires
  private invalidateCache(patterns: string[]): void {
    for (const [key] of this.cache) {
      if (patterns.some(pattern => key.includes(pattern))) {
        this.cache.delete(key);
        console.log(`🗑️ Cache invalidé: ${key}`);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache complètement vidé');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export de l'instance singleton
export const cubeMatchAPI = new CubeMatchAPIv2();

// Export des types pour utilisation externe
export type {
  ScoreData,
  LeaderboardEntry,
  UserStats,
  GameSettings
};
