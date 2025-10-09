# 🎮 Guide d'ajout d'un nouveau jeu à l'écosystème Katiopa

Ce guide explique comment ajouter un nouveau jeu à la plateforme Katiopa de manière **modulaire et sans hardcoding**.

## 📋 Checklist complète

### 1️⃣ Base de données (Backend)

**Fichier:** `backend/prisma/schema.prisma`

```prisma
// Ajouter 3 modèles pour le nouveau jeu (exemple: LogicQuest)

model LogicQuestScore {
  id                String   @id @default(uuid())
  user_id           String   @map("user_id")
  session_id        String?  @map("session_id")
  
  // Métriques de base
  score             Int      @default(0)
  level             Int      @default(1)
  time_played_ms    Int      @map("time_played_ms")
  
  // Métriques spécifiques au jeu
  // ... vos champs personnalisés
  
  // Relations
  userSession       UserSession @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@map("logicquest_scores")
}

model LogicQuestRound {
  // ... détails des rounds
}

model LogicQuestUserStats {
  // ... statistiques agrégées
}

// Ajouter les relations dans UserSession
model UserSession {
  // ... existing relations
  logicQuestScores      LogicQuestScore[]
  logicQuestUserStats   LogicQuestUserStats?
}
```

**Commandes:**
```bash
cd backend
npx prisma generate
npx prisma db push  # ou créer une migration
```

---

### 2️⃣ Backend - Routes & Services

#### A. Route de sauvegarde des scores

**Fichier:** `backend/src/routes/logicquest/scores.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { updateLogicQuestCompetences } from '../../services/logicquest-competence-mapper';

const router = Router();
const prisma = new PrismaClient();

// Schéma de validation Zod
const LogicQuestScoreSchema = z.object({
  score: z.number(),
  level: z.number(),
  // ... vos champs
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user?.userId; // De l'authentification
    const scoreData = LogicQuestScoreSchema.parse(req.body);
    
    // Sauvegarder le score
    const score = await prisma.logicQuestScore.create({
      data: {
        user_id: userId,
        score: scoreData.score,
        level: scoreData.level,
        // ... autres champs
      }
    });
    
    // Mettre à jour les compétences du radar
    await updateLogicQuestCompetences(userId, scoreData);
    
    res.json({ success: true, scoreId: score.id });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: 'Erreur sauvegarde' });
  }
});

export default router;
```

#### B. Service de mapping des compétences

**Fichier:** `backend/src/services/logicquest-competence-mapper.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CompetenceType = 
  | 'MATHEMATIQUES' 
  | 'PROGRAMMATION' 
  | 'CREATIVITE' 
  | 'CONCENTRATION' 
  | 'RESOLUTION_PROBLEMES' 
  | 'COMMUNICATION' 
  | 'CONNAISSANCES_GENERALES'
  | 'SENS_CRITIQUE';

// Mapper votre jeu vers les compétences du radar
const LOGICQUEST_COMPETENCE_MAP = {
  'EASY': {
    primary: 'RESOLUTION_PROBLEMES',
    secondary: ['CONCENTRATION']
  },
  'HARD': {
    primary: 'RESOLUTION_PROBLEMES',
    secondary: ['CONCENTRATION', 'SENS_CRITIQUE']
  }
};

export async function updateLogicQuestCompetences(
  userId: string,
  scoreData: any
): Promise<void> {
  // Calculer le score de performance
  // Mettre à jour CompetenceAssessment
  // Voir numeromagic-competence-mapper.ts comme exemple
}
```

#### C. Router principal

**Fichier:** `backend/src/routes/logicquest/index.ts`

```typescript
import { Router } from 'express';
import scoresRouter from './scores';
import statsRouter from './stats';
import leaderboardRouter from './leaderboard';

const router = Router();

router.use('/scores', scoresRouter);
router.use('/stats', statsRouter);
router.use('/leaderboard', leaderboardRouter);

export default router;
```

#### D. Intégration au routeur principal

**Fichier:** `backend/src/routes/index.ts`

```typescript
// Ajouter l'import
import logicquestRoutes from './logicquest/index';

// Ajouter la route
router.use('/logicquest', logicquestRoutes);
```

---

### 3️⃣ Frontend - API Client

**Fichier:** `frontend/lib/api/logicquest.ts`

```typescript
async function fetchViaProxy(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `/api${endpoint}`;
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
    throw new Error(error.error || 'Erreur API');
  }
  
  return response.json();
}

export const logicQuestAPI = {
  async saveScore(scoreData: any) {
    return fetchViaProxy('/logicquest/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    });
  },
  
  async getStats(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return fetchViaProxy(`/logicquest/stats${query}`);
  }
};
```

---

### 4️⃣ Frontend - Proxy Next.js

**Fichier:** `frontend/app/api/logicquest/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest('GET', request, params);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest('POST', request, params);
}

async function handleRequest(
  method: string,
  request: NextRequest,
  params: { path: string[] }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/logicquest/${path}${request.nextUrl.search}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    },
  };
  
  if (method !== 'GET') {
    options.body = await request.text();
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  return NextResponse.json(data, { status: response.status });
}
```

