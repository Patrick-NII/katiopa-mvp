import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Ajouter/retirer un like sur un commentaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, commentId } = body;

    if (!userId || !commentId) {
      return NextResponse.json(
        { success: false, error: 'User ID and comment ID required' },
        { status: 400 }
      );
    }

    const existingLike = await prisma.commentLike.findFirst({
      where: {
        userId,
        commentId
      }
    });

    let result;
    if (existingLike) {
      // Retirer le like
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      });
      result = { liked: false, action: 'removed' };
    } else {
      // Ajouter le like
      await prisma.commentLike.create({
        data: {
          userId,
          commentId,
          createdAt: new Date()
        }
      });
      result = { liked: true, action: 'added' };
    }

    // Récupérer le nouveau total de likes pour ce commentaire
    const totalLikes = await prisma.commentLike.count({
      where: { commentId }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        totalLikes
      }
    });
  } catch (error) {
    console.error('Error handling comment like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle comment like' },
      { status: 500 }
    );
  }
}
