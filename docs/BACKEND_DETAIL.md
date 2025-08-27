# 🔧 BACKEND - DOCUMENTATION DÉTAILLÉE

## 📁 STRUCTURE COMPLÈTE DU BACKEND

### **Organisation des fichiers**
```
backend/
├── src/
│   ├── index.ts                    # Point d'entrée principal
│   ├── prisma.ts                   # Configuration Prisma
│   ├── middleware/
│   │   └── auth.ts                 # Middleware d'authentification
│   └── routes/
│       ├── auth.ts                  # Routes d'authentification
│       ├── stats.ts                 # Routes des statistiques
│       ├── llm.ts                   # Routes LLM/IA
│       └── activity.ts              # Routes des activités
├── prisma/
│   ├── schema.prisma                # Schéma de base de données
│   └── seed-multi-user.ts           # Script de seeding
├── package.json                     # Dépendances et scripts
└── .env                             # Variables d'environnement
```

---

## 🚀 POINT D'ENTRÉE PRINCIPAL (src/index.ts)

### **Description**
Le fichier `index.ts` est le point d'entrée principal du serveur Express. Il configure tous les middlewares, routes et gestionnaires d'erreurs.

### **Code complet avec commentaires**
```typescript
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/auth";
import statsRoutes from "./routes/stats";
import llmRoutes from "./routes/llm";
import activityRoutes from "./routes/activity";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de sécurité Helmet
app.use(helmet());

// Configuration CORS avec fallback sécurisé
app.use(cors({ 
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"], 
  credentials: false 
}));

// Middleware de parsing JSON
app.use(express.json());

// Configuration des logs Morgan (masquage des en-têtes sensibles)
app.use(morgan("dev", {
  stream: process.stdout,
  skip: () => false
}));

// Rate limiting pour l'authentification (anti bruteforce)
const authLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10, // 10 tentatives par minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Route de santé (health check)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes avec rate limiting pour l'auth
app.use("/auth", authLimiter, authRoutes);
app.use("/stats", statsRoutes);
app.use("/llm", llmRoutes);
app.use("/activity", activityRoutes);

// Gestionnaire 404
app.use((_req: Request, res: Response) => res.status(404).json({ error: "Not found" }));

// Gestionnaire d'erreurs global (empêche le crash du process)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled route error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Sécurité au niveau process (capture des exceptions non gérées)
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// Démarrage du serveur
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
```

### **Fonctionnalités clés**
1. **Sécurité** : Helmet pour les en-têtes HTTP sécurisés
2. **CORS** : Configuration flexible avec fallback sécurisé
3. **Rate Limiting** : Protection contre le bruteforce
4. **Logs** : Morgan pour le logging HTTP
5. **Gestion d'erreurs** : Capture globale des exceptions
6. **Sécurité process** : Protection contre les crashes

---

## 🔐 MIDDLEWARE D'AUTHENTIFICATION (src/middleware/auth.ts)

### **Description**
Le middleware d'authentification vérifie la validité des tokens JWT et extrait les informations utilisateur pour les routes protégées.

### **Code complet avec commentaires**
```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Interface étendue pour inclure les informations utilisateur
export interface AuthRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
    accountId: string;
    userType: string;
  };
}

// Middleware de vérification d'authentification
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extraction du token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant ou invalide" });
    }

    // Extraction du token (suppression de "Bearer ")
    const token = authHeader.substring(7);

    // Vérification et décodage du token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Vérification de la structure du token décodé
    if (!decoded.sessionId || !decoded.userId || !decoded.accountId) {
      return res.status(401).json({ error: "Token malformé" });
    }

    // Ajout des informations utilisateur à la requête
    req.user = {
      id: decoded.userId,
      sessionId: decoded.sessionId,
      accountId: decoded.accountId,
      userType: decoded.userType || "UNKNOWN"
    };

    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token invalide" });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expiré" });
    }
    
    return res.status(500).json({ error: "Erreur d'authentification" });
  }
};
```

