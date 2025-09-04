import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAvailableSessions() {
  console.log('🔍 Vérification des sessions disponibles...\n');

  try {
    // Récupérer toutes les sessions
    const sessions = await prisma.userSession.findMany({
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        userType: true,
        lastLoginAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 ${sessions.length} sessions trouvées:\n`);

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.firstName} ${session.lastName}`);
      console.log(`   - Session ID: ${session.sessionId}`);
      console.log(`   - Type: ${session.userType}`);
      console.log(`   - Actif: ${session.isActive ? 'Oui' : 'Non'}`);
      console.log(`   - Dernière connexion: ${session.lastLoginAt ? new Date(session.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}`);
      console.log('');
    });

    // Trouver les sessions enfants
    const childSessions = sessions.filter(s => s.userType === 'CHILD');
    console.log(`👶 ${childSessions.length} sessions enfants disponibles:`);
    childSessions.forEach(child => {
      console.log(`   - ${child.sessionId} (${child.firstName} ${child.lastName})`);
    });

    // Trouver les sessions parents
    const parentSessions = sessions.filter(s => s.userType === 'PARENT');
    console.log(`\n👨‍👩‍👧‍👦 ${parentSessions.length} sessions parents disponibles:`);
    parentSessions.forEach(parent => {
      console.log(`   - ${parent.sessionId} (${parent.firstName} ${parent.lastName})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableSessions();

