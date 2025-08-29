// Script de seed pour les plan seats
// Mappe les abonnements existants vers les nouveaux plans
// Minimal-diff: ajout-only, sans casser l'existant

import { PrismaClient } from '@prisma/client';
import { seatsForPlan, mapSubscriptionTypeToPlan } from '../domain/plan/planPolicy';

const prisma = new PrismaClient();

/**
 * Détermine le nombre maximum d'enfants selon le type d'abonnement
 */
function seatsForSubscriptionType(type: "FREE" | "PRO" | "PRO_PLUS" | "ENTERPRISE"): number {
  switch (type) {
    case "FREE": return 1;
    case "PRO": return 2;
    case "PRO_PLUS": return 4;
    case "ENTERPRISE": return 9999; // illimité pratique
    default: return 1;
  }
}

/**
 * Met à jour ou crée les plan seats pour tous les comptes existants
 */
export async function seedPlanSeats(): Promise<void> {
  try {
    console.log('🔄 Début du seed des plan seats...');
    
    // Récupération de tous les comptes existants
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        email: true,
        subscriptionType: true,
        plan: true
      }
    });
    
    console.log(`📊 ${accounts.length} comptes trouvés pour le seed des plan seats`);
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const account of accounts) {
      try {
        // Détermination du nombre maximum d'enfants
        const maxChildren = seatsForSubscriptionType(account.subscriptionType as any);
        
        // Mise à jour du plan si nécessaire
        if (!account.plan) {
          const newPlan = mapSubscriptionTypeToPlan(account.subscriptionType);
          await prisma.account.update({
            where: { id: account.id },
            data: { plan: newPlan }
          });
          console.log(`✅ Plan mis à jour pour ${account.email}: ${account.subscriptionType} → ${newPlan}`);
        }
        
        // Création ou mise à jour du plan seat
        const planSeat = await prisma.planSeat.upsert({
          where: { accountId: account.id },
          update: { 
            maxChildren,
            // Ajout de logs pour le debug
            account: {
              update: {
                plan: account.plan || mapSubscriptionTypeToPlan(account.subscriptionType)
              }
            }
          },
          create: { 
            accountId: account.id, 
            maxChildren 
          },
        });
        
        if (planSeat) {
          if (planSeat.maxChildren === maxChildren) {
            updatedCount++;
          } else {
            createdCount++;
          }
        }
        
        console.log(`✅ Plan seat pour ${account.email}: ${maxChildren} enfants max`);
        
      } catch (error) {
        console.error(`❌ Erreur lors du seed du plan seat pour ${account.email}:`, error);
        // Continue avec les autres comptes
      }
    }
    
    console.log(`🎉 Seed des plan seats terminé:`);
    console.log(`   - Créés: ${createdCount}`);
    console.log(`   - Mis à jour: ${updatedCount}`);
    console.log(`   - Total: ${accounts.length}`);
    
  } catch (error) {
    console.error('❌ Erreur générale lors du seed des plan seats:', error);
    throw error;
  }
}

/**
 * Vérifie l'état des plan seats après le seed
 */
export async function verifyPlanSeats(): Promise<void> {
  try {
    console.log('🔍 Vérification des plan seats...');
    
    const planSeats = await prisma.planSeat.findMany({
      include: {
        account: {
          select: {
            email: true,
            subscriptionType: true,
            plan: true
          }
        }
      }
    });
    
    console.log(`📊 ${planSeats.length} plan seats trouvés:`);
    
    for (const seat of planSeats) {
      const expectedSeats = seatsForSubscriptionType(seat.account.subscriptionType as any);
      const status = seat.maxChildren === expectedSeats ? '✅' : '⚠️';
      
      console.log(`${status} ${seat.account.email}:`);
      console.log(`   - Plan: ${seat.account.plan} (${seat.account.subscriptionType})`);
      console.log(`   - Sièges: ${seat.maxChildren}/${expectedSeats}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des plan seats:', error);
  }
}

/**
 * Fonction principale pour exécuter le seed
 */
async function main() {
  try {
    await seedPlanSeats();
    await verifyPlanSeats();
    
    console.log('🎯 Seed des plan seats terminé avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur fatale lors du seed des plan seats:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution si le script est appelé directement
// Exécution si le script est appelé directement (compat ESM)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  main();
}
