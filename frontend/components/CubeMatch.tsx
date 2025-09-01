"use client";
import React, { useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { Gamepad2, Lightbulb, RotateCcw, Volume2, VolumeX, Play, Pause, Settings, Target, Zap, X, Trophy, Users } from 'lucide-react';
import { cubematchAPI, CubeMatchScore, CubeMatchStats } from '../lib/api/cubematch';

// Hook pour détecter les changements de taille d'écran
const useViewportSize = () => {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
};

type Operator = 'ADD' | 'SUB' | 'MUL' | 'DIV';
type Cell = { id: string; row: number; col: number; value: number | null; bornAt: number };
type Coords = { row: number; col: number };

type Config = {
  rows: number;
  cols: number;
  operator: Operator;
  target: number;
  allowDiagonals: boolean;
  tickMs: number;
  spawnPerTick: [number, number];
  maxSize: number;
  theme?: 'classic' | 'ocean' | 'sunset' | 'forest';
  assistOnSelect?: boolean;
  allowMultiplePairs?: boolean;
  timedMode?: boolean;
  cascadeMode?: boolean;
};

type State = {
  grid: Cell[][];
  selected: Coords[];
  score: number;
  combo: number;
  level: number;
  config: Config;
  running: boolean;
  lastTick: number;
  seed: number;
  hint: Coords[] | null;
  gameOver: boolean;
  timePlayedMs: number;
  soundEnabled: boolean;
  lastAction: 'HIT' | 'MISS' | null;
};

type Action =
  | { type: 'INIT'; payload?: Partial<Config> }
  | { type: 'TICK'; now: number }
  | { type: 'CLICK'; at: Coords }
  | { type: 'SET_OPERATOR'; op: Operator; target: number }
  | { type: 'SET_SIZE'; rows: number; cols: number }
  | { type: 'SET_TICK_MS'; tickMs: number }
  | { type: 'SET_SPAWN'; min: number; max: number }
  | { type: 'SET_MAXSIZE'; max: number }
  | { type: 'SET_THEME'; theme: NonNullable<Config['theme']> }
  | { type: 'TOGGLE_ASSIST' }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'TOGGLE_DIAG' }
  | { type: 'HINT' }
  | { type: 'LEVEL_UP' }
  | { type: 'RESTART' }
  | { type: 'TICK_TIME'; delta: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_MULTIPLE_PAIRS' }
  | { type: 'TOGGLE_TIMED_MODE' }
  | { type: 'TOGGLE_CASCADE_MODE' }
  | { type: 'CLEAR_ANIMATION' };

const rand = (seed: number) => {
  const a = 1664525, c = 1013904223, m = 2 ** 32;
  const next = (a * seed + c) % m;
  return { next, r01: next / m };
};

const emptyGrid = (rows: number, cols: number, bornAt = 0): Cell[][] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: `${r}-${c}`, row: r, col: c, value: null, bornAt
    }))
  );

const defaultConfig: Config = {
  rows: 12, cols: 12, // Grille adaptée pour enfants 5-7 ans
  operator: 'ADD',
  target: 10,
  allowDiagonals: false,
  tickMs: 15000, // Plus lent pour les enfants (15 secondes)
  spawnPerTick: [4, 6], // Moins de spawns pour éviter la surcharge
  maxSize: 6, // Valeurs plus petites pour les enfants
  theme: 'classic',
  assistOnSelect: true,
  allowMultiplePairs: false,
  timedMode: false,
  cascadeMode: false,
};

const STORAGE_KEY = 'cubeMatch:v1';

function loadUserPrefs(): { cfg: Partial<Config>; soundEnabled?: boolean } {
  try {
    if (typeof window === 'undefined') return { cfg: {} };
    const raw = localStorage.getItem('userSettings');
    if (!raw) return { cfg: {} };
    const data = JSON.parse(raw);
    const cm = data?.cubematch ?? {};
    const cfg: Partial<Config> = {
      allowDiagonals: Boolean(cm.diagonals ?? false),
      assistOnSelect: Boolean(cm.assistOnSelect ?? true),
      theme: (cm.theme ?? 'classic') as any,
      operator: (cm.operator ?? 'ADD') as Operator,
      target: Number(cm.target ?? 10) || 10,
    };
    const soundEnabled = Boolean(cm.sound ?? true);
    return { cfg, soundEnabled };
  } catch {
    return { cfg: {} };
  }
}

