"use client";
import React, { useEffect, useMemo, useReducer, useState } from 'react';

type Operator = 'ADD' | 'SUB' | 'MUL' | 'DIV';
type Cell = { id: string; row: number; col: number; value: number | null; bornAt: number };
type Coords = { row: number; col: number };

type Config = {
  rows: number;
  cols: number;
  operator: Operator;
  target: number;              // ex: 10 pour ADD, 2 pour DIV, etc.
  allowDiagonals: boolean;     // adjacence 4 ou 8
  tickMs: number;              // vitesse de remplissage au niveau courant
  spawnPerTick: [number, number]; // min,max cellules à remplir
  maxSize: number;             // limite de la grille
  theme?: 'classic' | 'ocean' | 'sunset' | 'forest';
  assistOnSelect?: boolean;    // surligner voisins jouables après 1er clic
};

type State = {
  grid: Cell[][];
  selected: Coords[];          // 0..2 éléments
  score: number;
  combo: number;
  level: number;
  config: Config;
  running: boolean;
  lastTick: number;
  seed: number;                // pour random local
  hint: Coords[] | null;
  gameOver: boolean;
  // Améliorations
  timePlayedMs: number;        // temps total joué
  soundEnabled: boolean;       // sons activés/désactivés
  lastAction: 'HIT' | 'MISS' | null; // pour feedback audio visuel
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
  | { type: 'TOGGLE_SOUND' };

const rand = (seed: number) => {
  // LCG deterministic
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
  rows: 6, cols: 6,
  operator: 'ADD',
  target: 10,
  allowDiagonals: false,
  tickMs: 6000,
  spawnPerTick: [1, 3],
  maxSize: 9,
  theme: 'classic',
  assistOnSelect: true,
};

const STORAGE_KEY = 'cubeMatch:v1';

// Palette de thèmes (classes Tailwind explicitement listées pour JIT)
const themePalette = {
  classic: {
    headerFrom: 'from-indigo-600', headerTo: 'to-fuchsia-600',
    activeFrom: 'from-indigo-600', activeTo: 'to-fuchsia-600',
    ring: 'ring-indigo-500', outline: 'outline-amber-400',
  },
  ocean: {
    headerFrom: 'from-cyan-600', headerTo: 'to-blue-600',
    activeFrom: 'from-cyan-600', activeTo: 'to-blue-600',
    ring: 'ring-sky-500', outline: 'outline-emerald-400',
  },
  sunset: {
    headerFrom: 'from-orange-500', headerTo: 'to-pink-600',
    activeFrom: 'from-orange-500', activeTo: 'to-pink-600',
    ring: 'ring-rose-500', outline: 'outline-amber-400',
  },
  forest: {
    headerFrom: 'from-emerald-600', headerTo: 'to-lime-600',
    activeFrom: 'from-emerald-600', activeTo: 'to-lime-600',
    ring: 'ring-emerald-500', outline: 'outline-lime-400',
  },
} as const;

function loadSaved(): State | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.grid)) return null;
    // reconstruire la grille de manière sûre
    const rows = data.grid.length;
    const cols = rows ? data.grid[0].length : 0;
    const grid: Cell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const cell = data.grid[r][c];
        return {
          id: `${r}-${c}`,
          row: r,
          col: c,
          value: (cell?.value ?? null) as number | null,
          bornAt: Number(cell?.bornAt ?? 0)
        } as Cell;
      })
    );
    const state: State = {
      grid,
      selected: [],
      score: Number(data.score ?? 0),
      combo: Number(data.combo ?? 0),
      level: Number(data.level ?? 1),
      config: {
        ...defaultConfig,
        ...(data.config ?? {}),
      } as Config,
      running: Boolean(data.running ?? true),
      lastTick: Number(data.lastTick ?? Date.now()),
      seed: Number(data.seed ?? Math.floor(Math.random() * 2 ** 31)),
      hint: null,
      gameOver: Boolean(data.gameOver ?? false),
      timePlayedMs: Number(data.timePlayedMs ?? 0),
      soundEnabled: Boolean(data.soundEnabled ?? true),
      lastAction: null,
    };
    return state;
  } catch {}
  return null;
}

