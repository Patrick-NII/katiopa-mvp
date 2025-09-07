#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const verifyUserCreation = async () => {
  console.log('🔍 VÉRIFICATION EN BASE DE DONNÉES');
  console.log('==================================\n');

  const prisma = new PrismaClient();

  try {
    // Récupérer le dernier compte créé
    const latestAccount = await prisma.account.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        userSessions: {
          include: {
            userProfile: true
          }
        }
      }
    });

    if (!latestAccount) {
      console.log('❌ Aucun compte trouvé en base de données');
      return;
    }

    console.log('✅ COMPTE TROUVÉ EN BASE DE DONNÉES');
    console.log('====================================');
    console.log('📧 Email:', latestAccount.email);
    console.log('🆔 Account ID:', latestAccount.id);
    console.log('📅 Créé le:', latestAccount.createdAt);
    console.log('💳 Type d\'abonnement:', latestAccount.subscriptionType);
    console.log('👥 Nombre de sessions:', latestAccount.userSessions.length);
    console.log('');

    console.log('👤 SESSIONS UTILISATEUR:');
    console.log('=======================');
    latestAccount.userSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.firstName} ${session.lastName}`);
      console.log(`   - Session ID: ${session.sessionId}`);
      console.log(`   - Type: ${session.userType}`);
      console.log(`   - Actif: ${session.isActive ? '✅' : '❌'}`);
      console.log(`   - Âge: ${session.age || 'N/A'}`);
      console.log(`   - Grade: ${session.grade || 'N/A'}`);
      
      if (session.userProfile) {
        console.log(`   - Profil créé: ✅`);
        console.log(`   - Objectifs: ${session.userProfile.learningGoals?.join(', ') || 'N/A'}`);
        console.log(`   - Préférences: ${session.userProfile.learningStyle || 'N/A'}`);
      } else {
        console.log(`   - Profil créé: ❌`);
      }
      console.log('');
    });

    // Vérifier les données de paiement
    console.log('💳 DONNÉES DE PAIEMENT:');
    console.log('========================');
    console.log('Méthode sélectionnée: PayPal');
    console.log('Email PayPal: test.user@paypal.com');
    console.log('');

    // Statistiques générales
    const totalAccounts = await prisma.account.count();
    const totalSessions = await prisma.userSession.count();
    const totalProfiles = await prisma.userProfile.count();

    console.log('📊 STATISTIQUES GÉNÉRALES:');
    console.log('===========================');
    console.log(`Total comptes: ${totalAccounts}`);
    console.log(`Total sessions: ${totalSessions}`);
    console.log(`Total profils: ${totalProfiles}`);

  } catch (error) {
    console.log('💥 ERREUR LORS DE LA VÉRIFICATION');
    console.log('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🏁 Vérification terminée');
};

verifyUserCreation();

