/**
 * 🎯 CUBEMATCH SERIES API CLIENT
 * 
 * Service frontend pour envoyer les données de séries au backend
 * Gère la collecte et l'envoi des données de validation avec timer
 */

// 🎯 CORRECTION: Ne pas utiliser apiPost/apiGet qui font des appels directs
// Utiliser fetch avec le proxy Next.js à la place

/**
 * 🔧 Helpers pour les appels API via le proxy Next.js
 */
async function fetchViaProxy(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `/api${endpoint}`; // Passer par le proxy Next.js
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || error.message || 'Erreur API');
  }

  return response.json();
}

async function apiPost(endpoint: string, data: any): Promise<any> {
  return fetchViaProxy(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function apiGet(endpoint: string): Promise<any> {
  return fetchViaProxy(endpoint, {
    method: 'GET',
  });
}

export interface SeriesData {
  attempts: number;
  correct: number;
  startTime: number;
  validationTimerMs: number;
  operator: string;
  target: number;
  difficulty: string;
  sessionId?: string;
}

export interface SeriesAttempt {
  selectedNumbers: number[];
  targetValue: number;
  operator: string;
  isCorrect: boolean;
  responseTimeMs: number;
  attemptType: 'correct' | 'incorrect' | 'timeout';
  numbersCount: number;
  isLongDecomposition: boolean;
}

export interface GameSessionData {
  sessionId: string;
  scoreId?: string;
  score: number;
  level: number;
  timePlayedMs: number;
  operator: string;
  target: number;
  difficulty: string;
  gridSize: number;
  allowDiagonals: boolean;
  totalMoves: number;
  successfulMoves: number;
  failedMoves: number;
  accuracyRate: number;
  comboMax: number;
  cellsCleared: number;
  hintsUsed: number;
  consecutiveErrors: number;
  longDecompositionsCount: number;
  autoValidationEnabled: boolean;
  seriesData: SeriesData[];
  attemptsData: SeriesAttempt[][];
}

/**
 * 💾 Envoyer une session complète avec toutes les séries
 */
export async function saveGameSessionWithSeries(data: GameSessionData): Promise<{
  success: boolean;
  scoreId?: string;
  message: string;
  data?: any;
}> {
  try {
    console.log('🎯 Envoi session complète avec séries...', {
      sessionId: data.sessionId,
      totalSeries: data.seriesData.length,
      totalAttempts: data.attemptsData.flat().length
    });

    const response = await apiPost('/cubematch/series', data);
    
    console.log('✅ Session enregistrée avec succès:', response);
    return response;
    
  } catch (error: any) {
    console.error('❌ Erreur envoi session:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de l\'enregistrement de la session'
    };
  }
}

/**
 * 📊 Récupérer les statistiques d'une session
 */
export async function getSessionStats(sessionId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    console.log(`📊 Récupération stats session ${sessionId}...`);
    
    const response = await apiGet(`/cubematch/series/session/${sessionId}`);
    
    console.log('✅ Stats session récupérées:', response);
    return response;
    
  } catch (error: any) {
    console.error('❌ Erreur récupération stats session:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la récupération des statistiques'
    };
  }
}

/**
 * 📈 Récupérer les agrégations quotidiennes
 */
export async function getDailyAggregates(
  startDate?: string, 
  endDate?: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    console.log('📈 Récupération agrégations quotidiennes...');
    
    const response = await apiGet(`/cubematch/series/daily-aggregates?${params.toString()}`);
    
    console.log('✅ Agrégations récupérées:', response);
    return response;
    
  } catch (error: any) {
    console.error('❌ Erreur récupération agrégations:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la récupération des agrégations'
    };
  }
}

/**
 * 🧹 Nettoyer les anciennes données
 */
export async function cleanupOldData(daysToKeep: number = 90): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    console.log(`🧹 Nettoyage données anciennes (garder ${daysToKeep} jours)...`);
    
    const response = await apiPost('/cubematch/series/cleanup', {
      daysToKeep
    });
    
    console.log('✅ Nettoyage terminé:', response);
    return response;
    
  } catch (error: any) {
    console.error('❌ Erreur nettoyage:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors du nettoyage'
    };
  }
}

/**
 * 🎯 Classe pour collecter les données de série en temps réel
 */
