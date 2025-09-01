// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { 
  system?: string; 
  messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }>;
  persona?: 'kid' | 'pro';
  lang?: 'fr' | 'en';
}

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

// Interface pour le contexte utilisateur
interface UserContext {
  displayName: string
  role: 'child' | 'parent'
  goals?: any
  progress?: Array<{
    domain: string
    level: number
    stats: any
    updatedAt: Date
  }>
}

// Fonction pour vérifier l'authentification côté serveur avec Prisma
async function verifyAuthServerSide(): Promise<UserInfo | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authToken')?.value

    if (!token) {
      console.log('❌ Pas de token trouvé')
      return null
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Token invalide ou pas de userId')
      return null
    }

    console.log('🔍 Recherche utilisateur avec userId:', decoded.userId)

    // Récupérer directement depuis la base de données avec Prisma
    const userSession = await prisma.userSession.findUnique({
      where: {
        id: decoded.userId
      },
      include: {
        account: true
      }
    })

    if (!userSession) {
      console.log('❌ Utilisateur non trouvé en base')
      return null
    }

    console.log('✅ Utilisateur trouvé:', userSession.sessionId)

    return {
      id: userSession.id,
      sessionId: userSession.sessionId,
      firstName: userSession.firstName,
      lastName: userSession.lastName,
      email: userSession.account.email,
      userType: userSession.userType as 'PARENT' | 'CHILD',
      subscriptionType: userSession.account.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
      isActive: userSession.isActive
    }

  } catch (error) {
    console.error('❌ Erreur vérification auth côté serveur:', error)
    return null
  }
}

// Fonction pour obtenir le contexte utilisateur
async function getUserContext(userInfo: UserInfo): Promise<UserContext> {
  try {
    const displayName = userInfo.firstName || userInfo.email || 'Utilisateur'
    const role = userInfo.userType === 'CHILD' ? 'child' : 'parent'
    
    // TODO: Récupérer les objectifs et progression depuis la base de données
    // Pour l'instant, on utilise des données factices
    const goals = {
      shortTerm: "découvrir CubeAI",
      longTerm: "apprentissage personnalisé"
    }
    
    const progress = [
      {
        domain: "math",
        level: 2,
        stats: { mastered: ["additions <= 20"], struggling: ["soustractions ≤ 20"] },
        updatedAt: new Date()
      }
    ]

    return {
      displayName,
      role,
      goals,
      progress
    }
  } catch (error) {
    console.error('❌ Erreur récupération contexte:', error)
    return {
      displayName: userInfo.firstName || 'Utilisateur',
      role: userInfo.userType === 'CHILD' ? 'child' : 'parent'
    }
  }
}

// Fonction pour détecter l'intention de la question
function detectIntent(userQuery: string): string {
  const query = userQuery.toLowerCase()
  
  // Intentions d'action
  if (query.includes('tarif') || query.includes('prix') || query.includes('abonnement') || query.includes('facturation')) {
    return 'pricing'
  }
  if (query.includes('inscription') || query.includes('créer') || query.includes('compte') || query.includes('signup')) {
    return 'signup'
  }
  if (query.includes('souscrire') || query.includes('acheter') || query.includes('subscribe')) {
    return 'subscribe'
  }
  if (query.includes('aide') || query.includes('support') || query.includes('faq') || query.includes('problème')) {
    return 'support'
  }
  
  // Intentions personnelles
  if (query.includes('email') || query.includes('mail') || query.includes('adresse mail')) {
    return 'personal_info'
  }
  if (query.includes('profil') || query.includes('informations') || query.includes('données') || query.includes('qui suis')) {
    return 'personal_info'
  }
  
  // Intentions éducatives
  if (query.includes('math') || query.includes('calcul') || query.includes('addition') || query.includes('soustraction')) {
    return 'educational'
  }
  if (query.includes('histoire') || query.includes('conte') || query.includes('récit')) {
    return 'story'
  }
  if (query.includes('ia') || query.includes('intelligence artificielle') || query.includes('robot')) {
    return 'ai_education'
  }
  
  return 'general'
}

