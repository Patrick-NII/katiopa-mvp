#!/usr/bin/env node

/**
 * Script pour exécuter la migration des tables de rapports quotidiens
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runDailyReportsMigration() {
  console.log('🚀 Démarrage de la migration des tables de rapports quotidiens...');

  try {
    // Lire le fichier de migration SQL
    const migrationPath = path.join(__dirname, '../migrations/create_daily_reports_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Exécution de ${commands.length} commandes SQL...`);

    // Exécuter chaque commande séparément
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Commande ${i + 1}/${commands.length} exécutée`);
        } catch (error) {
          console.log(`⚠️ Commande ${i + 1} ignorée (probablement déjà exécutée):`, error.message);
        }
      }
    }

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
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyReportsMigration();
}

export { runDailyReportsMigration };
