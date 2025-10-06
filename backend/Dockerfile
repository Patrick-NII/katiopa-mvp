# 🐳 Dockerfile Backend - Katiopa MVP Production
FROM node:18-alpine

# Métadonnées
LABEL version="1.0.0"
LABEL description="Backend Katiopa MVP - Production Ready"
LABEL maintainer="team@katiopa.com"

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4000

# Créer utilisateur non-root pour sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S katiopa -u 1001

# Répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances de production
RUN npm ci --only=production && \
    npm cache clean --force

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Changer propriétaire des fichiers
RUN chown -R katiopa:nodejs /app
USER katiopa

# Exposer le port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Commande de démarrage
CMD ["node", "dist/index.js"]

