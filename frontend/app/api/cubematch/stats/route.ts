import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer les statistiques générales pour CubeMatch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';

    // Compter les différents éléments
    const [
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
      totalGamesPlayed,
      totalPlayers
    ] = await Promise.all([
      prisma.gameLike.count({ where: { gameId } }),
      prisma.gameComment.count({ where: { gameId } }),
      prisma.gameShare.count({ where: { gameId } }),
      prisma.gameView.count({ where: { gameId } }),
      prisma.gameScore.count({ where: { gameId } }),
      prisma.gameScore.groupBy({
        by: ['userId'],
        where: { gameId }
      }).then(result => result.length)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        views: totalViews,
        gamesPlayed: totalGamesPlayed,
        totalPlayers
      }
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game stats' },
      { status: 500 }
    );
  }
}

// POST - Enregistrer une action (share, view, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId = 'cubematch', action, score } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'share':
        await prisma.gameShare.create({
          data: {
            userId,
            gameId,
            createdAt: new Date()
          }
        });
        result = { action: 'shared' };
        break;
      
      case 'view':
        await prisma.gameView.create({
          data: {
            userId,
            gameId,
            createdAt: new Date()
          }
        });
        result = { action: 'viewed' };
        break;
      
      case 'play':
        if (score !== undefined) {
          await prisma.gameScore.create({
            data: {
              userId,
              gameId,
              score: parseInt(score),
              createdAt: new Date()
            }
          });
          result = { action: 'played', score };
        } else {
          return NextResponse.json(
            { success: false, error: 'Score required for play action' },
            { status: 400 }
          );
        }
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error recording action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record action' },
      { status: 500 }
    );
  }
}