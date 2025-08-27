# 📌 Prompt IA — Katiopa MVP Multi-Utilisateurs

Tu es un **architecte logiciel** et **développeur fullstack senior**.  
Tu travailles sur **Katiopa MVP**, une application éducative pour enfants et familles.  
Ton rôle : **implémenter, sécuriser et optimiser** le système multi-utilisateurs, les endpoints API, la BDD Prisma, et le front React/Next.js.

---

## 🎯 Objectifs
1. Implémenter une **architecture multi-utilisateurs** : un **Account** (email) → plusieurs **UserSessions** (ex: enfant, parent).
2. Chaque **session** a un `sessionId`, un mot de passe et ses propres activités.
3. Gérer les **plans d’abonnement** (FREE, PRO, PRO_PLUS, ENTERPRISE) avec quotas de sessions.
4. Ajouter des **profils personnalisés** (goals, préférences, style d’apprentissage…).
5. Enregistrer toutes les activités, présences et sessions pour un **LLM adaptatif**.
6. Sécuriser l’API (rate-limit, RBAC, JWT enrichi).
7. Créer un **frontend UX adapté** (sélecteur de sessions, dashboard par rôle, minuterie en temps réel).
8. Préparer des **analytics enrichis** pour le LLM : snapshot de progression, temps, inactivité.

---

## 🗄️ Modèle de données (Prisma)
```prisma
enum SubscriptionType { FREE PRO PRO_PLUS ENTERPRISE }
enum UserType { CHILD PARENT TEACHER ADMIN }
enum Gender { MALE FEMALE UNSPECIFIED }
enum PresenceStatus { present absent busy pause }

model Account {
  id              String  @id @default(cuid())
  email           String  @unique
  subscriptionType SubscriptionType @default(FREE)
  maxSessions     Int     @default(2)
  isActive        Boolean @default(true)
  consents        Json?
  dataVisibility  String?
  dataRetentionDays Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  sessions        UserSession[]
}

model UserSession {
  id            String  @id @default(cuid())
  accountId     String
  sessionId     String
  password      String
  firstName     String
  lastName      String
  gender        Gender   @default(UNSPECIFIED)
  userType      UserType @default(CHILD)
  age           Int?
  grade         String?
  country       String?
  timezone      String?
  preferences   Json?
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  account       Account  @relation(fields: [accountId], references: [id])
  profile       UserProfile?
  activities    Activity[]
  sessions      Session[]
  presence      Presence?
  uiEvents      UIEvent[]
  skills        KnowledgeSkill[]

  @@unique([accountId, sessionId])
  @@index([accountId])
}

model UserProfile {
  id               String  @id @default(cuid())
  userSessionId    String  @unique
  learningGoals    Json
  preferredSubjects Json
  learningStyle    String?
  difficulty       String?
  interests        Json
  specialNeeds     Json
  customNotes      String?
  parentWishes     String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  userSession      UserSession @relation(fields: [userSessionId], references: [id])
}

model Activity {
  id            String  @id @default(cuid())
  userSessionId String
  domain        String
  nodeKey       String
  score         Int
  attempts      Int     @default(1)
  durationMs    Int
  createdAt     DateTime @default(now())
  userSession   UserSession @relation(fields: [userSessionId], references: [id])
  @@index([userSessionId, createdAt])
}

model Session {
  id             String   @id @default(cuid())
  userSessionId  String
  startedAt      DateTime
  endedAt        DateTime?
  idleSeconds    Int      @default(0)
  focusBlurCount Int      @default(0)
  networkIssues  Int      @default(0)
  device         String?
  os             String?
  browser        String?
  appVersion     String?
  createdAt      DateTime  @default(now())
  userSession    UserSession @relation(fields: [userSessionId], references: [id])
  @@index([userSessionId, startedAt])
}

model Presence {
  id        String   @id @default(cuid())
  userSessionId String @unique
  status    PresenceStatus
  since     DateTime @default(now())
  updatedAt DateTime @updatedAt
  userSession UserSession @relation(fields: [userSessionId], references: [id])
}

model UIEvent {
  id        String   @id @default(cuid())
  userSessionId String
  type      String
  meta      Json?
  createdAt DateTime @default(now())
  userSession UserSession @relation(fields: [userSessionId], references: [id])
  @@index([userSessionId, createdAt])
}

model KnowledgeSkill {
  id               String  @id @default(cuid())
  userSessionId    String
  nodeKey          String
  masteryEstimate  Float   @default(0)
  prerequisitesOk  Boolean @default(true)
  lastPracticedAt  DateTime?
  decayRisk        Float   @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  userSession      UserSession @relation(fields: [userSessionId], references: [id])
  @@unique([userSessionId, nodeKey])
}
```

---

## 🔐 Auth & JWT
- Login par **sessionId + password**.
- JWT doit contenir :
```json
{
  "sub": "<userSessionId>",
  "accountId": "<accountId>",
  "sessionId": "enfant1",
  "userType": "CHILD",
  "plan": "FREE",
  "iat": 123456,
  "exp": 123789
}
```
- Middleware `requireAuth` pour vérifier le JWT.  
- Middleware `requireRole([PARENT, ADMIN])` pour sécuriser certaines routes.

---

## 🌐 Endpoints API à implémenter

### Auth
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/switch` (changement de session si parent/admin)

### Sessions
- `GET /sessions/list` (listes des sessions du compte)
- `POST /sessions/create` (création nouvelle session si quota dispo)
- `POST /sessions/start`
- `POST /sessions/end`

### Presence
- `POST /presence/set` (present|absent|busy|pause)

### UI / Analytics
- `POST /uievents`
- `POST /skills/upsert`
- `GET /analytics/snapshot` → données consolidées pour le LLM

### LLM
- `POST /llm/evaluate-advanced` → analyse JSON stricte

---

## 🎨 Frontend (Next.js + Tailwind)
- Page **Login** : juste login, pas de fetch profil avant token.  
- **NavBar** : fetch profil uniquement si token + pas sur `/login|/register`.  
- **Dashboard** : guard → redirige si pas de token, sinon fetch stats/analytics.  
- **Sélecteur de sessions** pour un parent connecté.  
- Header : avatar, salutation, timer session, badge plan.  
- Timer : utilise `/sessions/start` + `/sessions/end`.

---

## 🔧 Sécurité
- Rate limit `/auth/login` (ex: 10 req/min).  
- Prévoir migration future → **cookies httpOnly**.  
- Masquer Authorization dans les logs.  
- Pas d’info sensible dans snapshot LLM (anonymiser).

---

## 🧪 Tests
1. Création compte + 2 sessions (FREE).  
2. Connexion parent → accès dashboard parent.  
3. Connexion enfant → interface enfant.  
4. Dépassement quota → erreur `PLAN_LIMIT_REACHED`.  
5. Snapshot analytics vide vs complet → cohérence.  
6. Switch de session → refresh dashboard correct.

---

## 🚀 Prochaines étapes IA
1. Générer la migration Prisma pour ce schéma.  
2. Implémenter les endpoints `/sessions/*`, `/presence/*`, `/analytics/snapshot`.  
3. Mettre à jour `auth.ts` pour login multi-session.  
4. Adapter le front (sélecteur de session, dashboard role-based).  
5. Préparer le `llm/evaluate-advanced` avec retour JSON strict.

---

👉 **Consigne IA** : À partir de ce prompt, écris le code manquant (backend + frontend), corrige les incohérences, et rends le projet Katiopa MVP **fonctionnel, sécurisé et prêt pour démo multi-utilisateurs**.
