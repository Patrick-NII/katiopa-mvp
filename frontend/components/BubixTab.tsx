'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, X, MessageCircle, Trash2, Plus, Bot, User, Sparkles,
  Share2, Download
} from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  lastUpdated: number
}

interface BubixTabProps {
  user: any
  childSessions: any[]
  userType: 'CHILD' | 'PARENT'
  subscriptionType: string
}

export default function BubixTab({ user, childSessions, userType, subscriptionType }: BubixTabProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  // ---------- Utils: titre auto ----------
  const clean = (s: string) =>
    s.replace(/\s+/g, ' ').replace(/[\r\n\t]/g, ' ').trim()

  const capitalize = (s: string) =>
    s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s

  const generateAutoTitle = (messages: Message[]): string => {
    // On prend le premier message USER non vide
    const firstUser = messages.find(m => m.sender === 'user' && clean(m.text).length > 0)
    if (!firstUser) return 'Nouvelle conversation'
    // Prend la 1ère phrase ou 6-8 mots
    const text = clean(firstUser.text)
    // coupe à la 1ère ponctuation forte si présente
    const sentence = text.split(/(?<=\.|\?|!)/)[0] || text
    const words = sentence.split(' ').slice(0, 12).join(' ')
    const base = capitalize(words)
    // Limite ~48 caractères pour rester net dans la sidebar
    const truncated = base.length > 48 ? base.slice(0, 47).trimEnd() + '…' : base
    return truncated
  }

  const needsAutoTitle = (conv: Conversation) => {
    // On (re)nomme si le titre est vide, par défaut, ou juste des espaces
    const t = conv.title?.trim() || ''
    return t === '' || /^nouvelle conversation$/i.test(t)
  }

  // ---------- 0) Verrouille le scroll de page & fixe un vrai 100vh ----------
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('resize', setVh)
    }
  }, [])

  // ---------- 1) Auto-scroll vers le bas ----------
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, scrollToBottom])

  // ---------- 2) Auto-resize textarea (1 → 6 lignes) ----------
  const autoResize = useCallback(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || '20')
    const max = lineHeight * 6
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px'
  }, [])
  useEffect(() => {
    autoResize()
  }, [inputValue, autoResize])

  // ---------- 3) Conversations: load/save ----------
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    }
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversation(newConversation)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedConversations = localStorage.getItem(`bubix_conversations_${user?.id}`)
    if (savedConversations) {
      try {
        const parsed: Conversation[] = JSON.parse(savedConversations)
        setConversations(parsed)
        if (parsed.length > 0) setCurrentConversation(parsed[0])
        else createNewConversation()
      } catch (e) {
        console.error('Erreur lors du chargement des conversations:', e)
        createNewConversation()
      }
    } else {
      createNewConversation()
    }
  }, [user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (conversations.length > 0) {
      localStorage.setItem(`bubix_conversations_${user?.id}`, JSON.stringify(conversations))
    }
  }, [conversations, user?.id])

  // ---------- 4) Envoi message ----------
  const sendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now()
    }

    // Met à jour la conv courante
    let updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: Date.now()
    }

    // Si besoin, auto-nommer maintenant (dès 1er message)
    if (needsAutoTitle(updatedConversation)) {
      updatedConversation = { 
        ...updatedConversation, 
        title: generateAutoTitle(updatedConversation.messages) 
      }
    }

    setCurrentConversation(updatedConversation)
    setConversations(prev => prev.map(c => (c.id === updatedConversation.id ? updatedConversation : c)))
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedConversation.messages,
          persona: userType === 'CHILD' ? 'kid' : 'pro',
          lang: 'fr',
          user,
          childSessions
        })
      })

      if (!response.ok) throw new Error('Erreur lors de la communication avec Bubix')

      const data = await response.json()
      const botMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        text: data.text,
        sender: 'bot',
        timestamp: Date.now()
      }

      let finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, botMessage],
        lastUpdated: Date.now()
      }

      // Sécurité: si le titre n’a pas été défini avant (cas rare), on le définit ici
      if (needsAutoTitle(finalConversation)) {
        finalConversation = { 
          ...finalConversation, 
          title: generateAutoTitle(finalConversation.messages) 
        }
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => prev.map(c => (c.id === finalConversation.id ? finalConversation : c)))
    } catch (error) {
      console.error('Erreur:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        text: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        sender: 'bot',
        timestamp: Date.now()
      }
      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        lastUpdated: Date.now()
      }
      setCurrentConversation(finalConversation)
      setConversations(prev => prev.map(c => (c.id === finalConversation.id ? finalConversation : c)))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // ---------- 5) Suppression conversation ----------
  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    if (currentConversation?.id === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId)
      setCurrentConversation(remaining[0] || null)
    }
  }

  // ---------- 6) Entrée pour envoyer ----------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ---------- 7) Partage & Export ----------
  const getConversationExport = (conv: Conversation) => {
    const payload = {
      meta: {
        app: 'Bubix',
        version: 1,
        exportedAt: new Date().toISOString(),
      },
      conversation: conv
    }
    return JSON.stringify(payload, null, 2)
  }

  const exportCurrentConversation = () => {
    if (!currentConversation) {
      alert('Aucune conversation sélectionnée.')
      return
    }
    const json = getConversationExport(currentConversation)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeTitle = (currentConversation.title || 'conversation')
      .toLowerCase()
      .replace(/[^a-z0-9\-_\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
    a.download = `bubix-${safeTitle || 'conversation'}-${currentConversation.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareCurrentConversation = async () => {
    if (!currentConversation) {
      alert('Aucune conversation sélectionnée.')
      return
    }
    const json = getConversationExport(currentConversation)

    const shareText = `💬 ${currentConversation.title}\n\n` +
      currentConversation.messages.map(m => {
        const who = m.sender === 'user' ? 'Moi' : 'Bubix'
        return `${who} — ${new Date(m.timestamp).toLocaleString('fr-FR')}\n${m.text}\n`
      }).join('\n')

    // 1) Web Share API (si dispo)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bubix — ${currentConversation.title}`,
          text: shareText
          // On peut aussi joindre une URL si tu as une page publique
        })
        return
      } catch (e) {
        // L’utilisateur a peut-être annulé ; on tente le fallback
        console.warn('Partage annulé ou non supporté, fallback presse-papiers.')
      }
    }

    // 2) Fallback: copie le JSON dans le presse-papiers
    try {
      await navigator.clipboard.writeText(json)
      alert('Conversation copiée dans le presse-papiers (format JSON).')
    } catch {
      // 3) Fallback final: ouvre une fenêtre avec le JSON
      const w = window.open()
      if (w) {
        w.document.write(`<pre>${json.replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c] as string))}</pre>`)
        w.document.close()
      } else {
        alert('Impossible de partager, autorisez les popups ou réessayez.')
      }
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="w-full overflow-hidden" style={{ height: 'calc(var(--vh) * 98)' }}>
      <div className="h-full w-full flex bg-gray-50">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0 }}
              animate={{ width: 280 }}
              exit={{ width: 0 }}
              className="bg-white border-r border-gray-200 flex flex-col h-full min-w-0"
            >
              {/* Header */}
              <div className="border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-base font-semibold text-gray-900">Bubix</h2>
                  <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* NEW: barre d’actions “Partager / Exporter” */}
              <div className="border-b border-gray-200 flex-shrink-0 px-3 py-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareCurrentConversation}
                    className="flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 px-2 py-1.5 rounded hover:bg-gray-50 text-sm"
                    title="Partager la conversation"
                  >
                    <Share2 size={16} />
                    Partager
                  </button>
                  <button
                    onClick={exportCurrentConversation}
                    className="flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 px-2 py-1.5 rounded hover:bg-gray-50 text-sm"
                    title="Exporter en JSON"
                  >
                    <Download size={16} />
                    Exporter
                  </button>
                </div>
              </div>

              {/* Bouton Nouvelle conversation */}
              <div className="border-b border-gray-200 flex-shrink-0">
                <button
                  onClick={createNewConversation}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-2 py-1.5 rounded-none hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Nouvelle conversation
                </button>
              </div>

              {/* Liste des conversations (scroll seule) */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setCurrentConversation(conversation)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h3>
                        <p className="text-xs text-gray-500">{formatDate(conversation.lastUpdated)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conversation.id)
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main */}
        <section className="flex-1 flex flex-col h-full min-h-0 min-w-0">
          {/* Header (fixe, compact) */}
          <header className="bg-white border-b border-gray-200 px-2 py-1 flex-shrink-0">
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                {!showSidebar && (
                  <button onClick={() => setShowSidebar(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <MessageCircle size={18} />
                  </button>
                )}
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <h1 className="text-base font-semibold text-gray-900">Bubix</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{subscriptionType}</span>
                <p className="text-xs text-gray-600 ml-2">
                  {userType === 'CHILD' ? "Assistant d'apprentissage" : 'Assistant parental'}
                </p>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-2 min-h-0">
            {currentConversation?.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bienvenue chez Bubix !</h3>
                  <p className="text-gray-600">
                    {userType === 'CHILD'
                      ? "Je suis ton assistant d'apprentissage. Pose-moi des questions sur tes exercices ou demande-moi de l'aide !"
                      : "Je suis votre assistant parental. Je peux vous aider à suivre les progrès de vos enfants et répondre à vos questions."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentConversation?.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex gap-2 ${
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                        }`}
                      >
                        {message.sender === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-[11px] mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="max-w-xs sm:max-w-sm md:max-w-md lg-max-w-lg xl:max-w-xl flex gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot size={12} className="text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <footer className="bg-white border-t border-gray-200 p-1 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={userType === 'CHILD' ? 'Pose ta question à Bubix...' : 'Posez votre question à Bubix...'}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-5"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 text-center">Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne</p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}