function projectForSave(state: State) {
  // Ne pas sauvegarder les sélections/hints transitoires
  return {
    grid: state.grid.map(row => row.map(c => ({ value: c.value, bornAt: c.bornAt }))),
    score: state.score,
    combo: state.combo,
    level: state.level,
    config: state.config,
    running: state.running,
    lastTick: state.lastTick,
    seed: state.seed,
    gameOver: state.gameOver,
    timePlayedMs: state.timePlayedMs,
    soundEnabled: state.soundEnabled,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT': {
      const cfg = { ...defaultConfig, ...(action.payload || {}) };
      return {
        grid: emptyGrid(cfg.rows, cfg.cols),
        selected: [],
        score: 0,
        combo: 0,
        level: 1,
        config: cfg,
        running: true,
        lastTick: Date.now(),
        seed: Math.floor(Math.random() * 2 ** 31),
        hint: null,
        gameOver: false,
        timePlayedMs: 0,
        soundEnabled: true,
        lastAction: null,
      } as State;
    }

    case 'TICK': {
      if (!state.running || state.gameOver) return state;
      // remplir quelques cases vides
      const now = action.now;
      let { seed } = state;
      const flat = state.grid.flat();
      const empties = flat.filter(c => c.value === null);
      if (empties.length === 0) {
        // plus de place : si aucun coup possible -> Game Over
        const any = findAnyMatch(state);
        if (!any) return { ...state, running: false, gameOver: true } as State;
        return state;
      }
      const nMin = state.config.spawnPerTick[0];
      const nMax = state.config.spawnPerTick[1];
      // combien à spawn
      ({ next: seed } = rand(seed));
      const toSpawn = Math.min(
        empties.length,
        nMin + Math.floor(rand(seed).r01 * (nMax - nMin + 1))
      );

      // choisir des positions vides aléatoires et leur donner des valeurs 1..9
      const chosen: Cell[] = [];
      let pool = [...empties];
      for (let i = 0; i < toSpawn && pool.length; i++) {
        ({ next: seed } = rand(seed));
        const idx = Math.floor(rand(seed).r01 * pool.length);
        const cell = pool.splice(idx, 1)[0];
        ({ next: seed } = rand(seed));
        const val = 1 + Math.floor(rand(seed).r01 * 9);
        chosen.push({ ...cell, value: val, bornAt: now });
      }

      // reconstruire la grille
      const map = new Map(chosen.map(c => [c.id, c]));
      const newGrid = state.grid.map(row =>
        row.map(c => (map.has(c.id) ? (map.get(c.id) as Cell) : c))
      );

      // si plein et aucun coup → Game Over
      const full = newGrid.flat().every(c => c.value !== null);
      if (full && !findAnyMatch({ ...state, grid: newGrid } as State)) {
        return { ...state, grid: newGrid, running: false, gameOver: true, seed } as State;
      }

      return { ...state, grid: newGrid, lastTick: now, seed } as State;
    }

    case 'CLICK': {
      if (!state.running || state.gameOver) return state;
      const { row, col } = action.at;
      const cell = state.grid[row][col];
      if (cell.value === null) return state;

      let selected = [...state.selected];
      // toggle
      const exists = selected.find(s => s.row === row && s.col === col);
      if (exists) {
        selected = selected.filter(s => !(s.row === row && s.col === col));
        return { ...state, selected, hint: null } as State;
      }
      if (selected.length === 2) selected = []; // reset si déjà 2
      selected.push({ row, col });

      if (selected.length < 2) {
        // Assistance visuelle: surligner voisins jouables
        let hint: Coords[] | null = null;
        if (state.config.assistOnSelect) {
          const neighbors: Coords[] = [];
          const dirs = state.config.allowDiagonals
            ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
            : [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dr, dc] of dirs) {
            const r2 = row + dr, c2 = col + dc;
            if (r2 < 0 || c2 < 0 || r2 >= state.grid.length || c2 >= state.grid[0].length) continue;
            const v2 = state.grid[r2][c2].value;
            if (v2 === null) continue;
            if (checkRule(cell.value!, v2, state.config.operator, state.config.target)) {
              neighbors.push({ row: r2, col: c2 });
            }
          }
          hint = neighbors.length ? neighbors : null;
        }
        return { ...state, selected, hint } as State;
      }

      // valider la paire
      const [a, b] = selected.map(s => state.grid[s.row][s.col]);
      if (!areAdjacent(a, b, state.config.allowDiagonals)) {
        // mauvaise adjacence
        return { ...state, selected: [], combo: 0, hint: null, lastAction: 'MISS' } as State;
      }

      const ok = checkRule(a.value!, b.value!, state.config.operator, state.config.target);
      if (!ok) {
        return { ...state, selected: [], combo: 0, hint: null, lastAction: 'MISS' } as State;
      }

      // retirer la paire (vider les cases) + score
      const newGrid = state.grid.map(row =>
        row.map(c =>
          (c.id === a.id || c.id === b.id) ? { ...c, value: null } : c
        )
      );

      const combo = state.combo + 1;
      const gain = 10 * Math.max(1, combo);
      let next: State = {
        ...state,
        grid: newGrid,
        selected: [],
        combo,
        score: state.score + gain,
        hint: null,
        lastAction: 'HIT',
      } as State;

      // passage de niveau tous les 50 pts
      if (next.score >= state.level * 50) {
        next = levelUp(next);
      }
      return next;
    }

    case 'SET_OPERATOR': {
      return {
        ...state,
        config: { ...state.config, operator: action.op, target: action.target },
        selected: [],
        hint: null,
      } as State;
    }

    case 'SET_SIZE': {
      const rows = Math.max(3, Math.min(action.rows, state.config.maxSize));
      const cols = Math.max(3, Math.min(action.cols, state.config.maxSize));
      return {
        ...state,
        grid: fitGrid(state.grid, rows, cols),
        config: { ...state.config, rows, cols },
        selected: [],
        hint: null,
      } as State;
    }

    case 'SET_TICK_MS': {
      const tickMs = Math.max(500, action.tickMs | 0);
      return { ...state, config: { ...state.config, tickMs } } as State;
    }

    case 'SET_SPAWN': {
      const min = Math.max(1, Math.min(action.min | 0, 9));
      const max = Math.max(min, Math.min(action.max | 0, 9));
      return { ...state, config: { ...state.config, spawnPerTick: [min, max] } } as State;
    }

    case 'SET_MAXSIZE': {
      const max = Math.max(3, Math.min(action.max | 0, 12));
      const rows = Math.min(state.config.rows, max);
      const cols = Math.min(state.config.cols, max);
      return { ...state, config: { ...state.config, maxSize: max, rows, cols }, grid: fitGrid(state.grid, rows, cols) } as State;
    }

    case 'SET_THEME': {
      return { ...state, config: { ...state.config, theme: action.theme } } as State;
    }

    case 'TOGGLE_ASSIST': {
      return { ...state, config: { ...state.config, assistOnSelect: !state.config.assistOnSelect } } as State;
    }

    case 'PAUSE_TOGGLE': {
      return { ...state, running: !state.running } as State;
    }

    case 'TOGGLE_DIAG': {
      return { ...state, config: { ...state.config, allowDiagonals: !state.config.allowDiagonals } } as State;
    }

    case 'HINT': {
      const match = findAnyMatch(state);
      return { ...state, hint: match ? [match.a, match.b] : null, score: match ? state.score - 15 : state.score } as State;
    }

    case 'LEVEL_UP': {
      return levelUp(state);
    }

    case 'RESTART': {
      return reducer(state, { type: 'INIT' });
    }

    case 'TICK_TIME': {
      if (!state.running || state.gameOver) return state;
      return { ...state, timePlayedMs: state.timePlayedMs + action.delta } as State;
    }

    case 'TOGGLE_SOUND': {
      return { ...state, soundEnabled: !state.soundEnabled } as State;
    }

    default:
      return state;
  }
}

