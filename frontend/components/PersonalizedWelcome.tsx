import { motion } from 'framer-motion'
import { Heart, Star, BookOpen, Target, Trophy, Sparkles } from 'lucide-react'

interface PersonalizedWelcomeProps {
  firstName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  age?: number
  grade?: string
  memberSince: string
  daysSinceRegistration: number
}

export default function PersonalizedWelcome({
  firstName,
  gender,
  userType,
  age,
  grade,
  memberSince,
  daysSinceRegistration
}: PersonalizedWelcomeProps) {
  const getGenderSpecificGreeting = () => {
    switch (gender) {
      case 'MALE':
        return `Bonjour ${firstName} ! 👋`
      case 'FEMALE':
        return `Bonjour ${firstName} ! 👋`
      default:
        return `Bonjour ${firstName} ! 👋`
    }
  }

  const getUserTypeSpecificMessage = () => {
    switch (userType) {
      case 'CHILD':
        return {
          title: "Voici ton tableau de bord personnalisé !",
          subtitle: "Suis ta progression et découvre de nouveaux exercices amusants",
          icon: <Sparkles className="text-yellow-500" />,
          color: "from-yellow-400 to-orange-500"
        }
      case 'PARENT':
        return {
          title: "Tableau de bord parental",
          subtitle: "Suivez la progression de votre enfant et ses performances",
          icon: <Heart className="text-pink-500" />,
          color: "from-pink-400 to-rose-500"
        }
      case 'TEACHER':
        return {
          title: "Espace enseignant",
          subtitle: "Gérez vos classes et suivez les progrès de vos élèves",
          icon: <BookOpen className="text-blue-500" />,
          color: "from-blue-400 to-indigo-500"
        }
      case 'ADMIN':
        return {
          title: "Administration",
          subtitle: "Gérez la plateforme et supervisez les utilisateurs",
          icon: <Trophy className="text-purple-500" />,
          color: "from-purple-400 to-violet-500"
        }
      default:
        return {
          title: "Bienvenue sur votre tableau de bord !",
          subtitle: "Suivez votre progression et découvrez de nouvelles fonctionnalités",
          icon: <Star className="text-green-500" />,
          color: "from-green-400 to-emerald-500"
        }
    }
  }

  const getAgeSpecificMessage = () => {
    if (!age) return null
    
    if (age >= 5 && age <= 7) {
      return "Tu es dans la tranche d'âge parfaite pour apprendre avec Katiopa !"
    } else if (age < 5) {
      return "Tu commences tôt l'apprentissage, c'est excellent !"
    } else if (age > 7) {
      return "Tu as dépassé l'âge cible, mais l'apprentissage n'a pas d'âge !"
    }
    return null
  }

  const getGradeSpecificMessage = () => {
    if (!grade) return null
    
    const gradeMessages: { [key: string]: string } = {
      'CP': "Tu es en CP, une année importante pour les bases !",
      'CE1': "En CE1, tu consolides tes connaissances !",
      'CE2': "En CE2, tu prépares le passage au cycle suivant !",
      'GS': "En Grande Section, tu te prépares pour le CP !",
      'MS': "En Moyenne Section, tu développes tes compétences !"
    }
    
    return gradeMessages[grade] || `En ${grade}, continue ton apprentissage !`
  }

  const getLLMAnalysis = () => {
    switch (userType) {
      case 'CHILD':
        return {
          title: "🤖 Analyse IA de ta progression",
          content: "Continue comme ça ! Tu progresses bien dans tes exercices. N'oublie pas de faire une pause si tu te sens fatigué.",
          recommendation: "💡 Recommandation : Essaie de nouveaux domaines pour varier tes apprentissages !"
        }
      case 'PARENT':
        return {
          title: "🤖 Analyse IA de vos enfants",
          content: "Vos enfants montrent une excellente progression. Emma (6 ans) excelle en mathématiques, Thomas (7 ans) progresse bien en français.",
          recommendation: "💡 Recommandation : Encouragez la pratique quotidienne pour maintenir cette dynamique positive."
        }
      default:
        return null
    }
  }

  const getMembershipMessage = () => {
    if (daysSinceRegistration === 0) {
      return "Bienvenue ! C'est ton premier jour avec Katiopa ! 🎉"
    } else if (daysSinceRegistration === 1) {
      return "Tu es membre depuis hier, bienvenue ! 👋"
    } else if (daysSinceRegistration < 7) {
      return `Tu es membre depuis ${daysSinceRegistration} jours, continue comme ça ! 💪`
    } else if (daysSinceRegistration < 30) {
      return `Tu es membre depuis ${daysSinceRegistration} jours, tu prends de bonnes habitudes ! 🌟`
    } else if (daysSinceRegistration < 365) {
      const months = Math.floor(daysSinceRegistration / 30)
      return `Tu es membre depuis ${months} mois, tu es un utilisateur fidèle ! 🏆`
    } else {
      const years = Math.floor(daysSinceRegistration / 365)
      return `Tu es membre depuis ${years} an${years > 1 ? 's' : ''}, merci pour ta fidélité ! 🎊`
    }
  }

  const userTypeInfo = getUserTypeSpecificMessage()
  const ageMessage = getAgeSpecificMessage()
  const gradeMessage = getGradeSpecificMessage()
  const membershipMessage = getMembershipMessage()

  return (
    <motion.div
      className={`bg-gradient-to-r ${userTypeInfo.color} text-white p-8 rounded-xl shadow-lg`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Salutation personnalisée */}
          <motion.h1 
            className="text-4xl font-bold mb-3 flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {getGenderSpecificGreeting()}
            {userTypeInfo.icon}
          </motion.h1>

          {/* Titre et sous-titre selon le type d'utilisateur */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-2">{userTypeInfo.title}</h2>
            <p className="text-lg opacity-90">{userTypeInfo.subtitle}</p>
          </motion.div>

          {/* Messages spécifiques selon l'âge et la classe */}
          <motion.div
            className="mt-6 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {ageMessage && (
              <div className="flex items-center gap-2 text-sm">
                <Target size={16} />
                <span>{ageMessage}</span>
              </div>
            )}
            
            {gradeMessage && (
              <div className="flex items-center gap-2 text-sm">
                <BookOpen size={16} />
                <span>{gradeMessage}</span>
              </div>
            )}
          </motion.div>

          {/* Message de fidélité */}
          <motion.div
            className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Trophy size={18} />
              <span className="text-sm font-medium">{membershipMessage}</span>
            </div>
            <div className="text-xs opacity-80 mt-1">
              Membre depuis le {memberSince}
            </div>
          </motion.div>

          {/* Analyse LLM selon le type d'utilisateur */}
          {getLLMAnalysis() && (
            <motion.div
              className="mt-4 p-4 bg-white bg-opacity-25 rounded-lg border border-white border-opacity-30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-2">
                {getLLMAnalysis()?.title}
              </h3>
              <p className="text-sm opacity-90 mb-3">
                {getLLMAnalysis()?.content}
              </p>
              <div className="text-xs font-medium opacity-80">
                {getLLMAnalysis()?.recommendation}
              </div>
            </motion.div>
          )}
        </div>

        {/* Décorations animées */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {userTypeInfo.icon}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 