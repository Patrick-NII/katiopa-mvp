'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight, User as UserIcon, LogOut } from 'lucide-react';
import { authAPI } from '@/lib/api';
import Navbar from '@/components/NavBar';
import DecorativeCubes from '@/components/DecorativeCubes';
import PublicBubix from '@/components/PublicBubix';
import FloatingBubixButton from '@/components/FloatingBubixButton';

export default function LoginPage() {
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubix, setShowBubix] = useState(false);
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
        
        // Signal cross-onglets + redirection
        try { localStorage.setItem('cubeai:auth', 'logged_in:' + Date.now()); } catch {}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <DecorativeCubes variant="minimal" />
      {/* Navigation */}
      <Navbar />

      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <p className="font-subtitle text-gray-600 dark:text-gray-300 text-lg md:text-xl">Hello ! 😊</p>
        </motion.div>

        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8"
        >
          <h2 className="font-subtitle-xl text-gray-800 dark:text-gray-200 mb-6 text-center">Connexion</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 font-body"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* ID de session */}
            <div>
              <label htmlFor="sessionId" className="font-label block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID de session
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  id="sessionId"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="font-input w-full pl-10 pr-4 py-3 md:py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Votre ID de session"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="font-label block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-input w-full pl-10 pr-12 py-3 md:py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
              className="font-button w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 md:py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="!text-white">Se connecter</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Informations supplémentaires */}
          <div className="mt-6 space-y-4">
            {/* Liens d'inscription */}
            <div className="text-center space-y-2">
              <p className="font-body text-sm md:text-base text-gray-600 dark:text-gray-300">
                Pas encore de compte ?{' '}
                <a href="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  Créer un compte
                </a>
              </p>
              
              <a href="/forgot-password" className="flex items-center justify-center space-x-2 text-sm md:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                <UserIcon className="h-4 w-4" />
                <span>Mot de passe oublié ?</span>
              </a>
            </div>

          </div>

          {/* Notes importantes */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="font-body text-xs md:text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>• Utilisez votre ID de session et mot de passe fournis lors de l'inscription</p>
              <p>• Chaque utilisateur a ses propres identifiants de connexion</p>
              <p>• Les sessions sont sécurisées avec des cookies HttpOnly</p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Modal Bubix */}
      <AnimatePresence>
        {showBubix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBubix(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full">
                <PublicBubix />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pastille flottante Bubix */}
      <FloatingBubixButton />
    </div>
  );
}
