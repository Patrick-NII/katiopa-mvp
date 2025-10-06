# Guide de Segmentation par Âge - CubeAI

## Vue d'ensemble

Le système de segmentation par âge de CubeAI adapte automatiquement l'interface, le contenu et la difficulté selon l'âge de l'enfant. Cette approche garantit une expérience utilisateur optimale et pédagogiquement appropriée.

## Tranches d'âge définies

### 🧸 Tout-petits (4-5 ans) - `TODDLER`
- **Caractéristiques** : Attention courte, apprentissage par le jeu
- **Interface** : Très simple, colorée, gros boutons
- **Langage** : Vocabulaire basique, phrases courtes
- **Fonctionnalités** : Pas de cycle hebdomadaire, pas de comparaison

### 🎨 Maternelle (6-7 ans) - `PRESCHOOL`
- **Caractéristiques** : Curiosité naturelle, début de logique
- **Interface** : Simple mais plus détaillée
- **Langage** : Vocabulaire enrichi, explications courtes
- **Fonctionnalités** : Détails des compétences, pas de cycle hebdomadaire

### 📚 Primaire début (8-9 ans) - `EARLY_PRIMARY`
- **Caractéristiques** : Attention soutenue, goût pour les défis
- **Interface** : Équilibrée, plus d'informations
- **Langage** : Intermédiaire, explications détaillées
- **Fonctionnalités** : Cycle hebdomadaire, comparaison possible

### 🎯 Primaire fin (10-11 ans) - `LATE_PRIMARY`
- **Caractéristiques** : Pensée abstraite, autonomie
- **Interface** : Complexe, statistiques avancées
- **Langage** : Riche, explications complètes
- **Fonctionnalités** : Toutes les fonctionnalités disponibles

### 🏆 Collège (12+ ans) - `MIDDLE_SCHOOL`
- **Caractéristiques** : Pensée critique, recherche de performance
- **Interface** : Professionnelle, données détaillées
- **Langage** : Avancé, vocabulaire technique
- **Fonctionnalités** : Interface complète, outils avancés

## Utilisation dans les composants

### 1. Hook useAgeAdaptation

```typescript
import { useAgeAdaptation } from '../hooks/useAgeAdaptation'

function MyComponent({ childAge }: { childAge: number }) {
  const {
    adaptText,
    colors,
    isFeatureEnabled,
    ui,
    getMotivationalMessage
  } = useAgeAdaptation({ age: childAge })

  return (
    <div>
      <h1 className={ui.fontSize.title}>
        {adaptText({
          simple: 'Mon Super Jeu !',
          intermediate: 'Mon Tableau de Bord',
          advanced: 'Interface de Gestion'
        })}
      </h1>
      
      {isFeatureEnabled('advancedStats') && (
        <div>Statistiques avancées...</div>
      )}
      
      <p style={{ color: colors.primary }}>
        {getMotivationalMessage('success')}
      </p>
    </div>
  )
}
```

### 2. Adaptation directe avec les utilitaires

```typescript
import { getAgeSegment, adaptTextForAge, isFeatureAvailable } from '../lib/ageSegmentation'

function AdaptedComponent({ age }: { age: number }) {
  const segment = getAgeSegment(age)
  
  return (
    <div>
      <span className="badge">
        {segment.name} • {segment.ageRange}
      </span>
      
      <p>
        {adaptTextForAge(age, {
          simple: 'Tu es super !',
          intermediate: 'Excellent travail !',
          advanced: 'Performance remarquable !'
        })}
      </p>
      
      {isFeatureAvailable(age, 'showWeeklyCycle') && (
        <WeeklyCycleComponent />
      )}
    </div>
  )
}
```

## Fonctionnalités conditionnelles

### Navigation et onglets
```typescript
// Masquer certains onglets pour les jeunes enfants
const shouldShowTab = (tabName: string, age: number) => {
  const restrictedTabs = {
    'weekly-cycle': age >= 8,
    'advanced-stats': age >= 10,
    'performance-analysis': age >= 12
  }
  
  return restrictedTabs[tabName] !== false
}
```

