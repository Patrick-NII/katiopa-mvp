'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import AnimatedIcon from './AnimatedIcons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Erreur capturée par ErrorBoundary:', error, errorInfo)
    
    // Log de l'erreur pour le debugging
    this.setState({
      error,
      errorInfo
    })

    // En production, vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      // Fallback personnalisé fourni
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback par défaut
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            {/* Icône d'erreur */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oups ! Quelque chose s'est mal passé
            </h1>

            {/* Message d'erreur */}
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite. Ne vous inquiétez pas, 
              nous avons été notifiés et travaillons à la résoudre.
            </p>

            {/* Détails techniques (en développement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Détails techniques (développement)
                </summary>
                <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-800 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Erreur:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>

              <button
                onClick={this.handleGoBack}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <AnimatedIcon type="home" className="w-4 h-4" />
                Accueil
              </button>
            </div>

            {/* Informations de support */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Le problème persiste ?
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="mailto:support@katiopa.com"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Contacter le support
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href="/help"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Centre d'aide
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook personnalisé pour gérer les erreurs dans les composants fonctionnels
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('❌ Erreur gérée par useErrorHandler:', error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const ErrorDisplay = React.useCallback(() => {
    if (!error) return null

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Une erreur s'est produite
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error.message}
            </p>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }, [error, clearError])

  return {
    error,
    handleError,
    clearError,
    ErrorDisplay
  }
}

// Composant de gestion d'erreurs pour les formulaires
export function FormErrorHandler({ error, onClear }: { error: string | null; onClear: () => void }) {
  if (!error) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erreur de formulaire
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
          <button
            onClick={onClear}
            className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant de gestion d'erreurs pour les requêtes API
export function ApiErrorHandler({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  if (!error) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Problème de connexion
          </h3>
          <p className="text-sm text-orange-700 mt-1">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-orange-600 hover:text-orange-500 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
