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

    // VÉRIFICATION 1: Vérifier le token JWT et récupérer l'ID du compte parent
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    if (!decoded || decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès non autorisé - Seuls les parents peuvent utiliser Bubix' }, { status: 403 });
    }

    const parentAccountId = decoded.accountId;
    const parentUserId = decoded.userId;
    const parentEmail = decoded.email;

    // VÉRIFICATION 1.1: Vérifier que le compte parent existe et est actif
    const parentAccount = await prisma.account.findUnique({
      where: { 
        id: parentAccountId,
        email: parentEmail,
        isActive: true
      },
      include: {
        userSessions: {
          where: {
            userType: 'PARENT',
            isActive: true
          }
        }
      }
    });

    if (!parentAccount) {
      return NextResponse.json({ 
        error: 'Compte parent non trouvé ou inactif',
        details: 'Le compte parent spécifié n\'existe pas ou a été désactivé'
      }, { status: 404 });
    }

    // VÉRIFICATION 1.2: Vérifier que la session parent existe et correspond au compte
    const parentSession = parentAccount.userSessions.find(session => session.id === parentUserId);
    if (!parentSession) {
      return NextResponse.json({ 
        error: 'Session parent non trouvée',
        details: 'La session parent spécifiée n\'appartient pas à ce compte'
      }, { status: 404 });
    }

    // VÉRIFICATION 1.3: Vérifier la cohérence des données parent
    if (parentSession.accountId !== parentAccountId) {
      return NextResponse.json({ 
        error: 'Incohérence des données parent',
        details: 'Les identifiants parent ne correspondent pas'
      }, { status: 403 });
    }

    const body = await request.json();
    const { prompt, sessionId, analysisType, context } = body;

    if (!prompt || !sessionId || !analysisType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // VÉRIFICATION 2: Vérifier que la session enfant existe et appartient au parent
    const childSession = await prisma.userSession.findUnique({
      where: { 
        sessionId: sessionId,
        userType: 'CHILD'
      },
      include: {
        account: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!childSession) {
      return NextResponse.json({ 
        error: 'Session enfant non trouvée',
        details: 'La session spécifiée n\'existe pas ou n\'est pas une session enfant'
      }, { status: 404 });
    }

    // VÉRIFICATION 3: Vérifier que l'enfant appartient bien au compte parent
    if (childSession.accountId !== parentAccountId) {
      return NextResponse.json({ 
        error: 'Accès non autorisé',
        details: 'Cette session enfant n\'appartient pas à votre compte'
      }, { status: 403 });
    }

    // VÉRIFICATION 3.1: Vérifier que l'enfant est actif
    if (!childSession.isActive) {
      return NextResponse.json({ 
        error: 'Session enfant inactive',
        details: 'Cette session enfant a été désactivée'
      }, { status: 403 });
    }

    // VÉRIFICATION 3.2: Vérifier la cohérence des données enfant
    if (childSession.accountId !== childSession.account.id) {
      return NextResponse.json({ 
        error: 'Incohérence des données enfant',
        details: 'Les identifiants enfant ne correspondent pas'
      }, { status: 403 });
    }

    // VÉRIFICATION BONUS: Vérifier qu'il n'y a pas de confusion avec d'autres enfants du même prénom
    const childrenWithSameName = await prisma.userSession.findMany({
      where: {
        accountId: parentAccountId,
        userType: 'CHILD',
        firstName: childSession.firstName,
        isActive: true
      },
      select: { 
        id: true,
        sessionId: true, 
        firstName: true, 
        lastName: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    // VÉRIFICATION BONUS: Vérifier qu'il n'y a pas de confusion avec d'autres parents du même nom
    const parentsWithSameName = await prisma.userSession.findMany({
      where: {
        accountId: parentAccountId,
        userType: 'PARENT',
        firstName: parentSession.firstName,
        lastName: parentSession.lastName,
        isActive: true
      },
      select: { 
        id: true,
        sessionId: true, 
        firstName: true, 
        lastName: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    // Logs de sécurité détaillés
    const securityLog = {
      timestamp: new Date().toISOString(),
      parentAccount: {
        id: parentAccountId,
        email: parentEmail,
        subscriptionType: parentAccount.subscriptionType,
        createdAt: parentAccount.createdAt
      },
      parentSession: {
        id: parentUserId,
        sessionId: parentSession.sessionId,
        name: `${parentSession.firstName} ${parentSession.lastName}`,
        createdAt: parentSession.createdAt,
        lastLoginAt: parentSession.lastLoginAt
      },
      childSession: {
        id: childSession.id,
        sessionId: childSession.sessionId,
        name: `${childSession.firstName} ${childSession.lastName}`,
        createdAt: childSession.createdAt,
        lastLoginAt: childSession.lastLoginAt
      },
      analysisRequest: {
        type: analysisType,
        promptLength: prompt.length,
        contextProvided: !!context
      },
      potentialConflicts: {
        childrenWithSameName: childrenWithSameName.length,
        parentsWithSameName: parentsWithSameName.length
      }
    };

    if (childrenWithSameName.length > 1) {
      console.log(`⚠️ ATTENTION: ${childrenWithSameName.length} enfants trouvés avec le prénom "${childSession.firstName}" pour le compte ${parentAccountId}`);
      console.log('Enfants trouvés:', childrenWithSameName.map(c => `${c.firstName} ${c.lastName} (${c.sessionId}) - Créé: ${c.createdAt}`));
      securityLog.potentialConflicts.childrenDetails = childrenWithSameName;
    }

    if (parentsWithSameName.length > 1) {
      console.log(`⚠️ ATTENTION: ${parentsWithSameName.length} parents trouvés avec le nom "${parentSession.firstName} ${parentSession.lastName}" pour le compte ${parentAccountId}`);
      console.log('Parents trouvés:', parentsWithSameName.map(p => `${p.firstName} ${p.lastName} (${p.sessionId}) - Créé: ${p.createdAt}`));
      securityLog.potentialConflicts.parentsDetails = parentsWithSameName;
    }

    // Log complet de sécurité
    console.log('🔒 ANALYSE BUBIX SÉCURISÉE:', JSON.stringify(securityLog, null, 2));

    // Récupérer les données réelles de l'enfant pour l'analyse
    const childData = {
      name: `${childSession.firstName} ${childSession.lastName}`,
      age: childSession.age,
      grade: childSession.grade,
      totalActivities: childSession.activities.length,
      averageScore: childSession.activities.length > 0 
        ? childSession.activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / childSession.activities.length
        : 0,
      totalTime: childSession.activities.reduce((sum, activity) => sum + (activity.durationMs || 0), 0),
      domains: [...new Set(childSession.activities.map(a => a.domain).filter(Boolean))],
      recentActivities: childSession.activities.slice(0, 5).map(activity => ({
        domain: activity.domain,
        score: activity.score,
        duration: activity.durationMs,
        date: activity.createdAt
      }))
    };

    // Construire le prompt enrichi avec les VRAIES données
    const enrichedPrompt = `
Tu es Bubix, l'assistant IA éducatif de CubeAI. 

DONNÉES RÉELLES DE L'ENFANT (à utiliser exclusivement) :
- Nom complet : ${childData.name}
- Âge : ${childData.age || 'Non spécifié'}
- Classe : ${childData.grade || 'Non spécifiée'}
- Nombre total d'activités : ${childData.totalActivities}
- Score moyen : ${childData.averageScore.toFixed(1)}%
- Temps total d'apprentissage : ${Math.round(childData.totalTime / (1000 * 60))} minutes
- Domaines étudiés : ${childData.domains.join(', ') || 'Aucun domaine spécifique'}
- Activités récentes : ${childData.recentActivities.map(a => `${a.domain} (${a.score}%)`).join(', ')}

SESSION ANALYSÉE :
- ID de session : ${sessionId}
- Type d'analyse : ${analysisType}
- Plan d'abonnement : ${context?.subscriptionType || 'FREE'}

PROMPT UTILISATEUR :
${prompt}

RÈGLES STRICTES :
- Utilise UNIQUEMENT les données réelles fournies ci-dessus
- Ne mentionne PAS de détails non documentés dans la base de données
- Si les données sont limitées, indique-le clairement
- Sois précis sur les durées et scores réels
- Évite les généralisations non fondées
- Structure ta réponse de manière claire et professionnelle

Réponds maintenant en utilisant exclusivement les données réelles :
`;

    // Appel à l'API OpenAI avec le prompt enrichi et sécurisé
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
            content: 'Tu es Bubix, un assistant IA éducatif spécialisé dans l\'analyse des performances d\'apprentissage des enfants. Tu es bienveillant, professionnel et constructif. Tu utilises UNIQUEMENT les données réelles fournies et évites les hallucinations.'
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

    // Log de sécurité pour traçabilité
    console.log(`✅ Analyse Bubix sécurisée - Parent: ${parentAccountId}, Enfant: ${childData.name} (${sessionId}), Type: ${analysisType}`);

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
        domains: childData.domains
      },
      securityInfo: {
        parentVerified: true,
        childVerified: true,
        accountId: parentAccountId,
        parentEmail: parentEmail,
        verificationTimestamp: new Date().toISOString(),
        potentialConflicts: {
          childrenWithSameName: childrenWithSameName.length,
          parentsWithSameName: parentsWithSameName.length
        }
      }
    });

  } catch (error) {
    console.error('Erreur API Bubix sécurisée:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse par Bubix',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
