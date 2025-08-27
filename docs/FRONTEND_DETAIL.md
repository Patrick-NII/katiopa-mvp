# 🎨 FRONTEND - DOCUMENTATION DÉTAILLÉE

## 📁 STRUCTURE COMPLÈTE DU FRONTEND

### **Organisation des fichiers**
```
frontend/
├── app/                          # App Router Next.js 14
│   ├── globals.css               # Styles globaux Tailwind
│   ├── layout.tsx                # Layout principal avec métadonnées
│   ├── page.tsx                  # Page d'accueil
│   ├── login/
│   │   └── page.tsx              # Page de connexion
│   ├── register/
│   │   └── page.tsx              # Page d'inscription multi-étapes
│   └── dashboard/
│       └── page.tsx              # Dashboard principal avec onglets
├── components/                    # Composants React réutilisables
│   ├── AuthGuard.tsx             # Protection d'authentification
│   ├── UserHeader.tsx            # En-tête utilisateur avec infos
│   ├── NavBar.tsx                # Navigation principale
│   ├── SidebarNavigation.tsx     # Navigation latérale avec onglets
│   ├── DashboardTab.tsx          # Onglet Dashboard principal
│   ├── StatisticsTab.tsx         # Onglet Statistiques détaillées
│   ├── ExercisesTab.tsx          # Onglet Exercices et planning
│   ├── DetailedUserInfo.tsx      # Informations détaillées utilisateur
│   ├── AnimatedLLMButton.tsx     # Bouton d'évaluation LLM animé
│   ├── AdvancedLLMResults.tsx    # Affichage des résultats LLM
│   ├── HelpChatButton.tsx        # Bouton d'aide flottant
│   └── SessionSwitcher.tsx       # Sélecteur de session utilisateur
├── hooks/                        # Hooks React personnalisés
│   ├── useSession.ts             # Gestion de la session utilisateur
│   ├── useGlobalTime.ts          # Calcul du temps depuis inscription
│   └── useTotalConnectionTime.ts # Temps de connexion total
├── lib/                          # Utilitaires et configuration
│   └── api.ts                    # Client API centralisé
├── types/                        # Types TypeScript centralisés
│   └── index.ts                  # Définitions de types
├── tailwind.config.js            # Configuration Tailwind CSS
├── next.config.js                # Configuration Next.js
└── package.json                  # Dépendances et scripts
```

---

## 🚀 POINT D'ENTRÉE PRINCIPAL (app/layout.tsx)

### **Description**
Le layout principal définit la structure HTML de base, les métadonnées et les styles globaux de l'application.

### **Code complet avec commentaires**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Configuration de la police Inter
const inter = Inter({ subsets: ['latin'] })