function levelUp(state: State): State {
  const { rows, cols, tickMs, maxSize } = state.config;
  const newRows = Math.min(maxSize, rows + 1);
  const newCols = Math.min(maxSize, cols + 1);
  const newTick = Math.max(1500, tickMs - 500);
  const newGrid = fitGrid(state.grid, newRows, newCols);
  return {
    ...state,
    grid: newGrid,
    level: state.level + 1,
    config: { ...state.config, rows: newRows, cols: newCols, tickMs: newTick },
  } as State;
}

function fitGrid(grid: Cell[][], rows: number, cols: number): Cell[][] {
  const ng = emptyGrid(rows, cols);
  for (let r = 0; r < Math.min(rows, grid.length); r++) {
    for (let c = 0; c < Math.min(cols, grid[0].length); c++) {
      ng[r][c] = { ...ng[r][c], value: grid[r][c].value, bornAt: grid[r][c].bornAt };
    }
  }
  return ng;
}

function areAdjacent(a: Cell, b: Cell, diagonals: boolean) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  if (diagonals) return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  return (dr + dc === 1); // 4-neighbours
}

function checkRule(a: number, b: number, op: Operator, target: number) {
  switch (op) {
    case 'ADD': return a + b === target;
    case 'SUB': return Math.abs(a - b) === target;
    case 'MUL': return a * b === target;
    case 'DIV': return (a % b === 0 && a / b === target) || (b % a === 0 && b / a === target);
  }
}

