// app/api/chat/route.ts
// Optional LLM fallback. Requires OPENAI_API_KEY. You can swap provider if needed.
import { NextRequest, NextResponse } from 'next/server'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { system?: string; messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }> }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody
    const system = body.system ?? "Tu es l'assistant du site Katiopa. Sois clair, utile, bienveillant. Oriente vers des liens internes quand pertinent."
    const history: ChatMsg[] = [{ role: 'system', content: system }]

    for (const m of body.messages.slice(-12)) {
      history.push({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })
    }

    const key = process.env.OPENAI_API_KEY
    if (!key) {
      return NextResponse.json({ text: "Le mode LLM n'est pas configuré côté serveur. Ajoutez OPENAI_API_KEY pour activer la réponse intelligente.", actions: [] })
    }

    // Call OpenAI Chat Completions
    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: history,
      temperature: 0.6,
      max_tokens: 400,
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
      return NextResponse.json({ text: "Le service LLM a renvoyé une erreur. Fallback local activé.", actions: [], info: txt })
    }
    const data = await r.json()
    const text = data.choices?.[0]?.message?.content ?? "Réponse vide du modèle."
    return NextResponse.json({ text, actions: [] })
  } catch (e: any) {
    return NextResponse.json({ text: "Impossible d'interroger le LLM pour le moment. Utilisez les liens et le moteur local.", actions: [] })
  }
}
