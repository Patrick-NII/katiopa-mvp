# Système de Rapports Quotidiens Automatisés CubeAI

## 📊 Vue d'Ensemble

Le système de rapports quotidiens automatisés génère des comptes rendus personnalisés par IA pour chaque enfant, envoyés aux parents via email. Il combine analyse de données, intelligence artificielle et automatisation pour fournir un suivi pédagogique de qualité.

## 🗄️ Architecture des Données

### Tables Principales

#### 1. **user_sessions** - Sessions Enfant
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,          -- parent
  child_nickname TEXT NOT NULL,      -- ex. "Lina"
  child_age INT NOT NULL,            -- 5-7 ans au prototype
  parent_email TEXT NOT NULL,
  goals JSONB,                       -- objectifs choisis par les parents
  consent_email BOOLEAN NOT NULL DEFAULT true,
  email_frequency TEXT DEFAULT 'daily',
  email_time TIME DEFAULT '19:30:00',
  email_domains TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube']
);
```

#### 2. **learning_events** - Événements d'Apprentissage
```sql
CREATE TABLE learning_events (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  ts TIMESTAMP NOT NULL,
  domain TEXT NOT NULL,              -- "maths", "programmation", "playcube"
  activity TEXT NOT NULL,            -- ex. "addition", "tic-tac-toe"
  duration_sec INT NOT NULL,
  success_ratio NUMERIC,             -- 0-1 si applicable
  metadata JSONB
);
```

#### 3. **quiz_results** - Résultats Quiz/Exercices
```sql
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  ts TIMESTAMP NOT NULL,
  module TEXT NOT NULL,              -- "MathCube N1 - additions <=10"
  score NUMERIC NOT NULL,            -- 0-100
  attempts INT NOT NULL,
  time_sec INT NOT NULL
);
```

#### 4. **session_stats_daily** - Statistiques Journalières
```sql
CREATE TABLE session_stats_daily (
  session_id UUID,
  date DATE,
  total_time_min INT,
  kpi_assiduite NUMERIC,             -- 0-100
  kpi_comprehension NUMERIC,          -- 0-100
  kpi_progression NUMERIC,           -- 0-100
  sessions_count INT,
  best_module TEXT,
  needs_help TEXT,
  consecutive_days INT,
  focus_score NUMERIC,
  PRIMARY KEY (session_id, date)
);
```

#### 5. **daily_reports** - Rapports Envoyés
```sql
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY,
  session_id UUID,
  date DATE,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  model_used TEXT,
  prompt_used TEXT,
  kpis_snapshot JSONB,
  sent_at TIMESTAMP,
  parent_email TEXT,
  status TEXT DEFAULT 'sent'
);
```

## 🧠 Intelligence Artificielle

### Prompt Système
```
Tu es un tuteur pédagogique bienveillant. Tu écris un compte rendu quotidien
à destination des parents. Cible: enfant 5–7 ans. Style: clair, positif,
concis, orienté actions concrètes (2–3 conseils max). Jamais culpabilisant.
Pas d'emoji. Pas d'exagération. Pas de jargon.
```

### Prompt Utilisateur
```
Données du jour (format JSON):
- Enfant: {child_nickname}, {child_age} ans
- Date: {date_iso}
- KPIs:
  - assiduite: {kpi_assiduite}/100
  - comprehension: {kpi_comprehension}/100
  - progression: {kpi_progression}/100
  - total_time_min: {total_time_min} min
  - sessions_count: {sessions_count}
- Modules:
  - best_module: {best_module}
  - needs_help: {needs_help}
- Objectifs parents (si fournis): {goals_json}

Consignes rédactionnelles:
1) En-tête: "Bilan du jour — {child_nickname}" + date.
2) 3 rubriques courtes:
   - Assiduité: phrase simple + fait chiffré.
   - Compréhension & progrès: 1–2 phrases + module fort/faible.
   - Conseils pour demain: 2 puces max, très concrètes (5–10 min).
3) 1 phrase d'encouragement final neutre.