function findAnyMatch(state: State): { a: Coords; b: Coords } | null {
  const { allowDiagonals, operator, target } = state.config;
  const dirs = allowDiagonals
    ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    : [[1,0],[-1,0],[0,1],[0,-1]];
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[0].length; c++) {
      const v = state.grid[r][c].value;
      if (v === null) continue;
      for (const [dr, dc] of dirs) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 < 0 || c2 < 0 || r2 >= state.grid.length || c2 >= state.grid[0].length) continue;
        const v2 = state.grid[r2][c2].value;
        if (v2 === null) continue;
        if (checkRule(v, v2, operator, target)) {
          return { a: { row: r, col: c }, b: { row: r2, col: c2 } };
        }
      }
    }
  }
  return null;
}

export default function CubeMatch() {
  const [showOptions, setShowOptions] = useState(false);
  const [state, dispatch] = useReducer(reducer, undefined as any, () => {
    const saved = loadSaved();
    return saved ?? reducer({} as any, { type: 'INIT' });
  });

  // Tick (remplissage du cube)
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
      o.type = 'sine'; o.frequency.value = 880; // la4*2
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.14);
    } catch {}
  }, [state.lastAction, state.soundEnabled]);

  // Grille responsive
  const cellSize = useMemo(() => {
    // Grille nettement plus grande
    const base = 88; // taille de base nettement augmentée
    const scale = Math.max(56, base - (state.config.rows - 6) * 8);
    return `${scale}px`;
  }, [state.config.rows]);

  // Couleur du chiffre selon la valeur pour une meilleure lisibilité
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
    <div className="w-full max-w-6xl mx-auto p-4">
      <header className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${theme.headerFrom} ${theme.headerTo}`}>
              🎲 Cube Match
            </h1>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">Niveau {state.level}</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">Score {state.score}</span>
            {state.combo > 1 && <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">Combo ×{state.combo}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OpButton current={state.config} onChange={(op, target)=>dispatch({type:'SET_OPERATOR', op, target})}/>
            <TargetControl current={state.config} onChange={(target)=>dispatch({type:'SET_OPERATOR', op: state.config.operator, target})} />
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700" onClick={()=>dispatch({type:'TOGGLE_DIAG'})}>
              {state.config.allowDiagonals ? 'Diagonales: ON' : 'Diagonales: OFF'}
            </button>
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-yellow-50 text-gray-800" onClick={()=>dispatch({type:'HINT'})}>Indice (-15)</button>
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800" onClick={()=>dispatch({type:'RESTART'})}>Rejouer</button>
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800" onClick={()=>dispatch({type:'TOGGLE_SOUND'})}>
              Son: {state.soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800" onClick={()=>dispatch({type:'PAUSE_TOGGLE'})}>
              {state.running ? 'Pause' : 'Continuer'}
            </button>
            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800" onClick={()=>setShowOptions(v=>!v)}>
              Options
            </button>
          </div>
        <div className="mt-2 text-sm text-gray-600">Temps de jeu: {formatMs(state.timePlayedMs)}</div>
        </div>
        {/* barre de progression vers le prochain niveau (tous les 50 pts) */}
        <div className="mt-3">
          {(() => {
            const base = (state.level - 1) * 50;
            const progress = Math.max(0, state.score - base);
            const pct = Math.min(100, Math.round((progress / 50) * 100));
            return (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
              </div>
            );
          })()}
        </div>
      </header>

      <div
        className="grid bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded-xl shadow border border-gray-200"
        style={{
          gridTemplateColumns: `repeat(${state.config.cols}, ${cellSize})`,
          gridTemplateRows: `repeat(${state.config.rows}, ${cellSize})`,
          gap: '8px'
        }}
      >
        {state.grid.flat().map(cell => {
          const isSel = state.selected.some(s => s.row === cell.row && s.col === cell.col);
          const isHint = state.hint?.some(h => h.row === cell.row && h.col === cell.col);
          return (
            <button
              key={cell.id}
              onClick={() => dispatch({ type: 'CLICK', at: { row: cell.row, col: cell.col } })}
              className={`flex items-center justify-center rounded-lg border text-2xl font-extrabold select-none shadow-sm transition
                ${cell.value === null ? 'bg-white' : 'bg-white'}
                ${isSel ? `ring-2 ${theme.ring} shadow-md` : 'hover:shadow-md hover:scale-[1.02]'}
                ${isHint ? `outline outline-2 ${theme.outline}` : ''}
                ${valueClass(cell.value)}
              `}
            >
              {cell.value ?? '·'}
            </button>
          );
        })}
      </div>

      {state.gameOver && (
        <div className="mt-4 p-4 border rounded bg-rose-50">
          <p className="font-semibold mb-2">Partie terminée</p>
          <p className="mb-2">Score : {state.score} — Niveau atteint : {state.level}</p>
          <button className="px-3 py-2 border rounded" onClick={()=>dispatch({type:'RESTART'})}>Rejouer</button>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Règle par défaut : addition pour atteindre 10, cases adjacentes orthogonales.
        Change l’opérateur et la cible avec les boutons.
      </p>
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
      className={`px-4 py-2 rounded-md text-sm font-semibold transition border
        ${current.operator===op
          ? `bg-gradient-to-r ${theme.activeFrom} ${theme.activeTo} text-white border-transparent`
          : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-200'}
      `}
      title={`Opérateur ${label} — cible ${target}`}
    >{label}</button>
  );
  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
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
      <label className="text-sm text-gray-600">Cible</label>
      <input
        type="number"
        min={1}
        max={99}
        value={current.target}
        onChange={e=>onChange(parseInt(e.target.value||'0',10) || current.target)}
        className="w-20 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-800"
      />
    </div>
  );
}
      {showOptions && (
        <div className="mb-4 rounded-lg border bg-white p-3 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Lignes</label>
              <input type="number" min={3} max={state.config.maxSize} value={state.config.rows}
                onChange={e=>dispatch({type:'SET_SIZE', rows: parseInt(e.target.value||'0',10) || state.config.rows, cols: state.config.cols})}
                className="w-24 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Colonnes</label>
              <input type="number" min={3} max={state.config.maxSize} value={state.config.cols}
                onChange={e=>dispatch({type:'SET_SIZE', rows: state.config.rows, cols: parseInt(e.target.value||'0',10) || state.config.cols})}
                className="w-24 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Max grille</label>
              <input type="number" min={3} max={12} value={state.config.maxSize}
                onChange={e=>dispatch({type:'SET_MAXSIZE', max: parseInt(e.target.value||'0',10) || state.config.maxSize})}
                className="w-24 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Tick (ms)</label>
              <input type="number" min={500} step={100} value={state.config.tickMs}
                onChange={e=>dispatch({type:'SET_TICK_MS', tickMs: parseInt(e.target.value||'0',10) || state.config.tickMs})}
                className="w-28 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Spawn min</label>
              <input type="number" min={1} max={9} value={state.config.spawnPerTick[0]}
                onChange={e=>dispatch({type:'SET_SPAWN', min: parseInt(e.target.value||'0',10) || state.config.spawnPerTick[0], max: state.config.spawnPerTick[1]})}
                className="w-24 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Spawn max</label>
              <input type="number" min={1} max={9} value={state.config.spawnPerTick[1]}
                onChange={e=>dispatch({type:'SET_SPAWN', min: state.config.spawnPerTick[0], max: parseInt(e.target.value||'0',10) || state.config.spawnPerTick[1]})}
                className="w-24 px-3 py-2 rounded-md border border-gray-300" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Thème</label>
              <select
                value={state.config.theme ?? 'classic'}
                onChange={e=>dispatch({type:'SET_THEME', theme: e.target.value as any})}
                className="px-3 py-2 rounded-md border border-gray-300 bg-white"
              >
                <option value="classic">Classic</option>
                <option value="ocean">Ocean</option>
                <option value="sunset">Sunset</option>
                <option value="forest">Forest</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-gray-600">Aide sur sélection</label>
              <input type="checkbox" checked={!!state.config.assistOnSelect}
                onChange={()=>dispatch({type:'TOGGLE_ASSIST'})}
              />
            </div>
          </div>
        </div>
      )}
