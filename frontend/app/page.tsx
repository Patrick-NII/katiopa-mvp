'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, BookOpen, Users, Star, ArrowRight, CheckCircle, Play, Shield, Zap, Globe, Award, MessageCircle, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Share2 } from 'lucide-react'
import ChatBubble from '@/components/ChatBubble'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation principale */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Katiopa */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Katiopa
              </span>
            </motion.div>

            {/* Boutons de navigation */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
              >
                Connexion
              </Link>
              <Link 
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section avec effets 3D et bulles animées */}
      <section className="relative overflow-hidden">
        {/* Effets de bulles 3D multiples et variés */}
        <motion.div
          className="absolute top-10 right-20 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.3, 1], 
            rotate: [0, 180, 360],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 left-10 w-24 h-24 bg-gradient-to-r from-pink-400/40 to-red-400/40 rounded-full blur-lg"
          animate={{ 
            scale: [1, 1.4, 1], 
            rotate: [360, 180, 0],
            x: [0, -15, 0],
            y: [0, 15, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-32 w-20 h-20 bg-gradient-to-r from-green-400/50 to-blue-400/50 rounded-full blur-md"
          animate={{ 
            scale: [1, 1.5, 1], 
            rotate: [0, 90, 180, 270, 360],
            x: [0, 25, 0],
            y: [0, -25, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-60 left-1/4 w-16 h-16 bg-gradient-to-r from-yellow-400/60 to-orange-400/60 rounded-full blur-sm"
          animate={{ 
            scale: [1, 1.6, 1], 
            rotate: [180, 0, 180],
            x: [0, 30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-r from-indigo-400/40 to-purple-400/40 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 360],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Nouvelles bulles supplémentaires */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-36 h-36 bg-gradient-to-r from-cyan-400/35 to-blue-400/35 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.4, 1], 
            rotate: [0, 120, 240, 360],
            x: [0, 35, 0],
            y: [0, -35, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-44 h-44 bg-gradient-to-r from-violet-400/25 to-purple-400/25 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1], 
            rotate: [360, 240, 120, 0],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-r from-emerald-400/45 to-teal-400/45 rounded-full blur-lg"
          animate={{ 
            scale: [1, 1.7, 1], 
            rotate: [0, 180, 360],
            x: [0, 45, 0],
            y: [0, 45, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="text-center">
            {/* Titre principal avec effet 3D avancé */}
            <motion.h1 
              className="text-6xl md:text-8xl font-black text-blue-700 mb-8 leading-tight"
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              style={{
                textShadow: `
                  0 1px 0 #ccc,
                  0 2px 0 #c9c9c9,
                  0 3px 0 #bbb,
                  0 4px 0 #b9b9b9,
                  0 5px 0 #aaa,
                  0 6px 1px rgba(0,0,0,.1),
                  0 0 5px rgba(0,0,0,.1),
                  0 1px 3px rgba(0,0,0,.3),
                  0 3px 5px rgba(0,0,0,.2),
                  0 5px 10px rgba(0,0,0,.25),
                  0 10px 10px rgba(0,0,0,.2),
                  0 20px 20px rgba(0,0,0,.15)
                `
              }}
            >
              Apprendre 
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-blue-600">
                Tout en prenant plaisir
              </span>
            </motion.h1>

            {/* Description optimisée SEO avec mots-clés stratégiques */}
            <motion.p 
              className="text-2xl md:text-3xl text-gray-700 mb-10 max-w-5xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              Découvrez <strong>Katiopa</strong>, la première plateforme d'<strong>apprentissage intelligent</strong> qui révolutionne 
              l'<strong>éducation des enfants de 5 à 7 ans</strong>. Notre technologie d'<strong>intelligence artificielle adaptative</strong> 
              crée des <strong>parcours personnalisés</strong> qui s'ajustent en temps réel aux besoins de chaque enfant.
            </motion.p>

            {/* Sous-description enrichie avec termes éducatifs spécifiques */}
            <motion.p 
              className="text-lg md:text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <strong>Mathématiques fondamentales, lecture et écriture, sciences naturelles, développement de la créativité</strong> - 
              chaque domaine est abordé avec une approche <strong>ludique et progressive</strong>. Les parents suivent les progrès 
              en temps réel tandis que les enfants développent leur <strong>confiance en soi</strong>, leur 
              <strong>autonomie d'apprentissage</strong> et leur <strong>curiosité naturelle</strong>.
            </motion.p>

            {/* Boutons d'action améliorés avec animations */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <Link 
                href="/register"
                className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-2xl transition-all transform hover:scale-110 shadow-2xl hover:shadow-3xl border-2 border-transparent hover:border-white/20"
              >
                Commencer gratuitement
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              
              <button className="group inline-flex items-center px-10 py-5 border-3 border-gray-300 text-gray-700 text-xl font-bold rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg">
                <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                Voir la démo
              </button>
            </motion.div>

            {/* Statistiques enrichies avec données crédibles */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <div className="text-center group">
                <motion.div 
                  className="text-4xl font-black text-blue-600 mb-3 group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: 5 }}
                >
                  15,000+
                </motion.div>
                <div className="text-gray-700 font-semibold">Familles nous font confiance</div>
                <div className="text-sm text-gray-500 mt-1">Depuis notre lancement</div>
              </div>
              <div className="text-center group">
                <motion.div 
                  className="text-4xl font-black text-purple-600 mb-3 group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: -5 }}
                >
                  98%
                </motion.div>
                <div className="text-gray-700 font-semibold">Amélioration des résultats</div>
                <div className="text-sm text-gray-500 mt-1">En 3 mois d'utilisation</div>
              </div>
              <div className="text-center group">
                <motion.div 
                  className="text-4xl font-black text-pink-600 mb-3 group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: 5 }}
                >
                  24/7
                </motion.div>
                <div className="text-gray-700 font-semibold">Support personnalisé</div>
                <div className="text-sm text-gray-500 mt-1">Experts pédagogiques</div>
              </div>
              <div className="text-center group">
                <motion.div 
                  className="text-4xl font-black text-green-600 mb-3 group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: -5 }}
                >
                  4.9/5
                </motion.div>
                <div className="text-gray-700 font-semibold">Note moyenne</div>
                <div className="text-sm text-gray-500 mt-1">Par les parents</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités avec textes optimisés SEO */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Effets de bulles supplémentaires */}
        <motion.div
          className="absolute top-20 right-1/4 w-40 h-40 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.4, 1], 
            rotate: [0, 90, 180, 270, 360],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-36 h-36 bg-gradient-to-r from-purple-300/25 to-pink-300/25 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.3, 1], 
            rotate: [360, 180, 0],
            x: [0, -25, 0],
            y: [0, 25, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Une révolution dans l'<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">éducation numérique</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Katiopa combine les dernières avancées en <strong>intelligence artificielle</strong> avec des 
              <strong>méthodes pédagogiques éprouvées</strong> pour créer une expérience d'apprentissage 
              unique et personnalisée, adaptée aux besoins spécifiques de chaque enfant.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: "🧠",
                title: "Intelligence Artificielle Adaptative",
                description: "Notre algorithme d'IA analyse en temps réel les réponses de votre enfant pour ajuster instantanément la difficulté et le style d'apprentissage. Plus besoin de suivre un programme rigide - l'éducation s'adapte à l'enfant, pas l'inverse.",
                benefits: ["Adaptation en temps réel", "Personnalisation poussée", "Suivi des progrès"],
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: "📚",
                title: "Contenu Éducatif Premium",
                description: "Développé par des experts en pédagogie et des enseignants expérimentés, notre contenu couvre tous les domaines essentiels : mathématiques fondamentales, lecture et écriture, sciences naturelles, et développement de la créativité.",
                benefits: ["Experts pédagogiques", "Programme complet", "Méthodes éprouvées"],
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: "👨‍👩‍👧‍👦",
                title: "Suivi Parental Avancé",
                description: "Restez connecté à l'éducation de votre enfant avec des rapports détaillés, des analyses de progression et des recommandations personnalisées. Participez activement à son développement scolaire depuis votre smartphone.",
                benefits: ["Rapports détaillés", "Recommandations", "Suivi en temps réel"],
                color: "from-pink-500 to-pink-600"
              },
              {
                icon: "🔒",
                title: "Sécurité et Confidentialité",
                description: "La protection des données de votre enfant est notre priorité absolue. Nous utilisons les technologies de cryptage les plus avancées et respectons strictement le RGPD pour garantir un environnement d'apprentissage 100% sécurisé.",
                benefits: ["Cryptage avancé", "Conformité RGPD", "Protection maximale"],
                color: "from-green-500 to-green-600"
              },
              {
                icon: "⚡",
                title: "Résultats Mesurables",
                description: "Voyez les progrès de votre enfant en temps réel avec des métriques précises et des graphiques interactifs. Notre système de suivi vous montre exactement où votre enfant excelle et où il a besoin de soutien supplémentaire.",
                benefits: ["Métriques précises", "Graphiques interactifs", "Progrès visibles"],
                color: "from-yellow-500 to-yellow-600"
              },
              {
                icon: "🌍",
                title: "Accessibilité Universelle",
                description: "Katiopa fonctionne sur tous vos appareils : ordinateur, tablette ou smartphone. Votre enfant peut continuer à apprendre partout, que ce soit à la maison, en voyage ou chez les grands-parents.",
                benefits: ["Multi-plateformes", "Synchronisation", "Apprentissage mobile"],
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="text-6xl mb-6">{feature.icon}</div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                  {feature.description}
                </p>
                
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-gray-700">
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full mr-3`} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Comment ça marche avec étapes détaillées */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Effets de bulles supplémentaires */}
        <motion.div
          className="absolute top-1/2 right-20 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-lg"
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 180, 360],
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Votre enfant commence à apprendre en <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">3 étapes simples</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              En moins de 5 minutes, votre enfant aura accès à un parcours d'apprentissage 
              parfaitement adapté à ses besoins et à son rythme d'apprentissage.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Création du compte familial",
                description: "Inscrivez-vous en quelques clics avec votre email principal. Choisissez le plan d'abonnement qui correspond à vos besoins et ajoutez tous les membres de votre famille qui utiliseront la plateforme.",
                details: ["Inscription en 2 minutes", "Plans flexibles", "Gestion familiale"],
                icon: "👨‍👩‍👧‍👦",
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "2",
                title: "Personnalisation des profils",
                description: "Définissez les objectifs d'apprentissage, les matières préférées et le style d'apprentissage de chaque enfant. Notre système analyse ces informations pour créer un parcours sur mesure.",
                details: ["Objectifs personnalisés", "Matières ciblées", "Style d'apprentissage"],
                icon: "🎯",
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "3",
                title: "Démarrage de l'apprentissage",
                description: "L'intelligence artificielle crée instantanément un parcours personnalisé et votre enfant peut commencer à apprendre immédiatement. Les progrès sont suivis en temps réel.",
                details: ["Parcours instantané", "Progrès en temps réel", "Adaptation continue"],
                icon: "🚀",
                color: "from-green-500 to-green-600"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className={`w-24 h-24 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-8 text-white text-3xl font-black shadow-2xl`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {step.step}
                </motion.div>
                
                <div className="text-5xl mb-6">{step.icon}</div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                  {step.description}
                </p>
                
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-gray-700 font-medium">
                      ✓ {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Plans d'abonnement avec textes optimisés */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Choisissez le plan qui correspond à vos <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">besoins éducatifs</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Des options flexibles et transparentes pour tous les budgets et toutes les tailles de famille. 
              Commencez gratuitement et évoluez selon vos besoins.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Gratuit",
                price: "0€",
                description: "Parfait pour découvrir Katiopa",
                features: [
                  "2 sessions utilisateur",
                  "Accès de base aux exercices",
                  "Support communautaire",
                  "Statistiques de base",
                  "Contenu fondamental"
                ],
                color: "from-gray-400 to-gray-600",
                popular: false
              },
              {
                name: "Pro",
                price: "9.99€",
                period: "/mois",
                description: "Pour les familles engagées",
                features: [
                  "3 sessions utilisateur",
                  "Toutes les fonctionnalités",
                  "Support prioritaire",
                  "Statistiques avancées",
                  "Contenu premium",
                  "Rapports détaillés"
                ],
                color: "from-purple-400 to-purple-600",
                popular: true
              },
              {
                name: "Pro Plus",
                price: "19.99€",
                period: "/mois",
                description: "Pour les familles nombreuses",
                features: [
                  "4 sessions utilisateur",
                  "Toutes les fonctionnalités",
                  "Support dédié",
                  "Analyses détaillées",
                  "Contenu exclusif",
                  "Formation parentale",
                  "Accompagnement personnalisé"
                ],
                color: "from-blue-400 to-blue-600",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`relative rounded-2xl p-8 border-2 transition-all ${
                  plan.popular 
                    ? 'border-purple-500 bg-purple-50 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Plus populaire
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`w-full bg-gradient-to-r ${plan.color} hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium text-center block transition-all transform hover:scale-105`}
                >
                  Commencer maintenant
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages avec textes authentiques */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Ce que disent les <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">familles satisfaites</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Découvrez les expériences authentiques de familles qui ont transformé 
              l'apprentissage de leurs enfants grâce à Katiopa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Marie Dupont",
                role: "Mère de Lucas, 6 ans",
                content: "Katiopa a complètement transformé l'approche de Lucas envers les mathématiques. Il adore maintenant faire ses exercices et demande même à continuer après l'heure prévue !",
                rating: 5
              },
              {
                name: "Pierre Martin",
                role: "Père de Emma, 5 ans",
                content: "L'IA s'adapte parfaitement au rythme d'Emma. Elle progresse à son propre rythme et reste motivée. Les rapports détaillés me permettent de suivre ses progrès facilement.",
                rating: 5
              },
              {
                name: "Sophie Bernard",
                role: "Mère de Thomas, 7 ans",
                content: "Enfin une plateforme qui comprend vraiment les besoins de mon enfant. Les résultats sont impressionnants et Thomas a développé une vraie confiance en lui.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA finale avec éléments interactifs */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Effets de bulles supplémentaires */}
        <motion.div
          className="absolute top-10 left-1/4 w-28 h-28 bg-white/10 rounded-full blur-lg"
          animate={{ 
            scale: [1, 1.3, 1], 
            rotate: [0, 180, 360],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [360, 180, 0],
            x: [0, -25, 0],
            y: [0, 25, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-white mb-6 leading-tight">
              Prêt à transformer l'<span className="text-yellow-300">apprentissage</span> ?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Rejoignez des milliers de familles qui ont déjà découvert 
              le pouvoir de l'apprentissage adaptatif avec Katiopa. 
              Commencez gratuitement dès aujourd'hui !
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link
                href="/register"
                className="inline-flex items-center px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
              >
                Commencer gratuitement
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-10 py-5 border-3 border-white text-white text-xl font-bold rounded-2xl hover:bg-white hover:text-blue-600 transition-all"
              >
                Se connecter
              </Link>
            </div>

            {/* Éléments interactifs : Chat et réseaux sociaux */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              
              
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                  <Facebook className="h-6 w-6 text-white" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                  <Twitter className="h-6 w-6 text-white" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                  <Instagram className="h-6 w-6 text-white" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                  <Youtube className="h-6 w-6 text-white" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                  <Share2 className="h-6 w-6 text-white" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer enrichi avec informations de contact */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Katiopa</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                L'apprentissage de l'intelligence artificielle pour tous des le plus jeune âge. Notre mission est de rendre 
                l'éducation accessible, personnalisée et engageante pour chaque enfant.
              </p>
              
              {/* Informations de contact */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-400">
                  <Mail className="h-5 w-5 mr-3 text-blue-400" />
                  <span>contact@katiopa.com</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-3 text-blue-400" />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-3 text-blue-400" />
                  <span>Paris, France</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Produit</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Plans d'abonnement</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Méthodes pédagogiques</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriels</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Légal</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Katiopa. Tous droits réservés. | L'IA pour tous les.</p>
          </div>
        </div>
      </footer>

      {/* Chat Bubble flottant */}
      <ChatBubble />
    </div>
  )
}