Réponds en Markdown structuré (## titres, listes). 120–160 mots.
```

## 📊 KPIs Calculés

### Assiduité (0-100)
- **Formule**: `(minutes_actives / 25) * 100`
- **Objectif**: 20-30 minutes par jour
- **Seuil optimal**: 25 minutes = 100%

### Compréhension (0-100)
- **Formule**: `moyenne(scores_quiz)`
- **Source**: Résultats des mini-quiz
- **Pondération**: Moyenne simple

### Progression (0-100)
- **Formule**: `nombre_nouveaux_modules * 10`
- **Source**: Nouveaux modules débloqués
- **Pondération**: 10 points par nouveau module

### Focus (0-100)
- **Formule**: `(temps_moyen_activité / 300) * 100`
- **Objectif**: 5 minutes par activité = 100%
- **Seuil optimal**: 300 secondes

## 🎨 Template Email

### Sujet
```
CubeAI — Bilan du jour pour {child_nickname} ({date_fr})
```

### Design HTML
- **Header**: Gradient bleu-violet avec logo CubeAI
- **Stats Grid**: 3 cartes avec temps total, compréhension, progression
- **Contenu**: Markdown converti en HTML avec style personnalisé
- **Footer**: Copyright + lien de désinscription
- **Responsive**: Design mobile-first

### Exemple de Contenu
```html
<div class="header">
    <div class="logo">CubeAI</div>
    <div class="title">Bilan du jour</div>
    <p>19 décembre 2024</p>
</div>

<div class="content">
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">28 min</div>
            <div class="stat-label">Temps total</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">85%</div>
            <div class="stat-label">Compréhension</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">70%</div>
            <div class="stat-label">Progression</div>
        </div>
    </div>
    
    <div class="report-content">
        <h2>Bilan du jour — Lina</h2>
        <p><strong>Assiduité</strong><br>
        Lina a passé 28 minutes aujourd'hui sur CubeAI. 2 sessions réalisées.</p>
        
        <p><strong>Compréhension & progrès</strong><br>
        Score moyen de 85/100. Meilleur module : Additions simples.</p>
        
        <p><strong>Conseils pour demain</strong><br>
        • Prévoir 10-15 minutes d'activité<br>
        • Encourager la régularité</p>
        
        <p>Continuez à accompagner Lina dans ses apprentissages !</p>
    </div>
</div>
```

## 🔄 Automatisation

### Jobs Programmatiques

#### 1. Calcul des Statistiques (18:00)
```typescript
export async function calculateDailyStatsJob() {
  const targetDate = new Date();
  await prisma.$executeRaw`SELECT calculate_daily_stats(${targetDate})`;
}
```

#### 2. Génération des Rapports (19:30)
```typescript
export async function generateDailyReportsJob() {
  const targetDate = new Date();
  await DailyReportService.generateAndSendDailyReports(targetDate);
}
```

#### 3. Nettoyage Hebdomadaire
```typescript
export async function cleanupOldReportsJob() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  await prisma.dailyReport.deleteMany({
    where: {
      date: { lt: oneYearAgo },
      status: { in: ['sent', 'failed'] }
    }
  });
}
```

### Script Python pour Cron

#### Installation
```bash
# Rendre exécutable
chmod +x backend/scripts/daily_reports.py

# Configuration cron (tous les jours à 19:30)
30 19 * * * /usr/bin/python3 /path/to/cubeai/backend/scripts/daily_reports.py
```

#### Utilisation
```bash
# Génération normale
python3 daily_reports.py generate

# Génération pour une date spécifique
python3 daily_reports.py generate 2024-12-19

# Test pour une session
python3 daily_reports.py test session123