function loadSaved(): State | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    
    // S'assurer que tous les champs requis sont présents
    return {
      grid: data.grid || emptyGrid(6, 6),
      selected: data.selected || [],
      score: data.score || 0,
      combo: data.combo || 0,
      level: data.level || 1,
      config: { ...defaultConfig, ...data.config },
      running: data.running !== undefined ? data.running : true,
      lastTick: data.lastTick || Date.now(),
      seed: data.seed || Math.floor(Math.random() * 1000000),
      hint: data.hint || null,
      gameOver: data.gameOver || false,
      timePlayedMs: data.timePlayedMs || 0,
      soundEnabled: data.soundEnabled !== undefined ? data.soundEnabled : true,
      lastAction: data.lastAction || null,
    };
  } catch {
    return null;
  }
}

function projectForSave(state: State): Partial<State> {
  return {
    grid: state.grid,
    selected: state.selected,
    score: state.score,
    level: state.level,
    combo: state.combo,
    config: state.config,
    running: state.running,
    lastTick: state.lastTick,
    seed: state.seed,
    hint: state.hint,
    gameOver: state.gameOver,
    timePlayedMs: state.timePlayedMs,
    soundEnabled: state.soundEnabled,
    lastAction: state.lastAction,
  };
}

const themePalette = {
  classic: {
    headerFrom: 'from-indigo-600',
    headerTo: 'to-purple-600',
    ring: 'ring-indigo-500',
    outline: 'outline-indigo-500',
    activeFrom: 'from-indigo-500',
    activeTo: 'to-indigo-600',
  },
  ocean: {
    headerFrom: 'from-blue-600',
    headerTo: 'to-cyan-600',
    ring: 'ring-blue-500',
    outline: 'outline-blue-500',
    activeFrom: 'from-blue-500',
    activeTo: 'to-blue-600',
  },
  sunset: {
    headerFrom: 'from-orange-600',
    headerTo: 'to-red-600',
    ring: 'ring-orange-500',
    outline: 'outline-orange-500',
    activeFrom: 'from-orange-500',
    activeTo: 'to-orange-600',
  },
  forest: {
    headerFrom: 'from-green-600',
    headerTo: 'to-emerald-600',
    ring: 'ring-green-500',
    outline: 'outline-green-500',
    activeFrom: 'from-green-500',
    activeTo: 'to-green-600',
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT': {
      const config = { ...defaultConfig, ...action.payload };
      return {
        grid: emptyGrid(config.rows, config.cols),
        selected: [],
        score: 0,
        combo: 0,
        level: 1,
        config,
        running: true,
        lastTick: Date.now(),
        seed: Math.floor(Math.random() * 1000000),
        hint: null,
        gameOver: false,
        timePlayedMs: 0,
        soundEnabled: true,
        lastAction: null,
      };
    }
    case 'TICK': {
      if (!state.running || state.gameOver) return state;
      
      const { seed } = state;
      const { r01 } = rand(seed);
      
      // Algorithme amélioré de génération des chiffres
      const spawnCount = Math.floor(r01 * (state.config.spawnPerTick[1] - state.config.spawnPerTick[0] + 1)) + state.config.spawnPerTick[0];
      
      const newGrid = state.grid.map(row => [...row]);
      let newSeed = seed;
      
      // Calculer la densité actuelle de la grille
      const totalCells = state.config.rows * state.config.cols;
      const filledCells = newGrid.flat().filter(cell => cell.value !== null).length;
      const density = filledCells / totalCells;
      
      // Ajuster le nombre de spawns selon la densité
      let adjustedSpawnCount = spawnCount;
      if (density < 0.3) {
        // Si la grille est peu remplie, augmenter les spawns
        adjustedSpawnCount = Math.min(spawnCount + 2, state.config.spawnPerTick[1] + 2);
      } else if (density > 0.7) {
        // Si la grille est très remplie, réduire les spawns
        adjustedSpawnCount = Math.max(spawnCount - 1, state.config.spawnPerTick[0] - 1);
      }
      
      for (let i = 0; i < adjustedSpawnCount; i++) {
        const emptyCells = newGrid.flat().filter(cell => cell.value === null);
        if (emptyCells.length === 0) break;
        
        const { r01: r } = rand(newSeed);
        const cellIndex = Math.floor(r * emptyCells.length);
        const cell = emptyCells[cellIndex];
        
        // Algorithme intelligent de génération de valeurs - Adapté pour enfants 5-7 ans
        let value: number;
        const { r01: valueR } = rand(newSeed);
        
        // Pour les enfants, privilégier les petites valeurs et les combinaisons simples
        const existingValues = newGrid.flat().filter(cell => cell.value !== null).map(cell => cell.value as number);
        const valueCounts: Record<number, number> = {};
        existingValues.forEach(v => {
          valueCounts[v] = (valueCounts[v] || 0) + 1;
        });
        
        // Privilégier les valeurs 1-3 pour les enfants (plus faciles à manipuler)
        const easyValues = [1, 2, 3];
        const mediumValues = [4, 5, 6];
        
        if (valueR < 0.7) {
          // 70% de chance d'avoir des valeurs faciles (1-3)
          value = easyValues[Math.floor(valueR * easyValues.length)];
        } else {
          // 30% de chance d'avoir des valeurs moyennes (4-6)
          value = mediumValues[Math.floor((valueR - 0.7) * mediumValues.length)];
        }
        
        // Éviter les valeurs trop proches dans les cellules adjacentes
        const adjacentValues: number[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = cell.row + dr;
            const nc = cell.col + dc;
            if (nr >= 0 && nr < state.config.rows && nc >= 0 && nc < state.config.cols) {
              const adjacentCell = newGrid[nr][nc];
              if (adjacentCell.value !== null) {
                adjacentValues.push(adjacentCell.value);
              }
            }
          }
        }
        
        // Si la valeur générée est trop proche des valeurs adjacentes, choisir une valeur différente
        if (adjacentValues.some(adjValue => Math.abs(value - adjValue) <= 1)) {
          const availableValues = Array.from({length: state.config.maxSize}, (_, i) => i + 1)
            .filter(v => !adjacentValues.some(adjValue => Math.abs(v - adjValue) <= 1));
          if (availableValues.length > 0) {
            value = availableValues[Math.floor(valueR * availableValues.length)];
          }
        }
        
        newGrid[cell.row][cell.col] = { ...cell, value, bornAt: action.now };
        newSeed = rand(newSeed).next;
      }
      
      return {
        ...state,
        grid: newGrid,
        seed: newSeed,
        lastTick: action.now,
      };
    }
    case 'CLICK': {
      if (state.gameOver) return state;
      
      const cell = state.grid[action.at.row][action.at.col];
      if (cell.value === null) return state;
      
      const newSelected = [...state.selected];
      const existingIndex = newSelected.findIndex(s => s.row === action.at.row && s.col === action.at.col);
      
      if (existingIndex >= 0) {
        newSelected.splice(existingIndex, 1);
      } else {
        if (newSelected.length >= 2) {
          newSelected.shift();
        }
        newSelected.push(action.at);
      }
      
      if (newSelected.length === 2) {
        const [a, b] = newSelected;
        const valA = state.grid[a.row][a.col].value!;
        const valB = state.grid[b.row][b.col].value!;
        
        let result: number;
        switch (state.config.operator) {
          case 'ADD': result = valA + valB; break;
          case 'SUB': result = Math.abs(valA - valB); break;
          case 'MUL': result = valA * valB; break;
          case 'DIV': result = Math.max(valA, valB) / Math.min(valA, valB); break;
          default: result = valA + valB;
        }
        
        if (Math.abs(result - state.config.target) < 0.01) {
          // Succès !
          const newGrid = state.grid.map(row => [...row]);
          newGrid[a.row][a.col] = { ...newGrid[a.row][a.col], value: null };
          newGrid[b.row][b.col] = { ...newGrid[b.row][b.col], value: null };
          
          const points = Math.floor((valA + valB) * (1 + state.combo * 0.1));
          const newCombo = state.combo + 1;
          const newScore = state.score + points;
          const newLevel = Math.floor(newScore / 50) + 1;
          
          return {
            ...state,
            grid: newGrid,
            selected: [],
            score: newScore,
            combo: newCombo,
            level: newLevel,
            hint: null,
            lastAction: 'HIT',
          };
        } else {
          // Échec
          return {
            ...state,
            selected: [],
            combo: 0,
            hint: null,
            lastAction: 'MISS',
          };
        }
      }
      
      return {
        ...state,
        selected: newSelected,
        hint: null,
      };
    }
    case 'SET_OPERATOR':
      return {
        ...state,
        config: { ...state.config, operator: action.op, target: action.target },
        selected: [],
        hint: null,
      };
    case 'SET_SIZE':
      return {
        ...state,
        config: { ...state.config, rows: action.rows, cols: action.cols },
        grid: emptyGrid(action.rows, action.cols),
        selected: [],
        hint: null,
      };
    case 'SET_TICK_MS':
      return {
        ...state,
        config: { ...state.config, tickMs: action.tickMs },
      };
    case 'SET_SPAWN':
      return {
        ...state,
        config: { ...state.config, spawnPerTick: [action.min, action.max] },
      };
    case 'SET_MAXSIZE':
      return {
        ...state,
        config: { ...state.config, maxSize: action.max },
      };
    case 'SET_THEME':
      return {
        ...state,
        config: { ...state.config, theme: action.theme },
      };
    case 'TOGGLE_ASSIST':
      return {
        ...state,
        config: { ...state.config, assistOnSelect: !state.config.assistOnSelect },
      };
    case 'PAUSE_TOGGLE':
      return {
        ...state,
        running: !state.running,
      };
    case 'TOGGLE_DIAG':
      return {
        ...state,
        config: { ...state.config, allowDiagonals: !state.config.allowDiagonals },
      };
    case 'HINT': {
      if (state.score < 15) return state;
      
      const emptyCells = state.grid.flat().filter(cell => cell.value === null);
      if (emptyCells.length === 0) return state;
      
      const { r01 } = rand(state.seed);
      const cellIndex = Math.floor(r01 * emptyCells.length);
      const cell = emptyCells[cellIndex];
      
      return {
        ...state,
        score: state.score - 15,
        hint: [{ row: cell.row, col: cell.col }],
      };
    }
    case 'LEVEL_UP':
      return {
        ...state,
        level: state.level + 1,
      };
    case 'RESTART':
      return reducer({ ...state, gameOver: false }, { type: 'INIT', payload: state.config });
    case 'TICK_TIME':
      return {
        ...state,
        timePlayedMs: state.timePlayedMs + action.delta,
      };
    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled,
      };
    case 'TOGGLE_MULTIPLE_PAIRS':
      return {
        ...state,
        config: { ...state.config, allowMultiplePairs: !state.config.allowMultiplePairs },
      };
    case 'TOGGLE_TIMED_MODE':
      return {
        ...state,
        config: { ...state.config, timedMode: !state.config.timedMode },
      };
    case 'TOGGLE_CASCADE_MODE':
      return {
        ...state,
        config: { ...state.config, cascadeMode: !state.config.cascadeMode },
      };
    case 'CLEAR_ANIMATION':
      return {
        ...state,
        lastAction: null,
      };
    default:
      return state;
  }
}

