'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!/.+@.+\..+/.test(email.trim())) {
      setError('Veuillez saisir un email valide');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setMessage("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white/90 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-title text-xl text-gray-800">CubeAI</Link>
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">Connexion</Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 mt-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Mot de passe oublié</h1>
          <p className="text-gray-600 mb-6">Entrez votre email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>

          {message && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

