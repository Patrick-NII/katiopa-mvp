import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditDatabase() {
  console.log('🔍 AUDIT COMPLET DE LA BASE DE DONNÉES KATIOPA\n');
  
  try {
    // 1. AUDIT DES COMPTES
    console.log('📊 1. AUDIT DES COMPTES');
    console.log('=' .repeat(50));
    
    const accounts = await prisma.account.findMany({
      include: {
        userSessions: {
          include: {
            activities: true,
            profile: true
          }
        }
      }
    });
    
    for (const account of accounts) {
      console.log(`\n🏠 Compte: ${account.email}`);
      console.log(`   Type: ${account.subscriptionType}`);
      console.log(`   Sessions max: ${account.maxSessions}`);
      console.log(`   Sessions actives: ${account.userSessions.length}`);
      console.log(`   Temps total: ${account.totalAccountConnectionDurationMs}ms`);
      
      // Vérifier la cohérence des sessions
      if (account.userSessions.length > account.maxSessions) {
        console.log(`   ⚠️  ALERTE: Trop de sessions (${account.userSessions.length} > ${account.maxSessions})`);
      }
      
      for (const session of account.userSessions) {
        console.log(`   👤 Session: ${session.sessionId} (${session.userType})`);
        console.log(`      Nom: ${session.firstName} ${session.lastName}`);
        console.log(`      Âge: ${session.age || 'N/A'}, Niveau: ${session.grade || 'N/A'}`);
        console.log(`      Activités: ${session.activities.length}`);
        console.log(`      Temps total: ${session.totalConnectionDurationMs}ms`);
        console.log(`      Dernière connexion: ${session.lastLoginAt || 'Jamais'}`);
        
        // Vérifier les activités
        if (session.activities.length > 0) {
          const totalDuration = session.activities.reduce((sum, act) => sum + act.durationMs, 0);
          const avgScore = session.activities.reduce((sum, act) => sum + act.score, 0) / session.activities.length;
          console.log(`      Durée totale activités: ${totalDuration}ms`);
          console.log(`      Score moyen: ${avgScore.toFixed(1)}/100`);
        }
      }
    }
    
    // 2. AUDIT DES ACTIVITÉS
    console.log('\n\n🎯 2. AUDIT DES ACTIVITÉS');
    console.log('=' .repeat(50));
    
    const activities = await prisma.activity.findMany({
      include: {
        userSession: {
          include: {
            account: true
          }
        }
      }
    });
    
    console.log(`Total des activités: ${activities.length}`);
    
    if (activities.length > 0) {
      const domains = [...new Set(activities.map(a => a.domain))];
      console.log(`Domaines: ${domains.join(', ')}`);
      
      const totalDuration = activities.reduce((sum, act) => sum + act.durationMs, 0);
      const avgScore = activities.reduce((sum, act) => sum + act.score, 0) / activities.length;
      const avgAttempts = activities.reduce((sum, act) => sum + act.attempts, 0) / activities.length;
      
      console.log(`Durée totale: ${totalDuration}ms (${Math.round(totalDuration / 60000)} minutes)`);
      console.log(`Score moyen: ${avgScore.toFixed(1)}/100`);
      console.log(`Tentatives moyennes: ${avgAttempts.toFixed(1)}`);
      
      // Vérifier la cohérence des scores
      const invalidScores = activities.filter(a => a.score < 0 || a.score > 100);
      if (invalidScores.length > 0) {
        console.log(`⚠️  ALERTE: ${invalidScores.length} activités avec scores invalides`);
      }
      
      // Vérifier la cohérence des durées
      const invalidDurations = activities.filter(a => a.durationMs < 0 || a.durationMs > 3600000);
      if (invalidDurations.length > 0) {
        console.log(`⚠️  ALERTE: ${invalidDurations.length} activités avec durées invalides`);
      }
    }
    
    // 3. AUDIT DES PROFILS
    console.log('\n\n👤 3. AUDIT DES PROFILS UTILISATEUR');
    console.log('=' .repeat(50));
    
    const profiles = await prisma.userProfile.findMany({
      include: {
        userSession: {
          include: {
            account: true
          }
        }
      }
    });
    
    console.log(`Total des profils: ${profiles.length}`);
    
    for (const profile of profiles) {
      console.log(`\n📋 Profil de ${profile.userSession.firstName} ${profile.userSession.lastName}`);
      console.log(`   Objectifs: ${profile.learningGoals.join(', ')}`);
      console.log(`   Matières préférées: ${profile.preferredSubjects.join(', ')}`);
      console.log(`   Style d'apprentissage: ${profile.learningStyle || 'N/A'}`);
      console.log(`   Difficulté: ${profile.difficulty || 'N/A'}`);
    }
    
    // 4. VÉRIFICATIONS DE COHÉRENCE
    console.log('\n\n🔍 4. VÉRIFICATIONS DE COHÉRENCE');
    console.log('=' .repeat(50));
    
    // Vérifier que chaque session a un profil si c'est un enfant
    const childrenWithoutProfiles = await prisma.userSession.findMany({
      where: {
        userType: 'CHILD',
        profile: null
      }
    });
    
    if (childrenWithoutProfiles.length > 0) {
      console.log(`⚠️  ALERTE: ${childrenWithoutProfiles.length} enfants sans profil`);
      for (const child of childrenWithoutProfiles) {
        console.log(`   - ${child.firstName} ${child.lastName} (${child.sessionId})`);
      }
    }
    
    // Vérifier la cohérence des temps de connexion
    for (const account of accounts) {
      const accountTotalTime = account.userSessions.reduce((sum, session) => sum + Number(session.totalConnectionDurationMs), 0);
      const accountTotalTimeMs = Number(account.totalAccountConnectionDurationMs);
      
      if (Math.abs(accountTotalTime - accountTotalTimeMs) > 1000) { // Tolérance de 1 seconde
        console.log(`⚠️  ALERTE: Incohérence de temps pour ${account.email}`);
        console.log(`   Temps total sessions: ${accountTotalTime}ms`);
        console.log(`   Temps total compte: ${accountTotalTimeMs}ms`);
        console.log(`   Différence: ${Math.abs(accountTotalTime - accountTotalTimeMs)}ms`);
      }
    }
    
    // 5. STATISTIQUES GÉNÉRALES
    console.log('\n\n📈 5. STATISTIQUES GÉNÉRALES');
    console.log('=' .repeat(50));
    
    const totalUsers = accounts.reduce((sum, acc) => sum + acc.userSessions.length, 0);
    const totalActivities = activities.length;
    const totalConnectionTime = accounts.reduce((sum, acc) => sum + Number(acc.totalAccountConnectionDurationMs), 0);
    
    console.log(`Comptes totaux: ${accounts.length}`);
    console.log(`Utilisateurs totaux: ${totalUsers}`);
    console.log(`Activités totales: ${totalActivities}`);
    console.log(`Temps de connexion total: ${Math.round(totalConnectionTime / 60000)} minutes`);
    
    // Répartition par type d'abonnement
    const subscriptionStats = {};
    for (const account of accounts) {
      const type = account.subscriptionType;
      if (!subscriptionStats[type]) {
        subscriptionStats[type] = { count: 0, sessions: 0, activities: 0 };
      }
      subscriptionStats[type].count++;
      subscriptionStats[type].sessions += account.userSessions.length;
      subscriptionStats[type].activities += account.userSessions.reduce((sum, session) => sum + session.activities.length, 0);
    }
    
    console.log('\nRépartition par abonnement:');
    for (const [type, stats] of Object.entries(subscriptionStats)) {
      console.log(`   ${type}: ${stats.count} comptes, ${stats.sessions} sessions, ${stats.activities} activités`);
    }
    
    // Répartition par type d'utilisateur
    const userTypeStats = {};
    for (const account of accounts) {
      for (const session of account.userSessions) {
        const type = session.userType;
        if (!userTypeStats[type]) {
          userTypeStats[type] = { count: 0, activities: 0 };
        }
        userTypeStats[type].count++;
        userTypeStats[type].activities += session.activities.length;
      }
    }
    
    console.log('\nRépartition par type d\'utilisateur:');
    for (const [type, stats] of Object.entries(userTypeStats)) {
      console.log(`   ${type}: ${stats.count} utilisateurs, ${stats.activities} activités`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'audit
auditDatabase().catch(console.error);
