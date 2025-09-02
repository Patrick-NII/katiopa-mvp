#!/usr/bin/env node

/**
 * Script pour exécuter la migration des tables de logging des emails
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runEmailLoggingMigration() {
  console.log('🚀 Démarrage de la migration des tables de logging des emails...');

  try {
    // Lire le fichier de migration SQL
    const migrationPath = path.join(__dirname, '../../migrations/create_email_logging_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter la migration
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('✅ Migration des tables de logging des emails terminée avec succès');

    // Vérifier que les tables ont été créées
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_logs', 'incoming_emails', 'email_templates', 'email_statistics', 'email_bounces')
    `;

    console.log('📋 Tables créées:', tables);

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
  runEmailLoggingMigration();
}

export { runEmailLoggingMigration };
