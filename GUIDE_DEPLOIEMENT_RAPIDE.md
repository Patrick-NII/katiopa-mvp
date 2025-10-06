# 🚀 GUIDE DÉPLOIEMENT RAPIDE - KATIOPA MVP

**Objectif**: Déployer rapidement votre application Katiopa avec votre nom de domaine  
**Durée**: 15-30 minutes  
**Niveau**: Débutant à Intermédiaire

---

## 🎯 OPTION 1: DÉPLOIEMENT VPS (RECOMMANDÉ)

### **📋 Prérequis**
- Un VPS (OVH, Scaleway, DigitalOcean) avec Ubuntu 22.04
- Votre nom de domaine configuré pour pointer vers votre serveur
- Accès SSH root au serveur
- Clé API OpenAI

### **⚡ Déploiement en 5 Étapes**

#### **1. Préparation du Serveur**
```bash
# Connexion SSH
ssh root@votre-serveur.com

# Installation automatique des dépendances
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose git curl

# Clone du projet
git clone https://github.com/votre-compte/katiopa-mvp.git
cd katiopa-mvp
```

#### **2. Configuration**
```bash
# Copier le fichier d'environnement
cp production.env.example .env.production

# Éditer la configuration
nano .env.production
```

**Variables à modifier dans `.env.production` :**
```bash
DOMAIN_NAME=votredomaine.com
DATABASE_PASSWORD=GenerezUnMotDePasseTresSecurise123!
JWT_SECRET=GenerezUnSecretTresLongEtAleatoire64Caracteres!
COOKIE_SECRET=AutreSecretTresLongEtAleatoire64Caracteres!
OPENAI_API_KEY=sk-proj-VotreCleOpenAI
```

#### **3. Génération des Secrets**
```bash
# Générer des secrets sécurisés
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env.production
echo "COOKIE_SECRET=$(openssl rand -hex 64)" >> .env.production
echo "DATABASE_PASSWORD=$(openssl rand -base64 32)" >> .env.production
```

#### **4. Configuration DNS**
Chez votre registraire de domaine, créez ces enregistrements :
```
Type A    | votredomaine.com      | IP_DE_VOTRE_SERVEUR
Type A    | www.votredomaine.com  | IP_DE_VOTRE_SERVEUR
Type A    | api.votredomaine.com  | IP_DE_VOTRE_SERVEUR
```

#### **5. Déploiement Automatique**
```bash
# Lancer le déploiement
./deploy-production.sh votredomaine.com

# Attendre 5-10 minutes pour le déploiement complet
```

---

## 🎯 OPTION 2: VERCEL + SUPABASE (RAPIDE)

### **📋 Avantages**
- Déploiement en 1-click
- SSL automatique
- Scaling automatique
- Interface graphique

### **⚡ Déploiement en 3 Étapes**

#### **1. Frontend sur Vercel**
```bash
# Installation Vercel CLI
npm i -g vercel

# Dans le dossier frontend
cd frontend
vercel

# Suivre les instructions, configurer le domaine
```

#### **2. Base de Données Supabase**
- Aller sur [supabase.com](https://supabase.com)
- Créer un nouveau projet
- Copier l'URL de connexion PostgreSQL

#### **3. Backend sur Vercel**
```bash
# Dans le dossier backend
cd ../backend
vercel

# Variables d'environnement à ajouter sur Vercel:
DATABASE_URL=votre_url_supabase
JWT_SECRET=votre_secret
OPENAI_API_KEY=votre_cle
```

---

## 🎯 OPTION 3: RAILWAY (ULTRA-SIMPLE)

### **⚡ Déploiement en 2 Étapes**

#### **1. Connection GitHub**
- Aller sur [railway.app](https://railway.app)
- Connecter votre repo GitHub
- Cliquer "Deploy Now"

#### **2. Configuration**
- Ajouter PostgreSQL depuis l'interface
- Configurer les variables d'environnement
- Ajouter votre domaine personnalisé

---

## 🔧 CONFIGURATION AVANCÉE

### **🔐 SSL Let's Encrypt (Après déploiement VPS)**
```bash
# Installation Certbot
apt install -y certbot python3-certbot-nginx

# Génération certificat
certbot certonly --standalone -d votredomaine.com -d www.votredomaine.com

# Redémarrer nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### **📊 Monitoring et Logs**
```bash
# Voir les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Status des services
docker-compose -f docker-compose.prod.yml ps

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart backend
```

### **💾 Sauvegarde Automatique**
```bash
# Créer un cron job pour sauvegarde quotidienne
crontab -e

# Ajouter cette ligne (sauvegarde à 2h du matin)
0 2 * * * cd /path/to/katiopa-mvp && docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U katiopa_user katiopa_db > ./backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🚨 DÉPANNAGE RAPIDE

### **🔍 Problèmes Courants**

#### **Frontend ne charge pas**
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs frontend

# Redémarrer
docker-compose -f docker-compose.prod.yml restart frontend
```

#### **API ne répond pas**
```bash
# Vérifier la base de données
docker-compose -f docker-compose.prod.yml logs postgres

# Tester l'API
curl http://localhost:4000/health
```

#### **Erreurs de permissions**
```bash
# Changer propriétaire des fichiers
chown -R $USER:$USER .

# Redémarrer Docker
systemctl restart docker
```

### **📞 Support d'Urgence**
Si problème critique :
1. Vérifier les logs : `docker-compose logs`
2. Redémarrer tous les services : `docker-compose restart`
3. Revenir à la sauvegarde : restaurer depuis `./backups/`

---

## ✅ CHECKLIST FINALE

### **🎯 Avant de mettre en ligne**
- [ ] DNS configurés et propagés (24h max)
- [ ] SSL configuré et fonctionnel
- [ ] Base de données migrée et seedée
- [ ] API répond à `/health`
- [ ] Frontend accessible
- [ ] Variables d'environnement sécurisées
- [ ] Sauvegarde automatique configurée

### **🚀 Tests de Production**
- [ ] Inscription utilisateur fonctionne
- [ ] Connexion/déconnexion OK
- [ ] Fonctionnalités Bubix opérationnelles
- [ ] Emails de notification envoyés
- [ ] Performance acceptable (< 3s)

---

## 🎉 FÉLICITATIONS !

Votre application **Katiopa MVP** est maintenant en ligne ! 🚀

**URLs de votre application :**
- 🌍 **Application** : https://votredomaine.com
- 🔧 **API** : https://api.votredomaine.com
- 📊 **Monitoring** : https://votredomaine.com/health

**Prochaines étapes :**
1. 📊 Configurer Google Analytics
2. 🔍 Mettre en place monitoring (Sentry)
3. 📧 Tester l'envoi d'emails
4. 🔄 Configurer CI/CD pour les mises à jour
5. 📱 Optimiser pour mobile

---

**Besoin d'aide ?** Consultez la documentation complète dans `GUIDE_DEPLOIEMENT_PRODUCTION.md` ! 📚

