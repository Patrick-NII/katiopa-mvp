"use client";
import React, { useEffect, useMemo, useReducer } from 'react';

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
};

type Action =
  | { type: 'INIT'; payload?: Partial<Config> }
  | { type: 'TICK'; now: number }
  | { type: 'CLICK'; at: Coords }
  | { type: 'SET_OPERATOR'; op: Operator; target: number }
  | { type: 'TOGGLE_DIAG' }
  | { type: 'HINT' }
  | { type: 'LEVEL_UP' }
  | { type: 'RESTART' };

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
};

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

      if (selected.length < 2) return { ...state, selected, hint: null } as State;

      // valider la paire
      const [a, b] = selected.map(s => state.grid[s.row][s.col]);
      if (!areAdjacent(a, b, state.config.allowDiagonals)) {
        // mauvaise adjacence
        return { ...state, selected: [], combo: 0, hint: null } as State;
      }

      const ok = checkRule(a.value!, b.value!, state.config.operator, state.config.target);
      if (!ok) {
        return { ...state, selected: [], combo: 0, hint: null } as State;
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
  const [state, dispatch] = useReducer(reducer, undefined as any, () => reducer({} as any, { type: 'INIT' }));

  // Tick (remplissage du cube)
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, state.config.tickMs);
    return () => clearInterval(id);
  }, [state.running, state.config.tickMs]);

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

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <header className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">
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
          </div>
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
                ${isSel ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-md hover:scale-[1.02]'}
                ${isHint ? 'outline outline-2 outline-amber-400' : ''}
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

function OpButton({ current, onChange }: { current: Config; onChange: (op: Operator, target: number)=>void }) {
  const Item = ({ label, op, target }: { label: string; op: Operator; target: number }) => (
    <button
      onClick={()=>onChange(op, target)}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition border
        ${current.operator===op
          ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white border-transparent'
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
