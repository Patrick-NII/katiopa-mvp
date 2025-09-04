'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  User, 
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface HelpMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function HelpChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<HelpMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA CubeAI. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const quickActions = [
    {
              title: 'Comment utiliser CubeAI ?',
      description: 'Guide d\'utilisation de base',
      icon: BookOpen,
              action: () => handleQuickAction('Comment utiliser CubeAI ?')
    },
    {
      title: 'Problème technique',
      description: 'Dépannage et support',
      icon: Settings,
      action: () => handleQuickAction('J\'ai un problème technique')
    },
    {
      title: 'Mon profil utilisateur',
      description: 'Gérer mes informations',
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

    // Ajouter le message utilisateur
    const userMsg: HelpMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)

    // Simuler une réponse de l'assistant (remplacer par un vrai appel API)
    setTimeout(() => {
      const response = generateHelpResponse(userMessage)
      const assistantMsg: HelpMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000) // Délai réaliste
  }

  const generateHelpResponse = (question: string): string => {
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
    
    if (lowerQuestion.includes('exercices') || lowerQuestion.includes('pratiquer')) {
      return `Pour commencer à pratiquer :

1. **Choisissez une matière** : Maths, Lecture, Sciences, IA, etc.
2. **Sélectionnez un exercice** : Adapté à votre niveau
3. **Pratiquez régulièrement** : 15-20 min par jour recommandé
4. **Suivez votre progression** : Dans le Dashboard

L'IA Coach vous recommandera les exercices les plus adaptés !`
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

  return (
    <>
      {/* Bouton flottant d'aide */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Fenêtre de chat d'aide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                    <HelpCircle size={20} />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold">Assistant CubeAI</h3>
                    <p className="text-blue-100 text-sm">Comment puis-je vous aider ?</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </motion.button>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Actions rapides */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.title}
                        onClick={action.action}
                        className="p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <action.icon size={16} className="text-blue-600" />
                          <span className="text-xs font-medium text-gray-900">{action.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
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
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
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
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre question..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <motion.button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send size={16} />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 