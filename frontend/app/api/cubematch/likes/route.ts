import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer les likes pour CubeMatch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';

    const likes = await prisma.gameLike.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalLikes: likes.length,
        likes: likes.map(like => ({
          id: like.id,
          userId: like.userId,
          username: like.user.username,
          createdAt: like.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

// POST - Ajouter/retirer un like
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId = 'cubematch', action = 'toggle' } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const existingLike = await prisma.gameLike.findFirst({
      where: {
        userId,
        gameId
      }
    });

    let result;
    if (existingLike) {
      // Retirer le like
      await prisma.gameLike.delete({
        where: { id: existingLike.id }
      });
      result = { liked: false, action: 'removed' };
    } else {
      // Ajouter le like
      await prisma.gameLike.create({
        data: {
          userId,
          gameId,
          createdAt: new Date()
        }
      });
      result = { liked: true, action: 'added' };
    }

    // Récupérer le nouveau total
    const totalLikes = await prisma.gameLike.count({
      where: { gameId }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        totalLikes
      }
    });
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle like' },
      { status: 500 }
    );
  }
}
