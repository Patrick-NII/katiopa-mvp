'use client'

/**
 * 🎯 CubeMatch Service (style Bubix)
 *
 * Service centralisé pour les appels CubeMatch via le proxy Next.js
 * - Gère credentials/cookies automatiquement
 * - Fournit un point d'entrée unique (comme bubix-service)
 * - Offre un retry simple sur les POST critiques
 */

import type { ScoreData } from '@/lib/api/cubematch-v2'

type Json = Record<string, any>

class CubeMatchService {
  private static instance: CubeMatchService

  static getInstance(): CubeMatchService {
    if (!CubeMatchService.instance) {
      CubeMatchService.instance = new CubeMatchService()
    }
    return CubeMatchService.instance
  }

  private async fetchViaProxy<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
    })

    // Essayer de parser JSON; sinon, lever une erreur générique
    let data: any = null
    try {
      data = await response.json()
    } catch (_e) {
      // ignore, on gère en dessous via ok
    }

    if (!response.ok) {
      const code = (data && (data.error || data.code)) || `HTTP ${response.status}`
      const err = new Error(typeof data === 'object' && data?.message ? data.message : String(code)) as any
      err.status = response.status
      err.data = data
      throw err
    }

    return data as T
  }

  private async postWithRetry<T = any>(endpoint: string, body: Json, retries = 2): Promise<T> {
    let lastError: any
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchViaProxy<T>(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      } catch (e: any) {
        lastError = e
        const status = e?.status
        // Ne pas retenter sur 4xx (sauf 429), retenter sur 5xx ou réseau
        if (status && status < 500 && status !== 429) break
        // petite attente exponentielle
        await new Promise(res => setTimeout(res, 200 * (attempt + 1)))
      }
    }
    throw lastError
  }

  // 🏆 Enregistrer le score principal
  async saveScore(scoreData: ScoreData): Promise<{ success: boolean; scoreId: string }> {
    console.log('💾 [CubeMatchService] Sauvegarde du score via proxy...', {
      score: scoreData.score,
      level: scoreData.level,
      operator: scoreData.operator,
      difficulty: scoreData.difficulty,
      gridSize: scoreData.gridSize,
    })

    // Normaliser le payload avec des valeurs par défaut solides (évite 400 si champs manquants)
    const payload: any = {
      // Champs obligatoires
      score: Math.max(0, scoreData.score ?? 0),
      level: Math.max(1, scoreData.level ?? 1),
      timePlayedMs: Math.max(0, scoreData.timePlayedMs ?? 0),
      operator: scoreData.operator,
      target: Math.max(1, scoreData.target ?? 1),

      // Configuration de jeu
      allowDiagonals: Boolean(scoreData.allowDiagonals ?? false),
      gridSize: Math.max(3, scoreData.gridSize ?? 6),
      difficulty: (scoreData.difficulty ?? 'MEDIUM') as any,

      // Métriques avec défauts
      totalMoves: Math.max(0, scoreData.totalMoves ?? 0),
      successfulMoves: Math.max(0, scoreData.successfulMoves ?? 0),
      failedMoves: Math.max(0, (scoreData.totalMoves ?? 0) - (scoreData.successfulMoves ?? 0)),
      accuracyRate: Math.max(0, scoreData.accuracyRate ?? 0),
      averageMoveTimeMs: Math.max(0, scoreData.averageMoveTimeMs ?? 0),
      fastestMoveTimeMs: Math.max(0, scoreData.fastestMoveTimeMs ?? 0),
      slowestMoveTimeMs: Math.max(0, scoreData.slowestMoveTimeMs ?? 0),
      comboMax: Math.max(0, scoreData.comboMax ?? 0),
      cellsCleared: Math.max(0, scoreData.cellsCleared ?? 0),
      hintsUsed: Math.max(0, scoreData.hintsUsed ?? 0),
      gameDurationSeconds: Math.max(0, scoreData.gameDurationSeconds ?? Math.round((scoreData.timePlayedMs ?? 0) / 1000)),

      // Champs avancés (Zod attend 0.8..3.5 mais default(1.0) existe; on force des valeurs valides)
      initialDifficulty: Math.min(3.5, Math.max(0.8, scoreData.initialDifficulty ?? 1.0)),
      finalDifficulty: Math.min(3.5, Math.max(0.8, scoreData.finalDifficulty ?? 1.0)),
      averageDifficulty: Math.min(3.5, Math.max(0.8, scoreData.averageDifficulty ?? 1.0)),
      difficultyProgression: Array.isArray(scoreData.difficultyProgression) ? scoreData.difficultyProgression : undefined,
      flowScore: Math.max(0, scoreData.flowScore ?? 0),
      operatorDistribution: scoreData.operatorDistribution,
      operatorAccuracy: scoreData.operatorAccuracy,
      bubixMetrics: scoreData.bubixMetrics,
      recommendations: scoreData.recommendations,
      consecutiveErrors: Math.max(0, scoreData.consecutiveErrors ?? 0),
      longDecompositionsCount: Math.max(0, scoreData.longDecompositionsCount ?? 0),
      themeUsed: scoreData.themeUsed ?? 'classic',
      soundEnabled: scoreData.soundEnabled ?? true,
      assistEnabled: scoreData.assistEnabled ?? true,
      hintsEnabled: scoreData.hintsEnabled ?? true,
      // Séquences (laisser undefined si non fournies)
      targetNumbersUsed: scoreData.targetNumbersUsed,
      operatorSequence: scoreData.operatorSequence,
      moveTimings: scoreData.moveTimings,
      errorPatterns: scoreData.errorPatterns,
    }

    const result = await this.postWithRetry<{ success: boolean; scoreId: string }>(
      '/cubematch/scores',
      payload
    )

    if (!result?.success || !result?.scoreId) {
      throw new Error('Réponse de sauvegarde invalide (scoreId manquant)')
    }
    return result
  }
}

export const cubeMatchService = CubeMatchService.getInstance()
