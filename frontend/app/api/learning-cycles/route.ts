import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction utilitaire pour obtenir le début de la semaine (lundi)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
  return new Date(d.setDate(diff));
}

// Fonction utilitaire pour obtenir la fin de la semaine (dimanche)
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

// GET - Récupérer les cycles d'apprentissage d'un enfant
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    
    // Vérifier si c'est un parent ou un enfant
    if (decoded.userType !== 'PARENT' && decoded.userType !== 'CHILD') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const childSessionId = searchParams.get('childSessionId');
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0'); // 0 = semaine actuelle, -1 = semaine précédente, etc.

    // Calculer la semaine demandée
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);

    let sessionId = decoded.userId;
    
    // Si c'est un parent qui demande les données d'un enfant spécifique
    if (decoded.userType === 'PARENT' && childSessionId) {
      // Vérifier que l'enfant appartient au parent
      const childSession = await prisma.userSession.findFirst({
        where: {
          id: childSessionId,
          accountId: decoded.accountId
        }
      });
      
      if (!childSession) {
        return NextResponse.json({ error: 'Session enfant non trouvée' }, { status: 404 });
      }
      
      sessionId = childSessionId;
    }

    // Récupérer ou créer le cycle d'apprentissage pour cette semaine
    let learningCycle = await prisma.learningCycle.findUnique({
      where: {
        userSessionId_weekStartDate: {
          userSessionId: sessionId,
          weekStartDate: weekStart
        }
      },
      include: {
        userSession: {
          select: {
            firstName: true,
            lastName: true,
            sessionId: true,
            age: true
          }
        }
      }
    });

    // Si le cycle n'existe pas, le créer
    if (!learningCycle) {
      learningCycle = await prisma.learningCycle.create({
        data: {
          userSessionId: sessionId,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalProgress: 0
        },
        include: {
          userSession: {
            select: {
              firstName: true,
              lastName: true,
              sessionId: true,
              age: true
            }
          }
        }
      });
    }

    // Calculer les jours complétés
    const completedDays = [];
    if (learningCycle.mondayCompleted) completedDays.push('monday');
    if (learningCycle.tuesdayCompleted) completedDays.push('tuesday');
    if (learningCycle.wednesdayCompleted) completedDays.push('wednesday');
    if (learningCycle.thursdayCompleted) completedDays.push('thursday');
    if (learningCycle.fridayCompleted) completedDays.push('friday');
    if (learningCycle.weekendCompleted) completedDays.push('weekend');

    // Récupérer les préférences de l'enfant
    const childPreferences = await prisma.childPreferences.findUnique({
      where: { userSessionId: sessionId }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: learningCycle.id,
        weekStart: learningCycle.weekStartDate,
        weekEnd: learningCycle.weekEndDate,
        completedDays,
        totalProgress: learningCycle.totalProgress,
        childInfo: {
          name: `${learningCycle.userSession.firstName} ${learningCycle.userSession.lastName}`,
          sessionId: learningCycle.userSession.sessionId,
          age: learningCycle.userSession.age
        },
        preferences: childPreferences,
        createdAt: learningCycle.createdAt,
        updatedAt: learningCycle.updatedAt
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des cycles:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// POST - Marquer un jour comme complété
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    
    if (decoded.userType !== 'CHILD') {
      return NextResponse.json({ error: 'Seuls les enfants peuvent marquer des jours comme complétés' }, { status: 403 });
    }

    const { dayOfWeek, weekOffset = 0 } = await request.json();

    if (!dayOfWeek || !['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend'].includes(dayOfWeek)) {
      return NextResponse.json({ error: 'Jour de la semaine invalide' }, { status: 400 });
    }

    // Calculer la semaine
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);

    // Récupérer ou créer le cycle d'apprentissage
    let learningCycle = await prisma.learningCycle.findUnique({
      where: {
        userSessionId_weekStartDate: {
          userSessionId: decoded.sessionId,
          weekStartDate: weekStart
        }
      }
    });

    if (!learningCycle) {
      learningCycle = await prisma.learningCycle.create({
        data: {
          userSessionId: decoded.sessionId,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalProgress: 0
        }
      });
    }

    // Marquer le jour comme complété
    const updateData: any = {};
    updateData[`${dayOfWeek}Completed`] = true;
    
    // Recalculer le progrès total
    const currentProgress = [
      learningCycle.mondayCompleted,
      learningCycle.tuesdayCompleted,
      learningCycle.wednesdayCompleted,
      learningCycle.thursdayCompleted,
      learningCycle.fridayCompleted,
      learningCycle.weekendCompleted
    ].filter(Boolean).length;

    updateData.totalProgress = currentProgress + 1;

    const updatedCycle = await prisma.learningCycle.update({
      where: { id: learningCycle.id },
      data: updateData
    });

    // Enregistrer l'analytics de communication
    await prisma.communicationAnalytics.create({
      data: {
        userSessionId: decoded.sessionId,
        communicationStyle: 'finland', // Style par défaut pour les accomplissements
        messageType: 'achievement',
        effectiveness: 1.0, // Score élevé pour un jour complété
        context: {
          dayCompleted: dayOfWeek,
          weekStart: weekStart,
          totalProgress: updatedCycle.totalProgress
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Jour ${dayOfWeek} marqué comme complété`,
      data: {
        dayCompleted: dayOfWeek,
        totalProgress: updatedCycle.totalProgress,
        weekProgress: {
          monday: updatedCycle.mondayCompleted,
          tuesday: updatedCycle.tuesdayCompleted,
          wednesday: updatedCycle.wednesdayCompleted,
          thursday: updatedCycle.thursdayCompleted,
          friday: updatedCycle.fridayCompleted,
          weekend: updatedCycle.weekendCompleted
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du cycle:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour les préférences de l'enfant
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    
    if (decoded.userType !== 'CHILD') {
      return NextResponse.json({ error: 'Seuls les enfants peuvent mettre à jour leurs préférences' }, { status: 403 });
    }

    const preferences = await request.json();

    const updatedPreferences = await prisma.childPreferences.upsert({
      where: { userSessionId: decoded.sessionId },
      update: {
        learningStyle: preferences.learningStyle || [],
        interests: preferences.interests || [],
        preferredModules: preferences.preferredModules || [],
        communicationStyle: preferences.communicationStyle,
        difficultyPreference: preferences.difficultyPreference,
        sessionLength: preferences.sessionLength,
        timeOfDay: preferences.timeOfDay || [],
        weeklyGoals: preferences.weeklyGoals
      },
      create: {
        userSessionId: decoded.sessionId,
        learningStyle: preferences.learningStyle || [],
        interests: preferences.interests || [],
        preferredModules: preferences.preferredModules || [],
        communicationStyle: preferences.communicationStyle,
        difficultyPreference: preferences.difficultyPreference,
        sessionLength: preferences.sessionLength,
        timeOfDay: preferences.timeOfDay || [],
        weeklyGoals: preferences.weeklyGoals
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
