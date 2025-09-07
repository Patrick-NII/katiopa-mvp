"use client";
import React, { useEffect, useMemo, useReducer, useState, useCallback, useRef } from 'react';
import { Zap, X } from 'lucide-react';
import { cubematchAPI, CubeMatchScore, CubeMatchStats } from '../lib/api/cubematch';

/* ---------------------------
   Hooks viewport & vh réel
----------------------------*/
const useViewportSize = () => {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  
  return mounted ? size : { width: 1200, height: 800 };
};

const useLockViewport = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('resize', setVh);
    };
  }, []);
  
  return mounted;
};

// Mesure d’un élément (width/height)
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  
  return { ref, size: mounted ? size : { width: 0, height: 0 } };
}

/* ---------------------------
   Types
----------------------------*/
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
  paused: boolean;
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
  | { type: 'END_GAME' }
  | { type: 'RESUME' }
  | { type: 'TICK_TIME'; delta: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_MULTIPLE_PAIRS' }
  | { type: 'TOGGLE_TIMED_MODE' }
  | { type: 'TOGGLE_CASCADE_MODE' }
  | { type: 'CLEAR_ANIMATION' };

/* ---------------------------
   RNG amélioré : XorShift32
----------------------------*/
const rngNext = (seed: number) => {
  let x = seed || 2463534242; // non-zero
  x ^= (x << 13) >>> 0;
  x ^= (x >>> 17) >>> 0;
  x ^= (x << 5) >>> 0;
  const next = x >>> 0;
  const f = next / 0x100000000; // [0,1)
  return { next, f };
};
const pickInt = (seed: number, minIncl: number, maxIncl: number) => {
  const { next, f } = rngNext(seed);
  const span = maxIncl - minIncl + 1;
  const v = Math.floor(f * span) + minIncl;
  return { next, v };
};

/* ---------------------------
   Grille & defaults
----------------------------*/
const emptyGrid = (rows: number, cols: number, bornAt = 0): Cell[][] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: `${r}-${c}`, row: r, col: c, value: null, bornAt
    }))
  );

const defaultConfig: Config = {
  rows: 10, cols: 10,
  operator: 'ADD',
  target: 10,
  allowDiagonals: false,
  tickMs: 12000,
  spawnPerTick: [3, 5],
  maxSize: 9, // variété 1..9
  theme: 'classic',
  assistOnSelect: true,
  allowMultiplePairs: false,
  timedMode: false,
  cascadeMode: false,
};

const STORAGE_KEY = 'cubeMatch:v1';

