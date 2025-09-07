'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, X, MessageCircle, Trash2, Plus, Bot, User, Sparkles,
  Share2, Download, Crown, Star, Zap, Heart, Search
} from 'lucide-react'
import { useAvatar } from '@/contexts/AvatarContext'

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
  const { selectedAvatar } = useAvatar()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // Sur mobile, fermer la sidebar par défaut
      if (window.innerWidth < 1024) {
        setShowSidebar(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // États pour les limites de caractères
  const [characterLimits, setCharacterLimits] = useState({
    max: 2000,
    current: 0,
    remaining: 2000,
    subscriptionType: subscriptionType
  })

  // Fonction pour obtenir la limite de caractères selon l'abonnement
  const getMaxCharactersForSubscription = (subscriptionType: string): number => {
    switch (subscriptionType) {
      case 'FREE':
        return 500
      case 'PRO':
        return 2000 // Bubix Pro - limite généreuse
      case 'PRO_PLUS':
        return 4000
      case 'ENTERPRISE':
        return 6000
      default:
        return 500
    }
  }

  // Fonction pour calculer les caractères restants
  const calculateRemainingCharacters = (text: string): number => {
    const maxChars = getMaxCharactersForSubscription(subscriptionType)
    return Math.max(0, maxChars - text.length)
  }

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

  // ---------- 3) Mise à jour des limites de caractères ----------
  useEffect(() => {
    const maxChars = getMaxCharactersForSubscription(subscriptionType)
    const currentChars = inputValue.length
    const remainingChars = calculateRemainingCharacters(inputValue)
    
    setCharacterLimits({
      max: maxChars,
      current: currentChars,
      remaining: remainingChars,
      subscriptionType: subscriptionType
    })
  }, [inputValue, subscriptionType])

  // ---------- 3) Conversations: load/save ----------
  // Générer le message d'accueil personnalisé
  const generateWelcomeMessage = () => {
    if (userType === 'PARENT' && user && childSessions && childSessions.length > 0) {
      const childrenNames = childSessions.map(child => child.firstName).join(' et ');
      const childrenCount = childSessions.length;
      
      return `Bonjour ${user.firstName} ! 👋

Je suis Bubix, votre expert pédagogique personnel de CubeAI. Je suis là pour vous accompagner dans l'éducation de ${childrenCount > 1 ? 'vos enfants' : 'votre enfant'} ${childrenNames}.

🎯 **Ce que je peux faire pour vous :**
• Analyser les performances de ${childrenCount > 1 ? 'vos enfants' : 'votre enfant'}
• Proposer des méthodes d'apprentissage adaptées
• Suivre les progrès en temps réel
• Répondre à vos questions éducatives

💡 **N'hésitez pas à me poser des questions sur :**
- Les difficultés d'apprentissage
- Les méthodes pédagogiques
- Le suivi des progrès
- Les recommandations personnalisées

Comment puis-je vous aider aujourd'hui ?`;
    } else if (userType === 'CHILD' && user) {
      return `Salut ${user.firstName} ! 🌟

Je suis Bubix, ton assistant d'apprentissage préféré ! Je suis là pour t'aider à apprendre en s'amusant.

🎮 **Ce qu'on peut faire ensemble :**
• Résoudre des problèmes de maths
• Apprendre de nouvelles choses
• Jouer avec les mots
• Découvrir le monde des sciences

💫 **Dis-moi ce que tu veux faire aujourd'hui !**
Tu peux me poser n'importe quelle question ou me demander de t'aider avec tes devoirs.`;
    } else {
      return `Bonjour ! 👋

Je suis Bubix, l'assistant IA intelligent de CubeAI. Je suis là pour vous aider avec vos questions éducatives.

Comment puis-je vous aider aujourd'hui ?`;
    }
  };

  const createNewConversation = () => {
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      text: generateWelcomeMessage(),
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

  // ---------- 4) Recherche de conversations ----------
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      conversation.title.toLowerCase().includes(query) ||
      conversation.messages.some(message => 
        message.text.toLowerCase().includes(query)
      )
    )
  })

  // ---------- 5) Envoi message ----------
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
      
      // Mettre à jour les limites de caractères depuis la réponse
      if (data.characterLimits) {
        setCharacterLimits(data.characterLimits)
      }
      
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

      // Sécurité: si le titre n'a pas été défini avant (cas rare), on le définit ici
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

  // Fonction pour sélectionner une conversation (avec fermeture auto sur mobile)
  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
    if (isMobile) {
      setShowSidebar(false)
    }
  }
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
        // L'utilisateur a peut-être annulé ; on tente le fallback
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

  // Fonction pour obtenir l'icône et le style selon le type d'abonnement
  const getSubscriptionInfo = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'premium':
      case 'pro':
        return {
          icon: <Crown size={14} className="text-yellow-600" />,
          bgClass: 'bg-gradient-to-r from-yellow-100 to-orange-100',
          textClass: 'text-yellow-800',
          borderClass: 'border-yellow-200'
        }
      case 'starter':
      case 'gratuit':
        return {
          icon: <Star size={14} className="text-blue-600" />,
          bgClass: 'bg-gradient-to-r from-blue-100 to-indigo-100',
          textClass: 'text-blue-800',
          borderClass: 'border-blue-200'
        }
      case 'family':
        return {
          icon: <Heart size={14} className="text-pink-600" />,
          bgClass: 'bg-gradient-to-r from-pink-100 to-purple-100',
          textClass: 'text-pink-800',
          borderClass: 'border-pink-200'
        }
      default:
        return {
          icon: <Zap size={14} className="text-purple-600" />,
          bgClass: 'bg-gradient-to-r from-purple-100 to-indigo-100',
          textClass: 'text-purple-800',
          borderClass: 'border-purple-200'
        }
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-indigo-50" style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: '0',
      borderRadius: '0',
      overflow: 'hidden'
    }}>
      {/* Overlay pour mobile */}
      {showSidebar && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 280 }}
            exit={{ width: 0 }}
            className="bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col h-full min-w-0 shadow-lg lg:relative lg:z-auto z-50 fixed lg:static inset-0 lg:inset-auto"
          >
            {/* Header */}
            <div className="border-b border-gray-200/50 flex-shrink-0">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <Bot size={16} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-blue-900">Bubix</h2>
                    <p className="text-xs sm:text-sm text-blue-600 hidden sm:block">
                      {userType === 'CHILD' ? "Assistant d'apprentissage" : 'Assistant parental'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-sm"
                >
                  <X size={16} className="sm:w-5 sm:h-5 text-red-600" />
                </button>
              </div>
            </div>

            {/* Barre d'actions "Partager / Exporter" */}
            <div className="border-b border-gray-200/50 flex-shrink-0 p-2 sm:p-3">
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <button
                  onClick={shareCurrentConversation}
                  className="flex items-center justify-center gap-1 text-blue-900 px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-blue-50 transition-colors"
                  title="Partager la conversation"
                >
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Partager</span>
                </button>
                <button
                  onClick={exportCurrentConversation}
                  className="flex items-center justify-center gap-1 text-blue-900 px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-blue-50 transition-colors"
                  title="Exporter en JSON"
                >
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Exporter</span>
                </button>
              </div>
            </div>
            {/* bouton search */}
            <div className="border-b border-gray-200/50 flex-shrink-0 p-2 sm:p-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Search size={16} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{showSearch ? 'Masquer' : 'Rechercher'}</span>
              </button>
            </div>

            {/* Input de recherche */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-200/50 flex-shrink-0 overflow-hidden"
                >
                  <div className="p-2 sm:p-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher dans les conversations..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-gray-500 mt-2">
                        {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} trouvée{filteredConversations.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            

            {/* Bouton Nouvelle conversation */}
            <div className="border-b border-gray-200/50 flex-shrink-0 p-2 sm:p-3">
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={16} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Nouvelle conversation</span>
              </button>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {filteredConversations.length === 0 ? (
                <div className="p-3 sm:p-4 text-center">
                  {searchQuery ? (
                    <div className="text-gray-500">
                      <p className="text-xs sm:text-sm">Aucune conversation trouvée pour "{searchQuery}"</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">Aucune conversation</p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`w-full p-2 sm:p-3 cursor-pointer transition-all duration-200 border-b border-gray-100/50 ${
                      currentConversation?.id === conversation.id 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200' 
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-blue-900 truncate">{conversation.title}</h3>
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
                        <Trash2 size={12} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <section className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-white/50 backdrop-blur-sm">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {!showSidebar && (
                <button 
                  onClick={() => setShowSidebar(true)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3 bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-sm"
                >
                  <Bot size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                </button>
              )}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Bot size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-blue-900">Bubix {subscriptionType}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-blue-600">
                    {userType === 'CHILD' ? "Assistant d'apprentissage" : 'Assistant parental'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Onglet Conversations pour mobile */}
        {!showSidebar && isMobile && (
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-3 py-2 flex-shrink-0">
            <button
              onClick={() => setShowSidebar(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MessageCircle size={16} />
              <span className="text-sm font-medium">
                Mes Conversations ({conversations.length})
              </span>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {currentConversation?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                  <Sparkles size={24} className="sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Bienvenue chez Bubix !</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {userType === 'CHILD'
                    ? "Je suis ton assistant d'apprentissage. Pose-moi des questions sur tes exercices ou demande-moi de l'aide !"
                    : "Je suis votre assistant parental. Je peux vous aider à suivre les progrès de vos enfants et répondre à vos questions."}
                </p>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-500">💡 Essayez de me demander :</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(userType === 'CHILD' 
                      ? ['Aide-moi avec les maths', 'Explique-moi la programmation', 'Comment bien réviser ?', 'Je suis bloqué']
                      : ['Progrès de mon enfant', 'Conseils éducatifs', 'Activités recommandées', 'Suivi scolaire']
                    ).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputValue(suggestion)}
                        className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {currentConversation?.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] flex gap-2 sm:gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.sender === 'user' ? (
                        <img
                          src={selectedAvatar || user?.avatarPath || '/avatar/46634418-D597-4138-A12C-ED6DB610C8BD_1_105_c.jpeg'}
                          alt={`Avatar de ${user?.firstName || 'Utilisateur'}`}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                          <Bot size={16} className="sm:w-5 sm:h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200/50'
                      }`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 sm:mt-2 ${
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
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <Bot size={16} className="sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200/50 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500">Bubix réfléchit...</span>
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
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-3 sm:p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 sm:gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={userType === 'CHILD' ? 'Pose ta question à Bubix...' : 'Posez votre question à Bubix...'}
                  className="w-full resize-none border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm leading-5 bg-white/50 backdrop-blur-sm"
                  rows={1}
                  disabled={isLoading}
                  maxLength={characterLimits.max}
                />
                {/* Compteur de caractères */}
                <div className="absolute bottom-1 sm:bottom-2 right-2 sm:right-3 flex items-center gap-1 text-xs">
                  <span className={`${
                    characterLimits.remaining < 100 ? 'text-red-500' : 
                    characterLimits.remaining < 300 ? 'text-orange-500' : 'text-gray-400'
                  }`}>
                    {characterLimits.current}/{characterLimits.max}
                  </span>
                  {characterLimits.remaining < 100 && (
                    <span className="text-red-500">⚠️</span>
                  )}
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading || characterLimits.remaining < 0}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Send size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Entrée pour envoyer • Shift+Entrée pour une nouvelle ligne
              </p>
              <p className="text-xs text-gray-500">
                Limite: {characterLimits.max} caractères ({subscriptionType})
              </p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
}