'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      id: 'DECOUVERTE',
      name: 'Découverte',
      price: '4,99€',
      period: '/mois',
      color: 'from-green-500 to-emerald-600',
      icon: Star,
      features: [
        '1 parent + 1 enfant',
        'Bubix (version simplifiée)',
        'MathCube — bases en jouant',
        'Expériences (lite)',
        '1 analyse simple par semaine',
      ],
      cta: 'Choisir Découverte',
      href: '/register'
    },
    {
      id: 'EXPLORATEUR',
      name: 'Explorateur',
      price: '29,99€',
      period: '/mois',
      popular: true,
      color: 'from-blue-500 to-indigo-600',
      icon: Zap,
      features: [
        '1 parent + 2 enfants',
        'Bubix avancé (professeur/coach/ami)',
        'Math, Code, Play, Science, Dream, Expériences',
        'Dashboard parental complet + ComCube',
        'Analyses hebdomadaires + export PDF/Excel',
        'Radar de connaissance complet',
        'Certificats simples',
        'Support email + chat + téléphone',
      ],
      cta: 'Choisir Explorateur',
      href: '/register'
    },
    {
      id: 'MAITRE',
      name: 'Maître',
      price: '59,99€',
      period: '/mois',
      color: 'from-purple-500 to-pink-600',
      icon: Crown,
      features: [
        '1 parent + 4 enfants',
        'Bubix premium: prédictions & adaptation automatique',
        'Analyses quotidiennes et prédictives',
        'Radar de connaissance évolutif dense',
        'Contenus exclusifs & défis communautaires',
        'Diplômes officiels & badges',
        'Dashboard enrichi (comparatifs IA)',
        'Sauvegarde cloud + historique illimité',
        'Support VIP (WhatsApp & téléphone)',
      ],
      cta: 'Choisir Maître',
      href: '/register'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Découvrez CubeAI & Bubix</h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            L’intelligence artificielle qui grandit avec vos enfants. Bubix personnalise l’apprentissage et fait évoluer l’univers selon le plan choisi.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => (
            <motion.div key={p.id} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5, delay: idx*0.1}} className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${p.popular ? 'ring-2 ring-indigo-400' : ''}`}>
              {p.popular && (
                <div className="absolute top-3 right-3 text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Le plus choisi</div>
              )}
              <div className={`h-2 bg-gradient-to-r ${p.color}`}></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${p.color} flex items-center justify-center text-white`}>
                    <p.icon size={20}/>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-gray-600 ml-1">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mt-0.5"/>
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r ${p.color} hover:opacity-90 transition-opacity font-semibold`}>
                  {p.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Simple comparison */}
        <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5, delay:0.2}} className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Tableau comparatif simplifié</h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-6">Fonctionnalité</th>
                  <th className="py-2 pr-6">Découverte (4,99€)</th>
                  <th className="py-2 pr-6">Explorateur (29,99€)</th>
                  <th className="py-2">Maître (59,99€)</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr>
                  <td className="py-2 pr-6">Profils inclus</td>
                  <td className="py-2 pr-6">1 parent + 1 enfant</td>
                  <td className="py-2 pr-6">1 parent + 2 enfants</td>
                  <td className="py-2">1 parent + 4 enfants</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 pr-6">Onglets enfants</td>
                  <td className="py-2 pr-6">Bubix, MathCube, Expériences (lite)</td>
                  <td className="py-2 pr-6">Tous (Math, Code, Play, Science, Dream, Expériences)</td>
                  <td className="py-2">Tous + contenus premium</td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Onglets parents</td>
                  <td className="py-2 pr-6">Dashboard basique</td>
                  <td className="py-2 pr-6">Dashboard complet + ComCube</td>
                  <td className="py-2">Complet + comparatifs IA</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 pr-6">Bubix IA</td>
                  <td className="py-2 pr-6">gpt-3.5 limité</td>
                  <td className="py-2 pr-6">GPT-4o-mini (analyses)</td>
                  <td className="py-2">GPT-4o premium adaptatif</td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Analyses / Rapports</td>
                  <td className="py-2 pr-6">1 analyse basique/semaine</td>
                  <td className="py-2 pr-6">Hebdomadaires détaillés</td>
                  <td className="py-2">Quotidiens + prédictifs</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 pr-6">Radar de connaissance</td>
                  <td className="py-2 pr-6">Mini-cerveau</td>
                  <td className="py-2 pr-6">Cerveau complet</td>
                  <td className="py-2">Cerveau évolutif dense</td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Certificats</td>
                  <td className="py-2 pr-6">–</td>
                  <td className="py-2 pr-6">Progression simple</td>
                  <td className="py-2">Diplômes + badges premium</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 pr-6">Support</td>
                  <td className="py-2 pr-6">Email uniquement</td>
                  <td className="py-2 pr-6">Email + Chat + Téléphone</td>
                  <td className="py-2">VIP (WhatsApp + priorité)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Sauvegarde / Historique</td>
                  <td className="py-2 pr-6">Limité</td>
                  <td className="py-2 pr-6">Illimité</td>
                  <td className="py-2">Cloud auto + illimité</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-6 text-sm text-gray-600">Offre -25% sur abonnement annuel. Résiliable à tout moment.</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

