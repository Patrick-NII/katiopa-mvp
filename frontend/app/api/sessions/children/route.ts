import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const formattedSessions = childSessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      name: `${session.firstName} ${session.lastName}`,
      emoji: '👶', // Emoji par défaut
      isOnline: session.currentSessionStartTime ? true : false,
      lastActivity: session.lastLoginAt || session.currentSessionStartTime || new Date(),
      totalTime: Number(session.totalConnectionDurationMs) || 0,
      userType: 'CHILD' as const,
      age: session.age,
      grade: session.grade
    }));

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
