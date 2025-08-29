# 🧪 Comptes de Test - Katiopa MVP

## 📋 **Vue d'ensemble**

Ce document liste tous les comptes de test disponibles pour le développement et les tests de l'application Katiopa.

## 🔑 **Informations de Connexion**

**Mot de passe universel** : `password123`

## 🆓 **Compte FREE - Famille Dupont**

### 👩 **Marie Dupont (Parent)**
- **Session ID** : `MARIE_DUPONT`
- **Email** : `demo@katiopa.com`
- **Type** : Parent
- **Âge** : 32 ans
- **Limite** : 2 sessions maximum
- **Description** : Compte gratuit pour découvrir Katiopa

### 👦 **Lucas Dupont (Enfant)**
- **Session ID** : `LUCAS_005`
- **Email** : `demo@katiopa.com`
- **Type** : Enfant
- **Âge** : 5 ans
- **Niveau** : GS (Grande Section)
- **Limite** : Compte gratuit
- **Description** : Niveau débutant, apprentissage des bases

---

## ⭐ **Compte PRO - Famille Martin**

### 👨 **Patrick Martin (Parent)**
- **Session ID** : `PATRICK_MARTIN`
- **Email** : `pro@katiopa.com`
- **Type** : Parent
- **Âge** : 35 ans
- **Limite** : 4 sessions maximum
- **Description** : Compte Pro pour familles engagées

### 👧 **Emma Martin (Enfant)**
- **Session ID** : `EMMA_006`
- **Email** : `pro@katiopa.com`
- **Type** : Enfant
- **Âge** : 6 ans
- **Niveau** : CP (Cours Préparatoire)
- **Limite** : Compte Pro
- **Description** : Niveau débutant, lecture et mathématiques
- **Activités** : 3 activités disponibles (maths, français, sciences)

### 👦 **Thomas Martin (Enfant)**
- **Session ID** : `THOMAS_007`
- **Email** : `pro@katiopa.com`
- **Type** : Enfant
- **Âge** : 7 ans
- **Niveau** : CE1 (Cours Élémentaire 1)
- **Limite** : Compte Pro
- **Description** : Niveau intermédiaire, tables de multiplication

---

## 💎 **Compte PRO_PLUS - Famille Bernard**

### 👩 **Sophie Bernard (Parent)**
- **Session ID** : `SOPHIE_BERNARD`
- **Email** : `premium@katiopa.com`
- **Type** : Parent
- **Âge** : 38 ans
- **Limite** : 6 sessions maximum
- **Description** : Compte Pro Plus pour familles nombreuses

### 👧 **Julia Bernard (Enfant)**
- **Session ID** : `JULIA_004`
- **Email** : `premium@katiopa.com`
- **Type** : Enfant
- **Âge** : 4 ans
- **Niveau** : MS (Moyenne Section)
- **Limite** : Compte Pro Plus
- **Description** : Niveau très débutant, formes et couleurs

### 👦 **Alex Bernard (Enfant)**
- **Session ID** : `ALEX_008`
- **Email** : `premium@katiopa.com`
- **Type** : Enfant
- **Âge** : 8 ans
- **Niveau** : CE2 (Cours Élémentaire 2)
- **Limite** : Compte Pro Plus
- **Description** : Niveau avancé, division et histoire

---

## 🎯 **Recommandations de Test**

### **Pour Tester l'Interface Enfant**
- **Recommandé** : `EMMA_006` (6 ans, CP)
- **Alternative** : `LUCAS_005` (5 ans, GS)

### **Pour Tester l'Interface Parent**
- **Recommandé** : `PATRICK_MARTIN` (35 ans)
- **Alternative** : `MARIE_DUPONT` (32 ans)

### **Pour Tester les Limites**
- **Compte FREE** : `MARIE_DUPONT` (2 sessions max)
- **Compte PRO** : `PATRICK_MARTIN` (4 sessions max)
- **Compte PRO_PLUS** : `SOPHIE_BERNARD` (6 sessions max)

---

## 🔧 **Maintenance des Comptes**

### **Ajout d'un Nouveau Compte**
1. Mettre à jour `backend/src/seed.ts`
2. Ajouter les informations dans `frontend/app/login/page.tsx`
3. Mettre à jour ce document
4. Exécuter `npm run seed` dans le backend

### **Modification d'un Compte**
1. Modifier `backend/src/seed.ts`
2. Mettre à jour `frontend/app/login/page.tsx`
3. Mettre à jour ce document
4. Exécuter `npm run seed` dans le backend

### **Suppression d'un Compte**
1. Retirer du `backend/src/seed.ts`
2. Retirer de `frontend/app/login/page.tsx`
3. Mettre à jour ce document
4. Exécuter `npm run seed` dans le backend

---

## 📊 **Statistiques des Comptes**

- **Total des comptes** : 3 familles
- **Total des sessions** : 8 utilisateurs
- **Répartition par type** :
  - Parents : 3
  - Enfants : 5
- **Répartition par âge** :
  - 4-5 ans : 2
  - 6-7 ans : 2
  - 8+ ans : 1
  - Parents : 3

---

## 🚨 **Sécurité**

- **Ne jamais** utiliser ces comptes en production
- **Ne jamais** partager ces identifiants publiquement
- **Changer** le mot de passe universel en production
- **Limiter** l'accès aux comptes de test

---

**Dernière mise à jour** : 28 août 2025
**Version** : 1.0.0
