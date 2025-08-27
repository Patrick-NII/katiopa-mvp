'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, User, Lock, Eye, EyeOff, Info } from 'lucide-react'
import Link from 'next/link'
import { apiPost } from '../../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await apiPost('/auth/login', { sessionId, password })
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const testAccounts = [
    {
      name: 'Lucas (Enfant, 8 ans)',
      sessionId: 'LUCAS_001',
      password: 'lucas123',
      type: 'PRO_PLUS'
    },
    {
      name: 'Emma (Enfant, 6 ans)',
      sessionId: 'EMMA_002',
      password: 'emma123',
      type: 'PRO_PLUS'
    },
    {
      name: 'Marie (Parent, 35 ans)',
      sessionId: 'MARIE_003',
      password: 'marie123',
      type: 'PRO_PLUS'
    },
    {
      name: 'Léo (Enfant, 7 ans)',
      sessionId: 'LEO_005',
      password: 'leo123',
      type: 'FREE'
    },
    {
      name: 'Sophie (Parent, 32 ans)',
      sessionId: 'SOPHIE_006',
      password: 'sophie123',
      type: 'FREE'
    },
    {
      name: 'Patrick (Parent, 36 ans)',
      sessionId: 'PATRICK_007',
      password: 'patrick123',
      type: 'FREE'
    },
    {
      name: 'Aylon (Enfant, 6 ans, CP)',
      sessionId: 'AYLON_008',
      password: 'aylon123',
      type: 'FREE'
    }
  ]

  const fillTestAccount = (sessionId: string, password: string) => {
    setSessionId(sessionId)
    setPassword(password)
    setShowTestAccounts(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-3xl font-bold text-white">K</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KATIOPA</h1>
          <p className="text-gray-600">Apprentissage intelligent pour enfants</p>
        </div>

        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID de session */}
            <div>
              <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
                ID de session
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="sessionId"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ex: LUCAS_001"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn size={20} className="mr-2" />
                  Se connecter
                </div>
              )}
            </motion.button>
          </form>

          {/* Comptes de test */}
          <div className="mt-6">
            <button
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Info size={16} />
              {showTestAccounts ? 'Masquer' : 'Voir'} les comptes de test
            </button>
            
            {showTestAccounts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3">Comptes de test disponibles :</h3>
                <div className="space-y-2">
                  {testAccounts.map((account) => (
                    <button
                      key={account.sessionId}
                      onClick={() => fillTestAccount(account.sessionId, account.password)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded text-xs"
                    >
                      <div className="font-medium">{account.name}</div>
                      <div className="text-gray-500">
                        {account.sessionId} / {account.password}
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          account.type === 'PRO_PLUS' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {account.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Lien d'inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Informations supplémentaires */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>💡 Utilisez votre ID de session et mot de passe fournis lors de l'inscription</p>
          <p className="mt-1">🔐 Chaque utilisateur a ses propres identifiants de connexion</p>
        </motion.div>
      </motion.div>
    </div>
  )
}