// Fonction utilitaire pour nettoyer le localStorage et forcer 10x10
function forceResetTo10x10() {
  if (typeof window === 'undefined') return;
  
  // Supprimer la sauvegarde de jeu
  localStorage.removeItem(STORAGE_KEY);
  
  // Réinitialiser les préférences de taille
  try {
    const raw = localStorage.getItem('userSettings');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.cubematch) {
        data.cubematch.rows = 10;
        data.cubematch.cols = 10;
        localStorage.setItem('userSettings', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.log('Erreur lors de la réinitialisation des préférences:', e);
  }
  
  // Recharger la page
  window.location.reload();
}

// Exposer la fonction globalement pour debug (à retirer en production)
if (typeof window !== 'undefined') {
  (window as any).forceResetTo10x10 = forceResetTo10x10;
}

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
      maxSize: Math.max(9, Number(cm.maxSize ?? 9) || 9), // Migration automatique pour maxSize
      rows: Math.max(4, Math.min(10, Number(cm.rows ?? 10) || 10)), // Préférence de taille
      cols: Math.max(4, Math.min(10, Number(cm.cols ?? 10) || 10)), // Préférence de taille
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
    
    // Migration automatique : si maxSize < 9, le mettre à jour
    const savedConfig = data.config || {};
    if (savedConfig.maxSize && savedConfig.maxSize < 9) {
      savedConfig.maxSize = 9;
      // Mettre à jour le localStorage avec la nouvelle valeur
      const updatedData = { ...data, config: savedConfig };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    }
    
    // Migration automatique : si rows/cols > 10, les ramener à 10x10
    if (savedConfig.rows && savedConfig.rows > 10) {
      savedConfig.rows = 10;
    }
    if (savedConfig.cols && savedConfig.cols > 10) {
      savedConfig.cols = 10;
    }
    
    // Fusionner proprement avec defaultConfig en s'assurant que maxSize >= 9
    const mergedConfig = { 
      ...defaultConfig, 
      ...savedConfig,
      maxSize: Math.max(9, savedConfig.maxSize || defaultConfig.maxSize),
      rows: Math.max(4, Math.min(10, savedConfig.rows || defaultConfig.rows)),
      cols: Math.max(4, Math.min(10, savedConfig.cols || defaultConfig.cols))
    };
    
    return {
      grid: data.grid || emptyGrid(mergedConfig.rows, mergedConfig.cols),
      selected: data.selected || [],
      score: data.score || 0,
      combo: data.combo || 0,
      level: data.level || 1,
      config: mergedConfig,
      running: data.running !== undefined ? data.running : true,
      paused: data.paused || false,
      lastTick: data.lastTick || Date.now(),
      seed: data.seed || (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1,
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
    paused: state.paused,
    lastTick: state.lastTick,
    seed: state.seed,
    hint: state.hint,
    gameOver: state.gameOver,
    timePlayedMs: state.timePlayedMs,
    soundEnabled: state.soundEnabled,
    lastAction: state.lastAction,
  };
}

/* ---------------------------
   Thèmes
----------------------------*/
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

/* ---------------------------
   Reducer
----------------------------*/
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
        paused: false,
        lastTick: Date.now(),
        seed: (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1,
        hint: null,
        gameOver: false,
        timePlayedMs: 0,
        soundEnabled: true,
        lastAction: null,
      };
    }

    case 'TICK': {
      if (!state.running || state.gameOver) return state;

      // Vérifier si la grille est pleine (condition de fin de partie)
      const emptyCells = state.grid.flat().filter(cell => cell.value === null).length;
      if (emptyCells === 0) {
        console.log('🎯 Grille pleine - Fin de partie automatique');
        return { ...state, gameOver: true, running: false };
      }

      // Vérifier si aucun mouvement possible (grille bloquée)
      const hasValidMove = state.grid.some((row, rowIndex) => 
        row.some((cell, colIndex) => {
          if (cell.value === null) return false;
          const currentValue = cell.value;
          
          // Vérifier les cellules adjacentes
          const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // haut, bas, gauche, droite
          ];
          
          if (state.config.allowDiagonals) {
            directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]); // diagonales
          }
          
          return directions.some(([dr, dc]) => {
            const newRow = rowIndex + dr;
            const newCol = colIndex + dc;
            if (newRow < 0 || newRow >= state.config.rows || newCol < 0 || newCol >= state.config.cols) {
              return false;
            }
            const adjacentCell = state.grid[newRow][newCol];
            if (adjacentCell.value === null) return false;
            
            // Vérifier si la somme égale la cible
            const sum = currentValue + adjacentCell.value;
            return sum === state.config.target;
          });
        })
      );
      
      if (!hasValidMove && emptyCells < 5) {
        console.log('🚫 Aucun mouvement possible - Fin de partie automatique');
        return { ...state, gameOver: true, running: false };
      }

      let { seed } = state;
      const newGrid = state.grid.map(row => [...row]);

      const totalCells = state.config.rows * state.config.cols;
      const filled = newGrid.flat().filter(c => c.value !== null).length;
      const density = filled / totalCells;

      const { v: baseSpawn, next: s1 } = pickInt(seed, state.config.spawnPerTick[0], state.config.spawnPerTick[1]);
      seed = s1;
      let adjustedSpawn = baseSpawn + (density < 0.25 ? 2 : density > 0.75 ? -1 : 0);
      adjustedSpawn = Math.max(1, Math.min(adjustedSpawn, state.config.spawnPerTick[1] + 2));

      for (let i = 0; i < adjustedSpawn; i++) {
        const empties = newGrid.flat().filter(c => c.value === null);
        if (!empties.length) break;

        // Choisir une case vide “peu chargée” (anti-amas)
        let bestIdx = 0;
        let bestScore = Number.POSITIVE_INFINITY;
        for (let k = 0; k < Math.min(3, empties.length); k++) {
          const { v: idx, next: s2 } = pickInt(seed, 0, empties.length - 1);
          seed = s2;
          const c = empties[idx];
          let nearScore = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const rr = c.row + dr, cc = c.col + dc;
              if (rr >= 0 && rr < state.config.rows && cc >= 0 && cc < state.config.cols) {
                const av = newGrid[rr][cc].value;
                if (av != null) nearScore += 1;
              }
            }
          }
          if (nearScore < bestScore) { bestScore = nearScore; bestIdx = idx; }
        }
        const chosen = empties[bestIdx];

        // --- Valeur kids-friendly mais variée 1..maxSize (par défaut 9)
        const maxV = Math.max(3, state.config.maxSize);
        const { f: fVal, next: s3 } = rngNext(seed); seed = s3;
        let value: number;
        if (fVal < 0.5) {
          const { v, next } = pickInt(seed, 1, Math.min(3, maxV)); seed = next; value = v;          // 50% facile
        } else if (fVal < 0.85) {
          const lo = Math.min(4, maxV), hi = Math.min(6, maxV);
          const { v, next } = pickInt(seed, lo, hi); seed = next; value = v;                          // 35% moyen
        } else {
          const lo = Math.min(7, maxV);
          if (lo > maxV) { const { v, next } = pickInt(seed, 1, maxV); seed = next; value = v; }
          else { const { v, next } = pickInt(seed, lo, maxV); seed = next; value = v; }               // 15% avancé
        }

        // Évite |Δ|<=1 avec voisins si possible
        const adjacent: number[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = chosen.row + dr, cc = chosen.col + dc;
            if (rr >= 0 && rr < state.config.rows && cc >= 0 && cc < state.config.cols) {
              const v = newGrid[rr][cc].value;
              if (v != null) adjacent.push(v);
            }
          }
        }
        if (adjacent.some(v => Math.abs(v - value) <= 1)) {
          const candidates = Array.from({ length: state.config.maxSize }, (_, i) => i + 1)
            .filter(v => !adjacent.some(a => Math.abs(a - v) <= 1));
          if (candidates.length) {
            const { v: pick, next: s4 } = pickInt(seed, 0, candidates.length - 1);
            seed = s4;
            value = candidates[pick];
          }
        }

        newGrid[chosen.row][chosen.col] = { ...chosen, value, bornAt: action.now };
      }

      return { ...state, grid: newGrid, seed, lastTick: action.now };
    }

    case 'CLICK': {
      if (state.gameOver) return state;
      const cell = state.grid[action.at.row][action.at.col];
      if (cell.value === null) return state;

      const sel = [...state.selected];
      const idx = sel.findIndex(s => s.row === action.at.row && s.col === action.at.col);
      if (idx >= 0) sel.splice(idx, 1);
      else { if (sel.length >= 2) sel.shift(); sel.push(action.at); }

      if (sel.length === 2) {
        const [a, b] = sel;
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
          const ng = state.grid.map(r => [...r]);
          ng[a.row][a.col] = { ...ng[a.row][a.col], value: null };
          ng[b.row][b.col] = { ...ng[b.row][b.col], value: null };
          const points = Math.max(1, Math.floor((valA + valB) * (1 + state.combo * 0.1)));
          const combo = state.combo + 1;
          const score = state.score + points;
          const level = Math.floor(score / 50) + 1;
          return { ...state, grid: ng, selected: [], score, combo, level, hint: null, lastAction: 'HIT' };
        } else {
          return { ...state, selected: [], combo: 0, hint: null, lastAction: 'MISS' };
        }
      }
      return { ...state, selected: sel, hint: null };
    }

    case 'SET_OPERATOR':
      return { ...state, config: { ...state.config, operator: action.op, target: action.target }, selected: [], hint: null };

    case 'SET_SIZE':
      return { 
        ...state, 
        config: { 
          ...state.config, 
          rows: Math.max(4, Math.min(10, action.rows)), 
          cols: Math.max(4, Math.min(10, action.cols)) 
        }, 
        grid: emptyGrid(
          Math.max(4, Math.min(10, action.rows)), 
          Math.max(4, Math.min(10, action.cols))
        ), 
        selected: [], 
        hint: null 
      };

    case 'SET_TICK_MS':
      return { ...state, config: { ...state.config, tickMs: action.tickMs } };

    case 'SET_SPAWN':
      return { ...state, config: { ...state.config, spawnPerTick: [Math.max(1, action.min), Math.max(action.min, action.max)] } };

    case 'SET_MAXSIZE':
      return { 
        ...state, 
        config: { 
          ...state.config, 
          maxSize: Math.max(6, Math.min(20, action.max)) // Garde-fou entre 6 et 20
        } 
      };

    case 'SET_THEME':
      return { ...state, config: { ...state.config, theme: action.theme } };

    case 'TOGGLE_ASSIST':
      return { ...state, config: { ...state.config, assistOnSelect: !state.config.assistOnSelect } };

    case 'PAUSE_TOGGLE':
      return { ...state, paused: !state.paused, running: !state.paused };

    case 'TOGGLE_DIAG':
      return { ...state, config: { ...state.config, allowDiagonals: !state.config.allowDiagonals } };

    case 'HINT': {
      if (state.score < 15) return state;
      const empty = state.grid.flat().filter(c => c.value === null);
      if (!empty.length) return state;
      const { v: idx, next } = pickInt(state.seed, 0, empty.length - 1);
      const c = empty[idx];
      return { ...state, score: state.score - 15, hint: [{ row: c.row, col: c.col }], seed: next };
    }

    case 'LEVEL_UP':
      return { ...state, level: state.level + 1 };

    case 'RESTART':
      return reducer({ ...state, gameOver: false }, { type: 'INIT', payload: state.config });

    case 'END_GAME':
      return { ...state, gameOver: true, running: false };

    case 'RESUME':
      return { ...state, paused: false, running: true };

    case 'TICK_TIME':
      return { ...state, timePlayedMs: state.timePlayedMs + action.delta };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'TOGGLE_MULTIPLE_PAIRS':
      return { ...state, config: { ...state.config, allowMultiplePairs: !state.config.allowMultiplePairs } };

    case 'TOGGLE_TIMED_MODE':
      return { ...state, config: { ...state.config, timedMode: !state.config.timedMode } };

    case 'TOGGLE_CASCADE_MODE':
      return { ...state, config: { ...state.config, cascadeMode: !state.config.cascadeMode } };

    case 'CLEAR_ANIMATION':
      return { ...state, lastAction: null };

    default:
      return state;
  }
}

