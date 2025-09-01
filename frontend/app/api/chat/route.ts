// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { system?: string; messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }> }

// Interface pour les informations utilisateur
interface UserInfo {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  email?: string
  userType: 'PARENT' | 'CHILD'
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  isActive: boolean
}

// Fonction pour vérifier l'authentification côté serveur
async function verifyAuthServerSide(): Promise<UserInfo | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return null
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded || !decoded.userId) {
      return null
    }

    // Récupérer les informations utilisateur depuis la base de données
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/verify`, {
      headers: {
        'Cookie': `accessToken=${token}`
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.success && data.user) {
      return {
        id: data.user.id,
        sessionId: data.user.sessionId,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        userType: data.user.userType,
        subscriptionType: data.user.subscriptionType,
        isActive: true
      }
    }

    return null
  } catch (error) {
    console.error('Erreur vérification auth côté serveur:', error)
    return null
  }
}

// Fonction pour obtenir le modèle selon l'abonnement
function getModelForSubscription(subscriptionType: string): string {
  switch (subscriptionType) {
    case 'FREE':
      return 'gpt-3.5-turbo'
    case 'PRO':
      return 'gpt-4o-mini'
    case 'PRO_PLUS':
      return 'gpt-4o'
    case 'ENTERPRISE':
      return 'gpt-4o'
    default:
      return 'gpt-3.5-turbo'
  }
}

// Fonction pour vérifier si le LLM est activé
function isLLMEnabled(subscriptionType: string): boolean {
  return subscriptionType !== 'FREE'
}

// Fonction pour obtenir le nombre max de tokens
function getMaxTokensForSubscription(subscriptionType: string): number {
  switch (subscriptionType) {
    case 'FREE':
      return 0
    case 'PRO':
      return 400
    case 'PRO_PLUS':
      return 800
    case 'ENTERPRISE':
      return 1000
    default:
      return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody

    // Vérifier l'authentification côté serveur
    const userInfo = await verifyAuthServerSide()
    const userQuestion = body.messages[body.messages.length - 1]?.text?.toLowerCase() || ''
    
    if (!userInfo) {
      // Utilisateur non connecté - utiliser le modèle local pour FAQ et support
      
      // Détecter les questions de support/FAQ
      const supportKeywords = [
        'aide', 'support', 'faq', 'question', 'comment', 'problème',
        'inscription', 'connexion', 'compte', 'mot de passe',
        'tarif', 'prix', 'abonnement', 'facturation',
        'technique', 'bug', 'erreur', 'fonctionne pas'
      ]
      
      const isSupportQuestion = supportKeywords.some(keyword => 
        userQuestion.includes(keyword)
      )

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

      if (isAskingForPersonalInfo) {
        return NextResponse.json({
          text: "🔐 **Connexion requise**\n\nPour accéder à vos informations personnelles, vous devez d'abord vous connecter à votre compte.\n\n💡 **Pour vous connecter :**\n1. Cliquez sur 'Connexion' en haut à droite\n2. Utilisez votre Session ID et mot de passe\n3. Ou créez un compte si vous n'en avez pas\n\nUne fois connecté, je pourrai vous aider avec vos informations personnelles !",
          actions: [
            { label: "Se connecter", href: "/login" },
            { label: "Créer un compte", href: "/register" }
          ],
          model: 'local-auth-required',
          subscriptionType: 'none'
        })
      }

      if (isSupportQuestion) {
        // Réponse de support local
        return NextResponse.json({
          text: `🔧 **Support CubeAI**\n\nJe peux vous aider avec les questions de base. Voici quelques informations utiles :\n\n📧 **Contact** : support@cubeai.com\n📞 **Téléphone** : +33 1 23 45 67 89\n🌐 **Site web** : https://cubeai.com/support\n\n💡 **Questions fréquentes :**\n• Inscription : Cliquez sur "Commencer gratuitement"\n• Connexion : Utilisez votre Session ID et mot de passe\n• Tarifs : Voir la page des abonnements\n\nPour une assistance personnalisée, veuillez vous connecter à votre compte.`,
          actions: [
            { label: "Se connecter", href: "/login" },
            { label: "Créer un compte", href: "/register" },
            { label: "Voir les tarifs", href: "/register" }
          ],
          model: 'local-support',
          subscriptionType: 'none'
        })
      }

      // Réponse générique pour les utilisateurs non connectés
      return NextResponse.json({
        text: "👋 **Bienvenue sur CubeAI !**\n\nJe suis Bubix, votre assistant IA. Pour accéder à toutes mes fonctionnalités et obtenir des réponses personnalisées, veuillez vous connecter à votre compte.\n\n🔐 **Avantages de la connexion :**\n• Réponses personnalisées selon votre profil\n• Accès à l'historique de vos conversations\n• Fonctionnalités avancées selon votre abonnement\n\n💡 **Pour commencer :**\n1. Créez un compte gratuit\n2. Ou connectez-vous si vous en avez déjà un\n3. Profitez de l'expérience complète !",
        actions: [
          { label: "Se connecter", href: "/login" },
          { label: "Créer un compte", href: "/register" }
        ],
        model: 'local-base',
        subscriptionType: 'none'
      })
    }

    // Utilisateur connecté - analyser la question
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
      const profileInfo = `👤 **Profil Utilisateur :**
📧 Email : ${userInfo.email || 'Non renseigné'}
👨‍👩‍👧‍👦 Type : ${userInfo.userType === 'PARENT' ? 'Parent' : 'Enfant'}
📋 Nom : ${userInfo.firstName} ${userInfo.lastName}
🆔 Session ID : ${userInfo.sessionId}
💎 Abonnement : ${userInfo.subscriptionType}
✅ Statut : Actif`

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
    if (!isLLMEnabled(userInfo.subscriptionType)) {
      return NextResponse.json({ 
        text: `🔒 **Accès LLM limité**\n\nVotre abonnement actuel (${userInfo.subscriptionType}) ne permet pas l'accès au mode LLM avancé.\n\n💡 **Pour débloquer l'IA avancée :**\n• Passez à un abonnement PRO ou PRO_PLUS\n• Accédez à des réponses plus intelligentes et personnalisées\n• Profitez de plus de tokens et de fonctionnalités avancées\n\n📚 **En attendant, vous pouvez :**\n• Utiliser la base de connaissances locale\n• Consulter la FAQ et le support\n• Explorer les fonctionnalités de base`,
        actions: [
          { label: "Voir les abonnements", href: "/register" },
          { label: "FAQ", href: "/support" }
        ],
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