// Fonction pour récupérer des extraits RAG
function getRAGSnippets(intent: string, userQuery: string): string[] {
  const query = userQuery.toLowerCase()
  const snippets: string[] = []
  
  // Base de connaissances selon l'intention
  switch (intent) {
    case 'pricing':
      snippets.push(
        "Tarifs CubeAI : Essai gratuit de 3 mois, puis abonnements famille à partir de 9,99€/mois.",
        "Plans disponibles : Starter (gratuit), Pro (29,99€/mois), Premium (69,99€/mois).",
        "Avantages Premium : 6 sessions simultanées, IA coach avancé, certificats officiels."
      )
      break
    case 'signup':
      snippets.push(
        "Inscription : Créez votre compte en 2 minutes avec votre email.",
        "Processus : 1) Créer compte, 2) Personnaliser profil enfant, 3) Commencer à apprendre.",
        "Sécurité : Données cryptées, conformité RGPD, protection maximale des enfants."
      )
      break
    case 'educational':
      snippets.push(
        "Mathématiques : Additions, soustractions, géométrie adaptées aux 5-7 ans.",
        "Progression : Niveaux adaptatifs, exercices personnalisés, suivi en temps réel.",
        "Méthode : Approche ludique avec jeux éducatifs et récompenses."
      )
      break
    case 'ai_education':
      snippets.push(
        "IA pour enfants : Explications simples de l'intelligence artificielle.",
        "Sécurité IA : Contenu filtré, pas d'informations personnelles partagées.",
        "Apprentissage IA : L'IA s'adapte au niveau et au rythme de chaque enfant."
      )
      break
    default:
      snippets.push(
        "CubeAI : Plateforme d'apprentissage intelligent pour enfants de 5 à 7 ans.",
        "Fonctionnalités : Mathématiques, lecture, sciences, développement créativité.",
        "Personnalisation : IA adaptative qui s'ajuste aux besoins de chaque enfant."
      )
  }
  
  return snippets
}

// Fonction pour construire les prompts selon le workflow
function buildPrompts({
  persona,
  role,
  lang,
  context,
  rag,
  history,
  userQuery,
  intent
}: {
  persona: 'kid' | 'pro'
  role: 'child' | 'parent'
  lang: 'fr' | 'en'
  context: string
  rag: string[]
  history: any[]
  userQuery: string
  intent: string
}) {
  
  const system = `
Tu es Bubix, l'assistant IA de CubeAI.

Public: ${role === 'child' ? 'enfant 5–7 ans' : 'parent'}.
Langue: ${lang}.
Ton: ${persona === 'kid' ? 'bienveillant, simple, ludique' : 'clair, concis, orienté actions'}.

Règles:
- Réponds d'abord à la question. Sois concret et utile.
- Oriente vers des liens internes si pertinent (ex: /pricing, /signup, /subscribe).
- Personnalise avec objectifs/progression seulement si utile.
- Respect RGPD. Jamais d'infos d'autres utilisateurs.
- Si hors périmètre, propose une mini-leçon adaptée à l'âge/niveau.
- Si l'utilisateur demande "comment faire X sur le site", donne des étapes courtes (1–2–3) + CTA.
- Si tu es incertain, demande une clarification en 1 phrase.
- Adapte ton langage selon le persona (kid = phrases courtes, vocabulaire simple).
`.trim()

  const developer = `
Contraintes de sortie:
- Longueur: ${persona === 'kid' ? '2–5 phrases' : '1–4 phrases'}.
- Pas de jargon sans exemple simple (kid).
- Si lien: libellé clair + route interne (relative).
- Si exercices/math: un exemple simple (+ solution si demandé).
- Si liste: 3–5 puces maximum.
- Format CTA: "Libellé → /route"
`.trim()

  const ctxBlock = `
CONTEXT
${context}

RAG
${rag.length ? rag.join('\n---\n') : 'n/a'}

INTENT
${intent}
`.trim()

  const messages = [
    { role: 'system', content: system },
    { role: 'system', content: developer },
    { role: 'system', content: ctxBlock },
    ...history.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant' as const,
      content: m.text
    })),
    { role: 'user', content: userQuery }
  ]
  
  return { messages }
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

