import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAccounts() {
  try {
    console.log('🔍 Récupération des comptes en base de données...\n');

    // Récupérer tous les comptes avec leurs sessions utilisateur
    const accounts = await prisma.account.findMany({
      include: {
        userSessions: {
          where: { isActive: true },
          select: {
            id: true,
            sessionId: true,
            firstName: true,
            lastName: true,
            userType: true,
            password: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total des comptes : ${accounts.length}\n`);

    if (accounts.length === 0) {
      console.log('❌ Aucun compte trouvé en base de données');
      return;
    }

    accounts.forEach((account, index) => {
      console.log(`\n🏠 Compte ${index + 1}:`);
      console.log(`   📧 Email: ${account.email}`);
      console.log(`   💳 Abonnement: ${account.subscriptionType}`);
      console.log(`   👥 Sessions max: ${account.maxSessions}`);
      console.log(`   📅 Créé le: ${account.createdAt.toLocaleDateString('fr-FR')}`);
      console.log(`   ✅ Actif: ${account.isActive ? 'Oui' : 'Non'}`);
      
      if (account.userSessions.length > 0) {
        console.log(`   👤 Sessions utilisateur (${account.userSessions.length}):`);
        account.userSessions.forEach((session, sessionIndex) => {
          console.log(`      ${sessionIndex + 1}. ${session.firstName} ${session.lastName}`);
          console.log(`         🆔 ID: ${session.sessionId}`);
          console.log(`         🔑 Mot de passe: ${session.password}`);
          console.log(`         👶 Type: ${session.userType}`);
          console.log(`         📅 Créé le: ${session.createdAt.toLocaleDateString('fr-FR')}`);
        });
      } else {
        console.log(`   ⚠️  Aucune session utilisateur active`);
      }
    });

    // Statistiques
    const totalSessions = accounts.reduce((sum, account) => sum + account.userSessions.length, 0);
    const subscriptionTypes = accounts.reduce((acc, account) => {
      acc[account.subscriptionType] = (acc[account.subscriptionType] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Statistiques:');
    console.log(`   Total des sessions: ${totalSessions}`);
    console.log(`   Répartition des abonnements:`);
    Object.entries(subscriptionTypes).forEach(([type, count]) => {
      console.log(`      ${type}: ${count} compte(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des comptes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAccounts();
