# 🚀 Guide de Déploiement - Système Bubix Analysis

## 📋 État actuel

✅ **Frontend** : Interface temporaire active (pas d'erreurs de connexion)  
⏳ **Backend** : Routes et services créés, en attente d'activation  
⏳ **Base de données** : Migration Prisma prête à exécuter  

## 🔧 Étapes d'activation

### 1. 📊 Préparer la base de données

```bash
# Naviguer vers le backend
cd backend

# Exécuter la migration Prisma
npx prisma db push

# Vérifier que la table est créée
npx prisma studio
# → Vérifier la présence de la table "BubixAnalysis"
```

### 2. 🔑 Configurer OpenAI

```bash
# Ajouter la clé API dans le fichier .env du backend
echo "OPENAI_API_KEY=sk-your-openai-key-here" >> .env

# Vérifier la configuration
cat .env | grep OPENAI
```

### 3. 🚀 Redémarrer le backend

```bash
# Arrêter le backend actuel
pkill -f "node.*backend"

# Redémarrer avec les nouvelles routes
npm run dev
# ou
npm start
```

### 4. 🔄 Activer l'interface frontend

Une fois le backend prêt, remplacer le code temporaire dans `RadarChart.tsx` :

```typescript
// Remplacer cette section temporaire :
{/* Analyse Bubix temporairement désactivée */}

// Par le vrai composant :
<BubixAnalysisPanel
  childId={profiles[0]?.id || ''}
  competence={focusedCompetence}
  competenceLabel={CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.label || ''}
  childProfile={profiles[0]}
  competenceScore={competenceScore}
  competenceLevel={competenceLevel}
  isChild={isChild}
/>
```

### 5. ✅ Tester le système

```bash
# 1. Vérifier les routes API
curl http://localhost:5000/api/bubix/can-generate/test-child/mathematiques

# 2. Tester une génération d'analyse
curl -X POST http://localhost:5000/api/bubix/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "childProfile": {
      "id": "test-child",
      "name": "Test",
      "age": 8,
      "data": []
    },
    "competence": "mathematiques",
    "competenceScore": 7.5,
    "competenceLevel": "Avancé"
  }'

# 3. Vérifier l'historique
curl http://localhost:5000/api/bubix/history/test-child
```

## 🎯 Fichiers à modifier pour l'activation

### 1. Restaurer les imports dans RadarChart.tsx

```typescript
// Ajouter ces imports :
import { useBubixAnalysis } from '../../hooks/useBubixAnalysis'
import BubixAnalysisPanel from '../bubix/BubixAnalysisPanel'
```

### 2. Remplacer la section temporaire

Localiser cette section dans `RadarChart.tsx` :
```typescript
{/* Analyse Bubix temporairement désactivée */}
<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6...
```

Et la remplacer par :
```typescript
<BubixAnalysisPanel
  childId={profiles[0]?.id || ''}
  competence={focusedCompetence}
  competenceLabel={CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.label || ''}
  childProfile={profiles[0]}
  competenceScore={(() => {
    const selected = isChild ? profiles[0] : profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
    const d = selected?.data.find(x => x.competence === focusedCompetence)
    return d ? normalize(Number(d.score), d.maxScore, 10) : 0
  })()}
  competenceLevel={(() => {
    const selected = isChild ? profiles[0] : profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
    const d = selected?.data.find(x => x.competence === focusedCompetence)
    const score = d ? normalize(Number(d.score), d.maxScore, 10) : 0
    return getScoreLevel(score).level
  })()}
  isChild={isChild}
/>
```

## 🔍 Vérifications post-déploiement

### ✅ Checklist de validation

- [ ] Table `BubixAnalysis` créée en BDD
- [ ] Variable `OPENAI_API_KEY` configurée
- [ ] Backend redémarré sans erreurs
- [ ] Routes API `/api/bubix/*` accessibles
- [ ] Frontend mis à jour avec le vrai composant
- [ ] Test de génération d'analyse réussi
- [ ] Interface utilisateur fonctionnelle
- [ ] Limitation quotidienne active
- [ ] Historique des analyses accessible

### 🚨 Résolution de problèmes

**Erreur "OpenAI API key not found"**
```bash
# Vérifier la variable d'environnement
echo $OPENAI_API_KEY
# Redémarrer le backend après ajout
```

**Erreur "Table BubixAnalysis does not exist"**
```bash
# Exécuter la migration
npx prisma db push
# Ou créer manuellement la table
psql $DATABASE_URL -f prisma/migrations/add_bubix_analysis.sql
```

**Erreur de connexion frontend → backend**
```bash
# Vérifier que le backend écoute sur le bon port
netstat -an | grep 5000
# Vérifier la variable BACKEND_URL dans le frontend
```

## 📊 Monitoring et métriques

Une fois activé, surveiller :

- **Nombre d'analyses générées** par jour
- **Temps de réponse** OpenAI (< 30s)
- **Taux d'erreur** des générations
- **Utilisation des tokens** OpenAI
- **Satisfaction utilisateur** avec les analyses

## 🎉 Résultat attendu

Après activation complète :

1. **Interface fluide** sans erreurs de connexion
2. **Analyses pédagogiques** générées par OpenAI
3. **Limitation quotidienne** respectée
4. **Historique complet** des bulletins
5. **Expérience utilisateur** optimale

---

*Le système est prêt à être activé dès que le backend sera configuré ! 🚀*
