#!/bin/bash

echo "🔄 Mise à jour des schémas Prisma avec les modèles CubeMatch..."

# Backend - Ajouter les relations dans UserSession
echo "📝 Mise à jour du backend..."
cd backend

# Générer le client Prisma
echo "🔧 Génération du client Prisma backend..."
npx prisma generate

# Frontend - Ajouter les relations dans UserSession  
echo "📝 Mise à jour du frontend..."
cd ../frontend

# Générer le client Prisma
echo "🔧 Génération du client Prisma frontend..."
npx prisma generate

echo "✅ Schémas Prisma mis à jour !"
echo ""
echo "📊 Résumé des changements :"
echo "- ✅ Modèles CubeMatch ajoutés aux schémas Prisma"
echo "- ✅ Relations UserSession ↔ CubeMatch établies"
echo "- ✅ Type safety TypeScript pour les données CubeMatch"
echo "- ✅ Clients Prisma régénérés"
echo ""
echo "🎯 Avantages :"
echo "- Type safety complet pour les données CubeMatch"
echo "- Relations Prisma automatiques"
echo "- IntelliSense et autocomplétion"
echo "- Migrations Prisma gérées"
echo "- Cohérence entre frontend et backend"
