import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // ÉTAPE 1: Vérification d'authentification
    console.log('🔐 ÉTAPE 1: Vérification d\'authentification...');
    
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    if (!decoded || decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès non autorisé - Seuls les parents peuvent utiliser Bubix' }, { status: 403 });
    }

    console.log('✅ ÉTAPE 1 TERMINÉE: Authentification validée');

    const { prompt, sessionId, analysisType, context } = await request.json();

    if (!prompt || !sessionId || !analysisType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // ÉTAPE 2: Récupération des vraies données de la session
    console.log('👶 ÉTAPE 2: Récupération des données réelles de la session...');
    
    // Vérifier que la session appartient bien au parent
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        accountId: decoded.accountId
      },
      include: {
        account: true,
        activities: true,
        cubeMatchScores: true
      }
    });

    if (!session) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou accès non autorisé',
        details: `Session ${sessionId} non accessible pour le compte ${decoded.accountId}`
      }, { status: 404 });
    }

    // Récupérer les données de l'enfant associé à cette session
    // Si c'est une session enfant, utiliser directement cette session
    // Si c'est une session parent, récupérer un enfant du même compte
    let child;
    if (session.userType === 'CHILD') {
      child = session;
    } else {
      // C'est une session parent, récupérer un enfant du même compte
      child = await prisma.userSession.findFirst({
        where: {
          accountId: decoded.accountId,
          userType: 'CHILD',
          isActive: true
        }
      });
    }
    
    if (!child) {
      return NextResponse.json({ 
        error: 'Enfant non trouvé pour cette session',
        details: `Aucun enfant trouvé pour la session ${sessionId}`
      }, { status: 404 });
    }

    // Calculer les statistiques réelles
    const activities = child.activities || [];
    const cubeMatchScores = child.cubeMatchScores || [];
    const totalActivities = activities.length;
    const totalTime = activities.reduce((sum, activity) => sum + (activity.durationMs || 0), 0);
    
    // Calculer le score moyen (combinaison des activités et des scores CubeMatch)
    const activityScores = activities.map(activity => activity.score).filter(Boolean);
    const cubeMatchScoreValues = cubeMatchScores.map(score => score.score).filter(Boolean);
    const allScores = [...activityScores, ...cubeMatchScoreValues];
    const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;

    // Extraire les domaines uniques
    const domains = [...new Set(activities.map(activity => activity.domain).filter(Boolean))];

    // Préparer les activités récentes avec vraies données
    const recentActivities = activities.slice(-5).map(activity => {
      return {
        domain: activity.domain || 'Non spécifié',
        score: activity.score || 0,
        duration: activity.durationMs || 0,
        date: activity.createdAt
      };
    });

    const childData = {
      name: `${child.firstName} ${child.lastName}`,
      age: child.age,
      grade: child.grade || 'Non spécifié',
      totalActivities,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTime,
      domains,
      recentActivities,
      sessionId: child.id,
      sessionStartTime: child.currentSessionStartTime,
      sessionEndTime: child.lastLoginAt
    };

    console.log('✅ ÉTAPE 2 TERMINÉE: Données réelles récupérées', {
      childName: childData.name,
      totalActivities: childData.totalActivities,
      averageScore: childData.averageScore,
      domains: childData.domains
    });

    // ÉTAPE 3: Traitement par l'IA
    console.log('🤖 ÉTAPE 3: Traitement par l\'IA...');
    
    const enrichedPrompt = `
Tu es Bubix, l'assistant IA éducatif de CubeAI. 

⚠️ DONNÉES STRICTEMENT VÉRIFIÉES ET RÉELLES ⚠️
- Nom complet de l'enfant : ${childData.name}
- Âge : ${childData.age} ans
- Classe : ${childData.grade}
- Nombre total d'activités dans cette session : ${childData.totalActivities}
- Score moyen calculé : ${childData.averageScore.toFixed(1)}%
- Temps total d'apprentissage : ${Math.round(childData.totalTime / (1000 * 60))} minutes
- Domaines étudiés dans cette session : ${childData.domains.length > 0 ? childData.domains.join(', ') : 'Aucun domaine spécifique'}
- Activités récentes avec scores réels : ${childData.recentActivities.length > 0 ? childData.recentActivities.map(a => `${a.domain} (${a.score}%)`).join(', ') : 'Aucune activité récente'}

INFORMATIONS DE SÉCURITÉ :
- Type d'analyse demandée : ${analysisType}
- Plan d'abonnement : ${context?.subscriptionType || 'FREE'}
- Timestamp de la session : ${childData.sessionStartTime ? new Date(childData.sessionStartTime).toLocaleString('fr-FR') : 'Non disponible'}

PROMPT UTILISATEUR :
${prompt}

🚨 RÈGLES CRITIQUES DE SÉCURITÉ 🚨
1. Utilise EXCLUSIVEMENT les données réelles fournies ci-dessus
2. Ne mentionne JAMAIS d'informations non présentes dans ces données
3. Si une donnée n'est pas disponible, indique clairement "Donnée non disponible"
4. Ne mélange JAMAIS les données de différents enfants ou sessions
5. Vérifie que le nom de l'enfant correspond exactement à ${childData.name}
6. Si les données sont insuffisantes, propose des recommandations générales sans inventer de détails
7. Structure ta réponse de manière claire et professionnelle
8. Termine TOUJOURS par ta signature : "Cordialement, Bubix, Assistant IA Éducatif CubeAI"

Réponds maintenant en respectant strictement ces règles :
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: context?.subscriptionType === 'FREE' ? 'gpt-3.5-turbo' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es Bubix, l'assistant IA éducatif de CubeAI. 

🚨 RÈGLES CRITIQUES DE SÉCURITÉ 🚨
- Tu utilises EXCLUSIVEMENT les données réelles fournies dans le prompt utilisateur
- Tu ne mentionnes JAMAIS d'informations non présentes dans ces données
- Tu ne mélanges JAMAIS les données de différents enfants ou sessions
- Tu vérifies toujours que le nom correspond exactement
- Si une donnée n'est pas disponible, tu indiques clairement "Donnée non disponible"
- Tu termines TOUJOURS par ta signature : "Cordialement, Bubix, Assistant IA Éducatif CubeAI"

Tu es bienveillant, professionnel et constructif, mais tu respectes strictement ces règles de sécurité.`
          },
          {
            role: 'user',
            content: enrichedPrompt
          }
        ],
        max_tokens: context?.subscriptionType === 'FREE' ? 500 : 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Erreur lors de l\'appel à OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const bubixResponse = openaiData.choices[0]?.message?.content || 'Aucune réponse générée';

    console.log('✅ ÉTAPE 3 TERMINÉE: Analyse IA générée');

    return NextResponse.json({
      success: true,
      response: bubixResponse,
      analysisType,
      sessionId,
      childName: childData.name,
      timestamp: new Date().toISOString(),
      dataUsed: {
        totalActivities: childData.totalActivities,
        averageScore: childData.averageScore,
        totalTimeMinutes: Math.round(childData.totalTime / (1000 * 60)),
        domains: childData.domains,
        recentActivities: childData.recentActivities,
        sessionStartTime: childData.sessionStartTime,
        sessionEndTime: childData.sessionEndTime
      },
      securityInfo: {
        parentVerified: true,
        childVerified: true,
        accountId: decoded.accountId,
        parentEmail: decoded.email,
        childId: child.id,
        verificationTimestamp: new Date().toISOString(),
        dataSource: 'database_real_data',
        hallucinationPrevention: 'enabled',
        crossSessionProtection: 'active'
      }
    });

  } catch (error) {
    console.error('Erreur API Bubix:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'analyse par Bubix',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      securityInfo: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString(),
        dataSource: 'error_state'
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}