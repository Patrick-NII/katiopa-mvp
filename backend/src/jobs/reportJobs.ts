import { DailyReportService } from '../services/dailyReportService';

/**
 * Job pour générer les rapports quotidiens
 * Exécuté quotidiennement à 19:30
 */
export async function generateDailyReportsJob() {
  console.log('📊 Démarrage du job de génération des rapports quotidiens...');
  
  try {
    const targetDate = new Date();
    
    await DailyReportService.generateAndSendDailyReports(targetDate);
    
    console.log('✅ Job de génération des rapports quotidiens terminé');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des rapports quotidiens:', error);
  }
}

/**
 * Job pour calculer les statistiques journalières
 * Exécuté quotidiennement à 18:00 (avant les rapports)
 */
export async function calculateDailyStatsJob() {
  console.log('📈 Démarrage du job de calcul des statistiques journalières...');
  
  try {
    const targetDate = new Date();
    
    // Utiliser la fonction SQL directement
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$executeRaw`SELECT calculate_daily_stats(${targetDate})`;
    
    console.log('✅ Job de calcul des statistiques journalières terminé');
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques journalières:', error);
  }
}

/**
 * Job pour nettoyer les anciens rapports
 * Exécuté hebdomadairement
 */
export async function cleanupOldReportsJob() {
  console.log('🧹 Démarrage du job de nettoyage des anciens rapports...');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Supprimer les rapports de plus de 1 an
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const deletedCount = await prisma.dailyReport.deleteMany({
      where: {
        date: { lt: oneYearAgo },
        status: { in: ['sent', 'failed'] }
      }
    });
    
    console.log(`✅ Nettoyage terminé: ${deletedCount.count} rapports supprimés`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des rapports:', error);
  }
}

/**
 * Fonction pour démarrer tous les jobs de rapports
 */
export function startReportJobs() {
  // Calcul des stats quotidien à 18:00
  setInterval(calculateDailyStatsJob, 24 * 60 * 60 * 1000);
  
  // Génération des rapports quotidien à 19:30
  setTimeout(() => {
    setInterval(generateDailyReportsJob, 24 * 60 * 60 * 1000);
  }, 30 * 60 * 1000); // Délai de 30 minutes pour commencer à 19:30
  
  // Nettoyage hebdomadaire
  setInterval(cleanupOldReportsJob, 7 * 24 * 60 * 60 * 1000);
  
  console.log('🚀 Jobs de rapports quotidiens démarrés');
}
