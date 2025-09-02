#!/bin/bash

# Script de déploiement optimisé pour CubeAI Backend
# Usage: ./deploy.sh [environment]

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/cubeai"
LOG_FILE="/var/log/cubeai/deploy_${TIMESTAMP}.log"

echo "🚀 Déploiement CubeAI Backend - ${ENVIRONMENT}" | tee -a "$LOG_FILE"
echo "📅 Timestamp: ${TIMESTAMP}" | tee -a "$LOG_FILE"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    log "❌ Erreur lors du déploiement. Nettoyage..."
    # Arrêter les processus en cours
    pkill -f "npm run dev" || true
    pkill -f "node dist/index.js" || true
    exit 1
}

# Trapper les erreurs
trap cleanup ERR

# Vérification des prérequis
log "🔍 Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    log "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    log "❌ npm n'est pas installé"
    exit 1
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node --version)
log "✅ Node.js version: ${NODE_VERSION}"

# Vérifier les variables d'environnement
log "🔍 Vérification des variables d'environnement..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "OPENAI_API_KEY"
    "NOREPLY_EMAIL_USER"
    "NOREPLY_EMAIL_PASSWORD"
    "SUPPORT_EMAIL_USER"
    "SUPPORT_EMAIL_PASSWORD"
    "HELLO_EMAIL_USER"
    "HELLO_EMAIL_PASSWORD"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log "❌ Variable d'environnement manquante: ${var}"
        exit 1
    fi
done

log "✅ Toutes les variables d'environnement sont définies"

# Arrêter les processus existants
log "🛑 Arrêt des processus existants..."
pkill -f "npm run dev" || true
pkill -f "node dist/index.js" || true
sleep 2

# Sauvegarde de la base de données (si en production)
if [ "$ENVIRONMENT" = "production" ]; then
    log "💾 Sauvegarde de la base de données..."
    mkdir -p "$BACKUP_DIR"
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"
    log "✅ Sauvegarde créée: $BACKUP_DIR/backup_${TIMESTAMP}.sql"
fi

# Installation des dépendances
log "📦 Installation des dépendances..."
npm ci --only=production
log "✅ Dépendances installées"

# Génération du client Prisma
log "🔧 Génération du client Prisma..."
npm run db:generate
log "✅ Client Prisma généré"

# Migration de la base de données
log "🗄️ Migration de la base de données..."
npm run db:deploy
log "✅ Base de données migrée"

# Build de production
log "🏗️ Build de production..."
npm run build
log "✅ Build terminé"

# Vérification du build
if [ ! -f "dist/index.js" ]; then
    log "❌ Le fichier de build n'existe pas"
    exit 1
fi

# Test de la compilation TypeScript
log "🔍 Vérification TypeScript..."
npm run type-check
log "✅ Vérification TypeScript réussie"

# Démarrage de l'application
log "🚀 Démarrage de l'application..."
nohup node dist/index.js > /var/log/cubeai/app.log 2>&1 &
APP_PID=$!

# Attendre que l'application démarre
sleep 5

# Vérifier que l'application fonctionne
if ! kill -0 $APP_PID 2>/dev/null; then
    log "❌ L'application n'a pas démarré correctement"
    exit 1
fi

log "✅ Application démarrée avec PID: $APP_PID"

# Test de santé
log "🏥 Test de santé de l'application..."
sleep 3

if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    log "✅ Health check réussi"
else
    log "❌ Health check échoué"
    exit 1
fi

# Nettoyage des anciens builds
log "🧹 Nettoyage des anciens builds..."
find dist -name "*.js.map" -delete 2>/dev/null || true
log "✅ Nettoyage terminé"

# Finalisation
log "🎉 Déploiement terminé avec succès!"
log "📊 Informations:"
log "   - Environnement: ${ENVIRONMENT}"
log "   - PID: ${APP_PID}"
log "   - Port: 4000"
log "   - Logs: /var/log/cubeai/app.log"
log "   - Health check: http://localhost:4000/health"

# Sauvegarder le PID
echo $APP_PID > /var/run/cubeai.pid

log "✅ Déploiement CubeAI Backend terminé"
