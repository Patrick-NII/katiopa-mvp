import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction utilitaire pour formater le temps en millisecondes en format lisible
function formatDuration(ms: number): string {
  if (!ms || ms === 0) return '0 min';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}j ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}min`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  } else {
    return `${seconds}s`;
  }
}

// Fonction pour calculer le temps en ligne depuis le début de session
function getOnlineDuration(currentSessionStartTime: Date | null): string {
  if (!currentSessionStartTime) return '0 min';
  
  const now = new Date();
  const diffMs = now.getTime() - currentSessionStartTime.getTime();
  return formatDuration(diffMs);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    if (!decoded || decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès non autorisé - Seuls les parents peuvent accéder aux sessions enfants' }, { status: 403 });
    }

    // Récupérer toutes les sessions enfants du compte
    const childSessions = await prisma.userSession.findMany({
      where: {
        accountId: decoded.accountId,
        userType: 'CHILD',
        isActive: true
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        age: true,
        grade: true,
        lastLoginAt: true,
        currentSessionStartTime: true,
        totalConnectionDurationMs: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformer les données pour correspondre à l'interface ChildSession
    const formattedSessions = childSessions.map(session => {
      const totalTimeMs = Number(session.totalConnectionDurationMs) || 0;
      const onlineDuration = getOnlineDuration(session.currentSessionStartTime);
      
      return {
        id: session.id,
        sessionId: session.sessionId,
        firstName: session.firstName,
        lastName: session.lastName,
        name: `${session.firstName} ${session.lastName}`,
        emoji: '👶', // Emoji par défaut
        isOnline: session.currentSessionStartTime ? true : false,
        lastActivity: session.lastLoginAt || session.currentSessionStartTime || new Date(),
        totalTime: formatDuration(totalTimeMs), // Formaté en texte lisible
        totalTimeMs: totalTimeMs, // Garder la valeur brute en millisecondes pour les calculs
        onlineDuration: onlineDuration, // Temps en ligne depuis le début de session
        userType: 'CHILD' as const,
        age: session.age,
        grade: session.grade
      };
    });

    return NextResponse.json(formattedSessions);

  } catch (error) {
    console.error('Erreur API sessions enfants:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération des sessions enfants',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