export class SeriesCollector {
  private sessionId: string;
  private currentSeries: SeriesData | null = null;
  private currentAttempts: SeriesAttempt[] = [];
  private allSeries: SeriesData[] = [];
  private allAttempts: SeriesAttempt[][] = [];
  private gameStartTime: number = Date.now();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * 🚀 Démarrer une nouvelle série
   */
  startSeries(
    operator: string,
    target: number,
    difficulty: string,
    validationTimerMs: number
  ): void {
    // Finaliser la série précédente si elle existe
    if (this.currentSeries) {
      this.finishSeries();
    }

    this.currentSeries = {
      attempts: 0,
      correct: 0,
      startTime: Date.now(),
      validationTimerMs,
      operator,
      target,
      difficulty,
      sessionId: this.sessionId
    };

    this.currentAttempts = [];
    console.log('🎯 Nouvelle série démarrée:', this.currentSeries);
  }

  /**
   * 📝 Enregistrer une tentative
   */
  recordAttempt(
    selectedNumbers: number[],
    targetValue: number,
    operator: string,
    isCorrect: boolean,
    responseTimeMs: number,
    attemptType: 'correct' | 'incorrect' | 'timeout',
    isLongDecomposition: boolean = false
  ): void {
    if (!this.currentSeries) {
      console.warn('⚠️ Aucune série active pour enregistrer la tentative');
      return;
    }

    const attempt: SeriesAttempt = {
      selectedNumbers,
      targetValue,
      operator,
      isCorrect,
      responseTimeMs,
      attemptType,
      numbersCount: selectedNumbers.length,
      isLongDecomposition
    };

    this.currentAttempts.push(attempt);
    this.currentSeries.attempts++;
    
    if (isCorrect) {
      this.currentSeries.correct++;
    }

    console.log('📝 Tentative enregistrée:', attempt);
  }

  /**
   * ✅ Finaliser la série actuelle
   */
  finishSeries(): void {
    if (!this.currentSeries) return;

    this.allSeries.push(this.currentSeries);
    this.allAttempts.push([...this.currentAttempts]);

    console.log('✅ Série finalisée:', {
      series: this.currentSeries,
      attemptsCount: this.currentAttempts.length
    });

    this.currentSeries = null;
    this.currentAttempts = [];
  }

  /**
   * 💾 Envoyer toutes les données de session
   */
  async saveSession(gameData: {
    scoreId?: string; // 🎯 NOUVEAU: ID du score déjà créé
    score: number;
    level: number;
    operator: string;
    target: number;
    difficulty: string;
    gridSize: number;
    allowDiagonals: boolean;
    totalMoves: number;
    successfulMoves: number;
    failedMoves: number;
    accuracyRate: number;
    comboMax: number;
    cellsCleared: number;
    hintsUsed: number;
    consecutiveErrors: number;
    longDecompositionsCount: number;
    autoValidationEnabled: boolean;
  }): Promise<{ success: boolean; scoreId?: string; message: string }> {
    // Finaliser la série actuelle
    if (this.currentSeries) {
      this.finishSeries();
    }

    const sessionData: GameSessionData = {
      sessionId: this.sessionId,
      scoreId: gameData.scoreId, // 🎯 Passer le scoreId
      timePlayedMs: Date.now() - this.gameStartTime,
      seriesData: this.allSeries,
      attemptsData: this.allAttempts,
      ...gameData
    };

    console.log('💾 Envoi session complète:', {
      sessionId: this.sessionId,
      totalSeries: this.allSeries.length,
      totalAttempts: this.allAttempts.flat().length,
      timePlayed: sessionData.timePlayedMs
    });

    return await saveGameSessionWithSeries(sessionData);
  }

  /**
   * 📊 Obtenir les statistiques de la session en cours
   */
  getCurrentStats(): {
    totalSeries: number;
    totalAttempts: number;
    totalCorrect: number;
    currentSeries?: SeriesData;
    currentAttempts: number;
  } {
    const totalAttempts = this.allAttempts.flat().length + this.currentAttempts.length;
    const totalCorrect = this.allSeries.reduce((sum, s) => sum + s.correct, 0) + 
                        (this.currentSeries?.correct || 0);

    return {
      totalSeries: this.allSeries.length + (this.currentSeries ? 1 : 0),
      totalAttempts,
      totalCorrect,
      currentSeries: this.currentSeries || undefined,
      currentAttempts: this.currentAttempts.length
    };
  }

  /**
   * 🧹 Réinitialiser le collecteur
   */
  reset(): void {
    this.currentSeries = null;
    this.currentAttempts = [];
    this.allSeries = [];
    this.allAttempts = [];
    this.gameStartTime = Date.now();
  }
}