### **Fonctionnalités clés**
1. **Vérification JWT** : Validation cryptographique des tokens
2. **Extraction d'informations** : Récupération des données utilisateur
3. **Gestion d'erreurs** : Messages d'erreur spécifiques par type
4. **Sécurité** : Vérification de la structure des tokens
5. **Typage TypeScript** : Interface AuthRequest étendue

---

## 🔑 ROUTES D'AUTHENTIFICATION (src/routes/auth.ts)

### **Description**
Les routes d'authentification gèrent l'inscription, la connexion et la récupération des profils utilisateur.

### **Structure des routes**
- `POST /auth/register` : Inscription d'un nouveau compte
- `POST /auth/login` : Connexion d'un utilisateur
- `GET /auth/me` : Récupération du profil utilisateur

### **Route d'inscription (POST /auth/register)**
```typescript
router.post("/register", async (req, res) => {
  try {
    const { email, subscriptionType, members } = req.body;

    // Validation des données d'entrée
    if (!email || !subscriptionType || !members || !Array.isArray(members)) {
      return res.status(400).json({ 
        error: "Données d'inscription invalides" 
      });
    }

    // Vérification de l'unicité de l'email
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return res.status(400).json({ 
        error: "Un compte avec cet email existe déjà" 
      });
    }

    // Création du compte principal
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        maxSessions: getMaxSessions(subscriptionType),
        totalAccountConnectionDurationMs: 0n
      }
    });

    // Création des sessions utilisateur
    const userSessions = [];
    for (const member of members) {
      const session = await prisma.userSession.create({
        data: {
          sessionId: member.sessionId,
          firstName: member.firstName,
          lastName: member.lastName,
          gender: member.gender,
          userType: member.userType,
          age: member.age,
          grade: member.grade,
          country: member.country,
          timezone: member.timezone,
          preferences: member.preferences,
          accountId: account.id,
          totalConnectionDurationMs: 0n
        }
      });

      // Création du profil utilisateur
      await prisma.userProfile.create({
        data: {
          userId: session.id,
          // ... autres champs du profil
        }
      });

      userSessions.push(session);
    }

    res.json({
      success: true,
      accountId: account.id,
      sessions: userSessions.map(s => ({
        sessionId: s.sessionId,
        firstName: s.firstName,
        lastName: s.lastName
      }))
    });

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ 
      error: "Erreur lors de la création du compte" 
    });
  }
});
```

### **Route de connexion (POST /auth/login)**
```typescript
router.post("/login", async (req, res) => {
  try {
    const { sessionId, password } = req.body;

    // Validation des données d'entrée
    if (!sessionId || !password) {
      return res.status(400).json({ 
        error: "Session ID et mot de passe requis" 
      });
    }

    // Recherche de la session utilisateur
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        account: true,
        profile: true
      }
    });

    if (!userSession) {
      return res.status(401).json({ 
        error: "Identifiants invalides" 
      });
    }

    // Vérification du mot de passe (pour le MVP, comparaison directe)
    if (userSession.password !== password) {
      return res.status(401).json({ 
        error: "Identifiants invalides" 
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        sessionId: userSession.sessionId,
        userId: userSession.id,
        accountId: userSession.accountId,
        userType: userSession.userType
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Mise à jour du temps de connexion
    await prisma.userSession.update({
      where: { id: userSession.id },
      data: { currentSessionStartTime: new Date() }
    });

    res.json({
      token,
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        email: userSession.account.email,
        gender: userSession.gender,
        userType: userSession.userType,
        age: userSession.age,
        grade: userSession.grade,
        subscriptionType: userSession.account.subscriptionType,
        createdAt: userSession.createdAt,
        accountId: userSession.accountId
      }
    });

  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ 
      error: "Erreur lors de la connexion" 
    });
  }
});
```

