'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Bot, User, Sparkles, X, Plus, Trash2
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

export default function PublicBubix() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ---------- Utils: titre auto ----------
  const clean = (s: string) =>
    s.replace(/\s+/g, ' ').replace(/[\r\n\t]/g, ' ').trim()

  const capitalize = (s: string) =>
    s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s

  const generateAutoTitle = (messages: Message[]): string => {
    const firstUser = messages.find(m => m.sender === 'user' && clean(m.text).length > 0)
    if (!firstUser) return 'Nouvelle conversation'
    const text = clean(firstUser.text)
    const sentence = text.split(/(?<=\.|\?|!)/)[0] || text
    const words = sentence.split(' ').slice(0, 8).join(' ')
    const base = capitalize(words)
    const truncated = base.length > 40 ? base.slice(0, 39).trimEnd() + '…' : base
    return truncated
  }

  const needsAutoTitle = (conv: Conversation) => {
    const t = conv.title?.trim() || ''
    return t === '' || /^nouvelle conversation$/i.test(t)
  }

  // ---------- Auto-scroll vers le bas ----------
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, scrollToBottom])

  // ---------- Auto-resize textarea ----------
  const autoResize = useCallback(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || '20')
    const max = lineHeight * 4
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px'
  }, [])
  useEffect(() => {
    autoResize()
  }, [inputValue, autoResize])

  // ---------- Conversations: load/save ----------
  const createNewConversation = () => {
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      text: `Bonjour ! 👋

Je suis Bubix, l'assistant IA intelligent de CubeAI. Je suis là pour vous faire découvrir les possibilités de l'apprentissage personnalisé.

🌟 **Découvrez CubeAI :**
• Assistant pédagogique intelligent
• Méthodes d'apprentissage adaptées
• Suivi des progrès en temps réel
• Support pour parents et enfants

💡 **Posez-moi vos questions sur :**
- L'éducation et l'apprentissage
- Les méthodes pédagogiques
- Les défis éducatifs
- Comment CubeAI peut vous aider

Comment puis-je vous aider à découvrir CubeAI ?`,
      sender: 'bot',
      timestamp: Date.now()
    };

    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'Nouvelle conversation',
      messages: [welcomeMessage],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    }
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversation(newConversation)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedConversations = localStorage.getItem('public_bubix_conversations')
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
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (conversations.length > 0) {
      localStorage.setItem('public_bubix_conversations', JSON.stringify(conversations))
    }
  }, [conversations])

  // ---------- Bot conversationnel local ----------
  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim()
    
    // Salutations
    if (message.includes('bonjour') || message.includes('hello') || message.includes('salut')) {
      return "Bonjour ! Je suis Bubix, votre assistant conversationnel. Comment puis-je vous aider aujourd'hui ? 😊"
    }
    
    // Questions sur Bubix
    if (message.includes('qui es-tu') || message.includes('qui es tu') || message.includes('présente')) {
      return "Je suis Bubix, un assistant conversationnel intelligent créé par CubeAI. Je peux vous aider avec des questions, des discussions ou simplement discuter ! 🤖✨"
    }
    
    // Questions sur CubeAI
    if (message.includes('cubeai') || message.includes('cube ai') || message.includes('cube')) {
      return "CubeAI est une plateforme éducative innovante qui propose des expériences d'apprentissage gamifiées pour les enfants. Nous avons des modules en mathématiques, programmation, sciences et plus encore ! 🎮📚"
    }
    
    // Questions sur l'heure
    if (message.includes('heure') || message.includes('temps')) {
      const now = new Date()
      return `Il est actuellement ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. ⏰`
    }
    
    // Questions sur la météo
    if (message.includes('météo') || message.includes('temps qu\'il fait')) {
      return "Je ne peux pas vérifier la météo en temps réel, mais je vous recommande de regarder par la fenêtre ou de consulter un site météo ! 🌤️"
    }
    
    // Questions mathématiques simples
    if (message.includes('1+1') || message.includes('1 + 1')) {
      return "1 + 1 = 2 ! C'est une addition simple. 🧮"
    }
    
    // Questions sur les exercices
    if (message.includes('exercice') || message.includes('exercices')) {
      return "CubeAI propose de nombreux exercices : mathématiques, programmation, sciences, créativité... Chaque module est adapté à l'âge de l'enfant ! 📝🎯"
    }
    
    // Questions par défaut
    const defaultResponses = [
      "C'est une excellente question ! Pouvez-vous me donner plus de détails ? 🤔",
      "Je comprends votre demande. Laissez-moi réfléchir à cela... 💭",
      "Merci pour votre message ! Avez-vous d'autres questions ? 😊",
      "C'est intéressant ! J'aimerais en savoir plus sur ce sujet. 📖",
      "Je suis là pour vous aider. Que souhaitez-vous explorer ? 🚀",
      "Excellente observation ! Pouvez-vous développer votre pensée ? 💡",
      "Je trouve cela fascinant. Parlons-en plus en détail ! ✨",
      "C'est un sujet passionnant ! Que voulez-vous savoir exactement ? 🎉"
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  // ---------- Envoi message ----------
  const sendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now()
    }

    let updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: Date.now()
    }

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

    // Réponse locale avec délai naturel
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text)
      const botMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        text: botResponse,
        sender: 'bot',
        timestamp: Date.now()
      }

      let finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, botMessage],
        lastUpdated: Date.now()
      }

      if (needsAutoTitle(finalConversation)) {
        finalConversation = { 
          ...finalConversation, 
          title: generateAutoTitle(finalConversation.messages) 
        }
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => prev.map(c => (c.id === finalConversation.id ? finalConversation : c)))
      setIsLoading(false)
      inputRef.current?.focus()
    }, 800 + Math.random() * 400) // Délai naturel entre 800ms et 1200ms
  }

  // ---------- Suppression conversation ----------
  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    if (currentConversation?.id === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId)
      setCurrentConversation(remaining[0] || null)
    }
  }

  // ---------- Entrée pour envoyer ----------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 280 }}
            exit={{ width: 0 }}
            className="bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col h-full min-w-0 shadow-lg"
          >
            {/* Header */}
            <div className="border-b border-gray-200/50 flex-shrink-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Bot size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-blue-900">Bubix</h2>
                </div>
                <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Bouton Nouvelle conversation */}
            <div className="border-b border-gray-200/50 flex-shrink-0 p-3">
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={18} />
                Nouvelle conversation
              </button>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`mb-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    currentConversation?.id === conversation.id 
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 shadow-md' 
                      : 'bg-white/60 hover:bg-white/80 border border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => setCurrentConversation(conversation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-blue-900 truncate">{conversation.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(conversation.lastUpdated)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                      className="p-1 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
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
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button onClick={() => setShowSidebar(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bot size={20} />
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">Bubix</h1>
                <p className="text-sm text-blue-600">Assistant conversationnel</p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {currentConversation?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">Bienvenue chez Bubix !</h3>
                <p className="text-gray-600 mb-6">
                  Je suis votre assistant conversationnel. Posez-moi des questions, discutons ou explorez ensemble !
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">💡 Essayez de me demander :</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Qui es-tu ?', 'Parle-moi de CubeAI', 'Quelle heure est-il ?', '1+1 ?'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputValue(suggestion)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentConversation?.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] flex gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.sender === 'user' ? (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <User size={20} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                          <Bot size={20} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200/50'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="bg-white border border-gray-200/50 px-4 py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-gray-500">Bubix réfléchit...</span>
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
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question à Bubix..."
                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-5 bg-white/50 backdrop-blur-sm"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Entrée pour envoyer • Shift+Entrée pour une nouvelle ligne
            </p>
          </div>
        </footer>
      </section>
    </div>
  )
}
