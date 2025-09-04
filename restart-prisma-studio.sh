#!/bin/bash

echo "🔄 Redémarrage complet de Prisma Studio avec les nouvelles modifications..."

# 1. Tuer tous les processus Prisma Studio existants
echo "🛑 Arrêt des processus Prisma Studio existants..."
pkill -f "prisma studio" || echo "Aucun processus Prisma Studio trouvé"

# 2. Régénérer le client Prisma
echo "🔧 Régénération du client Prisma..."
npm run db:generate

# 3. Attendre un peu pour s'assurer que tout est prêt
sleep 2

# 4. Redémarrer Prisma Studio
echo "🚀 Démarrage de Prisma Studio..."
npm run db:studio

echo "✅ Prisma Studio redémarré avec les nouvelles modifications !"
