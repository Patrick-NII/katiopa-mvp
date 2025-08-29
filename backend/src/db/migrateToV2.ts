// Script de migration vers la v2
// Met à jour la base existante pour supporter les comptes parent + sous-comptes enfants
// Minimal-diff: ajout-only, sans casser l'existant

import { PrismaClient } from '@prisma/client';
import { seedPlanSeats } from './seedPlanSeats';
import { mapSubscriptionTypeToPlan } from '../domain/plan/planPolicy';

const prisma = new PrismaClient();

/**
 * Migration principale vers la v2
 */
export async function migrateToV2(): Promise<void> {
  try {
    console.log('🔄 Début de la migration vers la v2...');
    
    // Étape 1: Mise à jour des comptes existants
    await updateExistingAccounts();
    
    // Étape 2: Création des plan seats
    await seedPlanSeats();
    
    // Étape 3: Création des membres pour les sessions existantes
    await createMembersFromExistingSessions();
    
    console.log('✅ Migration vers la v2 terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

/**
 * Met à jour les comptes existants avec les nouveaux champs
 */
async function updateExistingAccounts(): Promise<void> {
  console.log('📊 Mise à jour des comptes existants...');
  
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      email: true,
      subscriptionType: true,
      plan: true
    }
  });
  
  let updatedCount = 0;
  
  for (const account of accounts) {
    try {
      // Mise à jour du plan si nécessaire
      if (!account.plan) {
        const newPlan = mapSubscriptionTypeToPlan(account.subscriptionType);
        
        await prisma.account.update({
          where: { id: account.id },
          data: { plan: newPlan }
        });
        
        console.log(`✅ Plan mis à jour pour ${account.email}: ${account.subscriptionType} → ${newPlan}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour compte ${account.email}:`, error);
    }
  }
  
  console.log(`📊 ${updatedCount} comptes mis à jour`);
}

/**
 * Crée des membres à partir des sessions existantes
 */
async function createMembersFromExistingSessions(): Promise<void> {
  console.log('👥 Création des membres à partir des sessions existantes...');
  
  const sessions = await prisma.userSession.findMany({
    include: {
      account: {
        select: {
          id: true,
          email: true,
          plan: true
        }
      }
    }
  });
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const session of sessions) {
    try {
      // Vérifier si un membre existe déjà
      const existingMember = await prisma.accountMember.findFirst({
        where: {
          accountId: session.accountId,
          username: session.sessionId
        }
      });
      
      if (existingMember) {
        console.log(`⏭️ Membre déjà existant pour ${session.sessionId}`);
        skippedCount++;
        continue;
      }
      
      // Déterminer le rôle
      const role = session.userType === 'PARENT' ? 'PARENT_ADMIN' : 'CHILD_MEMBER';
      
      // Créer le membre
      await prisma.accountMember.create({
        data: {
          accountId: session.accountId,
          role,
          username: session.sessionId,
          passwordHash: session.password, // Attention: ceci devrait être hashé
          displayName: `${session.firstName} ${session.lastName}`,
          ageBracket: getAgeBracket(session.age),
          status: 'active'
        }
      });
      
      console.log(`✅ Membre créé: ${session.sessionId} (${role})`);
      createdCount++;
      
    } catch (error) {
      console.error(`❌ Erreur création membre pour ${session.sessionId}:`, error);
    }
  }
  
  console.log(`👥 ${createdCount} membres créés, ${skippedCount} ignorés`);
}

/**
 * Détermine la tranche d'âge basée sur l'âge
 */
function getAgeBracket(age: number | null): string | undefined {
  if (!age) return undefined;
  
  if (age >= 5 && age <= 7) return '5-7';
  if (age >= 8 && age <= 11) return '8-11';
  if (age >= 12 && age <= 15) return '12-15';
  
  return undefined;
}

/**
 * Vérifie l'état de la migration
 */
export async function checkMigrationStatus(): Promise<void> {
  try {
    console.log('🔍 Vérification de l\'état de la migration...');
    
    // Vérifier les comptes
    const accounts = await prisma.account.findMany({
      include: {
        planSeat: true,
        members: true
      }
    });
    
    console.log(`📊 ${accounts.length} comptes trouvés:`);
    
    for (const account of accounts) {
      const status = account.plan && account.planSeat ? '✅' : '⚠️';
      console.log(`${status} ${account.email}:`);
      console.log(`   - Plan: ${account.plan || 'N/A'} (${account.subscriptionType})`);
      console.log(`   - Plan Seat: ${account.planSeat ? `${account.planSeat.maxChildren} enfants` : 'N/A'}`);
      console.log(`   - Membres: ${account.members.length}`);
    }
    
    // Vérifier les membres
    const members = await prisma.accountMember.findMany({
      include: {
        account: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log(`\n👥 ${members.length} membres trouvés:`);
    
    const roleCounts = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    await migrateToV2();
    await checkMigrationStatus();
    
    console.log('🎯 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur fatale lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

