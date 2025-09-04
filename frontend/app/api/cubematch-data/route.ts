// Route API pour récupérer les données CubeMatch d'un enfant
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour récupérer les données CubeMatch détaillées d'un enfant
async function getCubeMatchData(userId: string): Promise<any> {
  try {
    // Récupérer les statistiques globales CubeMatch
    const globalStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalGames,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed,
        COALESCE(AVG(time_played_ms), 0) as averageTimePerGame,
        COALESCE(MAX(level), 1) as highestLevel,
        COALESCE(AVG(level), 1) as averageLevel
      FROM cubematch_scores 
      WHERE user_id = ${userId}
    `;

    // Récupérer les statistiques par opération
    const operatorStats = await prisma.$queryRaw`
      SELECT 
        operator,
        COUNT(*) as games,
        COALESCE(SUM(score), 0) as totalScore,
        COALESCE(AVG(score), 0) as averageScore,
        COALESCE(MAX(score), 0) as bestScore,
        COALESCE(SUM(time_played_ms), 0) as totalTimePlayed,
        COALESCE(AVG(accuracy_rate), 0) as averageAccuracy,
        COALESCE(SUM(total_moves), 0) as totalMoves,
        COALESCE(SUM(successful_moves), 0) as successfulMoves,
        COALESCE(SUM(failed_moves), 0) as failedMoves,
        COALESCE(AVG(average_move_time_ms), 0) as averageMoveTime,
        COALESCE(MAX(level), 1) as highestLevel,
        COALESCE(AVG(level), 1) as averageLevel
      FROM cubematch_scores 
      WHERE user_id = ${userId}
      GROUP BY operator
      ORDER BY games DESC
    `;

    return {
      globalStats: globalStats[0],
      operatorStats,
      hasData: globalStats[0].totalGames > 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données CubeMatch:', error);
    return null;
  }
}

// Fonction pour générer un résumé CubeMatch pour l'IA
function generateCubeMatchSummary(cubeMatchData: any): string {
  if (!cubeMatchData || !cubeMatchData.hasData) {
    return "Aucune donnée CubeMatch disponible.";
  }

  const { globalStats, operatorStats } = cubeMatchData;

  let summary = `**Résumé CubeMatch :**\n\n`;

  // Statistiques globales
  summary += `**Statistiques globales :**\n`;
  summary += `• Parties jouées : ${globalStats.totalGames}\n`;
  summary += `• Score total : ${globalStats.totalScore.toLocaleString()}\n`;
  summary += `• Score moyen : ${Math.round(globalStats.averageScore)}\n`;
  summary += `• Meilleur score : ${globalStats.bestScore.toLocaleString()}\n`;
  summary += `• Temps total : ${Math.round(globalStats.totalTimePlayed / 60000)} minutes\n`;
  summary += `• Niveau maximum : ${globalStats.highestLevel}\n\n`;

  // Statistiques par opération
  if (operatorStats.length > 0) {
    summary += `**Performance par opération :**\n`;
    operatorStats.forEach((op: any) => {
      const operatorNameMap: Record<string, string> = {
        'ADD': 'Addition',
        'SUB': 'Soustraction',
        'MUL': 'Multiplication',
        'DIV': 'Division'
      };
      const operatorName = operatorNameMap[op.operator] || op.operator;

      summary += `• ${operatorName} : ${op.games} parties, score moyen ${Math.round(op.averageScore)}, précision ${op.averageAccuracy.toFixed(1)}%\n`;
    });
    summary += `\n`;
  }

  return summary;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Récupérer les données CubeMatch
    const cubeMatchData = await getCubeMatchData(decoded.userId);
    const summary = generateCubeMatchSummary(cubeMatchData);

    return NextResponse.json({
      success: true,
      data: cubeMatchData,
      summary: summary
    });

  } catch (error) {
    console.error('Erreur route CubeMatch:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

