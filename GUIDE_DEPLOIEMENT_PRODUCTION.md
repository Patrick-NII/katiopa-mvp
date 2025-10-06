# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION - KATIOPA MVP

**Date**: 21 septembre 2025  
**Objectif**: Déployer l'application Katiopa avec votre nom de domaine en production  
**Architectures supportées**: VPS, Cloud Provider, Docker

---

## 🎯 OPTIONS D'HÉBERGEMENT RECOMMANDÉES

### **Option 1: VPS (Recommandé) - Contrôle Total**
- **Providers**: OVH, Scaleway, DigitalOcean, Linode
- **Coût**: 15-50€/mois
- **Avantages**: Contrôle total, économique, SSL automatique
- **Stack**: Docker + Nginx + PostgreSQL

### **Option 2: Vercel + Supabase (Rapide)**
- **Frontend**: Vercel (gratuit puis $20/mois)
- **Backend**: Vercel Functions
- **Database**: Supabase (gratuit puis $25/mois)
- **Avantages**: Déploiement 1-click, SSL automatique

### **Option 3: Railway (Simplicité)**
- **Stack complète**: Railway
- **Coût**: $5-20/mois
- **Avantages**: Git-based deploy, monitoring intégré

---

## 🔧 DÉPLOIEMENT VPS (RECOMMANDÉ)

### **1. Prérequis Serveur**

```bash
# Spécifications minimales recommandées
RAM: 4GB minimum (8GB recommandé)
CPU: 2 vCores minimum
Stockage: 50GB SSD minimum
OS: Ubuntu 22.04 LTS
```

### **2. Configuration du Serveur**

```bash
# Connexion SSH à votre serveur
ssh root@votre-serveur.com

# Mise à jour système
apt update && apt upgrade -y

# Installation des dépendances
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

# Démarrage Docker
systemctl start docker
systemctl enable docker

# Création utilisateur application
useradd -m -s /bin/bash katiopa
usermod -aG docker katiopa
```

### **3. Configuration DNS**

Configurez vos enregistrements DNS chez votre registraire :

```bash
# Enregistrements A à créer
votredomaine.com        → IP_DE_VOTRE_SERVEUR
www.votredomaine.com    → IP_DE_VOTRE_SERVEUR
api.votredomaine.com    → IP_DE_VOTRE_SERVEUR

# Optionnel: sous-domaine pour l'app
app.votredomaine.com    → IP_DE_VOTRE_SERVEUR
```

---

## 📦 CONFIGURATION DOCKER COMPLÈTE

### **1. Dockerfile Backend Optimisé**


