# Amélioration de la Gestion des Statuts En Ligne/Hors Ligne

## Problème Identifié

Les indicateurs de statut en ligne/hors ligne ne se mettaient pas à jour correctement lors de la déconnexion des utilisateurs. Même après déconnexion, le statut restait affiché comme "en ligne".

## Solution Implémentée

### 1. Nouveau Hook `useSessionStatus`

**Fichier :** `frontend/hooks/useSessionStatus.ts`

Ce hook gère les événements de connexion/déconnexion de manière proactive :

- **Événements détectés :**
  - `beforeunload` : Fermeture de l'onglet/navigateur
  - `visibilitychange` : Changement d'onglet (document.hidden)
  - `storage` : Événements de déconnexion depuis d'autres onglets
  - `focus` : Retour sur l'onglet

- **Fonctionnalités :**
  - Mise à jour immédiate de l'état local
  - Synchronisation avec le backend
  - Gestion des appels multiples avec délai
  - Logs détaillés des changements de statut

### 2. Route API Améliorée

**Fichier :** `backend/src/routes/sessions.ts`

**Nouvelle route :** `POST /api/sessions/status`

- Gestion des connexions/déconnexions avec logs
- Calcul automatique du temps de session
- Mise à jour du `currentSessionStartTime` et `totalConnectionDurationMs`

**Nouvelle route :** `POST /api/sessions/cleanup-orphaned-sessions`

- Nettoyage automatique des sessions "orphelines" (en ligne depuis plus de 30 minutes)
- Prévention des statuts incorrects persistants

### 3. Hook `useRealTimeStatus` Amélioré

**Fichier :** `frontend/hooks/useRealTimeStatus.ts`

- Intégration du nettoyage automatique des sessions orphelines
- Polling toutes les 5 secondes avec vérification
- Mise à jour en temps réel des statuts

### 4. Composants Mise à Jour

**InactivityManager :** `frontend/components/InactivityManager.tsx`
- Signalement de déconnexion avant logout
- Gestion du sessionId pour les mises à jour

**NavBar :** `frontend/components/NavBar.tsx`
- Signalement de déconnexion lors du clic sur logout
- Synchronisation avec le backend

## Fonctionnement

### Événements de Déconnexion

1. **Fermeture d'onglet :** `beforeunload` → `signalDisconnect()`
2. **Changement d'onglet :** `visibilitychange` → `signalDisconnect()` si `document.hidden`
3. **Logout manuel :** Clic sur bouton → Appel API → `signalDisconnect()`
4. **Inactivité :** Timeout → `signalDisconnect()`

### Mise à Jour du Statut

1. **Déconnexion détectée :**
   - Mise à jour immédiate de l'état local (`isOnline: false`)
   - Appel API avec délai de 1 seconde
   - Mise à jour du `currentSessionStartTime` à `null`
   - Calcul et ajout du temps de session au total

2. **Reconnexion détectée :**
   - Mise à jour immédiate de l'état local (`isOnline: true`)
   - Appel API immédiat
   - Mise à jour du `currentSessionStartTime` à la date actuelle

### Nettoyage Automatique

- **Polling :** Toutes les 5 secondes
- **Critère :** Sessions en ligne depuis plus de 30 minutes
- **Action :** Mise à jour automatique du statut à "hors ligne"
- **Logs :** Affichage des sessions nettoyées

## Avantages

1. **Fiabilité :** Les statuts reflètent maintenant la réalité des connexions
2. **Temps réel :** Mise à jour immédiate lors des événements de déconnexion
3. **Robustesse :** Nettoyage automatique des sessions orphelines
4. **Traçabilité :** Logs détaillés pour le debugging
5. **Performance :** Optimisation des appels API avec délais

## Test

Un script de test a été créé : `backend/scripts/test-session-status.js`

```bash
cd backend/scripts
node test-session-status.js
```

Ce script teste :
- Récupération des sessions existantes
- Nettoyage des sessions orphelines
- Simulation de connexions/déconnexions
- Vérification des mises à jour de statut

## Monitoring

Les logs suivants sont maintenant disponibles dans la console :

- `🟢 Session [ID] connectée à [timestamp]`
- `🔴 Session [ID] déconnectée à [timestamp], durée: [X]s`
- `🧹 Session orpheline [ID] nettoyée`

## Compatibilité

Cette solution est compatible avec :
- Tous les navigateurs modernes
- Les sessions multiples (onglets multiples)
- Les déconnexions forcées (fermeture brutale)
- Les changements d'onglet
- Les timeouts d'inactivité
