import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    if (!decoded || decoded.userType !== 'PARENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { prompt, sessionId, analysisType, context } = body;

    if (!prompt || !sessionId || !analysisType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Construire le prompt enrichi pour Bubix
    const enrichedPrompt = `
Tu es Bubix, l'assistant IA éducatif de CubeAI. 

CONTEXTE :
- Enfant : ${context?.childName || 'Enfant'}
- Session : ${sessionId}
- Type d'analyse : ${analysisType}
- Plan d'abonnement : ${context?.subscriptionType || 'FREE'}

PROMPT UTILISATEUR :
${prompt}

INSTRUCTIONS :
- Réponds de manière professionnelle et bienveillante
- Utilise un ton encourageant et constructif
- Sois précis et détaillé dans tes analyses
- Adapte ton niveau de détail selon le plan d'abonnement
- Structure ta réponse de manière claire et lisible
- Inclus des recommandations pratiques quand approprié

Réponds maintenant :
`;

    // Appel à l'API OpenAI avec le prompt enrichi
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
            content: 'Tu es Bubix, un assistant IA éducatif spécialisé dans l\'analyse des performances d\'apprentissage des enfants. Tu es bienveillant, professionnel et constructif.'
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

    return NextResponse.json({
      success: true,
      response: bubixResponse,
      analysisType,
      sessionId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erreur API Bubix:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse par Bubix',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  }
}
