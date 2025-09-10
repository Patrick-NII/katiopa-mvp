import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer le classement pour CubeMatch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Récupérer les meilleurs scores
    const topPlayers = await prisma.gameScore.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: limit
    });

    // Grouper par utilisateur pour avoir le meilleur score de chaque utilisateur
    const userBestScores = new Map();
    topPlayers.forEach(score => {
      const userId = score.userId;
      if (!userBestScores.has(userId) || userBestScores.get(userId).score < score.score) {
        userBestScores.set(userId, {
          userId: score.userId,
          username: score.user.username,
          score: score.score,
          createdAt: score.createdAt
        });
      }
    });

    // Convertir en tableau et trier
    const ranking = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((player, index) => ({
        rank: index + 1,
        userId: player.userId,
        username: player.username,
        score: player.score,
        createdAt: player.createdAt
      }));

    return NextResponse.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ranking' },
      { status: 500 }
    );
  }
}
