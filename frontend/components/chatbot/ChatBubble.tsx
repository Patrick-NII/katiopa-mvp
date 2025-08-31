
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react'
import type { Message, LinkAction, KBItem } from '@/lib/chatbot/types'
import { detectIntent, tokenize, normalize } from '@/lib/chatbot/nlu'

// Internal links
const LINKS = {
  signup: '/register',
  subscribe: '/register',
  pricing: '/register',
  login: '/login',
  contact: '/contact',
  mathcube: '/dashboard',
  codecube: '/dashboard',
  playcube: '/dashboard',
  docs: '/dashboard',
}

// Storage keys
const ST_MESSAGES = 'katiopa_chat_messages_v3'
const ST_TAGS = 'katiopa_chat_tags_v3'
const ST_SUMMARY = 'katiopa_chat_summary_v2'
const ST_PERSONA = 'katiopa_chat_persona_v1'

type Persona = 'kid' | 'pro'

function now(){ return Date.now() }
function uid(){ return (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}_${Math.random()}` }
function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)) }

function load<T>(key:string, fallback:T): T {
  try { const raw = localStorage.getItem(key); return raw? JSON.parse(raw) : fallback } catch { return fallback }
}
function save(key:string, value:any){
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function jaccard(a:Set<string>, b:Set<string>){
  const inter = [...a].filter(x=>b.has(x)).length
  const union = new Set([...a, ...b]).size || 1
  return inter / union
}

function say(persona: Persona, pro: string | undefined, kid?: string | undefined){
  if(persona === 'kid' && kid) return kid
  return pro ?? kid ?? 'Je n’ai pas cette information.'
}

// Weighted KB score
function scoreKB(query: string, items: KBItem[]){
  const qTok = new Set(tokenize(query))
  return items.map(item=>{
    const tagTok = new Set(item.tags?.map(normalize) ?? [])
    const s1 = jaccard(qTok, tagTok) * 0.7
    const s2 = (item.q?.toLowerCase().split(/\s+/).some(w => qTok.has(normalize(w))) ? 0.3 : 0)
    return { item, score: s1 + s2 }
  }).sort((a,b)=>b.score-a.score)
}

async function askBackendLLM(history: Message[], userText: string, signal: AbortSignal){
  try{
    const res = await fetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ system: "Tu es l’assistant du site Katiopa. Réponds clairement. Oriente vers les liens internes. Si la question concerne des enfants, utilise un ton adapté si persona=kid.",
        messages: history.concat({ id: uid(), text: userText, sender:'user', timestamp: now() }) }),
      signal
    })
    if(!res.ok) return null
    const data = await res.json()
    if(!data?.text) return null
    return { text: data.text as string, actions: (data.actions || []) as LinkAction[] }
  }catch{ return null }
}

export default function ChatBubble(){
  const [open, setOpen] = useState(false)
  const [maxi, setMaxi] = useState(false)
  const [persona, setPersona] = useState<Persona>('kid')

  const [messages, setMessages] = useState<Message[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [summary, setSummary] = useState<string>('')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const [KB, setKB] = useState<KBItem[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController|null>(null)

  // INIT
  useEffect(()=>{
    setMessages(load(ST_MESSAGES, []))
    setTags(load(ST_TAGS, []))
    setSummary(load(ST_SUMMARY, ''))
    setPersona(load(ST_PERSONA, 'kid'))

    if(load(ST_MESSAGES, []).length === 0){
      const welcome: Message = {
        id: uid(), sender:'bot', timestamp: now(),
        text: "Bienvenue. Posez votre question (inscription, tarifs, pédagogie, sécurité, vision, blague, histoire, mini-leçon). Tapez /help pour l’aide."
      }
      setMessages([welcome])
      save(ST_MESSAGES, [welcome])
    }

    ;(async()=>{
      const files = [
        '/data/chatbot/kb_site.json',
        '/data/chatbot/kb_pedago.json',
        '/data/chatbot/kb_fun_kids.json',
        '/data/chatbot/kb_mini_lessons.json',
        '/data/chatbot/kb_science_facts.json',
        '/data/chatbot/kb_reading_stories.json',
        '/data/chatbot/kb_math_problems.json'
      ]
      const all: KBItem[] = []
      for(const f of files){
        try{
          const r = await fetch(f); if(!r.ok) continue
          const arr = await r.json()
          if(Array.isArray(arr)) all.push(...arr)
        }catch{}
      }
      setKB(all)
    })()
  },[])

  useEffect(()=>{ save(ST_MESSAGES, messages.slice(-160)) },[messages])
  useEffect(()=>{ save(ST_TAGS, [...new Set(tags)].slice(-200)) },[tags])
  useEffect(()=>{ save(ST_SUMMARY, summary) },[summary])
  useEffect(()=>{ save(ST_PERSONA, persona) },[persona])

  useEffect(()=>{
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  },[messages, typing, open, maxi])

  function updateTags(text:string){
    const toks = tokenize(text).filter(t=>t.length>=3).slice(0, 12)
    if(!toks.length) return
    setTags(prev=>[...prev, ...toks].slice(-200))
  }

  function maybeSummarize(){
    const last = messages.slice(-10)
    const bullets = last.map(m => `${m.sender==='user'?'U':'B'}: ${m.text}`).join(' | ')
    setSummary(prev => bullets.length > 2000 ? bullets.slice(-2000) : bullets)
  }

  function systemCommands(raw:string): boolean {
    const t = normalize(raw.trim())
    if(t === '/help'){
      pushBot("Commandes: /help, /reset, /export, /mode kid, /mode pro.")
      return true
    }
    if(t === '/reset'){
      const hello: Message = { id: uid(), sender:'bot', timestamp: now(), text: 'Conversation effacée localement. Comment puis-je vous aider ?' }
      setMessages([hello]); setTags([]); setSummary(''); setPersona('kid')
      save(ST_MESSAGES,[hello]); save(ST_TAGS,[]); save(ST_SUMMARY,''); save(ST_PERSONA,'kid')
      return true
    }
    if(t === '/export'){
      const content = JSON.stringify({ messages, tags, summary }, null, 2)
      const blob = new Blob([content], {type: 'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `katiopa_chat_${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)
      pushBot("Export effectué.")
      return true
    }
    if(t === '/mode kid'){
      setPersona('kid'); pushBot("Mode enfant activé.")
      return true
    }
    if(t === '/mode pro'){
      setPersona('pro'); pushBot("Mode parent/pro activé.")
      return true
    }
    return false
  }

  function pushUser(text:string){
    const m: Message = { id: uid(), sender:'user', text, timestamp: now() }
    setMessages(prev=>[...prev, m])
  }
  function pushBot(text:string){
    const m: Message = { id: uid(), sender:'bot', text, timestamp: now() }
    setMessages(prev=>[...prev, m])
  }

  async function streamBot(text:string, actions?:LinkAction[]){
    setTyping(true)
    const id = uid()
    let acc = ''
    for(const ch of text){
      acc += ch
      setMessages(prev => [...prev.filter(m=>m.id!==id), { id, sender:'bot', timestamp: now(), text: acc }])
      await sleep(5)
    }
    setTyping(false)
    if(actions?.length){
      const ln = actions.map(a => `• ${a.label} → ${a.href}`).join('\n')
      pushBot(ln)
    }
    maybeSummarize()
  }

  function fromIntent(intent: string): { text: string, actions?: LinkAction[] } | null {
    switch(intent){
      case 'greeting':
        return { text: "Bonjour, je suis l’assistant Katiopa. Dites ce que vous cherchez: inscription, tarifs, matières, sécurité, vision, blague, histoire, mini-leçon." }
      case 'signup':
        return { text: say(persona, "Inscription rapide. Créez votre compte, ajoutez votre enfant, choisissez un parcours 5–7 ans.",
                                   "Pour commencer, clique sur « Commencer gratuitement ».") ,
                 actions: [{label:'Créer un compte', href: LINKS.signup}, {label:'Tarifs', href: LINKS.pricing}] }
      case 'pricing':
        return { text: say(persona, "Essai gratuit puis offres famille. Les plans payants débloquent plus de contenus et des rapports parentaux.",
                                   "Tu peux essayer gratuitement. Après, il y a des formules famille.") ,
                 actions: [{label:'Voir les tarifs', href: LINKS.pricing}, {label:'Souscrire', href: LINKS.subscribe}] }
      case 'subscribe':
        return { text: "La souscription active les contenus premium et les outils parentaux avancés.",
                 actions: [{label:'Souscrire', href: LINKS.subscribe}] }
      case 'age':
        return { text: say(persona, "Le prototype couvre 5–7 ans avec séquences et évaluations adaptées.",
                                   "Nous guidons surtout les 5 à 7 ans, avec des missions adaptées.") }
      case 'subjects':
        return { text: say(persona, "MathCube (maths), CodeCube (programmation & IA), PlayCube (détente/échecs/créations).",
                                   "Il y a MathCube, CodeCube et PlayCube.") ,
                 actions: [{label:'MathCube',href:LINKS.mathcube},{label:'CodeCube',href:LINKS.codecube},{label:'PlayCube',href:LINKS.playcube}] }
      case 'security':
        return { text: "Conformité RGPD, minimisation des données, chiffrement. Contrôle parental et droit à l’oubli." }
      case 'vision':
        return { text: say(persona, "Notre intention: une aventure d’apprentissage, ludique, guidée par l’IA, avec les parents comme co-pilotes.",
                                   "Notre but: apprendre en s’amusant.") }
      case 'contact':
        return { text: "Expliquez votre besoin ici ou utilisez la page contact.", actions: [{label:'Contacter le support', href: LINKS.contact}] }
      case 'method':
        return { text: "Parcours en quêtes, objectifs clairs, feedback immédiat, certificat final." }
      case 'parents':
        return { text: "Les parents définissent des objectifs, valident des défis et suivent la progression via des rapports." }
      case 'joke':
        return { text: say(persona, "Voici une blague adaptée: Pourquoi le livre de maths sourit-il ? Parce qu’il a trouvé la solution.",
                                   "Blague: Pourquoi le livre de maths sourit-il ? Parce qu’il a trouvé la solution.") }
      case 'story':
        return { text: say(persona, "Histoire courte: Un enfant curieux découvre une idée et la partage pour aider ses amis à apprendre.",
                                   "Micro-récit: un scénario simple pour soutenir la lecture et la compréhension.") }
      case 'lesson':
        return { text: say(persona, "Mini-leçon: L’IA apprend à partir d’exemples. Elle n’est pas magique, elle s’entraîne.",
                                   "Mini-leçon: L’IA (ML/DL) apprend des patterns à partir de données.") }
      case 'math_problem':
        return { text: say(persona, "Petit exercice: 7 + 5 = ?",
                                   "Exercice simple: 7 + 5 = 12.") }
    }
    return null
  }

  async function handleSend(){
    const raw = input
    if(!raw.trim()) return
    setInput('')
    pushUser(raw)
    updateTags(raw)

    if(systemCommands(raw)) return

    // 1) Intent
    const intent = detectIntent(raw)
    const templ = fromIntent(intent)
    if(templ){
      await streamBot(templ.text, templ.actions)
      return
    }

    // 2) RAG over KB
    if(KB.length){
      const ranked = scoreKB(raw, KB)
      const top = ranked[0]
      if(top && top.score >= 0.55){
        const it = top.item
        const text = say(persona, it.a_pro || it.a, it.a_kid)
        await streamBot(text, it.actions)
        return
      }
    }

    // 3) Fallback LLM
    setTyping(true)
    abortRef.current?.abort()
    const ctrl = new AbortController(); abortRef.current = ctrl
    const llm = await Promise.race([
      askBackendLLM(messages, raw, ctrl.signal),
      (async()=>{ await sleep(3500); return null })(),
    ])
    setTyping(false)

    if(llm){
      await streamBot(llm.text, llm.actions)
      return
    }

    // 4) Last guidance
    await streamBot("Je n’ai pas trouvé dans ma base locale. Voulez-vous parler de l’inscription, des tarifs, de la pédagogie, de la sécurité, de la vision, d’une blague, d’une histoire ou d’une mini-leçon ?", [
      {label:'Inscription', href: LINKS.signup},
      {label:'Tarifs', href: LINKS.pricing},
      {label:'Souscrire', href: LINKS.subscribe},
    ])
  }

  const suggestions = useMemo(()=>[
    "Comment inscrire mon enfant ?",
    "Quels sont les tarifs ?",
    "Explique l’IA en mots simples",
  ],[])

  const width = maxi ? 'w-[560px]' : 'w-[460px]'
  const height = maxi ? 'h-[760px]' : 'h-[640px]'
  const messagesHeight = maxi ? 'h-[600px]' : 'h-[520px]'

  return (
    <>
      {/* FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        <motion.button
          onClick={()=>setOpen(v=>!v)}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
          whileTap={{ scale: 0.95 }}
          aria-label={open?'Fermer le chat':'Ouvrir le chat'}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }} transition={{ duration:0.2 }}>
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate:90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90, opacity:0 }} transition={{ duration:0.2 }}>
                <MessageCircle size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`fixed bottom-24 right-6 ${width} ${height} bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 200 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot size={22} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold">Bubix — Assistant Katiopa</div>
                    <div className="text-[11px] text-blue-100">Disponible • Mémoire activée • Mode {persona === 'kid' ? 'enfant' : 'parent/pro'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setPersona(p=>p==='kid'?'pro':'kid')} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[12px]">
                    {persona === 'kid' ? 'Mode pro' : 'Mode kid'}
                  </button>
                  <button onClick={()=>setMaxi(v=>!v)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20" aria-label={maxi?'Réduire':'Agrandir'}>
                    {maxi ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className={`flex-1 p-4 overflow-y-auto bg-gray-50 ${messagesHeight}`}>
              <div className="space-y-3">
                {messages.map(m => (
                  <motion.div key={m.id} className={`flex ${m.sender==='user'?'justify-end':'justify-start'}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${m.sender==='user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'}`}>
                      <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.sender==='user'?'text-blue-100':'text-gray-500'}`}>
                        {new Date(m.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {typing && (
                  <motion.div className="flex justify-start" initial={{opacity:0}} animate={{opacity:1}}>
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend() } }}
                  placeholder="Votre question… (ex: tarifs, inscription, blague, mini-leçon, /help)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16}/>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Comment inscrire mon enfant ?", "Quels sont les tarifs ?", "Explique l’IA en mots simples"].map((s,i)=>(
                  <button key={i} onClick={()=>setInput(s)} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