// Métadonnées de l'application
export const metadata: Metadata = {
  title: 'Katiopa - Apprentissage Adaptatif pour Enfants',
  description: 'Plateforme d\'apprentissage personnalisé basée sur l\'IA pour enfants de 5 à 7 ans',
  keywords: 'éducation, apprentissage, enfants, IA, mathématiques, codage',
  authors: [{ name: 'Équipe Katiopa' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow'
}

// Layout principal avec structure HTML
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/* Métadonnées supplémentaires */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {/* Structure principale de l'application */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
```

### **Fonctionnalités clés**
1. **Métadonnées SEO** : Titre, description et mots-clés optimisés
2. **Police Inter** : Typographie moderne et lisible
3. **Structure HTML** : Balises sémantiques et accessibilité
4. **Styles globaux** : Configuration Tailwind CSS

---

## 🏠 PAGE D'ACCUEIL (app/page.tsx)

### **Description**
Page d'accueil publique présentant Katiopa avec navigation vers connexion et inscription.

### **Code complet avec commentaires**
```typescript
'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, BookOpen, Users, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation principale */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Katiopa */}
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Katiopa</span>
            </motion.div>

            {/* Boutons de navigation */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Connexion
              </Link>
              <Link 
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Titre principal */}
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            L'apprentissage adaptatif
            <span className="block text-blue-600">pour tous les enfants</span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Katiopa utilise l'intelligence artificielle pour créer des parcours 
            d'apprentissage personnalisés, adaptés au rythme et aux besoins 
            de chaque enfant de 5 à 7 ans.
          </motion.p>

          {/* Bouton d'action principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Link 
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Commencer gratuitement
              <BookOpen className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        {/* Fonctionnalités principales */}
        <motion.div 
          className="mt-20 grid md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Fonctionnalité 1 */}
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              IA Adaptative
            </h3>
            <p className="text-gray-600">
              L'intelligence artificielle s'adapte au niveau et au style 
              d'apprentissage de chaque enfant.
            </p>
          </div>

          {/* Fonctionnalité 2 */}
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Contenu Personnalisé
            </h3>
            <p className="text-gray-600">
              Des exercices et activités adaptés aux besoins spécifiques 
              de chaque enfant.
            </p>
          </div>

          {/* Fonctionnalité 3 */}
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Suivi Parental
            </h3>
            <p className="text-gray-600">
              Les parents peuvent suivre les progrès et participer 
              à l'apprentissage de leur enfant.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

---

## 🔐 PAGE DE CONNEXION (app/login/page.tsx)

### **Description**
Page de connexion permettant aux utilisateurs de se connecter avec leur session ID et mot de passe.

### **Fonctionnalités principales**
1. **Authentification** : Connexion par session ID + mot de passe
2. **Validation** : Vérification des champs obligatoires
3. **Gestion d'erreurs** : Affichage des messages d'erreur
4. **Redirection** : Navigation automatique vers le dashboard
5. **Comptes de test** : Liste des comptes disponibles pour le développement

### **Structure du composant**
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { apiPost } from '@/lib/api'

export default function LoginPage() {
  const [sessionId, setSessionId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiPost('/auth/login', { sessionId, password })
      
      if (response.token) {
        localStorage.setItem('token', response.token)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* En-tête */}
        <div className="text-center mb-8">
          <motion.div 
            className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-600 mt-2">Accédez à votre espace Katiopa</p>
        </div>

        {/* Formulaire de connexion */}
        <motion.form 
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Session ID */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID de Session
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre ID de session"
              required
            />
          </div>

          {/* Mot de passe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <motion.div 
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </motion.div>
          )}

          {/* Bouton de connexion */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Se connecter
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Comptes de test */}
        <motion.div 
          className="mt-6 bg-white rounded-lg shadow-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Comptes de test disponibles :
          </h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div>Session: <code className="bg-gray-100 px-1 rounded">CHILD_001</code> | Mot de passe: <code className="bg-gray-100 px-1 rounded">password123</code></div>
            <div>Session: <code className="bg-gray-100 px-1 rounded">PARENT_001</code> | Mot de passe: <code className="bg-gray-100 px-1 rounded">password123</code></div>
            <div>Session: <code className="bg-gray-100 px-1 rounded">PATRICK</code> | Mot de passe: <code className="bg-gray-100 px-1 rounded">patrick2025</code></div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
```

---

## 📝 PAGE D'INSCRIPTION (app/register/page.tsx)

### **Description**
Page d'inscription multi-étapes permettant de créer un compte avec plusieurs membres de famille.

### **Fonctionnalités principales**
1. **Processus multi-étapes** : 4 étapes pour l'inscription complète
2. **Gestion des membres** : Ajout dynamique de membres de famille
3. **Validation** : Vérification des données à chaque étape
4. **Types de compte** : Différenciation FREE vs PRO_PLUS
5. **Génération automatique** : Session ID et mots de passe générés

### **Structure des étapes**
1. **Étape 1** : Informations du compte principal
2. **Étape 2** : Ajout des membres de famille
3. **Étape 3** : Vérification et confirmation
4. **Étape 4** : Succès et redirection

---

## 🎛️ DASHBOARD PRINCIPAL (app/dashboard/page.tsx)

### **Description**
Page principale du dashboard avec navigation par onglets et gestion de l'état utilisateur.

### **Fonctionnalités principales**
1. **Authentification** : Protection par AuthGuard
2. **Navigation par onglets** : Système de tabs pour organiser le contenu
3. **Gestion d'état** : État local pour les données utilisateur et activités
4. **Intégration LLM** : Évaluation et recommandations personnalisées
5. **Gestion des erreurs** : Fallbacks et messages d'erreur appropriés

### **Structure des onglets**
- **Dashboard** : Vue d'ensemble et statistiques principales
- **Statistiques** : Graphiques et analyses détaillées
- **Exercices** : Planning et suivi des exercices
- **Informations** : Profil détaillé et préférences
- **Abonnements** : Gestion des plans et facturation
- **Facturation** : Historique et documents de facturation
- **Réglages** : Configuration du compte
- **Aide** : Support et documentation

---

## 🛡️ COMPOSANT AUTHGUARD (components/AuthGuard.tsx)

### **Description**
Composant de protection qui vérifie l'authentification avant de rendre le contenu protégé.

### **Code complet avec commentaires**
```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Vérification de la présence du token
    const token = localStorage.getItem('token')
    
    if (!token) {
      setIsAuthenticated(false)
      router.replace('/login')
      return
    }

    // Token présent, authentification validée
    setIsAuthenticated(true)
  }, [router])

  // Affichage du fallback pendant la vérification
  if (isAuthenticated === null) {
    return fallback
  }

  // Redirection si non authentifié
  if (!isAuthenticated) {
    return null
  }

  // Rendu du contenu protégé
  return <>{children}</>
}
```

### **Fonctionnalités clés**
1. **Protection automatique** : Vérification du token à chaque rendu
2. **Redirection** : Navigation automatique vers la page de connexion
3. **État de chargement** : Gestion de l'état d'authentification
4. **Fallback personnalisable** : Contenu affiché pendant la vérification

---

## 👤 COMPOSANT USERHEADER (components/UserHeader.tsx)

### **Description**
En-tête utilisateur affichant les informations de profil, le temps de session et les contrôles de navigation.

### **Fonctionnalités principales**
1. **Affichage du profil** : Nom, email, statut d'abonnement
2. **Gestion du temps** : Durée de session et temps total
3. **Navigation** : Boutons de réglages et déconnexion
4. **Sélecteur de session** : Changement entre utilisateurs du même compte
5. **Indicateurs visuels** : Couleurs et icônes selon le type d'abonnement

---

## 🧭 COMPOSANT SIDEBARNAVIGATION (components/SidebarNavigation.tsx)

### **Description**
Navigation latérale fixe avec onglets organisés par fonctionnalité et type d'abonnement.

### **Structure des onglets**
```typescript
interface NavigationTab {
  id: string
  label: string
  icon: LucideIcon
  description: string
  availableFor: SubscriptionType[]
  badge?: string
}

const navigationTabs: NavigationTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Vue d\'ensemble et statistiques',
    availableFor: ['FREE', 'PRO', 'PRO_PLUS']
  },
  {
    id: 'statistiques',
    label: 'Statistiques',
    icon: BarChart3,
    description: 'Analyses détaillées et graphiques',
    availableFor: ['FREE', 'PRO', 'PRO_PLUS']
  },
  // ... autres onglets
]
```

---

## 📊 COMPOSANT DASHBOARDTAB (components/DashboardTab.tsx)

### **Description**
Contenu principal de l'onglet Dashboard avec statistiques, évaluation LLM et résumé des domaines.

### **Fonctionnalités**
1. **Statistiques principales** : Cartes avec métriques clés
2. **Évaluation LLM** : Bouton d'évaluation et affichage des résultats
3. **Résumé des domaines** : Vue d'ensemble par matière
4. **Sélection d'exercices** : Interface pour choisir les exercices
5. **Adaptation au focus** : Contenu adapté selon la matière sélectionnée

---

## 🔍 COMPOSANT STATISTICSTAB (components/StatisticsTab.tsx)

### **Description**
Onglet dédié aux statistiques détaillées avec graphiques et analyses de performance.

### **Fonctionnalités**
1. **Métriques clés** : Sessions, scores moyens, temps total
2. **Graphiques de performance** : Évolution dans le temps
3. **Analyse par domaine** : Comparaison entre matières
4. **Filtres temporels** : Différentes granularités (jour, semaine, mois)
5. **Export des données** : Téléchargement des rapports

---

## 🎯 COMPOSANT EXERCISESTAB (components/ExercisesTab.tsx)

### **Description**
Onglet de gestion des exercices avec planning hebdomadaire et suivi des progrès.

### **Fonctionnalités**
1. **Planning hebdomadaire** : Organisation des exercices par jour
2. **Statut des exercices** : En attente, en cours, terminés
3. **Système de quêtes** : Défis et objectifs à atteindre
4. **Progression** : Suivi des avancées par matière
5. **Recommandations** : Suggestions d'exercices adaptés

---

## 👤 COMPOSANT DETAILEDUSERINFO (components/DetailedUserInfo.tsx)

### **Description**
Interface complète pour la gestion du profil utilisateur avec préférences et objectifs d'apprentissage.

### **Sections principales**
1. **Informations personnelles** : Nom, âge, niveau scolaire
2. **Objectifs d'apprentissage** : Buts et aspirations
3. **Préférences** : Matières préférées et style d'apprentissage
4. **Besoins spéciaux** : Adaptations et accommodations
5. **Notes personnalisées** : Observations et commentaires
6. **Souhaits des parents** : Objectifs familiaux

---

## 🤖 COMPOSANT ANIMATEDLLMBUTTON (components/AnimatedLLMButton.tsx)

### **Description**
Bouton animé pour déclencher l'évaluation LLM avec adaptation selon le type d'abonnement.

### **Fonctionnalités**
1. **Animations** : Effets visuels avec Framer Motion
2. **Adaptation** : Style différent selon FREE vs PRO
3. **États** : Loading, succès, erreur
4. **Feedback** : Retour visuel immédiat
5. **Accessibilité** : Support clavier et lecteurs d'écran

---

## 📋 COMPOSANT ADVANCEDLLMRESULTS (components/AdvancedLLMResults.tsx)

### **Description**
Affichage structuré des résultats de l'évaluation LLM selon le contrat JSON défini.

### **Structure des résultats**
```typescript
interface LLMResponse {
  assessment: string
  exercises: Array<{
    title: string
    nodeKey: string
    description: string
  }>
  childSummary?: string
  adultSummary?: string
  keyInsights?: string[]
  recommendedExercises?: string[]
  schedulePlan?: string
  parentCoaching?: string
  teacherNotes?: string
  riskFlags?: string[]
  missingData?: string[]
}
```

---

## 💬 COMPOSANT HELPCHATBUTTON (components/HelpChatButton.tsx)

### **Description**
Bouton d'aide flottant avec interface de chat intégrée pour le support utilisateur.

### **Fonctionnalités**
1. **Chat intégré** : Interface de conversation en temps réel
2. **Actions rapides** : Boutons pour les questions fréquentes
3. **Historique** : Conservation des conversations
4. **Notifications** : Alertes pour les nouvelles réponses
5. **Accessibilité** : Support complet des technologies d'assistance

---

## 🎣 HOOKS PERSONNALISÉS

### **useSession (hooks/useSession.ts)**
Gestion de la durée de session avec persistance dans localStorage.

### **useGlobalTime (hooks/useGlobalTime.ts)**
Calcul du temps écoulé depuis l'inscription avec formatage automatique.

### **useTotalConnectionTime (hooks/useTotalConnectionTime.ts)**
Simulation du temps total de connexion avec mise à jour en temps réel.

---

## 🔧 CLIENT API (lib/api.ts)

### **Description**
Client API centralisé pour toutes les communications avec le backend.

### **Fonctionnalités**
1. **Configuration centralisée** : URL de base et en-têtes
2. **Gestion d'erreurs** : Traitement uniforme des erreurs HTTP
3. **Authentification** : Ajout automatique des tokens JWT
4. **Types TypeScript** : Support complet du typage
5. **Fallbacks** : Gestion des cas d'erreur réseau

---

## 📝 TYPES TYPESCRIPT (types/index.ts)

### **Description**
Définitions centralisées de tous les types utilisés dans l'application.

### **Types principaux**
```typescript
// Modèles de base de données
interface Account {
  id: string
  email: string
  subscriptionType: SubscriptionType
  maxSessions: number
  createdAt: Date
  totalAccountConnectionDurationMs: bigint
}

