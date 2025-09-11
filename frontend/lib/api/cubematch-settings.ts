// API client pour les paramètres CubeMatch

export interface CubeMatchSettings {
  // Gameplay
  gridSize: number;
  operator: 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  unlimitedTime: boolean;
  allowDiagonals: boolean;
  
  // Audio & UX  
  soundEnabled: boolean;
  hintsEnabled: boolean;
  autoSubmit: boolean;
  
  // Avancé
  spawnRate: number;
  maxNumbers: number;
  infiniteCubes: boolean;
  cleanCubes: boolean;
  
  // État du jeu en cours (pour récupération)
  currentGameState?: {
    isPlaying: boolean;
    score: number;
    level: number;
    timeLeft: number;
    target: number;
    gameBoard?: any;
    stats?: any;
    savedAt?: string;
  };
}

export interface UserGameStats {
  gamesPlayed: number;
  bestLevel: number;
  averageScore: number;
}

export interface SettingsResponse {
  success: boolean;
  settings: CubeMatchSettings;
  stats: UserGameStats;
}

class CubeMatchSettingsAPI {
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

  // 🎮 Charger les paramètres utilisateur
  async loadSettings(): Promise<SettingsResponse> {
    console.log('🎮 Chargement des paramètres utilisateur...');
    
    try {
      const result = await this.request('/cubematch/settings');
      console.log('✅ Paramètres chargés:', result.settings);
      return result;
    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
      
      // Retourner des paramètres par défaut en cas d'erreur
      const defaultSettings: CubeMatchSettings = {
        gridSize: 6,
        operator: 'ADD',
        difficulty: 'EASY',
        timeLimit: 60,
        unlimitedTime: false,
        allowDiagonals: false,
        soundEnabled: true,
        hintsEnabled: true,
        autoSubmit: false,
        spawnRate: 2000,
        maxNumbers: 9,
        infiniteCubes: false,
        cleanCubes: false
      };
      
      return {
        success: false,
        settings: defaultSettings,
        stats: { gamesPlayed: 0, bestLevel: 1, averageScore: 0 }
      };
    }
  }

  // 💾 Sauvegarder les paramètres utilisateur
  async saveSettings(settings: CubeMatchSettings): Promise<void> {
    console.log('💾 Sauvegarde des paramètres utilisateur...');
    
    try {
      await this.request('/cubematch/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      
      console.log('✅ Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      throw error;
    }
  }

  // 🎯 Sauvegarder l'état de jeu en cours (auto-sauvegarde)
  async saveGameState(gameState: any): Promise<void> {
    console.log('🎯 Sauvegarde automatique de l\'état de jeu...');
    
    try {
      await this.request('/cubematch/game-state', {
        method: 'POST',
        body: JSON.stringify(gameState),
      });
      
      console.log('✅ État de jeu sauvegardé automatiquement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde état:', error);
      // Ne pas bloquer le jeu pour cette erreur
    }
  }

  // 🧹 Nettoyer l'état de jeu (après game over)
  async clearGameState(): Promise<void> {
    console.log('🧹 Nettoyage de l\'état de jeu...');
    
    try {
      await this.request('/cubematch/game-state', {
        method: 'DELETE',
      });
      
      console.log('✅ État de jeu nettoyé');
    } catch (error) {
      console.error('❌ Erreur nettoyage état:', error);
      // Ne pas bloquer pour cette erreur
    }
  }

  // 🔄 Auto-sauvegarde périodique (pour éviter la perte de données)
  startAutoSave(gameStateGetter: () => any, intervalMs: number = 10000): () => void {
    console.log('🔄 Démarrage de l\'auto-sauvegarde...');
    
    const interval = setInterval(() => {
      const gameState = gameStateGetter();
      if (gameState && gameState.isPlaying) {
        this.saveGameState(gameState).catch(() => {
          // Silent fail pour ne pas perturber l'expérience de jeu
        });
      }
    }, intervalMs);

    // Retourner une fonction pour arrêter l'auto-sauvegarde
    return () => {
      console.log('⏹️ Arrêt de l\'auto-sauvegarde');
      clearInterval(interval);
    };
  }
}

export const cubeMatchSettingsAPI = new CubeMatchSettingsAPI();