# Statistiques
python3 daily_reports.py stats 2024-12-01 2024-12-31
```

## 🚀 API Routes

### Génération
- `POST /api/reports/generate` - Génère tous les rapports
- `POST /api/reports/test/:sessionId` - Test pour une session

### Consultation
- `GET /api/reports/session/:sessionId` - Rapports d'une session
- `GET /api/reports/statistics` - Statistiques globales
- `GET /api/reports/preview/:sessionId` - Aperçu sans envoi

### Configuration
- `PUT /api/reports/preferences` - Préférences de rapport
- `POST /api/reports/disable/:sessionId` - Désactivation

## 🔒 Conformité RGPD

### Consentement
- **Champ obligatoire**: `consent_email = true`
- **Désactivation**: `consent_email = false`
- **Préférences**: Fréquence, heure, domaines

### Minimisation des Données
- **Agrégats uniquement**: Pas de données brutes identifiantes
- **Anonymisation**: Hash des emails dans les logs
- **Conservation limitée**: 1 an maximum

### Droits Utilisateur
- **Droit à l'oubli**: Suppression complète des données
- **Portabilité**: Export des rapports
- **Rectification**: Modification des préférences

## 🛠️ Installation

### 1. Migration de Base de Données
```bash
# Exécuter la migration
npm run migrate:daily-reports

# Ou manuellement
node backend/scripts/run-daily-reports-migration.ts
```

### 2. Configuration des Variables d'Environnement
```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# API
CUBEAI_API_URL=https://cube-ai.fr
CUBEAI_API_KEY=your-api-key

# Frontend
FRONTEND_URL=https://cube-ai.fr
```

### 3. Démarrage des Jobs
```typescript
import { startReportJobs } from '../jobs/reportJobs';

// Dans votre fichier principal
startReportJobs();
```

## 📝 Exemples d'Utilisation

### Génération Manuelle
```typescript
import { DailyReportService } from '../services/dailyReportService';

// Générer pour aujourd'hui
await DailyReportService.generateAndSendDailyReports();

// Générer pour une date spécifique
await DailyReportService.generateAndSendDailyReports(new Date('2024-12-19'));
```

### Test d'un Rapport
```bash
# Via API
curl -X POST "http://localhost:4000/api/reports/test/session123" \
  -H "Authorization: Bearer your-token"

# Via script Python
python3 daily_reports.py test session123
```

### Aperçu d'un Rapport
```bash
curl -X GET "http://localhost:4000/api/reports/preview/session123" \
  -H "Authorization: Bearer your-token"
```

## 🔍 Monitoring et Debug

### Logs
```bash
# Logs du script Python
tail -f /var/log/cubeai-daily-reports.log

# Logs du backend
tail -f backend-dev.log
```

### Métriques
- **Taux de génération**: Rapports générés / Sessions actives
- **Taux d'envoi**: Rapports envoyés / Rapports générés
- **Temps de génération**: Moyenne par rapport
- **Erreurs IA**: Fallback utilisés

### Alertes
- **Échec de génération**: Plus de 5% d'échecs
- **Échec d'envoi**: Plus de 10% d'échecs
- **IA indisponible**: Fallback utilisé
- **Base de données**: Erreurs de connexion

## 🎯 Bonnes Pratiques

### Performance
- **Calcul préalable**: Stats calculées à 18:00
- **Parallélisation**: Traitement par batch
- **Timeout**: 5 minutes maximum par rapport
- **Cache**: Mise en cache des templates

### Fiabilité
- **Fallback**: Rapport minimal si IA indisponible
- **Retry**: 3 tentatives en cas d'échec
- **Monitoring**: Logs détaillés
- **Tests**: Validation avant production

### Sécurité
- **Authentification**: API key obligatoire
- **Validation**: Données d'entrée vérifiées
- **Sanitisation**: Contenu HTML nettoyé
- **Rate limiting**: Protection contre le spam

## 📈 Évolutions Futures

### Fonctionnalités Avancées
- **Rapports hebdomadaires**: Synthèse de la semaine
- **Rapports mensuels**: Bilan complet
- **Comparaisons**: Évolution dans le temps
- **Recommandations**: Suggestions personnalisées

### Intégrations
- **Slack/Discord**: Notifications équipe
- **Google Analytics**: Tracking des ouvertures
- **Zapier**: Automatisations externes
- **Webhooks**: Intégrations tierces

### IA Avancée
- **GPT-4 Turbo**: Modèle plus récent
- **Fine-tuning**: Modèle spécialisé
- **Multi-langues**: Support international
- **Personnalisation**: Style adaptatif
