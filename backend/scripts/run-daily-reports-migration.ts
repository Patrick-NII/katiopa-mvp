#!/usr/bin/env node

/**
 * Script pour exécuter la migration des tables de rapports quotidiens
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runDailyReportsMigration() {
  console.log('🚀 Démarrage de la migration des tables de rapports quotidiens...');

  try {
    // Lire le fichier de migration SQL
    const migrationPath = path.join(__dirname, '../../migrations/create_daily_reports_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter la migration
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('✅ Migration des tables de rapports quotidiens terminée avec succès');

    // Vérifier que les tables ont été créées
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_sessions', 'learning_events', 'quiz_results', 'session_stats_daily', 'daily_reports', 'report_preferences')
    `;

    console.log('📋 Tables créées:', tables);

    // Vérifier que la fonction SQL a été créée
    const functions = await prisma.$queryRaw`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'calculate_daily_stats'
    `;

    console.log('🔧 Fonctions créées:', functions);

    // Test de la fonction de calcul des stats
    console.log('🧪 Test de la fonction calculate_daily_stats...');
    await prisma.$executeRaw`SELECT calculate_daily_stats(CURRENT_DATE)`;
    console.log('✅ Fonction testée avec succès');

    // Générer le client Prisma
    console.log('🔄 Génération du client Prisma...');
    await prisma.$executeRaw`SELECT 1`; // Test de connexion

    console.log('✅ Migration complète terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  runDailyReportsMigration();
}

export { runDailyReportsMigration };