### **Route de profil (GET /auth/me)**
```typescript
router.get("/me", async (req: any, res) => {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith("Bearer ")) {
    return res.json({ user: null });
  }

  try {
    // Vérification du token JWT
    const payload = jwt.verify(
      auth.replace("Bearer ", ""), 
      JWT_SECRET
    ) as any;

    // Récupération des données utilisateur complètes
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId: payload.sessionId },
      include: {
        account: true,
        profile: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!userSession) {
      return res.json({ user: null });
    }

    // Construction de la réponse complète
    return res.json({
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        email: userSession.account.email,
        gender: userSession.gender,
        userType: userSession.userType,
        age: userSession.age,
        grade: userSession.grade,
        country: userSession.country,
        timezone: userSession.timezone,
        preferences: userSession.preferences,
        subscriptionType: userSession.account.subscriptionType,
        createdAt: userSession.createdAt,
        accountId: userSession.accountId,
        account: {
          id: userSession.account.id,
          email: userSession.account.email,
          subscriptionType: userSession.account.subscriptionType,
          maxSessions: userSession.account.maxSessions,
          createdAt: userSession.account.createdAt,
          totalAccountConnectionDurationMs: userSession.account.totalAccountConnectionDurationMs
        },
        profile: userSession.profile,
        recentActivities: userSession.activities
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return res.json({ user: null });
  }
});
```

---

## 📊 ROUTES DES STATISTIQUES (src/routes/stats.ts)

### **Description**
Les routes des statistiques fournissent des données agrégées sur les activités et performances des utilisateurs.

### **Route des activités (GET /stats/activities)**
```typescript
router.get("/activities", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Récupération des activités récentes
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        userSession: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({ activities });

  } catch (error) {
    console.error("Erreur lors de la récupération des activités:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des activités" 
    });
  }
});
```

### **Route du résumé (GET /stats/summary)**
```typescript
router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Calcul des statistiques agrégées avec Prisma
    const summary = await prisma.$queryRaw`
      SELECT 
        domain,
        AVG(score) as averageScore,
        COUNT(*) as totalActivities,
        SUM(durationMs) as totalDuration
      FROM "Activity"
      WHERE "userId" = ${userId}
      GROUP BY domain
      ORDER BY averageScore DESC
    `;

    res.json({ summary });

  } catch (error) {
    console.error("Erreur lors de la récupération du résumé:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération du résumé" 
    });
  }
});
```

---

## 🤖 ROUTES LLM (src/routes/llm.ts)

### **Description**
Les routes LLM gèrent l'intégration avec OpenAI pour l'évaluation personnalisée et les recommandations d'exercices.

### **Route d'évaluation (POST /llm/evaluate)**
```typescript
router.post("/evaluate", requireAuth, async (req: AuthRequest, res) => {
  const fallback = {
    assessment: "Tu progresses bien ! Continuons avec des petits défis adaptés.",
    exercises: [
      { 
        title: "Additions faciles (1 chiffre)", 
        nodeKey: "maths.addition.1digit", 
        description: "Résous 5 petites additions pour gagner un badge." 
      },
      { 
        title: "Comparer des nombres", 
        nodeKey: "maths.compare.1digit", 
        description: "Dis quel nombre est le plus grand entre deux." 
      },
      { 
        title: "Formes et couleurs", 
        nodeKey: "coding.logic.shapes", 
        description: "Classe des formes simples par couleur et taille." 
      }
    ]
  };

  try {
    const userId = req.user!.id;
    const focus = (req.body?.focus as string) ?? "maths";

    // Récupération des activités récentes pour le contexte
    const activities = await prisma.activity.findMany({
      where: { userId, domain: focus },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Préparation des données pour le LLM
    const statsText = activities
      .map(a => `${a.createdAt.toISOString()} | ${a.domain} | ${a.nodeKey} | score:${a.score} | attempts:${a.attempts} | durationMs:${a.durationMs}`)
      .join("\n");

    // Prompt système pour le LLM
    const system = `Tu es un pédagogue pour enfants de 5 à 7 ans.
