import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🏆 Récupération du Top 10 CubeMatch');
    
    // Récupérer les 10 meilleurs scores
    const topScores = await prisma.cubeMatchScore.findMany({
      take: 10,
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { created_at: 'asc' } // En cas d'égalité, le plus ancien gagne
      ],
      select: {
        id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        operator: true,
        target: true,
        combo_max: true,
        cells_cleared: true,
        created_at: true,
        user_id: true
      }
    });

    // Formater les données pour l'affichage
    const leaderboard = topScores.map((score, index) => ({
      rank: index + 1,
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      timePlayedFormatted: formatTime(Number(score.time_played_ms)),
      operator: score.operator,
      target: score.target,
      comboMax: score.combo_max || 0,
      cellsCleared: score.cells_cleared || 0,
      playedAt: score.created_at.toISOString(),
      playedAtFormatted: formatDate(score.created_at)
    }));

    console.log(`✅ Top 10 récupéré: ${leaderboard.length} scores`);
    
    return NextResponse.json({ 
      success: true, 
      data: leaderboard,
      total: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du Top 10:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du classement',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Fonctions utilitaires pour le formatage
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
