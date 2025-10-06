#!/bin/bash

# 🚀 Script de Déploiement Production - Katiopa MVP
# Usage: ./deploy-production.sh [votre-domaine.com]

set -e  # Arrêter en cas d'erreur

# Variables
DOMAIN_NAME=${1:-"votredomaine.com"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy_${TIMESTAMP}.log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERREUR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1" | tee -a "$LOG_FILE"
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    error "Erreur lors du déploiement. Nettoyage..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    exit 1
}

# Trapper les erreurs
trap cleanup ERR

# Créer les répertoires nécessaires
mkdir -p logs backups ssl nginx

echo ""
echo "🚀 ========================================="
echo "🎯 DÉPLOIEMENT KATIOPA MVP EN PRODUCTION"
echo "🌐 Domaine: ${DOMAIN_NAME}"
echo "📅 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# 1. Vérification des prérequis
log "🔍 Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé. Installez Docker d'abord."
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé."
    exit 1
fi

# Vérifier les fichiers de configuration
if [ ! -f ".env.production" ]; then
    error "Fichier .env.production manquant."
    echo "Copiez production.env.example vers .env.production et configurez-le:"
    echo "cp production.env.example .env.production"
    echo "nano .env.production"
    exit 1
fi

success "Prérequis vérifiés"

# 2. Vérification de la configuration
log "📋 Vérification de la configuration..."

# Charger les variables d'environnement
source .env.production

# Vérifier les variables critiques
REQUIRED_VARS=(
    "DOMAIN_NAME"
    "DATABASE_PASSWORD"
    "JWT_SECRET"
    "COOKIE_SECRET"
    "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Variable d'environnement manquante: ${var}"
        exit 1
    fi
done

success "Configuration vérifiée"

# 3. Mise à jour du nom de domaine dans nginx
log "🌐 Configuration du nom de domaine..."
sed -i.bak "s/DOMAIN_NAME/${DOMAIN_NAME}/g" nginx/nginx.conf
success "Nginx configuré pour ${DOMAIN_NAME}"

# 4. Génération des certificats SSL auto-signés (pour test)
log "🔐 Génération des certificats SSL temporaires..."
if [ ! -f "ssl/katiopa.crt" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/katiopa.key \
        -out ssl/katiopa.crt \
        -subj "/C=FR/ST=France/L=Paris/O=Katiopa/CN=${DOMAIN_NAME}"
    success "Certificats SSL générés (temporaires)"
    warning "⚠️  Remplacez par de vrais certificats SSL en production!"
    warning "Utilisez: certbot certonly --standalone -d ${DOMAIN_NAME}"
fi

# 5. Sauvegarde si base existante
if [ -f "postgres_data" ]; then
    log "💾 Sauvegarde de la base de données existante..."
    mkdir -p "$BACKUP_DIR"
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U katiopa_user katiopa_db > "$BACKUP_DIR/backup_${TIMESTAMP}.sql" 2>/dev/null || true
    success "Sauvegarde créée: $BACKUP_DIR/backup_${TIMESTAMP}.sql"
fi

# 6. Arrêt des services existants
log "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker system prune -f
success "Services arrêtés et nettoyés"

# 7. Build des images
log "🏗️ Construction des images Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache
success "Images construites"

# 8. Démarrage des services
log "🚀 Démarrage des services en production..."
docker-compose -f docker-compose.prod.yml up -d

# 9. Attendre que les services démarrent
log "⏳ Attente du démarrage des services..."
sleep 30

# 10. Vérification de la santé des services
log "🏥 Vérification de la santé des services..."

# Vérifier PostgreSQL
if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U katiopa_user &>/dev/null; then
    success "✅ PostgreSQL: OK"
else
    error "❌ PostgreSQL: ÉCHEC"
fi

# Vérifier Backend
sleep 10
if curl -f http://localhost:4000/health &>/dev/null; then
    success "✅ Backend: OK"
else
    error "❌ Backend: ÉCHEC"
fi

# Vérifier Frontend
if curl -f http://localhost:3000 &>/dev/null; then
    success "✅ Frontend: OK"
else
    error "❌ Frontend: ÉCHEC"
fi

# Vérifier Nginx
if curl -f http://localhost &>/dev/null; then
    success "✅ Nginx: OK"
else
    warning "⚠️ Nginx: Vérifiez la configuration SSL"
fi

# 11. Migration de la base de données
log "🗄️ Migration de la base de données..."
docker-compose -f docker-compose.prod.yml exec backend npm run db:deploy
success "Base de données migrée"

# 12. Affichage des informations finales
echo ""
echo "🎉 ========================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo "========================================="
echo ""
echo "📊 Informations de déploiement:"
echo "  🌐 Domaine: ${DOMAIN_NAME}"
echo "  🕒 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  📝 Logs: ${LOG_FILE}"
echo ""
echo "🔗 URLs d'accès:"
echo "  🌍 Application: https://${DOMAIN_NAME}"
echo "  🔧 API: https://api.${DOMAIN_NAME}"
echo "  🏥 Health Check: http://localhost:4000/health"
echo ""
echo "📋 Services actifs:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Configurez vos DNS pour pointer vers ce serveur"
echo "  2. Installez de vrais certificats SSL avec Let's Encrypt:"
echo "     certbot certonly --standalone -d ${DOMAIN_NAME}"
echo "  3. Redémarrez nginx après installation SSL:"
echo "     docker-compose -f docker-compose.prod.yml restart nginx"
echo "  4. Configurez la sauvegarde automatique"
echo "  5. Configurez le monitoring"
echo ""
echo "🔧 Commandes utiles:"
echo "  📊 Voir les logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  🔄 Redémarrer: docker-compose -f docker-compose.prod.yml restart"
echo "  🛑 Arrêter: docker-compose -f docker-compose.prod.yml down"
echo ""

# 13. Configuration des logs
log "📝 Configuration du logging..."
docker-compose -f docker-compose.prod.yml logs > logs/services_${TIMESTAMP}.log 2>&1 &

success "Déploiement terminé! 🚀"
echo ""
warning "⚠️  N'oubliez pas de configurer vos DNS et vos certificats SSL!"
echo ""

