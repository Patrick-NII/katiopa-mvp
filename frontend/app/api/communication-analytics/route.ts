import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer les analytics de communication
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    
    if (decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Seuls les parents peuvent accéder aux analytics' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const childSessionId = searchParams.get('childSessionId');
    const timeRange = searchParams.get('timeRange') || '30'; // jours
    const communicationStyle = searchParams.get('communicationStyle');

    if (!childSessionId) {
      return NextResponse.json({ error: 'ID de session enfant requis' }, { status: 400 });
    }

    // Vérifier que l'enfant appartient au parent
    const childSession = await prisma.userSession.findFirst({
      where: {
        id: childSessionId,
        accountId: decoded.accountId
      }
    });
    
    if (!childSession) {
      return NextResponse.json({ error: 'Session enfant non trouvée' }, { status: 404 });
    }

    // Calculer la date de début
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Construire les filtres
    const whereClause: any = {
      userSessionId: childSessionId,
      createdAt: {
        gte: startDate
      }
    };

    if (communicationStyle) {
      whereClause.communicationStyle = communicationStyle;
    }

    // Récupérer les analytics
    const analytics = await prisma.communicationAnalytics.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limiter à 100 entrées récentes
    });

    // Calculer les statistiques
    const stats = {
      totalMessages: analytics.length,
      averageEffectiveness: analytics.reduce((sum, a) => sum + a.effectiveness, 0) / analytics.length || 0,
      averageResponseTime: analytics
        .filter(a => a.responseTime)
        .reduce((sum, a) => sum + (a.responseTime || 0), 0) / analytics.filter(a => a.responseTime).length || 0,
      averageSatisfaction: analytics
        .filter(a => a.userSatisfaction)
        .reduce((sum, a) => sum + (a.userSatisfaction || 0), 0) / analytics.filter(a => a.userSatisfaction).length || 0,
      styleBreakdown: {} as Record<string, any>,
      moduleBreakdown: {} as Record<string, any>,
      messageTypeBreakdown: {} as Record<string, any>
    };

    // Analyser par style de communication
    analytics.forEach(analytic => {
      const style = analytic.communicationStyle;
      if (!stats.styleBreakdown[style]) {
        stats.styleBreakdown[style] = {
          count: 0,
          totalEffectiveness: 0,
          totalResponseTime: 0,
          totalSatisfaction: 0,
          responseTimeCount: 0,
          satisfactionCount: 0
        };
      }
      
      stats.styleBreakdown[style].count++;
      stats.styleBreakdown[style].totalEffectiveness += analytic.effectiveness;
      
      if (analytic.responseTime) {
        stats.styleBreakdown[style].totalResponseTime += analytic.responseTime;
        stats.styleBreakdown[style].responseTimeCount++;
      }
      
      if (analytic.userSatisfaction) {
        stats.styleBreakdown[style].totalSatisfaction += analytic.userSatisfaction;
        stats.styleBreakdown[style].satisfactionCount++;
      }
    });

    // Calculer les moyennes pour chaque style
    Object.keys(stats.styleBreakdown).forEach(style => {
      const data = stats.styleBreakdown[style];
      data.averageEffectiveness = data.totalEffectiveness / data.count;
      data.averageResponseTime = data.responseTimeCount > 0 ? data.totalResponseTime / data.responseTimeCount : 0;
      data.averageSatisfaction = data.satisfactionCount > 0 ? data.totalSatisfaction / data.satisfactionCount : 0;
    });

    // Analyser par module
    analytics.forEach(analytic => {
      if (analytic.module) {
        const module = analytic.module;
        if (!stats.moduleBreakdown[module]) {
          stats.moduleBreakdown[module] = {
            count: 0,
            totalEffectiveness: 0
          };
        }
        stats.moduleBreakdown[module].count++;
        stats.moduleBreakdown[module].totalEffectiveness += analytic.effectiveness;
      }
    });

    // Calculer les moyennes pour chaque module
    Object.keys(stats.moduleBreakdown).forEach(module => {
      const data = stats.moduleBreakdown[module];
      data.averageEffectiveness = data.totalEffectiveness / data.count;
    });

    // Analyser par type de message
    analytics.forEach(analytic => {
      const messageType = analytic.messageType;
      if (!stats.messageTypeBreakdown[messageType]) {
        stats.messageTypeBreakdown[messageType] = {
          count: 0,
          totalEffectiveness: 0
        };
      }
      stats.messageTypeBreakdown[messageType].count++;
      stats.messageTypeBreakdown[messageType].totalEffectiveness += analytic.effectiveness;
    });

    // Calculer les moyennes pour chaque type de message
    Object.keys(stats.messageTypeBreakdown).forEach(messageType => {
      const data = stats.messageTypeBreakdown[messageType];
      data.averageEffectiveness = data.totalEffectiveness / data.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        childInfo: {
          name: `${childSession.firstName} ${childSession.lastName}`,
          sessionId: childSession.sessionId,
          age: childSession.age
        },
        timeRange: parseInt(timeRange),
        stats,
        recentAnalytics: analytics.slice(0, 20), // 20 plus récentes
        recommendations: generateRecommendations(stats)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// POST - Enregistrer une nouvelle analytics de communication
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    
    const {
      communicationStyle,
      module,
      dayOfWeek,
      messageType,
      effectiveness,
      responseTime,
      userSatisfaction,
      context
    } = await request.json();

    if (!communicationStyle || !messageType || effectiveness === undefined) {
      return NextResponse.json({ error: 'Paramètres requis manquants' }, { status: 400 });
    }

    const analytics = await prisma.communicationAnalytics.create({
      data: {
        userSessionId: decoded.sessionId,
        communicationStyle,
        module,
        dayOfWeek,
        messageType,
        effectiveness: Math.max(0, Math.min(1, effectiveness)), // Clamp entre 0 et 1
        responseTime: responseTime ? Math.max(0, responseTime) : null,
        userSatisfaction: userSatisfaction ? Math.max(1, Math.min(5, userSatisfaction)) : null,
        context
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics enregistrées avec succès',
      data: analytics
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des analytics:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Fonction pour générer des recommandations basées sur les analytics
function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  // Recommandations basées sur l'efficacité des styles
  const styleEntries = Object.entries(stats.styleBreakdown) as [string, any][];
  const bestStyle = styleEntries.reduce((best, [style, data]) => 
    data.averageEffectiveness > best.averageEffectiveness ? { style, ...data } : best,
    { style: '', averageEffectiveness: 0 }
  );

  if (bestStyle.style) {
    recommendations.push(`Le style de communication "${bestStyle.style}" est le plus efficace avec ${(bestStyle.averageEffectiveness * 100).toFixed(1)}% d'efficacité moyenne.`);
  }

  // Recommandations basées sur les modules
  const moduleEntries = Object.entries(stats.moduleBreakdown) as [string, any][];
  const bestModule = moduleEntries.reduce((best, [module, data]) => 
    data.averageEffectiveness > best.averageEffectiveness ? { module, ...data } : best,
    { module: '', averageEffectiveness: 0 }
  );

  if (bestModule.module) {
    recommendations.push(`Le module "${bestModule.module}" génère les meilleures interactions avec ${(bestModule.averageEffectiveness * 100).toFixed(1)}% d'efficacité.`);
  }

  // Recommandations basées sur les types de messages
  const messageTypeEntries = Object.entries(stats.messageTypeBreakdown) as [string, any][];
  const bestMessageType = messageTypeEntries.reduce((best, [messageType, data]) => 
    data.averageEffectiveness > best.averageEffectiveness ? { messageType, ...data } : best,
    { messageType: '', averageEffectiveness: 0 }
  );

  if (bestMessageType.messageType) {
    recommendations.push(`Les messages de type "${bestMessageType.messageType}" sont les plus efficaces avec ${(bestMessageType.averageEffectiveness * 100).toFixed(1)}% d'efficacité.`);
  }

  // Recommandations générales
  if (stats.averageEffectiveness < 0.6) {
    recommendations.push('L\'efficacité globale est faible. Considérez ajuster le style de communication ou les types de messages.');
  }

  if (stats.averageResponseTime > 30000) { // Plus de 30 secondes
    recommendations.push('Le temps de réponse moyen est élevé. Simplifiez les instructions ou réduisez la complexité des tâches.');
  }

  if (stats.averageSatisfaction < 3) {
    recommendations.push('La satisfaction utilisateur est faible. Adaptez le contenu aux préférences de l\'enfant.');
  }

  return recommendations;
}