Analyse des activités (scores 0-100). Fais un court bilan positif, puis propose 3 exercices adaptés,
clairs et motivants, sous forme d'objectifs atteignables. Les exercices doivent référencer un nodeKey (maths.* ou coding.*).`;

    const user = `Données récentes:
${statsText}

Contrainte: âge 5-7, langage simple, ton bienveillant. Génère JSON strict.`;

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    });

    // Parsing de la réponse
    let out: any = null;
    try {
      out = JSON.parse(completion.choices[0].message?.content ?? "{}");
    } catch {
      out = null;
    }

    // Retour de la réponse ou du fallback
    return res.json(out && out.assessment ? out : fallback);

  } catch (e) {
    console.error("Erreur LLM:", e);
    return res.json(fallback);
  }
});
```

---

## 📝 ROUTES DES ACTIVITÉS (src/routes/activity.ts)

### **Description**
Les routes des activités gèrent la création et la récupération des exercices et activités des utilisateurs.

### **Route de création d'activité (POST /activity)**
```typescript
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { domain, nodeKey, score, attempts, durationMs } = req.body;
    const userId = req.user!.id;

    // Validation des données
    if (!domain || !nodeKey || typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ 
        error: "Données d'activité invalides" 
      });
    }

    // Création de l'activité
    const activity = await prisma.activity.create({
      data: {
        userId,
        domain,
        nodeKey,
        score,
        attempts: attempts || 1,
        durationMs: durationMs || 0
      }
    });

    res.json({ activity });

  } catch (error) {
    console.error("Erreur lors de la création de l'activité:", error);
    res.status(500).json({ 
      error: "Erreur lors de la création de l'activité" 
    });
  }
});
```

---

## 🗄️ CONFIGURATION PRISMA (src/prisma.ts)

### **Description**
Configuration de la connexion à la base de données PostgreSQL via Prisma ORM.

### **Code complet**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Fonctionnalités clés**
1. **Singleton pattern** : Une seule instance Prisma par processus
2. **Gestion de l'environnement** : Configuration différente en dev/prod
3. **Type safety** : Génération automatique des types TypeScript

---

## 🌱 SCRIPT DE SEEDING (prisma/seed-multi-user.ts)

### **Description**
Script de population de la base de données avec des comptes de test et des données d'exemple.

### **Fonctionnalités**
1. **Nettoyage** : Suppression des données existantes
2. **Comptes de test** : Création de comptes FREE et PRO_PLUS
3. **Sessions multiples** : Plusieurs utilisateurs par compte
4. **Données réalistes** : Activités et profils complets
5. **Comptes spécifiques** : Compte Patrick pour les tests

---

## 📋 VARIABLES D'ENVIRONNEMENT (.env)

### **Configuration requise**
```env
# Configuration du serveur
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-here

# Configuration CORS
CORS_ORIGIN=http://localhost:3000

# Configuration OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Configuration de la base de données
DATABASE_URL="postgresql://username:password@localhost:5432/katiopa"
```

---

## 🚀 SCRIPTS NPM (package.json)

### **Scripts disponibles**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed-multi-user.ts"
  }
}
```

---

## 🔍 DÉBOGAGE ET MONITORING

### **Logs et observabilité**
1. **Morgan** : Logs HTTP détaillés
2. **Console** : Logs d'erreurs et de débogage
3. **Health check** : Endpoint `/health` pour le monitoring

### **Gestion des erreurs**
1. **Middleware global** : Capture de toutes les erreurs
2. **Process-level safety** : Protection contre les crashes
3. **Messages d'erreur** : Réponses HTTP appropriées

---

*Document créé le : 31 décembre 2025*  
*Version : 1.0*  
*Maintenu par : Équipe de développement Katiopa* 