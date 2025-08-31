'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight, User as UserIcon } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { CubeAILogo } from '@/components/MulticolorText';
import AnimatedIcon from '@/components/AnimatedIcons';
import Link from 'next/link';

export default function LoginPage() {
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ sessionId, password });
      
      if (response.success) {
        // SUPPRESSION de localStorage.setItem('token', ...)
        // Le token est maintenant dans un cookie HttpOnly
        
        console.log('✅ Connexion réussie:', response.user);
        
        // Redirection vers le dashboard
        router.push('/dashboard');
      } else {
        setError('Erreur de connexion');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erreur de connexion inconnue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-title text-white text-2xl">C</span>
              </div>
              <CubeAILogo className="text-4xl" />
            </div>
            <div className="flex items-center space-x-4">
            <Link href="/" className="font-body text-gray-600 hover:text-gray-900 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 !text-gray-600 hover:!text-gray-900">
                Accueil
              </Link>
              <Link href="/register" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          
          <p className="font-subtitle text-gray-600">Hello ! 😊</p>
        </motion.div>

        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="font-subtitle-xl text-gray-800 mb-6 text-center">Connexion</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 font-body"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID de session */}
            <div>
              <label htmlFor="sessionId" className="font-label block text-sm font-medium text-gray-700 mb-2">
                ID de session
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="sessionId"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="font-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Votre ID de session"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="font-label block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-input w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="font-button w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Informations supplémentaires */}
          <div className="mt-6 space-y-4">
            {/* Liens d'inscription */}
            <div className="text-center space-y-2">
              <p className="font-body text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  Créer un compte
                </a>
              </p>
              
              <p className="font-body text-sm text-gray-600">
                Votre enfant a déjà un compte ?{' '}
                <a href="/login-child" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Connexion Enfant</span>
                </a>
              </p>
            </div>
          </div>

          {/* Notes importantes */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="font-body text-xs text-gray-500 space-y-1">
              <p>• Utilisez votre ID de session et mot de passe fournis lors de l'inscription</p>
              <p>• Chaque utilisateur a ses propres identifiants de connexion</p>
              <p>• Les sessions sont sécurisées avec des cookies HttpOnly</p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}