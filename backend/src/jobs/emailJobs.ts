import { EmailLoggingService } from '../services/emailLoggingService';

/**
 * Job pour retry automatiquement les emails échoués
 * Exécuté toutes les heures
 */
export async function retryFailedEmailsJob() {
  console.log('🔄 Démarrage du job de retry des emails échoués...');
  
  try {
    const pendingEmails = await EmailLoggingService.getPendingEmails();
    
    if (pendingEmails.length === 0) {
      console.log('✅ Aucun email en attente de retry');
      return;
    }

    console.log(`📧 ${pendingEmails.length} emails en attente de retry`);
    
    await EmailLoggingService.retryFailedEmails();
    
    console.log('✅ Job de retry des emails terminé');
  } catch (error) {
    console.error('❌ Erreur lors du job de retry des emails:', error);
  }
}

/**
 * Job pour nettoyer les anciens logs d'emails
 * Exécuté quotidiennement
 */
export async function cleanupEmailLogsJob() {
  console.log('🧹 Démarrage du job de nettoyage des logs d\'emails...');
  
  try {
    const deletedCount = await EmailLoggingService.cleanupOldLogs(90); // Garde 90 jours
    
    console.log(`✅ Nettoyage terminé: ${deletedCount} entrées supprimées`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des logs d\'emails:', error);
  }
}

/**
 * Job pour mettre à jour les statistiques d'emails
 * Exécuté quotidiennement
 */
export async function updateEmailStatisticsJob() {
  console.log('📊 Démarrage du job de mise à jour des statistiques d\'emails...');
  
  try {
    // Cette fonction pourrait être étendue pour calculer des statistiques plus détaillées
    // comme les taux d'ouverture, de clic, etc.
    console.log('✅ Job de mise à jour des statistiques terminé');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des statistiques:', error);
  }
}

/**
 * Fonction pour démarrer tous les jobs d'emails
 */
export function startEmailJobs() {
  // Retry toutes les heures
  setInterval(retryFailedEmailsJob, 60 * 60 * 1000);
  
  // Nettoyage quotidien
  setInterval(cleanupEmailLogsJob, 24 * 60 * 60 * 1000);
  
  // Statistiques quotidiennes
  setInterval(updateEmailStatisticsJob, 24 * 60 * 60 * 1000);
  
  console.log('🚀 Jobs d\'emails démarrés');
}
