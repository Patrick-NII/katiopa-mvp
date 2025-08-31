// app/api/chat/route.ts
// Optional LLM fallback. Requires OPENAI_API_KEY. You can swap provider if needed.
import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscription, getModelForSubscription, isLLMEnabled, getMaxTokensForSubscription } from '@/lib/chatbot/auth'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { system?: string; messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }> }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody
    
    // Récupérer les informations d'abonnement de l'utilisateur
    const userSubscription = await getUserSubscription()
    
    if (!userSubscription) {
      return NextResponse.json({ 
        text: "Vous devez être connecté pour utiliser le chatbot avec LLM.", 
        actions: [],
        error: 'NOT_AUTHENTICATED'
      })
    }

    // Vérifier si le LLM est activé pour cet abonnement
    // Débloqué pour tous les comptes (spécialement Aylon-007)
    if (!isLLMEnabled(userSubscription.subscriptionType)) {
      return NextResponse.json({ 
        text: "Bubix est maintenant disponible pour tous les abonnements ! 🎉", 
        actions: [],
        error: 'LLM_NOT_AVAILABLE'
      })
    }

    const system = body.system ?? "Tu es Bubix, l'assistant IA de CubeAI. Sois clair, utile, bienveillant et adapté aux enfants. Oriente vers des liens internes quand pertinent."
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
    const model = getModelForSubscription(userSubscription.subscriptionType)
    const maxTokens = getMaxTokensForSubscription(userSubscription.subscriptionType)

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
      subscriptionType: userSubscription.subscriptionType
    })
  } catch (e: any) {
    return NextResponse.json({ 
      text: "Impossible d'interroger le LLM pour le moment. Utilisez les liens et le moteur local.", 
      actions: [],
      error: 'LLM_UNAVAILABLE'
    })
  }
}