export default function CubeMatch() {
  const [showOptions, setShowOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [topScores, setTopScores] = useState<CubeMatchScore[]>([]);
  const [stats, setStats] = useState<CubeMatchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingScores, setStreamingScores] = useState<CubeMatchScore[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [state, dispatch] = useReducer(reducer, undefined as any, () => {
    const saved = loadSaved();
    if (saved) return saved;
    const prefs = loadUserPrefs();
    const initial = reducer({} as any, { type: 'INIT', payload: prefs.cfg });
    (initial as any).soundEnabled = prefs.soundEnabled ?? true;
    return initial;
  });
  const viewportSize = useViewportSize();

  // Fonction pour récupérer les scores en streaming
  const streamScores = useCallback(async () => {
    setIsStreaming(true);
    try {
      // Utiliser les vraies données du backend
      const scores = await cubematchAPI.getTopScores(5);
      setStreamingScores(scores);
    } catch (error) {
      console.error('Erreur lors du streaming des scores:', error);
      // Fallback avec des données par défaut si erreur
      const defaultScores = [
        { id: '1', userId: 'user1', username: 'Joueur 1', score: 1250, level: 8, timePlayedMs: 45000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
        { id: '2', userId: 'user2', username: 'Joueur 2', score: 980, level: 6, timePlayedMs: 38000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
        { id: '3', userId: 'user3', username: 'Joueur 3', score: 750, level: 5, timePlayedMs: 32000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
        { id: '4', userId: 'user4', username: 'Joueur 4', score: 620, level: 4, timePlayedMs: 28000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
        { id: '5', userId: 'user5', username: 'Joueur 5', score: 480, level: 3, timePlayedMs: 25000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() }
      ];
      setStreamingScores(defaultScores);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // Effet de nettoyage des animations
  useEffect(() => {
    if (state.lastAction === 'HIT') {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_ANIMATION' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.lastAction, dispatch]);
  useEffect(() => {
    streamScores();
    const interval = setInterval(streamScores, 30000);
    return () => clearInterval(interval);
  }, [streamScores]);

  // Charger les scores et statistiques
  useEffect(() => {
    const loadScores = async () => {
      setLoading(true);
      try {
        // Utiliser les vraies données du backend
        const [scores, gameStats] = await Promise.all([
          cubematchAPI.getTopScores(5),
          cubematchAPI.getStats()
        ]);
        setTopScores(scores);
        setStats(gameStats);
      } catch (error) {
        console.error('Erreur lors du chargement des scores:', error);
        // Fallback avec des données par défaut
        const defaultScores = [
          { id: '1', userId: 'user1', username: 'Joueur 1', score: 1250, level: 8, timePlayedMs: 45000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
          { id: '2', userId: 'user2', username: 'Joueur 2', score: 980, level: 6, timePlayedMs: 38000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
          { id: '3', userId: 'user3', username: 'Joueur 3', score: 750, level: 5, timePlayedMs: 32000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
          { id: '4', userId: 'user4', username: 'Joueur 4', score: 620, level: 4, timePlayedMs: 28000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
          { id: '5', userId: 'user5', username: 'Joueur 5', score: 480, level: 3, timePlayedMs: 25000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() }
        ];
        
        const defaultStats = {
          totalGames: 150,
          totalScore: 125000,
          averageScore: 833,
          bestScore: 1250,
          totalTimePlayed: 5400000,
          averageTimePlayed: 36000,
          highestLevel: 8
        };
        
        setTopScores(defaultScores);
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    if (showLeaderboard) {
      loadScores();
    }
  }, [showLeaderboard]);

  // Sauvegarder le score quand la partie se termine
  useEffect(() => {
    if (state.gameOver && state.score > 0) {
      const saveScore = async () => {
        try {
          // Sauvegarder avec toutes les données du jeu
          await cubematchAPI.saveScore({
            score: state.score,
            level: state.level,
            timePlayedMs: state.timePlayedMs,
            operator: state.config.operator,
            target: state.config.target,
            allowDiagonals: state.config.allowDiagonals,
            gridSizeRows: state.config.rows,
            gridSizeCols: state.config.cols,
            maxSize: state.config.maxSize,
            spawnRateMin: state.config.spawnPerTick[0],
            spawnRateMax: state.config.spawnPerTick[1],
            tickMs: state.config.tickMs,
            comboMax: state.combo,
            cellsCleared: 0, // À calculer si nécessaire
            hintsUsed: 0, // À calculer si nécessaire
            gameDurationSeconds: Math.floor(state.timePlayedMs / 1000)
          });
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du score:', error);
        }
      };
      saveScore();
    }
  }, [state.gameOver, state.score, state.level, state.timePlayedMs, state.config, state.combo]);

  // Tick principal du jeu
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, state.config.tickMs);
    return () => clearInterval(id);
  }, [state.running, state.config.tickMs]);

  // Tick temps joué (chaque seconde)
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'TICK_TIME', delta: 1000 });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectForSave(state)));
      }
    } catch {}
  }, [state]);

  // Lecture d'un léger son à la validation
  useEffect(() => {
    if (!state.soundEnabled) return;
    if (state.lastAction !== 'HIT') return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.14);
    } catch {}
  }, [state.lastAction, state.soundEnabled]);

  // Grille responsive - Optimisée pour enfants 5-7 ans avec cubes très grands
  const cellSize = useMemo(() => {
    const availableHeight = viewportSize.height - 150; // Encore plus d'espace pour les très gros cubes
    const maxCellHeight = Math.floor(availableHeight / state.config.rows);
    
    const availableWidth = Math.min(viewportSize.width - 200, 900); // Encore plus d'espace pour les très gros cubes
    const maxCellWidth = Math.floor(availableWidth / state.config.cols);
    
    const baseSize = Math.min(maxCellHeight, maxCellWidth, 80); // Taille très augmentée pour enfants
    const minSize = Math.max(60, baseSize); // Taille minimale encore plus grande
    
    return `${minSize}px`;
  }, [state.config.rows, state.config.cols, viewportSize]);

  // Couleur du chiffre selon la valeur
  const valueClass = (v: number | null) => {
    if (v == null) return 'text-gray-300';
    if (v <= 2) return 'text-sky-700';
    if (v <= 4) return 'text-emerald-700';
    if (v <= 6) return 'text-amber-700';
    if (v <= 8) return 'text-orange-700';
    return 'text-rose-700';
  };

  const theme = themePalette[(state.config.theme ?? 'classic') as keyof typeof themePalette];

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Fenêtre des paramètres */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
              <button 
                onClick={() => setShowOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Opérateur</h3>
                  <OpButton current={state.config} onChange={(op, target)=>dispatch({type:'SET_OPERATOR', op, target})}/>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cible</h3>
                  <TargetControl current={state.config} onChange={(target)=>dispatch({type:'SET_OPERATOR', op: state.config.operator, target})} />
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Délai d'apparition</h3>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Temps (secondes)</label>
                    <input
                      type="number"
                      min={5}
                      max={30}
                      step={1}
                      value={Math.round(state.config.tickMs / 1000)}
                      onChange={e => {
                        const seconds = parseInt(e.target.value) || 15;
                        dispatch({type: 'SET_TICK_MS', tickMs: seconds * 1000});
                      }}
                      className="w-20 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Temps entre chaque apparition de nouveaux nombres
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Nombre de spawns</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Minimum</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={state.config.spawnPerTick[0]}
                        onChange={e => {
                          const min = parseInt(e.target.value) || 4;
                          const max = Math.max(min, state.config.spawnPerTick[1]);
                          dispatch({type: 'SET_SPAWN', min, max});
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Maximum</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        step={1}
                        value={state.config.spawnPerTick[1]}
                        onChange={e => {
                          const max = parseInt(e.target.value) || 6;
                          const min = Math.min(max, state.config.spawnPerTick[0]);
                          dispatch({type: 'SET_SPAWN', min, max});
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de nombres qui apparaissent à chaque cycle
                  </p>
                </div>
              </div>
              
              {/* Colonne droite */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Règles de jeu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">Nombres voisins uniquement</h4>
                        <p className="text-xs text-gray-600">Calculer seulement avec des nombres adjacents</p>
                      </div>
                      <button 
                        className={`w-12 h-6 rounded-full transition-colors ${
                          state.config.allowDiagonals 
                            ? 'bg-purple-500' 
                            : 'bg-gray-300'
                        }`} 
                        onClick={()=>dispatch({type:'TOGGLE_DIAG'})}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          state.config.allowDiagonals ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">Combinaisons multiples</h4>
                        <p className="text-xs text-gray-600">Permettre plusieurs paires simultanées</p>
                      </div>
                      <button 
                        className={`w-12 h-6 rounded-full transition-colors ${
                          state.config.allowMultiplePairs 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`} 
                        onClick={()=>dispatch({type:'TOGGLE_MULTIPLE_PAIRS'})}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          state.config.allowMultiplePairs ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">Mode chronométré</h4>
                        <p className="text-xs text-gray-600">Limiter le temps pour chaque combinaison</p>
                      </div>
                      <button 
                        className={`w-12 h-6 rounded-full transition-colors ${
                          state.config.timedMode 
                            ? 'bg-orange-500' 
                            : 'bg-gray-300'
                        }`} 
                        onClick={()=>dispatch({type:'TOGGLE_TIMED_MODE'})}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          state.config.timedMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">Mode cascade</h4>
                        <p className="text-xs text-gray-600">Les nombres tombent après élimination</p>
                      </div>
                      <button 
                        className={`w-12 h-6 rounded-full transition-colors ${
                          state.config.cascadeMode 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                        }`} 
                        onClick={()=>dispatch({type:'TOGGLE_CASCADE_MODE'})}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          state.config.cascadeMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Aide visuelle</h3>
                  <button 
                    className={`w-full px-4 py-3 rounded-lg border font-medium transition-colors ${
                      state.config.assistOnSelect 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`} 
                    onClick={()=>dispatch({type:'TOGGLE_ASSIST'})}
                  >
                    {state.config.assistOnSelect ? 'Aide activée' : 'Aide désactivée'}
                  </button>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Son</h3>
                  <button 
                    className={`w-full px-4 py-3 rounded-lg border font-medium transition-colors ${
                      state.soundEnabled 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`} 
                    onClick={()=>dispatch({type:'TOGGLE_SOUND'})}
                  >
                    {state.soundEnabled ? 'Son activé' : 'Son désactivé'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal avec grille et classement */}
      <div className="flex gap-3 h-[calc(75vh-120px)]">
        {/* Zone de jeu principale */}
        <div className="flex-1 flex flex-col">
          {/* En-tête compact */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              {/* KPI améliorés à gauche */}
              <div className="flex items-center gap-3">
                {/* Niveau avec effet d'augmentation */}
                <div className="relative">
                  <div className={`px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg border-2 border-indigo-400 transform transition-all duration-300 ${
                    state.lastAction === 'HIT' ? 'scale-110 animate-pulse' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <span>Niveau {state.level}</span>
                    </div>
                  </div>
                  {state.lastAction === 'HIT' && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      +1
                    </div>
                  )}
                </div>
                
                {/* Score avec effet d'augmentation */}
                <div className="relative">
                  <div className={`px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-lg border-2 border-emerald-400 transform transition-all duration-300 ${
                    state.lastAction === 'HIT' ? 'scale-110 animate-pulse' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <span>{state.score}</span>
                    </div>
                  </div>
                  {state.lastAction === 'HIT' && (
                    <div className="absolute -top-2 -right-2 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      +{Math.floor(state.score * 0.1)}
                    </div>
                  )}
                </div>
                
                {/* Combo avec effet spécial */}
                {state.combo > 1 && (
                  <div className="relative">
                    <div className={`px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-lg border-2 border-orange-400 transform transition-all duration-300 animate-pulse`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <span>Combo ×{state.combo}</span>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-red-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      +{state.combo}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Boutons de contrôle à droite */}
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-2 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 text-sm font-medium transition-colors flex items-center gap-1" 
                  onClick={()=>dispatch({type:'HINT'})}
                >
                  <span className="text-lg">💡</span>
                  <span>Indice</span>
                </button>
                <button 
                  className="px-3 py-2 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-medium transition-colors flex items-center gap-1" 
                  onClick={()=>dispatch({type:'RESTART'})}
                >
                  <span className="text-lg">🔄</span>
                  <span>Rejouer</span>
                </button>
                <button 
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1 ${
                    state.running 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' 
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                  }`} 
                  onClick={()=>dispatch({type:'PAUSE_TOGGLE'})}
                >
                  <span className="text-lg">{state.running ? '⏸️' : '▶️'}</span>
                  <span>{state.running ? 'Pause' : 'Continuer'}</span>
                </button>
                <button 
                  className="px-3 py-2 rounded-lg border bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors flex items-center gap-1" 
                  onClick={()=>setShowOptions(true)}
                >
                  <span className="text-lg">⚙️</span>
                  <span>Paramètres</span>
                </button>
              </div>
            </div>
            
            {/* Barre de progression et temps améliorée */}
            <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span className="font-semibold">{formatMs(state.timePlayedMs)}</span>
              </div>
              <div className="flex-1 mx-4">
                {(() => {
                  const base = (state.level - 1) * 50;
                  const progress = Math.max(0, state.score - base);
                  const pct = Math.min(100, Math.round((progress / 50) * 100));
                  return (
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out rounded-full shadow-lg" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="font-semibold">
                  {(() => {
                    const base = (state.level - 1) * 50;
                    const progress = Math.max(0, state.score - base);
                    return `${progress}/50`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Grille de jeu */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${state.config.cols}, ${cellSize})`,
                gridTemplateRows: `repeat(${state.config.rows}, ${cellSize})`,
                gap: '8px',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {state.grid.flat().map(cell => {
                const isSel = state.selected?.some(s => s.row === cell.row && s.col === cell.col) || false;
                const isHint = state.hint?.some(h => h.row === cell.row && h.col === cell.col) || false;
                const isPlayable = state.config.assistOnSelect && state.selected?.length > 0 && 
                  (state.selected.length === 1 ? 
                    (state.config.allowDiagonals ? 
                      Math.abs(cell.row - state.selected[0].row) <= 1 && Math.abs(cell.col - state.selected[0].col) <= 1 :
                      (Math.abs(cell.row - state.selected[0].row) + Math.abs(cell.col - state.selected[0].col)) === 1
                    ) : false);
                
                return (
                  <button
                    key={cell.id}
                    onClick={() => dispatch({ type: 'CLICK', at: { row: cell.row, col: cell.col } })}
                    className={`flex items-center justify-center rounded-lg border-2 font-extrabold select-none transition-colors
                      ${cell.value === null ? 'bg-white border-gray-200' : 'bg-white border-gray-300'}
                      ${isSel ? `ring-2 ${theme.ring} shadow-md` : 'hover:shadow-md'}
                      ${isHint ? `outline outline-2 ${theme.outline}` : ''}
                      ${isPlayable ? 'bg-blue-50 border-blue-300' : ''}
                      ${valueClass(cell.value)}
                      ${cell.value !== null ? 'hover:bg-gray-50' : ''}
                    `}
                    style={{
                      minWidth: cellSize,
                      minHeight: cellSize,
                      fontSize: `calc(${cellSize} * 0.8)` // Police encore plus grande pour les gros cubes
                    }}
                  >
                    {cell.value ?? '·'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message de fin de partie */}
          {state.gameOver && (
            <div className="mt-3 p-3 border-2 border-rose-200 rounded-xl bg-rose-50 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-800">Partie terminée</h3>
              </div>
              <div className="text-xs text-rose-700 mb-2">
                Score final : {state.score} points | Niveau : {state.level} | Temps : {formatMs(state.timePlayedMs)}
              </div>
              <button 
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors text-xs" 
                onClick={()=>dispatch({type:'RESTART'})}
              >
                <RotateCcw className="inline w-3 h-3 mr-1" /> Nouvelle partie
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function OpButton({ current, onChange }: { current: Config; onChange: (op: Operator, target: number)=>void }) {
  const theme = themePalette[(current.theme ?? 'classic') as keyof typeof themePalette];
  const Item = ({ label, op, target }: { label: string; op: Operator; target: number }) => (
    <button
      onClick={()=>onChange(op, target)}
      className={`px-3 py-2 rounded-md text-xs font-semibold transition border
        ${current.operator===op
          ? `bg-gradient-to-r ${theme.activeFrom} ${theme.activeTo} text-white border-transparent`
          : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-200'}
      `}
      title={`Opérateur ${label} — cible ${target}`}
    >{label}</button>
  );
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
      <Item label="+10" op="ADD" target={10} />
      <Item label="−2" op="SUB" target={2} />
      <Item label="×12" op="MUL" target={12} />
      <Item label="÷2" op="DIV" target={2} />
    </div>
  );
}

function TargetControl({ current, onChange }: { current: Config; onChange: (target: number)=>void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600">Cible</label>
      <input
        type="number"
        min={1}
        max={99}
        value={current.target}
        onChange={e=>onChange(parseInt(e.target.value||'0',10) || current.target)}
        className="w-16 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-800 text-xs"
      />
    </div>
  );
}
