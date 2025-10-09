/**
 * 🎮 CONFIGURATION DES JEUX - SYSTÈME EXTENSIBLE
 * 
 * Pour ajouter un nouveau jeu, ajoutez simplement une entrée dans gameDataSources.
 * Aucune modification du code ailleurs n'est nécessaire.
 * 
 * @author CubeAI Team
 * @date 2025-10-09
 */

export interface GameDataField {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface GameDataConfig {
  dataKey: string;           // Clé dans l'objet child (ex: 'cubeMatchData')
  displayName: string;       // Nom affiché (ex: 'CubeMatch')
  fetchFunction?: string;    // Nom de la fonction de récupération (ex: 'getCubeMatchData')
  fields: GameDataField[];   // Champs à afficher dans BubiX
}

/**
 * 🎯 CONFIGURATION DES JEUX DISPONIBLES
 * 
 * Pour ajouter un nouveau jeu:
 * 1. Créer la fonction getXxxData() dans chat/route.ts
 * 2. Ajouter l'entrée ici
 * 3. Ajouter l'appel dans getChildrenData()
 * 
 * Le reste est AUTOMATIQUE!
 */
export const GAME_DATA_SOURCES: Record<string, GameDataConfig> = {
  cubeMatch: {
    dataKey: 'cubeMatchData',
    displayName: 'CubeMatch',
    fetchFunction: 'getCubeMatchData',
    fields: [
      { key: 'totalGames', label: 'Parties jouées' },
      { key: 'currentLevel', label: 'Niveau actuel' },
      { key: 'bestScore', label: 'Meilleur score' },
      { key: 'favoriteOperator', label: 'Opérateur préféré' }
    ]
  },
  
  numeroMagic: {
    dataKey: 'numeroMagicData',
    displayName: 'NuméroMagic',
    fetchFunction: 'getNumeroMagicData',
    fields: [
      { key: 'totalGames', label: 'Parties jouées' },
      { key: 'currentLevel', label: 'Niveau actuel' },
      { key: 'bestScore', label: 'Meilleur score' },
      { key: 'averageScore', label: 'Score moyen', format: (v) => v?.toFixed(0) || '0' },
      { key: 'favoriteMode', label: 'Mode préféré' },
      { key: 'preferredDifficulty', label: 'Difficulté préférée' },
      { key: 'totalTimeMs', label: 'Temps total', format: (v) => `${Math.floor((v || 0) / 60000)}min` }
    ]
  },
  
  // 🎯 FUTURS JEUX - Ajoutez simplement une nouvelle entrée ici!
  // 
  // logicQuest: {
  //   dataKey: 'logicQuestData',
  //   displayName: 'LogicQuest',
  //   fetchFunction: 'getLogicQuestData',
  //   fields: [
  //     { key: 'totalGames', label: 'Parties jouées' },
  //     { key: 'bestScore', label: 'Meilleur score' },
  //     { key: 'averageTime', label: 'Temps moyen', format: (v) => `${(v / 1000).toFixed(1)}s` }
  //   ]
  // },
  //
  // formesFun: {
  //   dataKey: 'formesFunData',
  //   displayName: 'FormesFun',
  //   fetchFunction: 'getFormesFunData',
  //   fields: [
  //     { key: 'totalPuzzles', label: 'Puzzles résolus' },
  //     { key: 'difficulty', label: 'Difficulté actuelle' },
  //     { key: 'accuracy', label: 'Précision', format: (v) => `${v}%` }
  //   ]
  // }
};

/**
 * Fonction générique pour formater les données de jeu
 * Parcourt automatiquement tous les jeux configurés dans GAME_DATA_SOURCES
 */
export function formatGameData(child: any): string {
  let gameData = '';
  
  // Parcourir tous les jeux configurés
  for (const [gameKey, config] of Object.entries(GAME_DATA_SOURCES)) {
    const data = child[config.dataKey];
    
    if (data) {
      gameData += `📊 ${config.displayName}:\n`;
      
      // Afficher tous les champs configurés
      config.fields.forEach(field => {
        const value = data[field.key];
        const formattedValue = field.format ? field.format(value) : value;
        gameData += `  - ${field.label}: ${formattedValue}\n`;
      });
    }
  }
  
  return gameData || '- Aucune donnée de jeu disponible\n';
}

/**
 * Obtenir la liste des noms de jeux disponibles
 */
export function getAvailableGames(): string[] {
  return Object.values(GAME_DATA_SOURCES).map(config => config.displayName);
}

/**
 * Vérifier si un enfant a des données pour un jeu spécifique
 */
export function hasGameData(child: any, gameName: string): boolean {
  const config = Object.values(GAME_DATA_SOURCES).find(
    c => c.displayName.toLowerCase() === gameName.toLowerCase()
  );
  return config ? !!child[config.dataKey] : false;
}

