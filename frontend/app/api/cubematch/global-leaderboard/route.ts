import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAuth(): Promise<any> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    return decoded;
  } catch (error) {
    console.error('Erreur vérification auth:', error);
    return null;
  }
}

// GET /api/cubematch/global-leaderboard - Récupérer le classement global (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Récupérer tous les scores avec les informations de session
    const allScores = await prisma.cubeMatchScore.findMany({
      include: {
        userSession: {
          select: {
            sessionId: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 1000 // Limite pour éviter de surcharger
    });

    // Grouper par utilisateur et calculer le meilleur score
    const userBestScores: Record<string, { 
      score: number, 
      username: string, 
      userId: string,
      sessionId: string,
      level: number,
      createdAt: Date
    }> = {};

    allScores.forEach((score) => {
      const userId = score.user_id;
      if (!userBestScores[userId] || score.score > userBestScores[userId].score) {
        userBestScores[userId] = {
          score: score.score,
          username: score.username,
          userId: userId,
          sessionId: score.userSession.sessionId,
          level: score.level,
          createdAt: score.created_at
        };
      }
    });

    // Trier par score décroissant et prendre le top N
    const leaderboard = Object.values(userBestScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        totalPlayers: Object.keys(userBestScores).length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur route leaderboard global:', error);
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
