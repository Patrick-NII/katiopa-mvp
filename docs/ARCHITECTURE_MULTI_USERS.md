# 🏗️ Architecture Multi-Utilisateurs - Katiopa MVP

## 📋 Vue d'ensemble

Katiopa implémente maintenant un système de **comptes multi-utilisateurs** qui permet à une famille ou une organisation de gérer plusieurs profils d'apprentissage sous un seul compte principal.

## 🔑 Concepts clés

### **1. Compte Principal (Account)**
- **Une adresse email = Un compte**
- Gère l'abonnement et les limites
- Contient les informations de facturation
- Peut avoir plusieurs sessions utilisateur

### **2. Sessions Utilisateur (UserSession)**
- **Chaque utilisateur = Une session unique**
- Identifiée par un `sessionId` (ex: "enfant1", "parent1")
- A son propre mot de passe
- Contient les informations personnelles (nom, âge, genre, etc.)

### **3. Types d'abonnement**
| Plan | Sessions max | Fonctionnalités |
|------|--------------|-----------------|
| **FREE** | 2 | Fonctionnalités de base |
| **PRO** | 2 | + Fonctionnalités premium |
| **PRO_PLUS** | 4 | + Toutes fonctionnalités |
| **ENTERPRISE** | Illimité | + Support entreprise |

## 🗄️ Structure de la base de données

### **Tables principales**

```sql
-- Compte principal
Account {
  id: string
  email: string (unique)
  subscriptionType: SubscriptionType
  maxSessions: number
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

-- Session utilisateur
UserSession {
  id: string
  accountId: string (référence Account)
  sessionId: string (unique, ex: "enfant1")
  password: string (hashé)
  firstName: string
  lastName: string
  gender: Gender
  userType: UserType
  age?: number
  grade?: string
  country?: string
  timezone?: string
  preferences?: json
  isActive: boolean
  lastLoginAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}

-- Profil détaillé
UserProfile {
  id: string
  userSessionId: string (référence UserSession)
  learningGoals: string[]
  preferredSubjects: string[]
  learningStyle?: string
  difficulty?: string
  interests: string[]
  specialNeeds: string[]
  customNotes?: string
  parentWishes?: string
  createdAt: timestamp
  updatedAt: timestamp
}

-- Activités d'apprentissage
Activity {
  id: string
  userSessionId: string (référence UserSession)
  domain: string (Mathématiques, Français, IA, etc.)
  nodeKey: string
  score: number
  attempts: number
  durationMs: number
  createdAt: timestamp
}
```

## 🔄 Flux de connexion

### **1. Connexion par session**
```
Utilisateur → Saisit sessionId + mot de passe
           ↓
Vérification → Récupération de la session
           ↓
Dashboard → Affichage personnalisé selon le type d'utilisateur
```

### **2. Switch de session**
```
Utilisateur connecté → Sélecteur de sessions
                    ↓
Liste des sessions disponibles → Sélection
                    ↓
Rechargement du dashboard → Nouveau contexte utilisateur
```

## 👥 Types d'utilisateurs

### **Enfant (CHILD)**
- **Âge cible :** 5-7 ans
- **Interface :** Adaptée aux enfants
- **Fonctionnalités :** Exercices, jeux, progression
- **Salutation :** "Bonjour Emma ! 👋"

### **Parent (PARENT)**
- **Interface :** Tableau de bord parental
- **Fonctionnalités :** Suivi des enfants, rapports, paramètres
- **Salutation :** "Bonjour Marie ! 👋"

### **Enseignant (TEACHER)**
- **Interface :** Espace enseignant
- **Fonctionnalités :** Gestion de classes, évaluations
- **Salutation :** "Bonjour Professeur ! 👋"

### **Administrateur (ADMIN)**
- **Interface :** Administration
- **Fonctionnalités :** Gestion de la plateforme
- **Salutation :** "Bonjour Administrateur ! 👋"

## 🎨 Personnalisation selon le genre

### **Adaptation automatique**
- **Garçon :** Interface avec couleurs et thèmes adaptés
- **Fille :** Interface avec couleurs et thèmes adaptés
- **Non spécifié :** Interface neutre