/* ---------------------------
   Composant principal
----------------------------*/
export default function CubeMatch() {
  useLockViewport();
  useViewportSize(); // garde à jour --vh même si on n’en a pas besoin ici directement

  const [showOptions, setShowOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [topScores, setTopScores] = useState<CubeMatchScore[]>([]);
  const [stats, setStats] = useState<CubeMatchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingScores, setStreamingScores] = useState<CubeMatchScore[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastVisibility = useRef<'visible'|'hidden'>('visible');

  const [state, dispatch] = useReducer(reducer, undefined as any, () => {
    // Vérifier si on est côté client avant d'accéder à localStorage
    if (typeof window === 'undefined') {
      const prefs = loadUserPrefs();
      const initial = reducer({} as any, { type: 'INIT', payload: prefs.cfg });
      (initial as any).soundEnabled = prefs.soundEnabled ?? true;
      return initial;
    }
    
    const saved = loadSaved();
    if (saved) return saved;
    const prefs = loadUserPrefs();
    const initial = reducer({} as any, { type: 'INIT', payload: prefs.cfg });
    (initial as any).soundEnabled = prefs.soundEnabled ?? true;
    return initial;
  });

  // Pause auto quand onglet masqué
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const onVis = () => {
      const vis = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      if (vis !== lastVisibility.current) {
        lastVisibility.current = vis;
        if (vis === 'hidden' && state.running) dispatch({ type: 'PAUSE_TOGGLE' });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [state.running, mounted]);

  // Streaming scores (optionnel)
  const streamScores = useCallback(async () => {
    setIsStreaming(true);
    try {
      const scores = await cubematchAPI.getTopScores(5);
      setStreamingScores(scores);
    } catch (error) {
      console.error('Erreur lors de la récupération des scores:', error);
      setStreamingScores([]);
    } finally {
      setIsStreaming(false);
    }
  }, []);
  useEffect(() => {
    streamScores();
    const id = setInterval(streamScores, 30000);
    return () => clearInterval(id);
  }, [streamScores]);

  // Charger scores + stats
  useEffect(() => {
    const loadScores = async () => {
      setLoading(true);
      try {
        const [scores, gameStats] = await Promise.all([
          cubematchAPI.getTopScores(5),
          cubematchAPI.getStats()
        ]);
        setTopScores(scores);
        setStats(gameStats);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setTopScores([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    if (showLeaderboard) loadScores();
  }, [showLeaderboard]);

  // Save score quand gameOver
  useEffect(() => {
    if (state.gameOver && state.score > 0) {
      const saveScore = async () => {
        try {
          console.log('🎮 Sauvegarde du score CubeMatch:', {
            score: state.score,
            level: state.level,
            timePlayedMs: state.timePlayedMs,
            operator: state.config.operator,
            target: state.config.target,
            allowDiagonals: state.config.allowDiagonals
          });
          
          const success = await cubematchAPI.saveScore({
            score: state.score,
            level: state.level,
            timePlayedMs: state.timePlayedMs,
            operator: state.config.operator,
            target: state.config.target,
            allowDiagonals: state.config.allowDiagonals,
            comboMax: state.combo,
            cellsCleared: 0, // À calculer si nécessaire
            hintsUsed: 0, // À calculer si nécessaire
            gameDurationSeconds: Math.floor(state.timePlayedMs / 1000),
            gridSizeRows: state.config.rows,
            gridSizeCols: state.config.cols,
            maxSize: state.config.maxSize,
            spawnRateMin: state.config.spawnPerTick[0],
            spawnRateMax: state.config.spawnPerTick[1],
            tickMs: state.config.tickMs,
            gameMode: 'classic',
            difficultyLevel: state.level > 5 ? 'hard' : state.level > 3 ? 'normal' : 'easy',
            totalMoves: 0, // À calculer si nécessaire
            successfulMoves: 0, // À calculer si nécessaire
            failedMoves: 0, // À calculer si nécessaire
            accuracyRate: 0, // À calculer si nécessaire
            averageMoveTimeMs: 0, // À calculer si nécessaire
            fastestMoveTimeMs: 0, // À calculer si nécessaire
            slowestMoveTimeMs: 0, // À calculer si nécessaire
            additionsCount: state.config.operator === 'ADD' ? 1 : 0,
            subtractionsCount: state.config.operator === 'SUB' ? 1 : 0,
            multiplicationsCount: state.config.operator === 'MUL' ? 1 : 0,
            divisionsCount: state.config.operator === 'DIV' ? 1 : 0,
            additionsScore: state.config.operator === 'ADD' ? state.score : 0,
            subtractionsScore: state.config.operator === 'SUB' ? state.score : 0,
            multiplicationsScore: state.config.operator === 'MUL' ? state.score : 0,
            divisionsScore: state.config.operator === 'DIV' ? state.score : 0,
            gridCompletionRate: 0, // À calculer si nécessaire
            maxConsecutiveHits: state.combo,
            maxConsecutiveMisses: 0, // À calculer si nécessaire
            longestComboChain: state.combo,
            targetNumbersUsed: JSON.stringify([state.config.target]),
            operatorSequence: JSON.stringify([state.config.operator]),
            timeSpentOnAdditionsMs: state.config.operator === 'ADD' ? state.timePlayedMs : 0,
            timeSpentOnSubtractionsMs: state.config.operator === 'SUB' ? state.timePlayedMs : 0,
            timeSpentOnMultiplicationsMs: state.config.operator === 'MUL' ? state.timePlayedMs : 0,
            timeSpentOnDivisionsMs: state.config.operator === 'DIV' ? state.timePlayedMs : 0,
            sessionStartTime: new Date(Date.now() - state.timePlayedMs).toISOString(),
            sessionEndTime: new Date().toISOString(),
            breaksTaken: 0, // À calculer si nécessaire
            totalBreakTimeMs: 0, // À calculer si nécessaire
            engagementScore: Math.min(100, Math.max(0, (state.score / state.level) * 10)), // Score d'engagement basé sur score/niveau
            focusTimePercentage: 95, // Estimation haute pour un jeu engageant
            difficultyAdjustments: 0, // À calculer si nécessaire
            themeUsed: state.config.theme || 'classic',
            soundEnabled: state.soundEnabled,
            assistEnabled: state.config.assistOnSelect || false,
            hintsEnabled: true // Toujours disponible
          });
          
          if (success) {
            console.log('✅ Score sauvegardé avec succès');
          } else {
            console.error('❌ Échec de la sauvegarde du score');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde:', error);
        }
      };
      saveScore();
    }
  }, [state.gameOver, state.score, state.level, state.timePlayedMs, state.config, state.combo]);

  // Sauvegarde périodique des scores (toutes les 30 secondes)
  useEffect(() => {
    if (!state.running || state.gameOver || state.score === 0) return;
    
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Sauvegarde périodique du score:', state.score);
        await cubematchAPI.saveScore({
          score: state.score,
          level: state.level,
          timePlayedMs: state.timePlayedMs,
          operator: state.config.operator,
          target: state.config.target,
          allowDiagonals: state.config.allowDiagonals,
          comboMax: state.combo,
          cellsCleared: 0,
          hintsUsed: 0,
          gameDurationSeconds: Math.floor(state.timePlayedMs / 1000),
          gridSizeRows: state.config.rows,
          gridSizeCols: state.config.cols,
          maxSize: state.config.maxSize,
          spawnRateMin: state.config.spawnPerTick[0],
          spawnRateMax: state.config.spawnPerTick[1],
          tickMs: state.config.tickMs,
          gameMode: 'classic',
          difficultyLevel: state.level > 5 ? 'hard' : state.level > 3 ? 'normal' : 'easy',
          totalMoves: 0,
          successfulMoves: 0,
          failedMoves: 0,
          accuracyRate: 0,
          averageMoveTimeMs: 0,
          fastestMoveTimeMs: 0,
          slowestMoveTimeMs: 0,
          additionsCount: state.config.operator === 'ADD' ? 1 : 0,
          subtractionsCount: state.config.operator === 'SUB' ? 1 : 0,
          multiplicationsCount: state.config.operator === 'MUL' ? 1 : 0,
          divisionsCount: state.config.operator === 'DIV' ? 1 : 0,
          additionsScore: state.config.operator === 'ADD' ? state.score : 0,
          subtractionsScore: state.config.operator === 'SUB' ? state.score : 0,
          multiplicationsScore: state.config.operator === 'MUL' ? state.score : 0,
          divisionsScore: state.config.operator === 'DIV' ? state.score : 0,
          gridCompletionRate: 0,
          maxConsecutiveHits: state.combo,
          maxConsecutiveMisses: 0,
          longestComboChain: state.combo,
          targetNumbersUsed: JSON.stringify([state.config.target]),
          operatorSequence: JSON.stringify([state.config.operator]),
          timeSpentOnAdditionsMs: state.config.operator === 'ADD' ? state.timePlayedMs : 0,
          timeSpentOnSubtractionsMs: state.config.operator === 'SUB' ? state.timePlayedMs : 0,
          timeSpentOnMultiplicationsMs: state.config.operator === 'MUL' ? state.timePlayedMs : 0,
          timeSpentOnDivisionsMs: state.config.operator === 'DIV' ? state.timePlayedMs : 0,
          sessionStartTime: new Date(Date.now() - state.timePlayedMs).toISOString(),
          sessionEndTime: new Date().toISOString(),
          breaksTaken: 0,
          totalBreakTimeMs: 0,
          engagementScore: Math.min(100, Math.max(0, (state.score / state.level) * 10)),
          focusTimePercentage: 95,
          difficultyAdjustments: 0,
          themeUsed: state.config.theme || 'classic',
          soundEnabled: state.soundEnabled,
          assistEnabled: state.config.assistOnSelect || false,
          hintsEnabled: true
        });
      } catch (error) {
        console.error('❌ Erreur sauvegarde périodique:', error);
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [state.running, state.gameOver, state.score, state.level, state.timePlayedMs, state.config, state.combo]);

  // Fin de partie automatique en quittant la page
  useEffect(() => {
    if (!state.running || state.gameOver || state.score === 0) return;

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Sauvegarder le score avant de quitter
      try {
        console.log('🚪 Sauvegarde avant fermeture de la page:', state.score);
        await cubematchAPI.saveScore({
          score: state.score,
          level: state.level,
          timePlayedMs: state.timePlayedMs,
          operator: state.config.operator,
          target: state.config.target,
          allowDiagonals: state.config.allowDiagonals,
          comboMax: state.combo,
          cellsCleared: 0,
          hintsUsed: 0,
          gameDurationSeconds: Math.floor(state.timePlayedMs / 1000),
          gridSizeRows: state.config.rows,
          gridSizeCols: state.config.cols,
          maxSize: state.config.maxSize,
          spawnRateMin: state.config.spawnPerTick[0],
          spawnRateMax: state.config.spawnPerTick[1],
          tickMs: state.config.tickMs,
          gameMode: 'classic',
          difficultyLevel: state.level > 5 ? 'hard' : state.level > 3 ? 'normal' : 'easy',
          totalMoves: 0,
          successfulMoves: 0,
          failedMoves: 0,
          accuracyRate: 0,
          averageMoveTimeMs: 0,
          fastestMoveTimeMs: 0,
          slowestMoveTimeMs: 0,
          additionsCount: state.config.operator === 'ADD' ? 1 : 0,
          subtractionsCount: state.config.operator === 'SUB' ? 1 : 0,
          multiplicationsCount: state.config.operator === 'MUL' ? 1 : 0,
          divisionsCount: state.config.operator === 'DIV' ? 1 : 0,
          additionsScore: state.config.operator === 'ADD' ? state.score : 0,
          subtractionsScore: state.config.operator === 'SUB' ? state.score : 0,
          multiplicationsScore: state.config.operator === 'MUL' ? state.score : 0,
          divisionsScore: state.config.operator === 'DIV' ? state.score : 0,
          gridCompletionRate: 0,
          maxConsecutiveHits: state.combo,
          maxConsecutiveMisses: 0,
          longestComboChain: state.combo,
          targetNumbersUsed: JSON.stringify([state.config.target]),
          operatorSequence: JSON.stringify([state.config.operator]),
          timeSpentOnAdditionsMs: state.config.operator === 'ADD' ? state.timePlayedMs : 0,
          timeSpentOnSubtractionsMs: state.config.operator === 'SUB' ? state.timePlayedMs : 0,
          timeSpentOnMultiplicationsMs: state.config.operator === 'MUL' ? state.timePlayedMs : 0,
          timeSpentOnDivisionsMs: state.config.operator === 'DIV' ? state.timePlayedMs : 0,
          sessionStartTime: new Date(Date.now() - state.timePlayedMs).toISOString(),
          sessionEndTime: new Date().toISOString(),
          breaksTaken: 0,
          totalBreakTimeMs: 0,
          engagementScore: Math.min(100, Math.max(0, (state.score / state.level) * 10)),
          focusTimePercentage: 95,
          difficultyAdjustments: 0,
          themeUsed: state.config.theme || 'classic',
          soundEnabled: state.soundEnabled,
          assistEnabled: state.config.assistOnSelect || false,
          hintsEnabled: true
        });
      } catch (error) {
        console.error('❌ Erreur sauvegarde avant fermeture:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden && state.running && !state.gameOver && state.score > 0) {
        // Sauvegarder quand la page devient cachée (changement d'onglet, etc.)
        try {
          console.log('👁️ Sauvegarde lors du changement de visibilité:', state.score);
          await cubematchAPI.saveScore({
            score: state.score,
            level: state.level,
            timePlayedMs: state.timePlayedMs,
            operator: state.config.operator,
            target: state.config.target,
            allowDiagonals: state.config.allowDiagonals,
            comboMax: state.combo,
            cellsCleared: 0,
            hintsUsed: 0,
            gameDurationSeconds: Math.floor(state.timePlayedMs / 1000),
            gridSizeRows: state.config.rows,
            gridSizeCols: state.config.cols,
            maxSize: state.config.maxSize,
            spawnRateMin: state.config.spawnPerTick[0],
            spawnRateMax: state.config.spawnPerTick[1],
            tickMs: state.config.tickMs,
            gameMode: 'classic',
            difficultyLevel: state.level > 5 ? 'hard' : state.level > 3 ? 'normal' : 'easy',
            totalMoves: 0,
            successfulMoves: 0,
            failedMoves: 0,
            accuracyRate: 0,
            averageMoveTimeMs: 0,
            fastestMoveTimeMs: 0,
            slowestMoveTimeMs: 0,
            additionsCount: state.config.operator === 'ADD' ? 1 : 0,
            subtractionsCount: state.config.operator === 'SUB' ? 1 : 0,
            multiplicationsCount: state.config.operator === 'MUL' ? 1 : 0,
            divisionsCount: state.config.operator === 'DIV' ? 1 : 0,
            additionsScore: state.config.operator === 'ADD' ? state.score : 0,
            subtractionsScore: state.config.operator === 'SUB' ? state.score : 0,
            multiplicationsScore: state.config.operator === 'MUL' ? state.score : 0,
            divisionsScore: state.config.operator === 'DIV' ? state.score : 0,
            gridCompletionRate: 0,
            maxConsecutiveHits: state.combo,
            maxConsecutiveMisses: 0,
            longestComboChain: state.combo,
            targetNumbersUsed: JSON.stringify([state.config.target]),
            operatorSequence: JSON.stringify([state.config.operator]),
            timeSpentOnAdditionsMs: state.config.operator === 'ADD' ? state.timePlayedMs : 0,
            timeSpentOnSubtractionsMs: state.config.operator === 'SUB' ? state.timePlayedMs : 0,
            timeSpentOnMultiplicationsMs: state.config.operator === 'MUL' ? state.timePlayedMs : 0,
            timeSpentOnDivisionsMs: state.config.operator === 'DIV' ? state.timePlayedMs : 0,
            sessionStartTime: new Date(Date.now() - state.timePlayedMs).toISOString(),
            sessionEndTime: new Date().toISOString(),
            breaksTaken: 0,
            totalBreakTimeMs: 0,
            engagementScore: Math.min(100, Math.max(0, (state.score / state.level) * 10)),
            focusTimePercentage: 95,
            difficultyAdjustments: 0,
            themeUsed: state.config.theme || 'classic',
            soundEnabled: state.soundEnabled,
            assistEnabled: state.config.assistOnSelect || false,
            hintsEnabled: true
          });
        } catch (error) {
          console.error('❌ Erreur sauvegarde changement visibilité:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.running, state.gameOver, state.score, state.level, state.timePlayedMs, state.config, state.combo]);

  // Fin de partie automatique après 10 minutes (600 secondes)
  useEffect(() => {
    if (!state.running || state.gameOver || state.paused) return;
    
    const maxGameTime = 10 * 60 * 1000; // 10 minutes en millisecondes
    const timeRemaining = maxGameTime - state.timePlayedMs;
    
    if (timeRemaining <= 0) {
      console.log('⏰ Temps de jeu maximum atteint - Fin de partie automatique');
      dispatch({ type: 'END_GAME' });
      return;
    }
    
    // Avertir 1 minute avant la fin
    if (timeRemaining <= 60000 && timeRemaining > 59000) {
      console.log('⚠️ Attention: Fin de partie dans 1 minute !');
    }
    
    const timer = setTimeout(() => {
      if (state.running && !state.gameOver && !state.paused) {
        console.log('⏰ Temps de jeu maximum atteint - Fin de partie automatique');
        dispatch({ type: 'END_GAME' });
      }
    }, timeRemaining);
    
    return () => clearTimeout(timer);
  }, [state.running, state.gameOver, state.paused, state.timePlayedMs]);

  // Tick principal (apparitions)
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), state.config.tickMs);
    return () => clearInterval(id);
  }, [state.running, state.config.tickMs]);

  // Tick temps joué
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK_TIME', delta: 1000 }), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-save
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectForSave(state)));
      }
    } catch {}
  }, [state]);

  // SFX hit
  useEffect(() => {
    if (!state.soundEnabled || state.lastAction !== 'HIT') return;
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

  /* === Layout 2 colonnes, 0 scroll page === */
  if (!mounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec informations de jeu et boutons */}
      <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard/mathcube'}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-gray-900">CubeMatch</h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              Niveau {state.level}
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              Score {state.score.toLocaleString()}
            </div>
            {state.combo > 1 && (
              <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                Combo ×{state.combo}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {formatMs(state.timePlayedMs)}
          </div>
          <button 
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-all duration-200"
            onClick={() => dispatch({ type: 'HINT' })}
          >
            💡 Indice
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-200"
            onClick={() => dispatch({ type: 'RESTART' })}
          >
            🔄 Rejouer
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              !state.paused 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            onClick={() => dispatch({ type: 'PAUSE_TOGGLE' })}
          >
            {!state.paused ? '⏸️ Pause' : '▶️ Continuer'}
          </button>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200"
            onClick={() => dispatch({ type: 'END_GAME' })}
          >
            ⏹️ Stop
          </button>
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
            onClick={() => setShowOptions(true)}
          >
            ⚙️ Paramètres
          </button>
        </div>
      </div>

      {/* Zone de jeu principale - responsive */}
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-4 lg:p-6 min-h-0">
          <GameArea state={state} dispatch={dispatch} />
        </div>
        
        {/* Panneau latéral - responsive */}
        <div className="w-full lg:w-80 bg-white/90 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-200 p-4 lg:p-6 flex flex-col lg:h-full">
          <SidePanel
            state={state}
            dispatch={dispatch}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
          />
        </div>
      </div>

      {/* Modal Paramètres */}
      {showOptions && (
        <OptionsModal state={state} dispatch={dispatch} onClose={() => setShowOptions(false)} />
      )}
    </div>
  );
}

/* ================== Game Area ================== */
function GameArea({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const theme = themePalette[(state.config.theme ?? 'classic') as keyof typeof themePalette];
  const { ref: frameRef, size: frame } = useElementSize<HTMLDivElement>();
  const gap = window.innerWidth < 768 ? 4 : 8; // Espacement réduit sur mobile
  const cols = state.config.cols;
  const rows = state.config.rows;

  const cellSizePx = useMemo(() => {
    if (!frame.width || !frame.height) return 56;
    const wForCells = frame.width - gap * (cols - 1);
    const hForCells = frame.height - gap * (rows - 1);
    const byW = Math.floor(wForCells / cols);
    const byH = Math.floor(hForCells / rows);
    // Responsive sizing basé sur la taille de l'écran
    const maxSize = window.innerWidth < 768 ? 45 : window.innerWidth < 1024 ? 60 : 80;
    const minSize = window.innerWidth < 768 ? 28 : window.innerWidth < 1024 ? 36 : 48;
    return Math.max(minSize, Math.min(maxSize, Math.min(byW, byH)));
  }, [frame, cols, rows]);

  const fontPx = Math.floor(cellSizePx * 0.55);
  const valueClass = (v: number | null) => {
    if (v == null) return 'text-gray-300';
    if (v <= 2) return 'text-sky-700';
    if (v <= 4) return 'text-emerald-700';
    if (v <= 6) return 'text-amber-700';
    if (v <= 8) return 'text-orange-700';
    return 'text-rose-700';
  };

  return (
    <div className="flex items-center justify-center h-full w-full">
      {/* Grille de jeu avec design épuré et responsive */}
      <div ref={frameRef} className="bg-white rounded-2xl p-4 lg:p-8 shadow-lg border border-gray-200 max-w-full max-h-full">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSizePx}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSizePx}px)`,
            gap,
          }}
        >
          {state.grid.flat().map(cell => {
            const isSel = state.selected?.some(s => s.row === cell.row && s.col === cell.col) || false;
            const isHint = state.hint?.some(h => h.row === cell.row && h.col === cell.col) || false;
            const isPlayable =
              state.config.assistOnSelect &&
              state.selected?.length > 0 &&
              (state.selected.length === 1
                ? (state.config.allowDiagonals
                    ? Math.abs(cell.row - state.selected[0].row) <= 1 && Math.abs(cell.col - state.selected[0].col) <= 1
                    : (Math.abs(cell.row - state.selected[0].row) + Math.abs(cell.col - state.selected[0].col)) === 1)
                : false);

            return (
              <button
                key={cell.id}
                onClick={() => dispatch({ type: 'CLICK', at: { row: cell.row, col: cell.col } })}
                className={`flex items-center justify-center rounded-lg font-bold transition-all duration-200 touch-manipulation
                  ${isSel ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-gray-100 hover:bg-gray-200'}
                  ${isHint ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                  ${isPlayable ? 'bg-blue-50 border-2 border-blue-300' : ''}
                  ${valueClass(cell.value)}
                `}
                style={{ 
                  width: cellSizePx, 
                  height: cellSizePx, 
                  fontSize: fontPx, 
                  lineHeight: 1,
                  minWidth: cellSizePx,
                  minHeight: cellSizePx
                }}
              >
                {cell.value ?? '·'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fin de partie - overlay élégant */}
      {state.gameOver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Partie terminée !</h2>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{state.score}</div>
              <div className="text-gray-600">Score final • Niveau {state.level}</div>
            </div>
            <button
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              onClick={() => dispatch({ type: 'RESTART' })}
            >
              Nouvelle partie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== Side Panel ================== */
function SidePanel(props: {
  state: State;
  dispatch: React.Dispatch<Action>;
  showOptions: boolean;
  setShowOptions: (v: boolean)=>void;
}) {
  const { state, dispatch, setShowOptions } = props;
  return (
    <div className="flex flex-col h-full">
      {/* Barre de progression */}
      <div className="mb-6">
        <ProgressBar state={state} />
      </div>
      
      {/* Instructions rapides */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Comment jouer</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• Sélectionnez des cases adjacentes</div>
          <div>• Formez des calculs avec l'opérateur</div>
          <div>• Atteignez la cible pour marquer des points</div>
        </div>
      </div>
      
      {/* Statistiques détaillées */}
      <div className="flex-1 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistiques</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Temps de jeu:</span>
            <span className="font-medium">{formatMs(state.timePlayedMs)}</span>
          </div>
          <div className="flex justify-between">
            <span>Combo actuel:</span>
            <span className="font-medium">{state.combo}</span>
          </div>
          <div className="flex justify-between">
            <span>Opérateur:</span>
            <span className="font-medium">{state.config.operator}</span>
          </div>
          <div className="flex justify-between">
            <span>Cible:</span>
            <span className="font-medium">{state.config.target}</span>
          </div>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="font-medium">{state.config.allowDiagonals ? 'Diagonales' : 'Adjacentes'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== UI helpers ================== */
function HeaderKPI({ state }: { state: State }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">CubeMatch</h2>
      <div className="flex items-center justify-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg">
          Niveau {state.level}
        </div>
        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg">
          Score {state.score}
        </div>
        {state.combo > 1 && (
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm shadow-lg">
            Combo ×{state.combo}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ state }: { state: State }) {
  const base = (state.level - 1) * 50;
  const progress = Math.max(0, state.score - base);
  const pct = Math.min(100, Math.round((progress / 50) * 100));
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 text-center">Progression vers le niveau suivant</h3>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full" 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <div className="text-center">
        <span className="text-lg font-bold text-indigo-600">{progress}</span>
        <span className="text-sm text-gray-500"> / 50 points</span>
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

/* ================== Options Modal ================== */
function OptionsModal({ state, dispatch, onClose }:{ state: State; dispatch: React.Dispatch<Action>; onClose: ()=>void }) {
  const theme = themePalette[(state.config.theme ?? 'classic') as keyof typeof themePalette];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[calc(var(--vh)*90)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    const seconds = Math.max(5, Math.min(30, parseInt(e.target.value || '12', 10)));
                    dispatch({type: 'SET_TICK_MS', tickMs: seconds * 1000});
                  }}
                  className="w-20 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Temps entre chaque apparition de nouveaux nombres</p>
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
                      const min = Math.max(1, parseInt(e.target.value || '3', 10));
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
                      const max = Math.max(1, parseInt(e.target.value || '5', 10));
                      const min = Math.min(max, state.config.spawnPerTick[0]);
                      dispatch({type: 'SET_SPAWN', min: Math.min(min, max), max});
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Nombres qui apparaissent à chaque cycle</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Valeur maximale</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Max (6-20)</label>
                <input
                  type="number"
                  min={6}
                  max={20}
                  step={1}
                  value={state.config.maxSize}
                  onChange={e => {
                    const maxSize = Math.max(6, Math.min(20, parseInt(e.target.value || '9', 10)));
                    dispatch({type: 'SET_MAXSIZE', max: maxSize});
                  }}
                  className="w-20 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Valeur maximale des nombres générés (1 à {state.config.maxSize})</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Taille de la grille</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Lignes</label>
                  <input
                    type="number"
                    min={4}
                    max={10}
                    step={1}
                    value={state.config.rows}
                    onChange={e => {
                      const rows = Math.max(4, Math.min(10, parseInt(e.target.value || '10', 10)));
                      dispatch({type: 'SET_SIZE', rows, cols: state.config.cols});
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Colonnes</label>
                  <input
                    type="number"
                    min={4}
                    max={10}
                    step={1}
                    value={state.config.cols}
                    onChange={e => {
                      const cols = Math.max(4, Math.min(10, parseInt(e.target.value || '10', 10)));
                      dispatch({type: 'SET_SIZE', rows: state.config.rows, cols});
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Taille de la grille de jeu ({state.config.rows}×{state.config.cols})</p>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Règles de jeu</h3>
              <div className="space-y-3">
                <ToggleRow
                  title="Adjacence"
                  desc="Orthogonal (désactivé) ou orthogonal + diagonales (activé)"
                  on={state.config.allowDiagonals}
                  onToggle={()=>dispatch({type:'TOGGLE_DIAG'})}
                  onLabel="Diag + ortho"
                  offLabel="Ortho"
                />
                <ToggleRow
                  title="Combinaisons multiples"
                  desc="Permettre plusieurs paires simultanées"
                  on={state.config.allowMultiplePairs ?? false}
                  onToggle={()=>dispatch({type:'TOGGLE_MULTIPLE_PAIRS'})}
                />
                <ToggleRow
                  title="Mode chronométré"
                  desc="Limiter le temps pour chaque combinaison"
                  on={state.config.timedMode ?? false}
                  onToggle={()=>dispatch({type:'TOGGLE_TIMED_MODE'})}
                />
                <ToggleRow
                  title="Mode cascade"
                  desc="Les nombres tombent après élimination"
                  on={state.config.cascadeMode ?? false}
                  onToggle={()=>dispatch({type:'TOGGLE_CASCADE_MODE'})}
                />
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
  );
}

/* ================== Contrôles Paramètres ================== */
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
    <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
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
        onChange={e=>onChange(Math.max(1, Math.min(99, parseInt(e.target.value||'0',10) || current.target)))}
        className="w-16 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-800 text-xs"
      />
    </div>
  );
}

function ToggleRow({ title, desc, on, onToggle, onLabel, offLabel }: { title: string; desc: string; on: boolean; onToggle: ()=>void; onLabel?: string; offLabel?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
      <div className="mr-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600">{desc}</p>
      </div>
      <button
        className={`w-28 h-8 rounded-full transition-colors text-[11px] font-semibold ${
          on ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-800'
        }`}
        onClick={onToggle}
      >
        {on ? (onLabel || 'Activé') : (offLabel || 'Désactivé')}
      </button>
    </div>
  );
}