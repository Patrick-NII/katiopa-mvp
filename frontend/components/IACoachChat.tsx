'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Lock, 
  Crown,
  MessageCircle,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  Heart
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface IACoachChatProps {
  user: any
  account: any
  isOpen: boolean
  onClose: () => void
}

export default function IACoachChat({ user, account, isOpen, onClose }: IACoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: getWelcomeMessage(user?.userType, account?.subscriptionType),
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Déterminer les permissions selon l'abonnement
  const isFree = account?.subscriptionType === 'FREE'
  const isPro = account?.subscriptionType === 'PRO'
  const isProPlus = account?.subscriptionType === 'PRO_PLUS'
  const isEnterprise = account?.subscriptionType === 'ENTERPRISE'
  const isChild = user?.userType === 'CHILD'
  const isParent = user?.userType === 'PARENT'

  // Prompts suggérés selon le type d'abonnement
  const getSuggestedPrompts = () => {
    if (isFree) {
      return [
        "Comment puis-je aider mon enfant à progresser ?",
        "Quels exercices recommandez-vous ?"
      ]
    }

    if (isChild) {
      return [
        "Comment puis-je m'améliorer en mathématiques ?",
        "Peux-tu m'expliquer ce concept ?",
        "Quel exercice me recommandes-tu ?"
      ]
    }

    if (isParent) {
      return [
        "Comment se sent mon enfant aujourd'hui ?",
        "Quelles sont ses forces et faiblesses ?",
        "Que recommandez-vous pour la semaine ?",
        "Comment l'encourager à progresser ?"
      ]
    }

    return [
      "Comment puis-je optimiser l'apprentissage ?",
      "Quelles sont les tendances de progression ?"
    ]
  }

  // Messages de bienvenue selon le type
  function getWelcomeMessage(userType: string, subscriptionType: string) {
    if (userType === 'CHILD') {
      return `Salut ! Je suis ton IA Coach CubeAI ! 🤖✨ Je suis là pour t'aider dans ton apprentissage. Tu peux me poser des questions sur tes exercices, me demander des conseils, ou juste discuter avec moi ! Que veux-tu faire aujourd'hui ?`
    }
    
    if (userType === 'PARENT') {
      return `Bonjour ! Je suis votre IA Coach CubeAI ! 🤖👨‍👩‍👧‍👦 Je dispose de toutes les données concernant vos enfants et peux vous donner des analyses détaillées, des recommandations personnalisées et répondre à toutes vos questions sur leur apprentissage. Comment puis-je vous aider aujourd'hui ?`
    }
    
    return `Bonjour ! Je suis votre IA Coach CubeAI ! 🤖✨ Je suis là pour vous accompagner dans l'apprentissage. Comment puis-je vous aider ?`
  }

  // Vérifier les limites selon l'abonnement
  const canSendMessage = () => {
    if (isFree) {
      return messages.filter(m => m.type === 'user').length < 3 // Limite à 3 messages pour les comptes gratuits
    }
    return true // Pas de limite pour les comptes payants
  }

  const getRemainingMessages = () => {
    if (isFree) {
      const used = messages.filter(m => m.type === 'user').length
      return Math.max(0, 3 - used)
    }
    return null
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canSendMessage() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simuler la réponse de l'IA (à remplacer par l'appel API réel)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue.trim(), user, account)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Générer une réponse IA contextuelle (à remplacer par l'API réelle)
  const generateAIResponse = (userInput: string, user: any, account: any) => {
    const input = userInput.toLowerCase()
    
    if (user?.userType === 'CHILD') {
      if (input.includes('math') || input.includes('mathématiques')) {
        return "Les mathématiques sont super importantes ! 🧮 Je vois que tu progresses bien dans ce domaine. Continue à pratiquer régulièrement et n'hésite pas à me demander de l'aide pour les concepts difficiles !"
      }
      if (input.includes('progrès') || input.includes('améliorer')) {
        return "Tu fais d'excellents progrès ! 📈 Tes scores s'améliorent constamment. Pour continuer à progresser, je te recommande de varier tes exercices et de ne pas hésiter à essayer de nouveaux domaines !"
      }
      return "Excellente question ! 🤔 Continue comme ça, tu apprends vraiment bien. N'hésite pas à me poser d'autres questions sur tes exercices ou tes objectifs d'apprentissage !"
    }
    
    if (user?.userType === 'PARENT') {
      if (input.includes('enfant') || input.includes('progression')) {
        return "Vos enfants montrent une excellente progression ! 👨‍👩‍👧‍👦 Emma (6 ans) excelle particulièrement en mathématiques avec un score moyen de 85%. Thomas (7 ans) progresse bien en français. Je recommande de maintenir cette dynamique avec des sessions régulières !"
      }
      if (input.includes('conseil') || input.includes('recommandation')) {
        return "Basé sur l'analyse des données, je recommande de : 1) Maintenir des sessions de 20-30 minutes par jour, 2) Varier les domaines d'apprentissage, 3) Encourager la pratique des exercices où ils ont le plus de difficultés. Voulez-vous des détails sur un aspect particulier ?"
      }
      return "Je dispose de toutes les données de vos enfants et peux vous donner des analyses détaillées sur leur progression, leurs forces, leurs difficultés et mes recommandations personnalisées. Que souhaitez-vous savoir ?"
    }
    
    return "Merci pour votre message ! Je suis là pour vous accompagner dans l'apprentissage. Comment puis-je vous aider plus précisément ?"
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">IA Coach CubeAI</h2>
                <p className="text-blue-100 text-sm">
                  {isChild ? 'Ton professeur personnel 24h/24' : 'Votre coach éducatif intelligent'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Badge d'abonnement */}
          <div className="mt-3 flex items-center gap-2">
            {isFree ? (
              <div className="flex items-center gap-2 bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                <Lock size={14} />
                Compte Gratuit
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                <Crown size={14} />
                {isPro ? 'Pro' : isProPlus ? 'Pro Plus' : 'Entreprise'}
              </div>
            )}
            
            {isFree && getRemainingMessages() !== null && (
              <div className="text-yellow-200 text-sm">
                {getRemainingMessages()} message{getRemainingMessages() !== 1 ? 's' : ''} restant{getRemainingMessages() !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}>
                      {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-white' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-500 text-sm">IA Coach réfléchit...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Prompts suggérés */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              💡 Suggestions de questions :
            </div>
            <div className="flex flex-wrap gap-2">
              {getSuggestedPrompts().map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isFree && !canSendMessage() 
                    ? "Limite atteinte pour les comptes gratuits" 
                    : isChild 
                      ? "Pose ta question à ton IA Coach..." 
                      : "Posez votre question à votre IA Coach..."
                }
                disabled={!canSendMessage() || isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
              {isFree && !canSendMessage() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Lock size={16} className="text-gray-400" />
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !canSendMessage() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          
          {/* Aide contextuelle */}
          <div className="mt-3 text-xs text-gray-500">
            {isChild ? (
              <div className="flex items-center gap-2">
                <Brain size={14} />
                <span>Ton IA Coach connaît tes progrès et peut te donner des conseils personnalisés !</span>
              </div>
            ) : isParent ? (
              <div className="flex items-center gap-2">
                <TrendingUp size={14} />
                <span>Votre IA Coach analyse en temps réel les données de vos enfants pour des recommandations précises.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span>Votre IA Coach est là pour vous accompagner dans l'apprentissage.</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
