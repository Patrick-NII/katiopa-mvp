'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { bubixService } from '@/lib/services/bubix-service'
import BubixThemedContainer, { useBubixTheme } from './BubixThemedContainer'
import { BubixCompteRenduButton, BubixChatButton, BubixAnalysisButton } from './BubixActionButton'

interface BubixIntegrationTestProps {
  userType: 'PARENT' | 'CHILD'
}

/**
 * 🧪 Composant de test d'intégration Bubix
 * Teste toutes les fonctionnalités centralisées
 */
export default function BubixIntegrationTest({ userType }: BubixIntegrationTestProps) {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<string[]>([])

  const { theme, themeConfig } = useBubixTheme(userType)

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setLoading(prev => ({ ...prev, [testName]: true }))
    
    try {
      await testFn()
      setTestResults(prev => ({ ...prev, [testName]: true }))
      addMessage(`✅ ${testName} - SUCCÈS`)
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }))
      addMessage(`❌ ${testName} - ÉCHEC: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const testBubixService = async () => {
    const testRequest = {
      prompt: 'Test d\'intégration Bubix',
      sessionId: 'test-session-123',
      analysisType: 'compte_rendu' as const,
      context: {
        subscriptionType: 'FREE',
        childName: 'Test Enfant'
      }
    }

    const result = await bubixService.analyzeSession(testRequest)
    if (!result.success) {
      throw new Error('Service Bubix non fonctionnel')
    }
  }

  const testThematisation = async () => {
    const buttonElement = document.querySelector('[data-testid="bubix-test-button"]')
    if (!buttonElement) {
      throw new Error('Bouton thématisé non trouvé')
    }
    
    const hasCorrectTheme = buttonElement.className.includes(
      userType === 'CHILD' ? 'emerald' : 'blue'
    )
    
    if (!hasCorrectTheme) {
      throw new Error('Thématisation incorrecte')
    }
  }

  const testConversation = async () => {
    const result = await bubixService.analyzeConversation(
      'Test de conversation',
      'test-session-123'
    )
    
    if (!result.bubixResponse) {
      throw new Error('Conversation non fonctionnelle')
    }
  }

  const testCache = async () => {
    // Premier appel
    const start1 = Date.now()
    await bubixService.analyzeSession({
      prompt: 'Test cache',
      sessionId: 'cache-test',
      analysisType: 'compte_rendu',
      context: { subscriptionType: 'FREE' }
    })
    const time1 = Date.now() - start1

    // Deuxième appel (devrait être en cache)
    const start2 = Date.now()
    await bubixService.analyzeSession({
      prompt: 'Test cache',
      sessionId: 'cache-test',
      analysisType: 'compte_rendu',
      context: { subscriptionType: 'FREE' }
    })
    const time2 = Date.now() - start2

    if (time2 >= time1) {
      throw new Error('Cache non fonctionnel')
    }
  }

  const runAllTests = async () => {
    addMessage('🚀 Début des tests d\'intégration Bubix...')
    
    await runTest('Service Bubix', testBubixService)
    await runTest('Thématisation', testThematisation)
    await runTest('Conversation', testConversation)
    await runTest('Cache', testCache)
    
    addMessage('🏁 Tests terminés !')
  }

  const allTestsPassed = Object.values(testResults).every(result => result === true)
  const hasResults = Object.keys(testResults).length > 0

  return (
    <BubixThemedContainer userType={userType} className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            🧪 Test d'Intégration Bubix
            <span className={`px-2 py-1 rounded-lg text-sm ${theme === 'child' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {userType === 'CHILD' ? 'Mode Enfant' : 'Mode Parent'}
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {userType === 'CHILD' 
              ? '🌟 Teste toutes mes super fonctionnalités Bubix !'
              : 'Vérification de l\'intégration complète des fonctionnalités Bubix'
            }
          </p>
        </div>

        {/* Boutons de test thématisés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BubixCompteRenduButton
            sessionId="test-session"
            sessionName="Test Session"
            onGenerate={() => addMessage('🎯 Bouton compte rendu cliqué !')}
            userType={userType}
            data-testid="bubix-test-button"
          />
          
          <BubixChatButton
            onOpenChat={() => addMessage('💬 Chat Bubix ouvert !')}
            unreadCount={3}
            userType={userType}
          />
          
          <BubixAnalysisButton
            analysisType="competence"
            onAnalyze={() => addMessage('🎯 Analyse des compétences lancée !')}
            userType={userType}
          />
          
          <BubixAnalysisButton
            analysisType="global"
            onAnalyze={() => addMessage('📊 Analyse globale lancée !')}
            userType={userType}
          />
        </div>

        {/* Tests automatisés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tests Automatisés</h2>
            <button
              onClick={runAllTests}
              disabled={Object.values(loading).some(l => l)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                theme === 'child' 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white disabled:opacity-50`}
            >
              {Object.values(loading).some(l => l) ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  Tests en cours...
                </>
              ) : (
                'Lancer tous les tests'
              )}
            </button>
          </div>

          {/* Résultats des tests */}
          {hasResults && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(testResults).map(([testName, passed]) => (
                <div
                  key={testName}
                  className={`p-3 rounded-lg border-2 ${
                    passed 
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{testName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statut global */}
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border-2 text-center ${
                allTestsPassed
                  ? 'border-green-300 bg-green-100 text-green-800'
                  : 'border-red-300 bg-red-100 text-red-800'
              }`}
            >
              {allTestsPassed ? (
                <>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="text-lg font-bold">
                    {userType === 'CHILD' 
                      ? '🎉 Tous mes tests sont réussis !' 
                      : '✅ Intégration Bubix Complète'
                    }
                  </h3>
                  <p>
                    {userType === 'CHILD'
                      ? 'Bubix fonctionne parfaitement pour moi !'
                      : 'Toutes les fonctionnalités Bubix sont opérationnelles.'
                    }
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <h3 className="text-lg font-bold">
                    {userType === 'CHILD'
                      ? '😅 Quelques réglages nécessaires'
                      : '⚠️ Intégration Partielle'
                    }
                  </h3>
                  <p>
                    {userType === 'CHILD'
                      ? 'Certaines fonctionnalités ont besoin d\'amour !'
                      : 'Certaines fonctionnalités nécessitent des corrections.'
                    }
                  </p>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Journal des messages */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Journal des Tests</h3>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">
                {userType === 'CHILD' 
                  ? '📝 Ici apparaîtront les résultats de mes tests !'
                  : 'Les résultats des tests apparaîtront ici...'
                }
              </p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BubixThemedContainer>
  )
}

