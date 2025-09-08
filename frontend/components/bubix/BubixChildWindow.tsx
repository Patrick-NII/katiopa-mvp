'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, Send, Bot, User, ChevronLeft, ChevronRight, Settings, History, Star, Search,
  Plus, Calculator, BookOpen, Globe, Lightbulb, Palette, Microscope, Users, Zap, Heart, Code, Gamepad2
} from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bubix'
  timestamp: Date
  subject?: string
}

interface Conversation {
  id: string
  title: string
  subject: string
  lastMessage: string
  timestamp: Date
}

interface BubixChildWindowProps {
  user: any
  userType: 'CHILD' | 'PARENT'
}

const LIVE_SUBJECTS = [
  { id: 'mathcube-live', name: 'MathCube Live', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
  { id: 'histoires-live', name: 'Histoires', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
  { id: 'geo-live', name: 'Géographie', icon: Globe, color: 'from-green-500 to-emerald-500' },
  { id: 'reflexion-live', name: 'Réflexion', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
  { id: 'creativite-live', name: 'Créativité', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { id: 'sciencecube-live', name: 'ScienceCube', icon: Microscope, color: 'from-indigo-500 to-purple-500' },
  { id: 'codecube-live', name: 'CodeCube', icon: Code, color: 'from-teal-500 to-cyan-500' },
  { id: 'playcube-live', name: 'PlayCube', icon: Gamepad2, color: 'from-red-500 to-pink-500' }
]

export default function BubixChildWindow({ user, userType }: BubixChildWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Salut ${user?.firstName || 'cher ami'} ! Je suis Bubix, ton assistant pédagogique. Je suis là pour t'aider à apprendre en s'amusant ! 🎮`,
      sender: 'bubix',
      timestamp: new Date()
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Mathématiques amusantes',
      subject: 'mathcube-live',
      lastMessage: 'Comment calculer 5 + 3 ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '2',
      title: 'Histoire de France',
      subject: 'histoires-live',
      lastMessage: 'Qui était Napoléon ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    }
  ])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      subject: activeSubject || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    // Simulation de réponse de Bubix adaptée au sujet
    setTimeout(() => {
      const subjectResponses = {
        'mathcube-live': `Super question ! En mathématiques, c'est important de comprendre le concept. Laisse-moi t'expliquer de manière simple...`,
        'histoires-live': `Excellente question historique ! L'histoire est comme une grande aventure. Voici ce que je peux te raconter...`,
        'geo-live': `Génial ! La géographie, c'est découvrir notre belle planète. Regardons ensemble...`,
        'reflexion-live': `Très bonne réflexion ! Réfléchir, c'est comme faire du sport avec son cerveau. Analysons cela...`,
        'creativite-live': `Fantastique ! La créativité, c'est magique. Créons quelque chose d'extraordinaire ensemble...`,
        'sciencecube-live': `Incroyable ! La science, c'est comme être un petit détective. Explorons ce mystère...`,
        'codecube-live': `Excellent ! La programmation, c'est comme donner des instructions à un robot. Programmons ensemble...`,
        'playcube-live': `Super ! Jouer et apprendre, c'est le meilleur ! Amusons-nous en apprenant...`
      }

      const response = activeSubject && subjectResponses[activeSubject as keyof typeof subjectResponses] 
        ? subjectResponses[activeSubject as keyof typeof subjectResponses]
        : `Merci pour ton message : "${newMessage}". Je suis là pour t'aider à apprendre en s'amusant ! 🎮`

      const bubixResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bubix',
        timestamp: new Date(),
        subject: activeSubject || undefined
      }
      setMessages(prev => [...prev, bubixResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewConversation = () => {
    setMessages([{
      id: '1',
      content: `Salut ${user?.firstName || 'cher ami'} ! Je suis Bubix, ton assistant pédagogique. Je suis là pour t'aider à apprendre en s'amusant ! 🎮`,
      sender: 'bubix',
      timestamp: new Date()
    }])
    setActiveSubject(null)
  }

  const selectSubject = (subjectId: string) => {
    setActiveSubject(subjectId)
    const subject = LIVE_SUBJECTS.find(s => s.id === subjectId)
    if (subject) {
      setMessages([{
        id: '1',
        content: `Parfait ! Nous allons travailler sur ${subject.name} ! Je vais adapter mes explications pour cette matière. Prêt à apprendre ? 🚀`,
        sender: 'bubix',
        timestamp: new Date(),
        subject: subjectId
      }])
    }
  }

  return (
    <div className="absolute inset-0 flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl dark:border-gray-700/30 rounded-2xl shadow-2xl overflow-hidden">
      {/* Sidebar pliable */}
      <motion.div
        initial={{ width: sidebarCollapsed ? 0 : 250 }}
        animate={{ width: sidebarCollapsed ? 0 : 250 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-gradient-to-b from-purple-500 to-pink-500 text-white overflow-hidden"
      >
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 h-full flex flex-col"
          >
            {/* Header avec nouvelle conversation */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white text-sm">Recherche</h3>
              </div>
              <button
                onClick={startNewConversation}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Nouvelle conversation"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Sections Live - Version compacte */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-purple-100 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Sessions Live
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {LIVE_SUBJECTS.map((subject) => {
                  const IconComponent = subject.icon
                  return (
                    <button
                      key={subject.id}
                      onClick={() => selectSubject(subject.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        activeSubject === subject.id 
                          ? 'bg-white/30' 
                          : 'hover:bg-white/20'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${subject.color} flex items-center justify-center`}>
                        <IconComponent className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-white text-center leading-tight">{subject.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Anciennes conversations - Version compacte */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-purple-100 mb-2 flex items-center gap-1">
                <History className="w-3 h-3" />
                Conversations
              </h4>
              <div className="space-y-1">
                {conversations.slice(0, 3).map((conv) => (
                  <button
                    key={conv.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <div className="text-xs text-white font-medium truncate">{conv.title}</div>
                    <div className="text-xs text-purple-200 truncate">{conv.lastMessage}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Statut - Version compacte */}
            <div className="mt-auto">
              <div className="bg-white/20 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white">En ligne</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-800 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Développer la sidebar" : "Réduire la sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-base">Bubix Assistant</h3>
              <p className="text-purple-100 text-xs">
                {activeSubject 
                  ? `Mode: ${LIVE_SUBJECTS.find(s => s.id === activeSubject)?.name || 'Général'}`
                  : 'Assistant pédagogique IA'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area - Optimisé pour éviter le scroll */}
        <div className="flex-1 overflow-hidden p-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="h-full overflow-y-auto space-y-3">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}>
                    {message.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`rounded-xl px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  }`}>
                    {message.subject && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">
                        {LIVE_SUBJECTS.find(s => s.id === message.subject)?.name}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area - Version compacte */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={activeSubject ? `Question sur ${LIVE_SUBJECTS.find(s => s.id === activeSubject)?.name}...` : "Tape ton message..."}
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}