### **Exemples d'adaptation**
```typescript
const getGenderSpecificGreeting = (gender: string, firstName: string) => {
  switch (gender) {
    case 'MALE': return `Bonjour ${firstName} ! 👋`
    case 'FEMALE': return `Bonjour ${firstName} ! 👋`
    default: return `Bonjour ${firstName} ! 👋`
  }
}
```

## ⏰ Gestion du temps

### **Temps de session**
- **Début :** Au moment de la connexion
- **Durée :** Calculée en temps réel
- **Affichage :** Format HH:MM:SS

### **Temps global depuis l'inscription**
- **Calcul :** Depuis la création du compte principal
- **Affichage :** Format HH:MM:SS
- **Mise à jour :** En temps réel

### **Exemple d'affichage**
```
Session: 00:15:32          Temps global: 72:45:18
Début: 14:30              Membre depuis: 27/08/2024
Durée totale: 00:15:32    Durée d'inscription: 3 jours
```

## 🚀 Fonctionnalités avancées

### **1. Gestion des sessions**
- **Création :** Selon le plan d'abonnement
- **Limitation :** Respect des quotas
- **Désactivation :** Possibilité de désactiver des sessions

### **2. Profils personnalisés**
- **Objectifs d'apprentissage :** Personnalisés par enfant
- **Matières préférées :** Adaptation de l'interface
- **Style d'apprentissage :** Visuel, auditif, kinesthésique
- **Centres d'intérêt :** Personnalisation des exercices

### **3. LLM adaptatif**
- **Contexte utilisateur :** Genre, âge, type d'utilisateur
- **Historique :** Activités et progression
- **Recommandations :** Personnalisées selon le profil

## 🔧 Implémentation technique

### **Frontend**
```typescript
// Hook pour le temps global
const globalTimeInfo = useGlobalTime(account.createdAt)

// Composant de bienvenue personnalisé
<PersonalizedWelcome
  firstName={user.firstName}
  gender={user.gender}
  userType={user.userType}
  age={user.age}
  grade={user.grade}
  memberSince={account.createdAt}
  daysSinceRegistration={globalTimeInfo.daysSinceRegistration}
/>
```

### **Backend**
```typescript
// Authentification par session
const userSession = await prisma.userSession.findUnique({
  where: { sessionId, isActive: true },
  include: { account: true, profile: true }
})
```

## 📱 Interface utilisateur

### **Header personnalisé**
- **Avatar :** Initiales de l'utilisateur
- **Nom complet :** Prénom + Nom
- **Type de compte :** Badge avec icône
- **Temps :** Session + Global + Date actuelle

### **Navigation latérale**
- **Logo :** Katiopa + "Apprentissage intelligent"
- **Type de compte :** Badge "Compte Gratuit" / "Pro Plus"
- **Onglets :** Adaptés selon l'abonnement

### **Dashboard personnalisé**
- **Salutation :** Adaptée au genre et type
- **Statistiques :** Selon les activités de la session
- **LLM :** Contexte adapté à l'utilisateur

## 🧪 Tests et démonstration

### **Comptes de test**
```
Compte PRO_PLUS (famille.dupont@example.com):
- Emma (enfant1): enfant123
- Lucas (enfant2): enfant456
- Marie (parent1): parent123
- Pierre (parent2): parent456

Compte FREE (famille.martin@example.com):
- Jade (enfant3): enfant789
- Sophie (parent3): parent789
```

### **Scénarios de test**
1. **Connexion enfant :** Interface adaptée, exercices
2. **Connexion parent :** Tableau de bord parental
3. **Switch de session :** Changement de contexte
4. **Limitation gratuite :** Blocage des fonctionnalités premium

## 🔮 Évolutions futures

### **Phase 2**
- **Gestion des classes :** Pour les enseignants
- **Rapports avancés :** Analytics détaillés
- **Notifications :** Alertes et rappels

### **Phase 3**
- **API publique :** Intégration avec d'autres plateformes
- **Mobile :** Applications iOS/Android
- **IA avancée :** Recommandations prédictives

## 📚 Ressources

- **Schéma Prisma :** `backend/prisma/schema.prisma`
- **Migration :** `backend/prisma/migrations/001_multi_user_accounts.sql`
- **Seed :** `backend/prisma/seed-multi-user.ts`
- **Types TypeScript :** `frontend/types/index.ts`
- **Composants :** `frontend/components/`

---

**Version :** 2.0.0  
**Date :** 27 août 2024  
**Auteur :** Équipe Katiopa 