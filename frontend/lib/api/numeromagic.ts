/**
 * 🔢 NUMÉROMAGIC API CLIENT
 * 
 * Client TypeScript pour l'API NuméroMagic
 * Toutes les requêtes passent par le proxy Next.js (/api/numeromagic/*)
 */

// ========================================
// Types
// ========================================

export interface NumeroMagicRound {
  roundNumber: number;
  targetNumber: number;
  givenNumbers: number[];
  operationsAvailable: string[];
  playerSolution?: {
    step: number;
    operation: string;
    operands: number[];
    result: number;
  }[];
  isCorrect: boolean;
  solveTimeMs: number;
  attemptsCount?: number;
  hintsUsedInRound?: number;
  operationsUsed: string[];
  wasPerfect?: boolean;
  difficultyRating?: number;
}

export interface NumeroMagicScoreData {
  // Informations de base
  score: number;
  level: number;
  timePlayedMs: number;
  
  // Configuration du jeu
  gameMode: 'CLASSIC' | 'TIMED' | 'CHALLENGE';
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  maxNumber: number;
  operationsAllowed: ('ADD' | 'SUB' | 'MUL' | 'DIV')[];
  
  // Métriques de performance
  totalRounds: number;
  successfulRounds: number;
  failedRounds: number;
  accuracyRate: number;
  
  // Métriques de temps
  averageSolveTimeMs?: number;
  fastestSolveMs?: number;
  slowestSolveMs?: number;
  
  // Combos et streaks
  maxCombo: number;
  currentStreak: number;
  bestStreak: number;
  
  // Métriques par opération
  additionsCount: number;
  subtractionsCount: number;
  multiplicationsCount: number;
  divisionsCount: number;
  
  additionsSuccess: number;
  subtractionsSuccess: number;
  multiplicationsSuccess: number;
  divisionsSuccess: number;
  
  // Données avancées
  hintsUsed: number;
  perfectRounds: number;
  numbersDiscovered?: number[];
  patternsUsed?: string[];
  
  // Métriques cognitives (pour BubiX)
  cognitiveProfile?: {
    problemSolvingStyle?: string;
    preferredOperations?: string[];
    learningCurve?: string;
  };
  engagementScore: number;
  flowScore: number;
  
  // Rounds détaillés
  rounds?: NumeroMagicRound[];
}

export interface NumeroMagicStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  totalRounds: number;
  totalSuccessful: number;
  globalAccuracy: number;
  bestStreak: number;
  bestCombo: number;
  fastestSolveMs: number | null;
  currentLevel: number;
  totalExperience: number;
  favoriteMode: string | null;
  preferredDifficulty: string | null;
  firstPlayedAt: Date | null;
  lastPlayedAt: Date | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  age: number | null;
  bestScore: number;
  totalGames?: number;
  accuracy: number;
  bestStreak: number;
  bestCombo: number;
  level?: number;
  experience?: number;
}

// ========================================
// Helper pour les requêtes via proxy
// ========================================

async function fetchViaProxy(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `/api/numeromagic${endpoint}`;
  
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
    throw new Error(error.error || error.message || 'Erreur API');
  }

  return response.json();
}

// ========================================
// API Client
// ========================================

export const numeroMagicAPI = {
  /**
   * Sauvegarder un score
   */
  async saveScore(data: NumeroMagicScoreData): Promise<{ success: boolean; scoreId: string }> {
    console.log('💾 Sauvegarde score NuméroMagic:', {
      score: data.score,
      level: data.level,
      totalRounds: data.totalRounds,
      gameMode: data.gameMode
    });

    try {
      const result = await fetchViaProxy('/scores', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      console.log('✅ Score NuméroMagic sauvegardé:', result.scoreId);
      return result;
    } catch (error) {
      console.error('❌ Erreur sauvegarde score NuméroMagic:', error);
      throw error;
    }
  },

  /**
   * Récupérer les derniers scores
   */
  async getScores(limit: number = 10): Promise<any[]> {
    return fetchViaProxy(`/scores?limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Récupérer un score spécifique
   */
  async getScore(scoreId: string): Promise<any> {
    return fetchViaProxy(`/scores/${scoreId}`, {
      method: 'GET'
    });
  },

  /**
   * Récupérer les statistiques utilisateur
   */
  async getStats(): Promise<NumeroMagicStats> {
    return fetchViaProxy('/stats', {
      method: 'GET'
    });
  },

  /**
   * Récupérer la progression
   */
  async getProgress(limit: number = 30): Promise<any> {
    return fetchViaProxy(`/stats/progress?limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Récupérer le leaderboard
   */
  async getLeaderboard(mode?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const query = mode 
      ? `?mode=${mode}&limit=${limit}` 
      : `?limit=${limit}`;
    
    return fetchViaProxy(`/leaderboard${query}`, {
      method: 'GET'
    });
  },

  /**
   * Récupérer le rang de l'utilisateur
   */
  async getRank(): Promise<{
    rank: number | null;
    totalPlayers: number;
    percentile: number;
    bestScore?: number;
    totalGames?: number;
  }> {
    return fetchViaProxy('/leaderboard/rank', {
      method: 'GET'
    });
  }
};

