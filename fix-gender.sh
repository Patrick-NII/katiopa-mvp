#!/bin/bash

# Script pour corriger les genres UNKNOWN dans la base de données
# Usage: ./fix-gender.sh

echo "🔧 Correction des genres UNKNOWN dans la base de données..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "backend/scripts/fix-gender-unknown.js" ]; then
    echo "❌ Erreur: Veuillez exécuter ce script depuis la racine du projet"
    exit 1
fi

# Aller dans le répertoire backend
cd backend

# Exécuter le script de correction
echo "🚀 Exécution du script de correction..."
node scripts/fix-gender-unknown.js

echo ""
echo "✅ Script terminé !"