interface UserSession {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  email: string
  gender: Gender
  userType: UserType
  age: number
  grade: string
  subscriptionType: SubscriptionType
  createdAt: Date
  accountId: string
}

// Types pour les composants
interface DashboardUser {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: Gender
  userType: UserType
  age: number
  grade: string
  subscriptionType: SubscriptionType
  createdAt: Date
}

// Enums
enum SubscriptionType {
  FREE = 'FREE',
  PRO = 'PRO',
  PRO_PLUS = 'PRO_PLUS'
}

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN'
}

enum UserType {
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}
```

---

## 🎨 CONFIGURATION TAILWIND (tailwind.config.js)

### **Description**
Configuration personnalisée de Tailwind CSS avec couleurs et composants spécifiques.

### **Personnalisations**
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
```

---

## 🚀 CONFIGURATION NEXT.JS (next.config.js)

### **Description**
Configuration Next.js pour l'optimisation et la personnalisation de l'application.

### **Paramètres**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

---

## 📦 DÉPENDANCES ET SCRIPTS (package.json)

### **Dépendances principales**
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.292.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 🔍 DÉBOGAGE ET DÉVELOPPEMENT

### **Outils de développement**
1. **React DevTools** : Inspection des composants et de l'état
2. **Console navigateur** : Logs et erreurs JavaScript
3. **Network tab** : Surveillance des appels API
4. **Lighthouse** : Audit de performance et accessibilité

### **Bonnes pratiques**
1. **Composants réutilisables** : Factorisation du code commun
2. **Gestion d'état** : Hooks personnalisés pour la logique métier
3. **Types stricts** : Utilisation complète de TypeScript
4. **Accessibilité** : Support des technologies d'assistance
5. **Performance** : Optimisation des re-renders et du bundle

---

*Document créé le : 31 décembre 2025*  
*Version : 1.0*  
*Maintenu par : Équipe de développement Katiopa* 