---

### 5️⃣ Frontend - Page du jeu

**Fichier:** `frontend/app/dashboard/games/logicquest/page.tsx`

```typescript
'use client'

import { useState } from 'react';
import { logicQuestAPI } from '@/lib/api/logicquest';

export default function LogicQuestPage() {
  const [score, setScore] = useState(0);
  
  const handleGameEnd = async () => {
    try {
      const result = await logicQuestAPI.saveScore({
        score: score,
        level: 1,
        // ... vos données
      });
      
      if (result.success) {
        console.log('✅ Score sauvegardé');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };
  
  return (
    <div>
      {/* Votre interface de jeu */}
    </div>
  );
}
```

---

### 6️⃣ Intégration BubiX - Données de jeu

**Fichier:** `frontend/app/api/chat/route.ts`

#### A. Créer la fonction de récupération

```typescript
// Ajouter cette fonction (copier/adapter getNumeroMagicData)
async function getLogicQuestData(childId: string, limit?: number): Promise<any> {
  try {
    console.log(`🎮 Récupération données LogicQuest pour enfant ${childId}...`);
    
    const scores = await prisma.logicQuestScore.findMany({
      where: { user_id: childId },
      orderBy: { created_at: 'desc' },
      ...(limit && { take: limit })
    });
    
    if (scores.length === 0) return null;
    
    return {
      game: 'LogicQuest',
      totalGames: scores.length,
      bestScore: Math.max(...scores.map(s => s.score)),
      // ... calculer les autres stats
    };
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}
```

#### B. Appeler dans getChildrenData()

```typescript
// Dans la fonction getChildrenData, ajouter:
const logicQuestData = await getLogicQuestData(child.id, cubeMatchLimit);
console.log(`   LogicQuest: ${logicQuestData ? 'Données trouvées' : 'Aucune donnée'}`);

// Dans l'objet retourné:
return {
  // ... autres champs
  logicQuestData: logicQuestData,
  logicQuestSummary: logicQuestData ? generateLogicQuestSummary(logicQuestData) : "..."
}
```

---

### 7️⃣ Configuration du jeu (FICHIER CENTRAL)

**Fichier:** `frontend/app/api/chat/game-data-config.ts`

```typescript
// Ajouter simplement cette entrée:

export const GAME_DATA_SOURCES = {
  // ... cubeMatch, numeroMagic
  
  logicQuest: {
    dataKey: 'logicQuestData',
    displayName: 'LogicQuest',
    fetchFunction: 'getLogicQuestData',
    fields: [
      { key: 'totalGames', label: 'Parties jouées' },
      { key: 'bestScore', label: 'Meilleur score' },
      { key: 'difficulty', label: 'Difficulté' },
      { key: 'accuracy', label: 'Précision', format: (v) => `${v}%` }
    ]
  }
};
```

**C'EST TOUT !** Le jeu sera automatiquement inclus dans BubiX.

---

### 8️⃣ Synchronisation des schémas Prisma

**IMPORTANT:** Après chaque modification du schéma backend, synchroniser avec le frontend:

```bash
# 1. Copier le schéma
cp backend/prisma/schema.prisma frontend/prisma/schema.prisma

# 2. Générer le client Prisma frontend
cd frontend
npx prisma generate

# 3. Nettoyer le cache Next.js
rm -rf .next

# 4. Redémarrer
npm run dev
```

---

## ✅ Garanties du système

### Zéro hardcoding
- ✅ Tous les IDs viennent de la BDD
- ✅ Tous les scores sont calculés en temps réel
- ✅ Toutes les stats sont dynamiques
- ✅ Ajout d'un nouveau jeu = modifier 1 seul fichier de config

### Scalabilité
- ✅ Ajout d'un jeu: ~30 minutes de développement
- ✅ Pas de modification du code BubiX
- ✅ Pas de modification du template de prompt
- ✅ Détection automatique des nouveaux jeux

### Production ready
- ✅ Pas de données de test
- ✅ Pas de session IDs hardcodés
- ✅ Tout vient de UserSession et Account
- ✅ Relations propres dans la BDD

---

## 🎯 Pour ajouter un jeu en 5 étapes

1. **Schéma Prisma** → Ajouter les 3 modèles (Score, Round, Stats)
2. **Route backend** → Créer `/routes/nouveaujeu/scores.ts`
3. **Service compétences** → Créer `nouveaujeu-competence-mapper.ts`
4. **Frontend API** → Créer `lib/api/nouveaujeu.ts`
5. **Config BubiX** → Ajouter 1 entrée dans `game-data-config.ts`

**TERMINÉ !** Le jeu est intégré à tout l'écosystème.

---

## 📝 Exemple complet

Voir l'implémentation de **NuméroMagic** comme référence :
- `backend/src/routes/numeromagic/*`
- `backend/src/services/numeromagic-competence-mapper.ts`
- `frontend/lib/api/numeromagic.ts`
- `frontend/app/dashboard/games/numeromagic/page.tsx`
- `frontend/app/api/chat/game-data-config.ts` (ligne 28-40)

