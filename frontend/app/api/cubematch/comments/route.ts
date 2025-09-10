import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer les commentaires pour CubeMatch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'cubematch';

    const comments = await prisma.gameComment.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        username: comment.user.username,
        createdAt: comment.createdAt,
        likes: comment.likes.map(like => ({
          id: like.id,
          userId: like.userId,
          username: like.user.username
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un commentaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId = 'cubematch', content } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content required' },
        { status: 400 }
      );
    }

    const comment = await prisma.gameComment.create({
      data: {
        userId,
        gameId,
        content: content.trim(),
        createdAt: new Date()
      },
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
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        username: comment.user.username,
        createdAt: comment.createdAt,
        likes: []
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
