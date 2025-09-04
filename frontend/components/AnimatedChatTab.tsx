'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Brain,
  Star,
  ChevronLeft,
  BookOpen,
  Settings,
  User,
  Crown,
  Gift
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AnimatedChatTabProps {
  subscriptionType?: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  className?: string
}

export default function AnimatedChatTab({ 
  subscriptionType = 'FREE',
  className = ""
}: AnimatedChatTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Salut ! Je suis Bubix, ton assistant IA CubeAI ! 🤖✨\n\n💡 **Mode actuel :** Base de connaissances locale\n🔒 **IA :** Disponible selon votre abonnement\n\nPose-moi n\'importe quelle question ! Je peux t\'aider avec tes devoirs, répondre à tes questions, raconter des histoires, et bien plus. Tape /help pour voir mes commandes spéciales !',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const isPremiumAccount = subscriptionType === 'PRO' || subscriptionType === 'PRO_PLUS' || subscriptionType === 'ENTERPRISE'

  const quickActions = [
    {
      title: 'Comment utiliser CubeAI ?',
      description: 'Guide d\'utilisation',
      icon: BookOpen,
      action: () => handleQuickAction('Comment utiliser CubeAI ?')
    },
    {
      title: 'Problème technique',
      description: 'Support et aide',
      icon: Settings,
      action: () => handleQuickAction('J\'ai un problème technique')
    },
    {
      title: 'Mon profil',
      description: 'Gérer mes infos',
      icon: User,
      action: () => handleQuickAction('Comment modifier mon profil ?')
    },
    {
      title: 'Fonctionnalités premium',
      description: 'Découvrir les avantages',
      icon: Star,
      action: () => handleQuickAction('Que propose le compte premium ?')
    }
  ]

  const handleQuickAction = (question: string) => {
    setInputMessage(question)
    handleSendMessage(question)
  }

  const handleSendMessage = async (message?: string) => {
    const userMessage = message || inputMessage
    if (!userMessage.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)

    // Simuler une réponse de l'assistant
    setTimeout(() => {
      const response = generateChatResponse(userMessage)
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
  }

  const generateChatResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('utiliser') || lowerQuestion.includes('comment')) {
      return `Voici comment utiliser CubeAI efficacement :

1. **Dashboard** : Consultez vos statistiques et progression
2. **Exercices** : Choisissez votre matière et commencez à pratiquer
3. **Profil** : Gérez vos informations et préférences
4. **Évaluation LLM** : Obtenez des conseils personnalisés

Voulez-vous que je vous guide sur une fonctionnalité spécifique ?`
    }
    
    if (lowerQuestion.includes('problème') || lowerQuestion.includes('technique')) {
      return `Je suis là pour vous aider ! Voici quelques solutions courantes :

• **Page qui ne charge pas** : Rafraîchissez votre navigateur
• **Exercices qui ne fonctionnent pas** : Vérifiez votre connexion internet
• **Problème de connexion** : Vérifiez vos identifiants

Pouvez-vous me décrire plus précisément le problème que vous rencontrez ?`
    }
    
    if (lowerQuestion.includes('profil') || lowerQuestion.includes('modifier')) {
      return `Pour modifier votre profil :

1. Allez dans le **Dashboard**
2. Cliquez sur **"Modifier"** dans le bloc Informations détaillées
3. Mettez à jour vos informations
4. Cliquez sur **"Sauvegarder"**

Vos modifications seront automatiquement prises en compte par l'IA Coach !`
    }
    
    if (lowerQuestion.includes('premium') || lowerQuestion.includes('fonctionnalités')) {
      return `Le compte Premium CubeAI vous offre :

✨ **Graphiques avancés** : Analyses détaillées de performance
🎯 **Plan personnalisé** : Révision espacée et planning intelligent
📊 **Statistiques complètes** : Historique et tendances
🤖 **IA avancée** : Mémoire, recommandations personnalisées
👨‍🏫 **Notes enseignants** : Conseils pédagogiques détaillés

Voulez-vous en savoir plus sur l'upgrade ?`
    }
    
    return `Merci pour votre question ! Je vais vous aider au mieux.

Pour une réponse plus précise, pourriez-vous reformuler ou préciser votre demande ? Je peux vous aider sur :
• L'utilisation de CubeAI
• Les fonctionnalités disponibles
• La résolution de problèmes
• Votre progression et statistiques`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Déterminer le style selon le type de compte
  const getTabStyle = () => {
    if (subscriptionType === 'PRO_PLUS' || subscriptionType === 'ENTERPRISE') {
      return {
        bg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600',
        hoverBg: 'hover:from-fuchsia-700 hover:to-purple-700',
        icon: <Crown size={28} />,
        text: 'Bubix Premium',
        description: 'IA avancée avec mémoire',
        buttonBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600',
        buttonHoverBg: 'hover:from-fuchsia-700 hover:to-purple-700'
      }
    } else if (subscriptionType === 'PRO') {
      return {
        bg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        hoverBg: 'hover:from-blue-700 hover:to-indigo-700',
        icon: <Star size={28} />,
        text: 'Bubix Pro',
        description: 'IA coach personnalisé',
        buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        buttonHoverBg: 'hover:from-blue-700 hover:to-indigo-700'
      }
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-600 to-purple-600',
        hoverBg: 'hover:from-blue-700 hover:to-purple-700',
        icon: <Gift size={28} />,
        text: 'Bubix',
        description: 'Assistant IA de base',
        buttonBg: 'bg-gradient-to-r from-blue-600 to-purple-600',
        buttonHoverBg: 'hover:from-blue-700 hover:to-purple-700'
      }
    }
  }

  const tabStyle = getTabStyle()

  return (
    <>
      {/* Conteneur fixé au bord droit, centré verticalement */}
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 ${className}`}>
        {/* Bouton de la languette (sert à ouvrir/fermer) */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            absolute top-1/2 -translate-y-1/2 h-40 ${tabStyle.bg} ${tabStyle.hoverBg} text-white 
            rounded-l-3xl ${isOpen ? 'rounded-r-none' : 'rounded-r-3xl'} shadow-lg hover:shadow-xl transition-all duration-300 
            flex items-center justify-center gap-4 cursor-pointer
          `}
          style={{ width: 100, right: 0 }}
          animate={{ right: isOpen ? 550 : 0 }}
          whileHover={{ 
            width: 140, // effet "étirer" horizontal de la languette
            x: -6,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icône principale */}
          <motion.div
            animate={isTyping ? { 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            } : {
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: isTyping ? 1 : 2,
              repeat: isTyping ? Infinity : Infinity,
              ease: "easeInOut"
            }}
          >
            {isTyping ? <Brain size={28} /> : tabStyle.icon}
          </motion.div>

          {/* Texte et description */}
          <div className="text-center">
            <div className="text-base font-semibold">
              {isTyping ? 'En train d\'écrire...' : tabStyle.text}
            </div>
            <div className="text-sm opacity-90">
              {isTyping ? 'Analyse en cours...' : tabStyle.description}
            </div>
          </div>

          {/* Icône d'expansion */}
          <motion.div
            animate={{ 
              rotate: isOpen ? 180 : 0,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
          </motion.div>

          {/* Effet de brillance */}
          {!isTyping && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
              initial={{ x: '-100%' }}
              whileHover={{ 
                x: '100%',
                opacity: [0, 0.3, 0]
              }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Animation de particules pour les comptes premium */}
          {isPremiumAccount && !isTyping && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-l-3xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{
                    x: [0, Math.random() * 200 - 100],
                    y: [0, Math.random() * 200 - 100],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut"
                  }}
                  style={{
                    left: `${20 + (i * 12)}%`,
                    top: `${20 + (i * 8)}%`
                  }}
                />
              ))}
            </div>
          )}
        </motion.button>

        {/* Fenêtre de chat centrée à droite */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed right-0 top-1/2 -translate-y-1/2 h-[650px] bg-white rounded-l-3xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ width: 550 }}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              {/* En-tête */}
              <div className={`${tabStyle.bg} text-white p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Brain size={28} />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-semibold">{tabStyle.text}</h3>
                      <p className="text-blue-100 text-sm">Assistant IA CubeAI</p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Actions rapides</h4>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      className="p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <action.icon size={20} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{action.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(650px - 280px)' }}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-xl ${
                        message.type === 'user'
                          ? `${tabStyle.buttonBg} text-white`
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-white' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="bg-gray-100 text-gray-800 p-4 rounded-xl">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre question..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <motion.button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim()}
                    className={`px-6 py-3 ${tabStyle.buttonBg} ${tabStyle.buttonHoverBg} text-white rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