// Fonction pour post-traiter la réponse
function postProcessResponse(text: string, persona: 'kid' | 'pro', intent: string): { text: string, actions: any[] } {
  let processedText = text
  const actions: any[] = []
  
  // Ajouter des CTA selon l'intention
  switch (intent) {
    case 'pricing':
      actions.push(
        { label: "Voir les tarifs", href: "/register" },
        { label: "Souscrire", href: "/register" }
      )
      break
    case 'signup':
      actions.push(
        { label: "Créer un compte", href: "/register" },
        { label: "Se connecter", href: "/login" }
      )
      break
    case 'subscribe':
      actions.push(
        { label: "Souscrire", href: "/register" },
        { label: "Voir les plans", href: "/register" }
      )
      break
    case 'support':
      actions.push(
        { label: "Centre d'aide", href: "/support" },
        { label: "Contact", href: "/contact" }
      )
      break
  }
  
  // Simplifier pour les enfants si nécessaire
  if (persona === 'kid' && processedText.length > 200) {
    // Garder seulement les 2-3 premières phrases
    const sentences = processedText.split(/[.!?]+/).filter(s => s.trim()).slice(0, 3)
    processedText = sentences.join('. ') + '.'
  }
  
  return { text: processedText, actions }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody
    const userQuery = body.messages[body.messages.length - 1]?.text || ''
    const persona = body.persona || 'pro'
    const lang = body.lang || 'fr'

    // Vérifier l'authentification côté serveur
    const userInfo = await verifyAuthServerSide()
    
    console.log('🔍 Vérification auth - userInfo:', userInfo ? 'Connecté' : 'Non connecté')
    
    if (!userInfo) {
      // Utilisateur non connecté - utiliser le modèle local pour FAQ et support
      const intent = detectIntent(userQuery)
      
      if (intent === 'personal_info') {
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

      // Réponse de support local avec RAG
      const ragSnippets = getRAGSnippets(intent, userQuery)
      const supportResponse = `🔧 **Support CubeAI**\n\n${ragSnippets.join('\n\n')}\n\n💡 **Pour une assistance personnalisée, veuillez vous connecter à votre compte.**`
      
      return NextResponse.json({
        text: supportResponse,
        actions: [
          { label: "Se connecter", href: "/login" },
          { label: "Créer un compte", href: "/register" }
        ],
        model: 'local-support',
        subscriptionType: 'none'
      })
    }

    // Utilisateur connecté - workflow complet
    const intent = detectIntent(userQuery)
    
    // Si l'utilisateur demande ses informations personnelles, les fournir directement
    if (intent === 'personal_info') {
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

    // Workflow complet : Récupérer le contexte utilisateur
    const userContext = await getUserContext(userInfo)
    
    // Récupérer les extraits RAG
    const ragSnippets = getRAGSnippets(intent, userQuery)
    
    // Construire le contexte
    const context = `Utilisateur: ${userContext.displayName}
Role: ${userContext.role}
Objectifs: ${JSON.stringify(userContext.goals) || 'n/a'}
Progression (3 derniers):
${userContext.progress?.map(p => `- ${p.domain}: level ${p.level}, stats: ${JSON.stringify(p.stats)}`).join('\n') || 'n/a'}`

    // Construire les prompts selon le workflow
    const { messages } = buildPrompts({
      persona,
      role: userContext.role,
      lang,
      context,
      rag: ragSnippets,
      history: body.messages,
      userQuery,
      intent
    })

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
      messages: messages,
      temperature: persona === 'kid' ? 0.6 : 0.4,
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
      console.error('❌ Erreur OpenAI:', txt)
      return NextResponse.json({
        text: "Le service LLM a renvoyé une erreur. Fallback local activé.",
        actions: [],
        info: txt,
        error: 'LLM_ERROR'
      })
    }
    
    const data = await r.json()
    const rawText = data.choices?.[0]?.message?.content ?? "Réponse vide du modèle."

    // Post-traiter la réponse
    const { text, actions } = postProcessResponse(rawText, persona, intent)

    return NextResponse.json({
      text,
      actions,
      model: model,
      subscriptionType: userInfo.subscriptionType,
      userInfo: {
        email: userInfo.email,
        sessionId: userInfo.sessionId,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        userType: userInfo.userType,
        subscriptionType: userInfo.subscriptionType
      },
      intent,
      persona
    })
  } catch (e: any) {
    console.error('❌ Erreur API chat:', e)
    return NextResponse.json({
      text: "Impossible d'interroger le LLM pour le moment. Utilisez les liens et le moteur local.",
      actions: [],
      error: 'LLM_UNAVAILABLE'
    })
  }
}
