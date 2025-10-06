'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Brain, 
  Sparkles, 
  FileText,
  User,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import BubixTab from '../../../components/BubixTab'

interface AnalysisContext {
  analysisId: string
  competence: string
  childName: string
  analysis: string
  score?: number
  level?: string
  savedReport?: {
    title: string
    notes?: string
    tags: string[]
  }
}

function BubixPageContent() {
  const searchParams = useSearchParams()
  const [context, setContext] = useState<AnalysisContext | null>(null)
  const [contextError, setContextError] = useState<string | null>(null)

  // Données utilisateur simulées (à remplacer par les vraies données)
  const user = {
    firstName: 'Parent',
    lastName: 'Test',
    userType: 'PARENT',
    subscriptionType: 'PREMIUM'
  }
  
  const childSessions = [
    {
      id: 'milan',
      firstName: 'Milan',
      lastName: 'Test'
    },
    {
      id: 'aylon',
      firstName: 'Aylon',
      lastName: 'Test'
    }
  ]

  // Récupérer et décoder le contexte depuis les paramètres URL
  useEffect(() => {
    const contextParam = searchParams.get('context')
    if (contextParam) {
      try {
        const decodedContext = JSON.parse(decodeURIComponent(contextParam))
        setContext(decodedContext)
        setContextError(null)
      } catch (error) {
        console.error('Erreur décodage contexte:', error)
        setContextError('Impossible de charger le contexte de l\'analyse')
      }
    }
  }, [searchParams])

  // Générer le message initial basé sur le contexte
  const generateInitialMessage = (ctx: AnalysisContext): string => {
    let message = `Bonjour ! Je vois que vous souhaitez discuter de l'analyse pédagogique concernant **${ctx.competence}** pour **${ctx.childName}**.`
    
    if (ctx.score && ctx.level) {
      message += `\n\n📊 **Résumé de l'évaluation :**\n- Score : ${ctx.score}/10\n- Niveau : ${ctx.level}`
    }

    if (ctx.savedReport) {
      message += `\n\n📝 **Rapport sauvegardé :** "${ctx.savedReport.title}"`
      if (ctx.savedReport.notes) {
        message += `\n💭 **Vos notes :** ${ctx.savedReport.notes}`
      }
      if (ctx.savedReport.tags.length > 0) {
        message += `\n🏷️ **Tags :** ${ctx.savedReport.tags.join(', ')}`
      }
    }

    message += `\n\n**Voici l'analyse complète :**\n\n${ctx.analysis}`
    message += `\n\n---\n\n💬 **Comment puis-je vous aider ?**\nJe peux vous expliquer certains points en détail, suggérer des activités spécifiques, ou répondre à vos questions sur le développement de ${ctx.childName}.`

    return message
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Chat avec Bubix
            </h1>
            {context && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                <FileText className="w-4 h-4" />
                Contexte : {context.competence}
              </div>
            )}
          </div>
          
          {context ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Discussion contextuelle
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Vous allez discuter avec Bubix à propos de l'analyse pédagogique de <strong>{context.childName}</strong> concernant <strong>{context.competence}</strong>.
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {context.score && context.level && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {context.score}/10 - {context.level}
                        </span>
                      </div>
                    )}
                    
                    {context.savedReport && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Rapport : {context.savedReport.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Discutez avec Bubix, votre assistant pédagogique intelligent, pour obtenir des conseils personnalisés.
            </p>
          )}

          {contextError && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Erreur de contexte</span>
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{contextError}</p>
            </div>
          )}
        </div>

        {/* Interface Bubix */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <BubixTab 
            user={user}
            childSessions={childSessions}
            userType={user.userType as 'CHILD' | 'PARENT'}
            subscriptionType={user.subscriptionType}
            initialContext={context ? {
              message: generateInitialMessage(context),
              metadata: {
                type: 'analysis_context',
                analysisId: context.analysisId,
                competence: context.competence,
                childName: context.childName,
                score: context.score,
                level: context.level
              }
            } : undefined}
          />
        </div>
      </div>
    </div>
  )
}

export default function BubixPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de Bubix...</p>
        </div>
      </div>
    }>
      <BubixPageContent />
    </Suspense>
  )
}
