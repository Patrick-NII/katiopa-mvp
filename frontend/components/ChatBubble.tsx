'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, User, Bot, Phone, Mail, MapPin } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Bonjour ! Je suis l'assistant virtuel de Katiopa. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simuler une réponse automatique
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('inscription') || input.includes('inscrire') || input.includes('compte')) {
      return "Pour vous inscrire, cliquez sur 'Commencer gratuitement' en haut de la page. Le processus prend moins de 5 minutes !"
    }
    
    if (input.includes('prix') || input.includes('tarif') || input.includes('abonnement')) {
      return "Nous proposons un plan gratuit et des plans payants à partir de 9.99€/mois. Commencez gratuitement pour tester !"
    }
    
    if (input.includes('âge') || input.includes('enfant') || input.includes('5') || input.includes('6') || input.includes('7')) {
      return "Katiopa est conçu spécialement pour les enfants de 5 à 7 ans. Notre contenu s'adapte parfaitement à cette tranche d'âge."
    }
    
    if (input.includes('math') || input.includes('français') || input.includes('sciences')) {
      return "Nous couvrons les mathématiques, le français, les sciences et la créativité. Chaque matière est adaptée au niveau de votre enfant."
    }
    
    if (input.includes('contact') || input.includes('aide') || input.includes('support')) {
      return "Vous pouvez nous contacter par email à contact@katiopa.com ou par téléphone au +33 1 23 45 67 89."
    }
    
    if (input.includes('sécurité') || input.includes('données') || input.includes('confidentialité')) {
      return "La sécurité de vos données est notre priorité. Nous utilisons un cryptage avancé et respectons strictement le RGPD."
    }
    
    return "Merci pour votre message ! Un de nos experts vous répondra dans les plus brefs délais. En attendant, explorez notre site pour en savoir plus sur Katiopa."
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Bulle de chat flottante */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      >
        {/* Bouton principal du chat */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center text-white transition-all transform hover:scale-110"
          whileHover={{ rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Indicateur de notification */}
        {!isOpen && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2, duration: 0.3 }}
          >
            1
          </motion.div>
        )}
      </motion.div>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          >
            {/* Header du chat */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Assistant Katiopa</h3>
                    <p className="text-sm text-blue-100">En ligne • Réponse instantanée</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 p-4 h-[350px] overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {/* Indicateur de frappe */}
                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              
              {/* Suggestions rapides */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Comment s'inscrire ?",
                  "Quels sont les prix ?",
                  "Pour quel âge ?",
                  "Quelles matières ?"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputText(suggestion)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Informations de contact rapides */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <Phone size={16} className="text-blue-600" />
                  <span className="text-xs text-gray-600">Téléphone</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Mail size={16} className="text-blue-600" />
                  <span className="text-xs text-gray-600">Email</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <MapPin size={16} className="text-blue-600" />
                  <span className="text-xs text-gray-600">Adresse</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
