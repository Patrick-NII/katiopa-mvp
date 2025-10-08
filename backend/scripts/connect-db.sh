#!/bin/bash

# 🗃️  Script de connexion à la base de données PostgreSQL
# Usage: ./connect-db.sh

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║   🗃️  CONNEXION À LA BASE DE DONNÉES PostgreSQL                          ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ Variables d'environnement chargées depuis .env"
else
  echo "⚠️  Fichier .env non trouvé"
fi

# Extraire les informations de connexion
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non définie"
  echo ""
  echo "📝 Format attendu:"
  echo "   postgresql://user:password@host:port/database"
  echo ""
  exit 1
fi

echo "🔗 URL de connexion: ${DATABASE_URL}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 COMMANDES UTILES DANS PSQL:"
echo ""
echo "  \\dt              - Lister toutes les tables"
echo "  \\d+ table_name   - Décrire une table"
echo "  \\x on            - Affichage étendu (pour JSON)"
echo "  \\q               - Quitter"
echo ""
echo "📊 REQUÊTES PRÉPARÉES:"
echo ""
echo "  \\i scripts/query-cubematch-metrics.sql  - Exécuter les requêtes"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Connexion à la base de données..."
echo ""

# Connexion à psql
psql "$DATABASE_URL"