### Exercices et difficulté
```typescript
import { getMaxDifficulty } from '../lib/ageSegmentation'

function ExerciseSelector({ age, exercises }: Props) {
  const maxDifficulty = getMaxDifficulty(age)
  
  const availableExercises = exercises.filter(
    exercise => exercise.difficulty <= maxDifficulty
  )
  
  return (
    <div>
      {availableExercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  )
}
```

## Personnalisation du langage

### Templates adaptatifs
```typescript
const getAgeAppropriateText = (age: number, context: string) => {
  const templates = {
    welcome: {
      simple: 'Salut {name} ! Prêt à jouer ? 🎮',
      intermediate: 'Bonjour {name} ! Prêt pour de nouvelles aventures ? 🚀',
      advanced: 'Bienvenue {name} ! Explorons tes compétences ensemble ! 🎯'
    },
    completion: {
      simple: 'Bravo ! Tu as fini ! 🌟',
      intermediate: 'Excellent ! Mission accomplie ! 🏆',
      advanced: 'Objectif atteint avec succès ! 🎖️'
    }
  }
  
  return adaptTextForAge(age, templates[context])
}
```

## Couleurs et thèmes

### Palettes par âge
- **Tout-petits** : Couleurs vives et contrastées (rouge, bleu, jaune)
- **Maternelle** : Couleurs douces et harmonieuses (violet, rose, vert)
- **Primaire** : Couleurs équilibrées (bleu, violet, orange)
- **Collège** : Couleurs professionnelles (gris, bleu foncé, vert)

```typescript
const { colors } = useAgeAdaptation({ age })

// Utilisation des couleurs adaptées
<div style={{ 
  backgroundColor: colors.primary + '20',
  borderColor: colors.primary,
  color: colors.primary 
}}>
  Contenu adapté
</div>
```

## Bonnes pratiques

### 1. Toujours vérifier l'âge
```typescript
// ✅ Bon
const age = profile?.age || 8 // âge par défaut
const segment = getAgeSegment(age)

// ❌ Mauvais
const segment = getAgeSegment(profile.age) // peut être undefined
```

### 2. Prévoir des fallbacks
```typescript
// ✅ Bon
{isFeatureEnabled('advancedStats') ? (
  <AdvancedStats />
) : (
  <SimpleStats />
)}

// ❌ Mauvais
{isFeatureEnabled('advancedStats') && <AdvancedStats />}
// Laisse un vide pour les jeunes enfants
```

### 3. Tester avec différents âges
```typescript
// Tests recommandés
const testAges = [5, 7, 9, 11, 13]
testAges.forEach(age => {
  console.log(`Âge ${age}:`, getAgeSegment(age))
})
```

## Intégration avec les données

### Récupération de l'âge depuis la base de données
```typescript
// Dans les hooks de données
const profile: ChildProfile = {
  id: session.sessionId,
  name: session.firstName,
  age: session.age, // ⚠️ Important : inclure l'âge
  data: competenceData
}
```

### Calcul automatique depuis la date de naissance
```typescript
import { calculateAge } from '../lib/ageSegmentation'

const age = calculateAge(user.birthDate)
const segment = getAgeSegment(age)
```

## Exemples d'implémentation

Voir les fichiers suivants pour des exemples concrets :
- `components/charts/RadarChart.tsx` - Adaptation complète du radar des compétences
- `hooks/useAgeAdaptation.ts` - Hook utilitaire
- `lib/ageSegmentation.ts` - Système de base

## Migration des composants existants

1. **Identifier les éléments à adapter** : textes, couleurs, fonctionnalités
2. **Ajouter l'âge aux props** : `{ age?: number }`
3. **Utiliser le hook** : `const { adaptText, colors, isFeatureEnabled } = useAgeAdaptation({ age })`
4. **Remplacer les textes fixes** par des textes adaptatifs
5. **Conditionner les fonctionnalités** avancées
6. **Tester avec différents âges**

Ce système garantit une expérience utilisateur optimale et pédagogiquement appropriée pour chaque tranche d'âge ! 🎯
