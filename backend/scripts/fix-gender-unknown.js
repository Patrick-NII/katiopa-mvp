#!/usr/bin/env node

/**
 * Script pour corriger les genres UNKNOWN dans la base de données
 * Usage: node fix-gender-unknown.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGenderUnknown() {
  console.log('🔧 Début de la correction des genres UNKNOWN...\n');

  try {
    // 1. Vérifier les comptes avec genre UNKNOWN
    console.log('📊 Comptes avec genre UNKNOWN avant correction:');
    const unknownBefore = await prisma.userSession.findMany({
      where: { gender: 'UNKNOWN' },
      select: { sessionId: true, firstName: true, lastName: true, userType: true }
    });
    
    console.table(unknownBefore);
    console.log(`Total: ${unknownBefore.length} comptes\n`);

    // 2. Correction des comptes spécifiques
    console.log('🎯 Correction des comptes spécifiques...');
    const specificUpdates = await prisma.userSession.updateMany({
      where: {
        sessionId: { in: ['patrick', 'milan123'] },
        gender: 'UNKNOWN'
      },
      data: { gender: 'MALE' }
    });
    console.log(`✅ ${specificUpdates.count} comptes spécifiques mis à jour\n`);

    // 3. Correction basée sur les prénoms masculins
    console.log('👨 Correction des prénoms masculins...');
    const maleNames = [
      'patrick', 'milan', 'aylon', 'pierre', 'paul', 'jean', 'michel', 
      'alain', 'philippe', 'bernard', 'daniel', 'christophe', 'nicolas', 
      'olivier', 'laurent', 'thomas', 'antoine', 'julien', 'sebastien', 
      'vincent', 'fabrice', 'david', 'eric'
    ];
    
    const maleUpdates = await prisma.userSession.updateMany({
      where: {
        gender: 'UNKNOWN',
        firstName: { 
          in: maleNames
        }
      },
      data: { gender: 'MALE' }
    });
    console.log(`✅ ${maleUpdates.count} prénoms masculins mis à jour\n`);

    // 4. Correction basée sur les prénoms féminins
    console.log('👩 Correction des prénoms féminins...');
    const femaleNames = [
      'sophie', 'marie', 'anne', 'catherine', 'isabelle', 'nathalie', 
      'patricia', 'christine', 'sylvie', 'veronique', 'sandrine', 
      'stephanie', 'caroline', 'julie', 'audrey', 'melanie', 'celine', 
      'emilie', 'jessica', 'laura', 'charlotte', 'lea', 'manon', 
      'camille', 'oceane', 'lucie', 'clara'
    ];
    
    const femaleUpdates = await prisma.userSession.updateMany({
      where: {
        gender: 'UNKNOWN',
        firstName: { 
          in: femaleNames
        }
      },
      data: { gender: 'FEMALE' }
    });
    console.log(`✅ ${femaleUpdates.count} prénoms féminins mis à jour\n`);

    // 5. Vérification finale
    console.log('📊 Comptes avec genre UNKNOWN après correction:');
    const unknownAfter = await prisma.userSession.findMany({
      where: { gender: 'UNKNOWN' },
      select: { sessionId: true, firstName: true, lastName: true, userType: true }
    });
    
    console.table(unknownAfter);
    console.log(`Total restant: ${unknownAfter.length} comptes\n`);

    // 6. Statistiques finales
    console.log('📈 Statistiques finales par genre:');
    const stats = await prisma.userSession.groupBy({
      by: ['gender'],
      _count: { gender: true }
    });
    
    console.table(stats.map(stat => ({
      Genre: stat.gender,
      Nombre: stat._count.gender
    })));

    console.log('\n🎉 Correction terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
fixGenderUnknown()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script échoué:', error);
    process.exit(1);
  });

export { fixGenderUnknown };
