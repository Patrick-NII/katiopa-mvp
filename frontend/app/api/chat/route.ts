// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscription, getModelForSubscription, isLLMEnabled, getMaxTokensForSubscription, getUserInfo, isUserAuthenticated, getUserProfileInfo } from '@/lib/chatbot/auth'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { system?: string; messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }> }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody

    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = await isUserAuthenticated()
    
    if (!isAuthenticated) {
      return NextResponse.json({
        text: "🔐 **Authentification requise**\n\nVous devez être connecté pour utiliser Bubix avec toutes ses fonctionnalités.\n\n💡 **Pour vous connecter :**\n1. Cliquez sur 'Connexion' en haut à droite\n2. Utilisez votre Session ID et mot de passe\n3. Ou créez un compte si vous n'en avez pas\n\nUne fois connecté, je pourrai vous aider avec vos informations personnelles !",
        actions: [
          { label: "Se connecter", href: "/login" },
          { label: "Créer un compte", href: "/register" }
        ],
        error: 'NOT_AUTHENTICATED'
      })
    }

    // Récupérer les informations complètes de l'utilisateur
    const userInfo = await getUserInfo()
    
    if (!userInfo) {
      return NextResponse.json({
        text: "❌ **Erreur de récupération des données**\n\nImpossible de récupérer vos informations utilisateur. Veuillez vous reconnecter.",
        actions: [
          { label: "Se reconnecter", href: "/login" }
        ],
        error: 'USER_INFO_ERROR'
      })
    }

    // Analyser la question de l'utilisateur pour détecter les demandes d'informations personnelles
    const userQuestion = body.messages[body.messages.length - 1]?.text?.toLowerCase() || ''
    
    // Détecter les questions sur les informations personnelles
    const personalInfoKeywords = [
      'email', 'adresse mail', 'mail', 'e-mail',
      'nom', 'prénom', 'nom complet',
      'profil', 'informations', 'données',
      'session', 'identifiant', 'id',
      'abonnement', 'subscription',
      'type', 'parent', 'enfant'
    ]
    
    const isAskingForPersonalInfo = personalInfoKeywords.some(keyword => 
      userQuestion.includes(keyword)
    )

    // Si l'utilisateur demande ses informations personnelles, les fournir directement
    if (isAskingForPersonalInfo) {
      const profileInfo = await getUserProfileInfo()
      return NextResponse.json({
        text: `🔍 **Vos informations personnelles :**\n\n${profileInfo}\n\n💡 **Note :** Ces informations sont privées et ne sont visibles que par vous.`,
        actions: [],
        userInfo: {
          email: userInfo.email,
          sessionId: userInfo.sessionId,
          name: `${userInfo.firstName} ${userInfo.lastName}`,
          userType: userInfo.userType,
          subscriptionType: userInfo.subscriptionType
        }
      })
    }

    // Vérifier si le LLM est activé pour cet abonnement
    // Débloqué pour tous les comptes (spécialement Aylon-007)
    if (!isLLMEnabled(userInfo.subscriptionType)) {
      return NextResponse.json({ 
        text: "Bubix est maintenant disponible pour tous les abonnements ! 🎉", 
        actions: [],
        error: 'LLM_NOT_AVAILABLE'
      })
    }

    const system = body.system ?? `Tu es Bubix, l'assistant IA de CubeAI. Sois clair, utile, bienveillant et adapté aux enfants. Oriente vers des liens internes quand pertinent.

INFORMATIONS UTILISATEUR ACTUEL :
- Nom : ${userInfo.firstName} ${userInfo.lastName}
- Type : ${userInfo.userType === 'PARENT' ? 'Parent' : 'Enfant'}
- Abonnement : ${userInfo.subscriptionType}
- Session ID : ${userInfo.sessionId}
${userInfo.email ? `- Email : ${userInfo.email}` : ''}

Tu peux utiliser ces informations pour personnaliser tes réponses. Si l'utilisateur demande ses informations personnelles, tu peux les fournir.`
    const history: ChatMsg[] = [{ role: 'system', content: system }]

    for (const m of body.messages.slice(-12)) {
      history.push({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })
    }

    const key = process.env.OPENAI_API_KEY
    if (!key || key === 'sk-your-openai-api-key-here') {
      return NextResponse.json({
        text: "Le mode LLM n'est pas configuré côté serveur. Contactez l'administrateur pour activer la réponse intelligente.",
        actions: [],
        error: 'LLM_NOT_CONFIGURED'
      })
    }

    // Utiliser le modèle approprié selon l'abonnement
    const model = getModelForSubscription(userInfo.subscriptionType)
    const maxTokens = getMaxTokensForSubscription(userInfo.subscriptionType)

    // Call OpenAI Chat Completions
    const payload = {
      model: model,
      messages: history,
      temperature: 0.6,
      max_tokens: maxTokens,
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const txt = await r.text()
      return NextResponse.json({
        text: "Le service LLM a renvoyé une erreur. Fallback local activé.",
        actions: [],
        info: txt,
        error: 'LLM_ERROR'
      })
    }
    const data = await r.json()
    const text = data.choices?.[0]?.message?.content ?? "Réponse vide du modèle."

    return NextResponse.json({
      text,
      actions: [],
      model: model,
      subscriptionType: userInfo.subscriptionType,
      userInfo: {
        email: userInfo.email,
        sessionId: userInfo.sessionId,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        userType: userInfo.userType,
        subscriptionType: userInfo.subscriptionType
      }
    })
  } catch (e: any) {
    return NextResponse.json({
      text: "Impossible d'interroger le LLM pour le moment. Utilisez les liens et le moteur local.",
      actions: [],
      error: 'LLM_UNAVAILABLE'
    })
  }
}
