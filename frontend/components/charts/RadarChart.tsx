'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveRadar } from '@nivo/radar'
// Icônes remplacées par Flaticon
const ShieldIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/2913/2913133.png" alt="Shield" className={className} style={style} />
)

const StarIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" alt="Star" className={className} style={style} />
)

const AwardIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/2583/2583788.png" alt="Award" className={className} style={style} />
)

const ZapIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/1040/1040230.png" alt="Lightning" className={className} style={style} />
)

const MessageCircleIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/2593/2593491.png" alt="Message" className={className} style={style} />
)

const SwitchCameraIcon = ({ className, style }: { className?: string; style?: any }) => (
  <img src="https://cdn-icons-png.flaticon.com/512/3031/3031293.png" alt="Switch" className={className} style={style} />
)
import { useRadarData, useMultiChildRadarData } from '../../hooks/useRadarData'
import { useRadarDataContext } from '../../contexts/RadarDataContext'
import { getAgeSegment, adaptTextForAge, getAgeAppropriateColors, isFeatureAvailable } from '../../lib/ageSegmentation'
import BubixAnalysisPanel from '../bubix/BubixAnalysisPanel'

/* ===== Modèle de données ===== */
export interface CompetenceData {
  competence: string;   // ex: 'mathematiques'
  score: number;        // ex: 7
  maxScore: number;     // ex: 10
}

export interface ChildProfile {
  id: string;           // slug unique (ex: 'milan')
  name: string;         // affichage (ex: 'Milan')
  color: string;        // couleur principale
  age?: number;         // âge de l'enfant pour la segmentation
  data: CompetenceData[];
}

interface RadarChartProps {
  childrenProfiles?: ChildProfile[];   // liste dynamique d'enfants (optionnel)
  userSessionId?: string;              // ID de session utilisateur pour charger les vraies données
  isChild?: boolean;
  className?: string;
  compareModeDefault?: boolean;       // afficher plusieurs enfants (optionnel)
  userType?: 'CHILD' | 'PARENT';      // Type d'utilisateur pour déterminer les données
}

/* ===== Radar Causal : Variables explicatives (causes) vs dépendantes (effets) ===== */
const CAUSAL_COMPETENCES = [
  // Variables explicatives (causes) - compétences de base qui influencent les autres
  { key: 'concentration',            label: 'Concentration',                   icon: <img src="https://cdn-icons-png.flaticon.com/512/2913/2913133.png" alt="Concentration" className="w-12 h-12" />, type: 'cause', description: 'Capacité à maintenir son attention' },
  { key: 'connaissances_generales',  label: 'Connaissances générales',         icon: <img src="https://cdn-icons-png.flaticon.com/512/3330/3330315.png" alt="Livres" className="w-12 h-12" />, type: 'cause', description: 'Base culturelle et informationnelle' },
  { key: 'creativite',               label: 'Créativité',                      icon: <img src="https://cdn-icons-png.flaticon.com/512/3959/3959542.png" alt="Créativité" className="w-12 h-12" />, type: 'cause', description: 'Pensée divergente et innovation' },
  { key: 'sens_critique',            label: 'Sens critique',                   icon: <img src="https://cdn-icons-png.flaticon.com/512/751/751463.png" alt="Recherche" className="w-12 h-12" />, type: 'cause', description: 'Capacité d\'analyse et d\'évaluation' },
  
  // Variables dépendantes (effets) - compétences qui découlent des causes
  { key: 'resolution_problemes',     label: 'Résolution de problèmes',         icon: <img src="https://cdn-icons-png.flaticon.com/512/2620/2620445.png" alt="Puzzle" className="w-12 h-12" />, type: 'effect', description: 'Application méthodique des connaissances' },
  { key: 'communication',            label: 'Communication',                   icon: <img src="https://cdn-icons-png.flaticon.com/512/2593/2593491.png" alt="Communication" className="w-12 h-12" />, type: 'effect', description: 'Expression et partage des idées' },
  { key: 'programmation',            label: 'Programmation',                   icon: <img src="https://cdn-icons-png.flaticon.com/512/1336/1336494.png" alt="Ordinateur" className="w-12 h-12" />, type: 'effect', description: 'Logique structurée et créative' },
  { key: 'mathematiques',            label: 'Mathématiques',                   icon: <img src="https://cdn-icons-png.flaticon.com/512/3771/3771275.png" alt="Mathématiques" className="w-12 h-12" />, type: 'effect', description: 'Raisonnement logique et abstrait' },
] as const

// Relations causales : cause → effet
const CAUSAL_RELATIONS = {
  'concentration': ['resolution_problemes', 'mathematiques'],
  'connaissances_generales': ['communication', 'programmation'],
  'creativite': ['programmation', 'resolution_problemes'],
  'sens_critique': ['communication', 'mathematiques'],
} as const

type AxisKey = typeof CAUSAL_COMPETENCES[number]['key']

/* ===== Helpers ===== */
const toDict = (arr: CompetenceData[]) => {
  return arr.reduce<Record<string, CompetenceData>>((acc, d) => { 
    acc[d.competence] = d; 
    return acc 
  }, {})
}

const normalize = (score: number, max: number, targetMax = 10) =>
  max > 0 ? Number(((score / max) * targetMax).toFixed(2)) : 0

const byAlpha = (a: ChildProfile, b: ChildProfile) => a.name.localeCompare(b.name, 'fr')

// Fonction pour déterminer le niveau et la couleur selon le score
const getScoreLevel = (score: number) => {
  if (score >= 8.5) return { level: 'Expert', color: '#059669' }
  if (score >= 7) return { level: 'Avancé', color: '#0891b2' }
  if (score >= 5.5) return { level: 'Intermédiaire', color: '#7c3aed' }
  if (score >= 4) return { level: 'En développement', color: '#ea580c' }
  if (score >= 2) return { level: 'Débutant', color: '#dc2626' }
  return { level: 'À découvrir', color: '#6b7280' }
}

/* ===== Analyse causale intelligente (utilise les vraies données) ===== */
function getCausalAnalysis(competence: AxisKey, childId: string, profiles: ChildProfile[], isChild: boolean = false) {
  const profile = profiles.find(p => p.id === childId)
  if (!profile) return 'Analyse en cours...'
  
  const competenceData = profile.data.find(d => d.competence === competence)
  if (!competenceData) return 'Données insuffisantes pour cette compétence.'
  
  const score = typeof competenceData.score === 'string' 
    ? parseFloat(competenceData.score) 
    : competenceData.score
  const maxScore = competenceData.maxScore
  const normalizedScore = normalize(score, maxScore, 10)
  
  const competenceInfo = CAUSAL_COMPETENCES.find(c => c.key === competence)
  if (!competenceInfo) return 'Compétence non reconnue.'
  
  // Utiliser le nouveau système Bubix au lieu de l'ancien système causal
  return getBubixAnalysis(competence, childId, profiles, isChild)
}


/* ===== SYSTÈME D'ANALYSE BUBIX AVANCÉ - PÉDAGOGIE PROFESSIONNELLE ===== */

// Paliers de performance détaillés
const PERFORMANCE_LEVELS = {
  MASTERY: { min: 9.0, label: 'Maîtrise', color: '#059669' },
  ADVANCED: { min: 7.5, label: 'Avancé', color: '#0891b2' }, 
  PROFICIENT: { min: 6.0, label: 'Compétent', color: '#7c3aed' },
  DEVELOPING: { min: 4.0, label: 'En développement', color: '#ea580c' },
  EMERGING: { min: 2.0, label: 'Émergent', color: '#dc2626' },
  BEGINNING: { min: 0, label: 'Débutant', color: '#6b7280' }
} as const

// Base de connaissances pédagogiques détaillée par compétence
const PEDAGOGICAL_KNOWLEDGE_BASE = {
  concentration: {
    definition: "Capacité à maintenir son attention de manière soutenue sur une tâche ou un stimulus spécifique, en filtrant les distractions.",
    indicators: {
      high: ["Maintient l'attention >15min", "Résiste aux distractions", "Termine les tâches entreprises", "Concentration sélective efficace"],
      medium: ["Attention fluctuante 5-15min", "Sensible aux distractions externes", "Besoin de rappels occasionnels"],
      low: ["Attention <5min", "Très distractible", "Difficultés à terminer les tâches", "Besoin d'encadrement constant"]
    },
    impacts: {
      academic: "Fondamentale pour tous les apprentissages scolaires, particulièrement en lecture et mathématiques",
      social: "Influence la qualité des interactions sociales et l'écoute active",
      emotional: "Liée à la régulation émotionnelle et la gestion du stress"
    },
    strategies: {
      strengthen: [
        "Créer un environnement calme et structuré",
        "Utiliser des techniques de mindfulness adaptées à l'âge",
        "Fractionner les tâches en séquences courtes",
        "Introduire des pauses actives régulières",
        "Utiliser des supports visuels et des minuteurs"
      ],
      maintain: [
        "Varier les modalités d'apprentissage",
        "Proposer des défis progressifs",
        "Renforcer positivement les efforts de concentration"
      ]
    },
    warning_signs: ["Agitation excessive", "Évitement des tâches", "Fatigue rapide", "Irritabilité lors d'efforts soutenus"]
  },
  
  connaissances_generales: {
    definition: "Ensemble des savoirs culturels, scientifiques et sociaux acquis, constituant le socle de la culture générale.",
    indicators: {
      high: ["Vocabulaire riche et précis", "Références culturelles variées", "Curiosité intellectuelle marquée", "Capacité de synthèse"],
      medium: ["Connaissances sectorielles", "Intérêt pour certains domaines", "Vocabulaire en développement"],
      low: ["Vocabulaire limité", "Peu de références culturelles", "Difficultés de compréhension contextuelle"]
    },
    impacts: {
      academic: "Base essentielle pour la compréhension en lecture, sciences et histoire",
      social: "Facilite les échanges et la communication avec les pairs",
      cognitive: "Enrichit les schémas mentaux et la capacité d'analyse"
    },
    strategies: {
      strengthen: [
        "Lecture quotidienne variée (documentaires, fiction, presse jeunesse)",
        "Visites culturelles (musées, expositions, monuments)",
        "Discussions familiales sur l'actualité adaptée",
        "Jeux de culture générale et quiz interactifs",
        "Encourager les questions et y répondre avec précision"
      ],
      maintain: [
        "Diversifier les sources d'information",
        "Créer des liens entre les apprentissages",
        "Valoriser la curiosité naturelle"
      ]
    },
    warning_signs: ["Désintérêt pour la lecture", "Vocabulaire qui stagne", "Difficultés de compréhension", "Isolement culturel"]
  },

  creativite: {
    definition: "Capacité à produire des idées originales, à résoudre des problèmes de manière innovante et à s'exprimer de façon personnelle.",
    indicators: {
      high: ["Solutions originales", "Expression artistique riche", "Pensée divergente", "Innovation dans les jeux"],
      medium: ["Créativité dans certains domaines", "Besoin d'encouragement", "Imitation créative"],
      low: ["Préférence pour l'imitation", "Résistance au changement", "Solutions conventionnelles uniquement"]
    },
    impacts: {
      academic: "Essentielle en arts, littérature et résolution de problèmes mathématiques",
      social: "Favorise l'originalité et l'expression personnelle",
      emotional: "Moyen d'expression des émotions et de développement de l'estime de soi"
    },
    strategies: {
      strengthen: [
        "Activités artistiques libres (dessin, peinture, musique)",
        "Jeux de construction et d'imagination",
        "Brainstorming sans jugement",
        "Encourager l'expérimentation",
        "Valoriser les tentatives même imparfaites"
      ],
      maintain: [
        "Varier les supports créatifs",
        "Proposer des défis ouverts",
        "Créer un environnement bienveillant"
      ]
    },
    warning_signs: ["Peur de l'erreur", "Conformisme excessif", "Manque de confiance", "Évitement des activités créatives"]
  },

  sens_critique: {
    definition: "Capacité à analyser, évaluer et questionner les informations de manière objective et réfléchie.",
    indicators: {
      high: ["Questionne les sources", "Analyse les arguments", "Détecte les incohérences", "Opinion nuancée"],
      medium: ["Commence à questionner", "Analyse guidée", "Opinions en construction"],
      low: ["Accepte sans questionner", "Difficultés d'analyse", "Opinions binaires"]
    },
    impacts: {
      academic: "Crucial pour l'analyse de textes, sciences et philosophie",
      social: "Protection contre la manipulation et les fake news",
      cognitive: "Développe l'autonomie intellectuelle"
    },
    strategies: {
      strengthen: [
        "Poser des questions ouvertes sur les lectures",
        "Analyser ensemble les publicités et médias",
        "Encourager l'argumentation respectueuse",
        "Comparer différentes sources d'information",
        "Jeux de débat adaptés à l'âge"
      ],
      maintain: [
        "Valoriser les questions pertinentes",
        "Modéliser la pensée critique",
        "Créer des espaces de discussion"
      ]
    },
    warning_signs: ["Crédulité excessive", "Opinions rigides", "Évitement du questionnement", "Influence facile"]
  },

  resolution_problemes: {
    definition: "Capacité à identifier, analyser et résoudre des problèmes complexes en utilisant des stratégies méthodiques.",
    indicators: {
      high: ["Stratégies multiples", "Persévérance", "Analyse systématique", "Transfert de solutions"],
      medium: ["Stratégies limitées", "Besoin d'aide ponctuelle", "Résolution par essai-erreur"],
      low: ["Abandon rapide", "Stratégies inefficaces", "Dépendance à l'aide externe"]
    },
    impacts: {
      academic: "Transversale à toutes les matières, particulièrement en mathématiques et sciences",
      social: "Gestion des conflits et négociation",
      life_skills: "Autonomie et adaptation aux situations nouvelles"
    },
    strategies: {
      strengthen: [
        "Méthode de résolution en étapes (comprendre, planifier, exécuter, vérifier)",
        "Jeux de logique et casse-têtes progressifs",
        "Situations-problèmes concrètes du quotidien",
        "Encourager la verbalisation du raisonnement",
        "Valoriser les tentatives et les erreurs constructives"
      ],
      maintain: [
        "Complexifier progressivement les défis",
        "Varier les types de problèmes",
        "Encourager l'autonomie"
      ]
    },
    warning_signs: ["Évitement des défis", "Frustration rapide", "Dépendance excessive", "Stratégies rigides"]
  },

  communication: {
    definition: "Capacité à exprimer ses idées clairement et à comprendre autrui dans diverses situations de communication.",
    indicators: {
      high: ["Expression claire et structurée", "Écoute active", "Adaptation au public", "Communication non-verbale maîtrisée"],
      medium: ["Expression correcte", "Écoute partielle", "Adaptation limitée"],
      low: ["Expression confuse", "Difficultés d'écoute", "Communication inadaptée"]
    },
    impacts: {
      academic: "Essentielle pour tous les apprentissages oraux et écrits",
      social: "Base des relations interpersonnelles et du travail en équipe",
      professional: "Compétence clé pour la réussite future"
    },
    strategies: {
      strengthen: [
        "Temps de parole quotidiens structurés",
        "Jeux de rôle et théâtre",
        "Présentation de projets personnels",
        "Écoute active modélisée par l'adulte",
        "Enrichissement du vocabulaire contextuel"
      ],
      maintain: [
        "Varier les situations de communication",
        "Encourager l'expression personnelle",
        "Créer un climat de confiance"
      ]
    },
    warning_signs: ["Mutisme sélectif", "Agressivité verbale", "Incompréhensions fréquentes", "Isolement social"]
  },

  programmation: {
    definition: "Capacité à concevoir, structurer et implémenter des solutions algorithmiques pour résoudre des problèmes.",
    indicators: {
      high: ["Logique algorithmique", "Décomposition de problèmes", "Débogage efficace", "Créativité technique"],
      medium: ["Logique de base", "Aide pour la structuration", "Débogage guidé"],
      low: ["Difficultés logiques", "Approche désorganisée", "Frustration technique"]
    },
    impacts: {
      academic: "Renforce la logique mathématique et la résolution de problèmes",
      cognitive: "Développe la pensée séquentielle et structurée",
      future: "Compétence du 21ème siècle de plus en plus valorisée"
    },
    strategies: {
      strengthen: [
        "Programmation visuelle (Scratch, Blockly)",
        "Robotique éducative adaptée à l'âge",
        "Jeux de logique et d'algorithmes",
        "Décomposition de tâches quotidiennes en étapes",
        "Projets créatifs motivants"
      ],
      maintain: [
        "Complexifier progressivement les projets",
        "Encourager l'expérimentation",
        "Valoriser la créativité technique"
      ]
    },
    warning_signs: ["Évitement des activités logiques", "Frustration face aux erreurs", "Approche chaotique", "Désintérêt technologique"]
  },

  mathematiques: {
    definition: "Capacité à comprendre, manipuler et appliquer les concepts mathématiques pour résoudre des problèmes quantitatifs.",
    indicators: {
      high: ["Raisonnement logique", "Calcul mental fluide", "Résolution de problèmes complexes", "Abstraction mathématique"],
      medium: ["Calculs corrects avec support", "Raisonnement guidé", "Problèmes simples résolus"],
      low: ["Difficultés de calcul", "Raisonnement confus", "Évitement des mathématiques"]
    },
    impacts: {
      academic: "Fondamentale pour les sciences, la technologie et l'économie",
      cognitive: "Développe la logique et l'abstraction",
      practical: "Essentielle pour la vie quotidienne et professionnelle"
    },
    strategies: {
      strengthen: [
        "Manipulation d'objets concrets avant l'abstraction",
        "Jeux mathématiques ludiques",
        "Problèmes ancrés dans le quotidien",
        "Verbalisation du raisonnement",
        "Progression par petites étapes"
      ],
      maintain: [
        "Défis mathématiques stimulants",
        "Applications concrètes",
        "Valoriser les différentes stratégies"
      ]
    },
    warning_signs: ["Anxiété mathématique", "Évitement systématique", "Erreurs de base persistantes", "Perte de confiance"]
  }
} as const

// Fonction pour déterminer le niveau de performance
function getPerformanceLevel(score: number) {
  for (const [key, level] of Object.entries(PERFORMANCE_LEVELS)) {
    if (score >= level.min) {
      return { key, ...level }
    }
  }
  return { key: 'BEGINNING', ...PERFORMANCE_LEVELS.BEGINNING }
}

// Analyse du profil radar global
function analyzeRadarProfile(profiles: ChildProfile[], childId: string): {
  strengths: string[],
  weaknesses: string[],
  balance: string,
  recommendations: string[]
} {
  const profile = profiles.find(p => p.id === childId)
  if (!profile) return { strengths: [], weaknesses: [], balance: '', recommendations: [] }

  const scores = profile.data.map(d => ({
    competence: d.competence,
    score: typeof d.score === 'string' ? parseFloat(d.score) : d.score,
    info: CAUSAL_COMPETENCES.find(c => c.key === d.competence)
  }))

  // Identifier les forces (top 25%)
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const topQuartile = sortedScores.slice(0, Math.ceil(scores.length * 0.25))
  const bottomQuartile = sortedScores.slice(-Math.ceil(scores.length * 0.25))

  const strengths = topQuartile
    .filter(s => s.score >= 6.0)
    .map(s => s.info?.label || s.competence)

  const weaknesses = bottomQuartile
    .filter(s => s.score < 5.0)
    .map(s => s.info?.label || s.competence)

  // Analyser l'équilibre du profil
  const variance = scores.reduce((sum, s) => sum + Math.pow(s.score - (scores.reduce((acc, sc) => acc + sc.score, 0) / scores.length), 2), 0) / scores.length
  const balance = variance < 2 ? 'équilibré' : variance < 4 ? 'modérément déséquilibré' : 'très déséquilibré'

  // Recommandations basées sur les corrélations causales
  const recommendations = generateCorrelationRecommendations(scores)

  return { strengths, weaknesses, balance, recommendations }
}

// Générer des recommandations basées sur les corrélations causales
function generateCorrelationRecommendations(scores: any[]): string[] {
  const recommendations: string[] = []
  
  // Analyser les compétences de base faibles qui impactent les dérivées
  const causeCompetences = scores.filter(s => CAUSAL_COMPETENCES.find(c => c.key === s.competence)?.type === 'cause')
  const effectCompetences = scores.filter(s => CAUSAL_COMPETENCES.find(c => c.key === s.competence)?.type === 'effect')

  causeCompetences.forEach(cause => {
    if (cause.score < 5.0) {
      const relatedEffects = CAUSAL_RELATIONS[cause.competence as keyof typeof CAUSAL_RELATIONS] || []
      const affectedEffects = effectCompetences.filter((effect: any) => 
        (relatedEffects as readonly string[]).includes(effect.competence) && effect.score < 6.0
      )
      
      if (affectedEffects.length > 0) {
        recommendations.push(
          `Priorité : Renforcer ${cause.info?.label} (${cause.score.toFixed(1)}/10) pour améliorer ${affectedEffects.map((e: any) => e.info?.label).join(', ')}`
        )
      }
    }
  })

  return recommendations
}

// Fonction principale d'analyse Bubix avancée
function generateAdvancedBubixAnalysis(
  competence: AxisKey,
  childName: string,
  score: number,
  age: number,
  profiles: ChildProfile[],
  childId: string,
  isChild: boolean = false
): string {
  const competenceInfo = CAUSAL_COMPETENCES.find(c => c.key === competence)
  const knowledge = PEDAGOGICAL_KNOWLEDGE_BASE[competence]
  
  if (!competenceInfo || !knowledge) return 'Analyse non disponible.'

  const performanceLevel = getPerformanceLevel(score)
  const radarAnalysis = analyzeRadarProfile(profiles, childId)
  
  // Déterminer les indicateurs selon le niveau
  let indicators: readonly string[]
  if (score >= 7.5) indicators = knowledge.indicators.high
  else if (score >= 4.0) indicators = knowledge.indicators.medium
  else indicators = knowledge.indicators.low

  // Sélectionner les stratégies appropriées
  const strategies = score >= 6.0 ? knowledge.strategies.maintain : knowledge.strategies.strengthen

  if (isChild) {
    // Version enfant : encourageante et simple
    return generateChildAnalysis(competenceInfo, knowledge, score, performanceLevel, childName, age)
  } else {
    // Version parent : détaillée et professionnelle
    return generateParentAnalysis(
      competenceInfo, 
      knowledge, 
      score, 
      performanceLevel, 
      childName, 
      age, 
      indicators, 
      strategies,
      radarAnalysis
    )
  }
}

// Analyse pour les enfants
function generateChildAnalysis(
  competenceInfo: any,
  knowledge: any,
  score: number,
  performanceLevel: any,
  childName: string,
  age: number
): string {
  const ageSegment = getAgeSegment(age)
  let message = ""

  if (score >= 8.0) {
    message = `🌟 Bravo ${childName} ! Tu es ${performanceLevel.label.toLowerCase()} en ${competenceInfo.label} (${score.toFixed(1)}/10). `
    if (age <= 7) message += "Tu es un vrai champion ! Continue à jouer et à apprendre."
    else message += "Tu maîtrises super bien cette compétence ! Continue sur cette lancée."
  } else if (score >= 6.0) {
    message = `👍 Bien joué ${childName} ! Tu progresses bien en ${competenceInfo.label} (${score.toFixed(1)}/10). `
    message += age <= 7 ? "Continue tes efforts, tu deviens de plus en plus fort !" : "Tu es sur la bonne voie, persévère !"
  } else if (score >= 4.0) {
    message = `💪 Tu apprends ${competenceInfo.label} (${score.toFixed(1)}/10), ${childName}. `
    message += age <= 7 ? "Chaque jour tu deviens meilleur ! On va s'entraîner ensemble." : "Avec de l'entraînement, tu vas y arriver !"
  } else {
    message = `🌱 Tu découvres ${competenceInfo.label} (${score.toFixed(1)}/10), ${childName}. `
    message += age <= 7 ? "C'est normal d'apprendre petit à petit. Tu vas grandir !" : "Tout le monde commence quelque part. Courage !"
  }

  return message
}

// Analyse détaillée pour les parents
function generateParentAnalysis(
  competenceInfo: any,
  knowledge: any,
  score: number,
  performanceLevel: any,
  childName: string,
  age: number,
  indicators: readonly string[],
  strategies: readonly string[],
  radarAnalysis: any
): string {
  let analysis = ""

  // 1. Diagnostic précis
  analysis += `📊 **DIAGNOSTIC - ${competenceInfo.label.toUpperCase()}**\n`
  analysis += `Score actuel : ${score.toFixed(1)}/10 (${performanceLevel.label})\n`
  analysis += `Définition : ${knowledge.definition}\n\n`

  // 2. Indicateurs observables
  analysis += `🔍 **INDICATEURS OBSERVÉS**\n`
  analysis += `À ce niveau, ${childName} présente généralement :\n`
  indicators.slice(0, 3).forEach(indicator => {
    analysis += `• ${indicator}\n`
  })
  analysis += `\n`

  // 3. Impact sur les apprentissages
  analysis += `🎯 **IMPACT SUR LES APPRENTISSAGES**\n`
  analysis += `• Scolaire : ${knowledge.impacts.academic}\n`
  if (knowledge.impacts.social) analysis += `• Social : ${knowledge.impacts.social}\n`
  if (knowledge.impacts.cognitive) analysis += `• Cognitif : ${knowledge.impacts.cognitive}\n`
  analysis += `\n`

  // 4. Stratégies pédagogiques concrètes
  analysis += `💡 **STRATÉGIES RECOMMANDÉES**\n`
  strategies.slice(0, 3).forEach((strategy, index) => {
    analysis += `${index + 1}. ${strategy}\n`
  })
  analysis += `\n`

  // 5. Corrélations avec le profil global
  if (radarAnalysis.recommendations.length > 0) {
    analysis += `🔗 **ANALYSE CORRÉLÉE**\n`
    analysis += `${radarAnalysis.recommendations[0]}\n\n`
  }

  // 6. Signaux d'alerte si nécessaire
  if (score < 4.0 && knowledge.warning_signs) {
    analysis += `⚠️ **SIGNAUX À SURVEILLER**\n`
    knowledge.warning_signs.slice(0, 2).forEach((sign: string) => {
      analysis += `• ${sign}\n`
    })
    analysis += `\n`
  }

  // 7. Perspective d'évolution
  analysis += `📈 **PERSPECTIVE D'ÉVOLUTION**\n`
  if (score >= 7.0) {
    analysis += `${childName} montre une excellente maîtrise. Maintenez la stimulation pour consolider ces acquis.`
  } else if (score >= 5.0) {
    analysis += `${childName} est en bonne progression. Avec un accompagnement ciblé, des améliorations significatives sont attendues.`
  } else {
    analysis += `${childName} nécessite un accompagnement renforcé. Un travail régulier sur cette compétence aura des effets positifs sur l'ensemble du profil.`
  }

  return analysis
}

// Composant pour afficher l'analyse formatée
function AnalysisDisplay({ content, isChild }: { content: string, isChild: boolean }) {
  if (isChild) {
    // Pour les enfants, affichage simple
    return <p className="text-base leading-relaxed">{content}</p>
  }

  // Pour les parents, formatage Markdown-like
  const sections = content.split('\n\n')
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (section.includes('**')) {
          // Section avec titre
          const lines = section.split('\n')
          const title = lines[0].replace(/\*\*/g, '').replace(/📊|🔍|🎯|💡|🔗|⚠️|📈/g, '').trim()
          const emoji = lines[0].match(/📊|🔍|🎯|💡|🔗|⚠️|📈/)?.[0] || ''
          const content = lines.slice(1).join('\n')
          
          return (
            <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{emoji}</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                  {title}
                </h4>
              </div>
              <div className="text-sm space-y-2">
                {content.split('\n').map((line, lineIndex) => {
                  if (line.startsWith('•')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{line.substring(1).trim()}</span>
                      </div>
                    )
                  } else if (line.match(/^\d+\./)) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-2">
                        <span className="text-blue-500 font-semibold">{line.match(/^\d+/)?.[0]}.</span>
                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    )
                  } else if (line.trim()) {
                    return <p key={lineIndex} className="text-gray-700 dark:text-gray-300">{line}</p>
                  }
                  return null
                })}
              </div>
            </div>
          )
        } else if (section.trim()) {
          // Section simple
          return (
            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {section}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}

// Fonction principale pour obtenir l'analyse Bubix (remplace l'ancien hardcoding)
function getBubixAnalysis(competence: AxisKey, childId: string, profiles: ChildProfile[], isChild: boolean = false): string {
  const profile = profiles.find(p => p.id === childId)
  if (!profile) return 'Analyse en cours...'
  
  const competenceData = profile.data.find(d => d.competence === competence)
  if (!competenceData) return 'Données insuffisantes pour cette compétence.'
  
  const score = typeof competenceData.score === 'string' 
    ? parseFloat(competenceData.score) 
    : competenceData.score
  
  // Utiliser l'âge du profil ou un âge par défaut
  const childAge = profile.age || 8
  
  // Utiliser le nouveau système d'analyse avancé
  return generateAdvancedBubixAnalysis(competence, profile.name, score, childAge, profiles, childId, isChild)
}


/* ===== UI ===== */
export default function RadarChart({
  childrenProfiles,
  userSessionId,
  isChild = false,
  className = '',
  compareModeDefault = false,
  userType = 'CHILD',
}: RadarChartProps) {
  // Utiliser le contexte pour partager les données avec Bubix (optionnel)
  let radarContext = null
  try {
    radarContext = useRadarDataContext()
  } catch (error) {
    // Le contexte n'est pas disponible, ce n'est pas grave
    console.log('RadarDataContext non disponible, utilisation normale du radar')
  }
  
  // Utiliser les données appropriées selon le type d'utilisateur
  const { profiles: singleProfiles, loading: singleLoading, error: singleError } = useRadarData({ 
    userSessionId: userSessionId || '', 
    isChild,
    userType
  })
  
  console.log('🔍 useRadarData result:', {
    singleProfiles: singleProfiles.length,
    singleLoading,
    singleError,
    profilesData: singleProfiles.map(p => ({ id: p.id, name: p.name, dataLength: p.data.length }))
  })
  
  const { profiles: multiProfiles, loading: multiLoading, error: multiError, childSessions } = useMultiChildRadarData({ 
    userType: userType === 'PARENT' ? 'PARENT' : 'CHILD'
  })
  
  console.log('🔍 useMultiChildRadarData result:', {
    multiProfiles: multiProfiles.length,
    multiLoading,
    multiError,
    childSessions: childSessions.length,
    profilesData: multiProfiles.map(p => ({ id: p.id, name: p.name, dataLength: p.data.length }))
  })
  
  // Utiliser les données appropriées
  const profiles = useMemo(() => {
    // Si c'est une session enfant, toujours utiliser singleProfiles (un seul enfant)
    if (isChild) {
      return singleProfiles.length > 0 ? singleProfiles.sort(byAlpha) : []
    }
    
    // Sinon, logique normale pour les parents
    if (userType === 'PARENT' && multiProfiles.length > 0) {
      return multiProfiles.sort(byAlpha)
    }
    if (userType === 'CHILD' && singleProfiles.length > 0) {
      return singleProfiles.sort(byAlpha)
    }
    if (childrenProfiles && childrenProfiles.length > 0) {
      return [...childrenProfiles].sort(byAlpha)
    }
    return []
  }, [isChild, userType, multiProfiles, singleProfiles, childrenProfiles])
  
  // Debug logs
  console.log('🔍 RadarChart Debug:', {
    userType,
    isChild,
    singleProfiles: singleProfiles.length,
    multiProfiles: multiProfiles.length,
    childSessions: childSessions.length,
    profilesLength: profiles.length,
    profilesDetailed: profiles.map(p => ({
      id: p.id,
      name: p.name,
      dataLength: p.data.length,
      competenceKeys: p.data.map(d => d.competence),
      expectedKeys: CAUSAL_COMPETENCES.map(c => c.key)
    })),
    singleLoading,
    multiLoading,
    singleError,
    multiError,
    shouldShowSelectors: !isChild && profiles.length > 1
  })
  
  const loading = userType === 'PARENT' ? multiLoading : singleLoading
  const error = userType === 'PARENT' ? multiError : singleError
  
  // Calculer l'âge moyen des profils pour la segmentation
  const averageAge = useMemo(() => {
    const ages = profiles.filter(p => p.age).map(p => p.age!)
    if (ages.length === 0) return 8 // âge par défaut
    return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
  }, [profiles])
  
  // Obtenir les informations de segmentation par âge
  const ageSegment = useMemo(() => getAgeSegment(averageAge), [averageAge])
  const ageColors = useMemo(() => getAgeAppropriateColors(averageAge), [averageAge])
  
  const [selectedChildId, setSelectedChildIdLocal] = useState(profiles[0]?.id || '')
  // Le mode comparaison n'est disponible que pour les parents avec plusieurs enfants
  const [compareMode, setCompareMode] = useState(isChild ? false : compareModeDefault)
  const [focusedCompetence, setFocusedCompetenceLocal] = useState<AxisKey | ''>('')
  
  // Partager les données avec le contexte (si disponible)
  useEffect(() => {
    if (radarContext) {
      radarContext.setProfiles(profiles)
      radarContext.setSelectedChildId(profiles[0]?.id || '')
    }
  }, [profiles, radarContext])
  
  // Fonctions qui mettent à jour le contexte (si disponible)
  const handleSetFocusedCompetence = (competence: AxisKey | '') => {
    setFocusedCompetenceLocal(competence)
    if (radarContext) {
      radarContext.setFocusedCompetence(competence)
    }
  }

  // construit l'objet data pour Nivo : un seul tableau avec toutes les keys (ids)
  const radarData = useMemo(() => {
    const dicts = profiles.reduce<Record<string, Record<string, CompetenceData>>>((acc, p) => {
      acc[p.id] = toDict(p.data)
      return acc
    }, {})

    const radarData = CAUSAL_COMPETENCES.map(({ key, label }) => {
      const row: any = { competence: label, _key: key } // _key = clé machine pour callbacks
      profiles.forEach((p) => {
        const d = dicts[p.id]?.[key]
        row[p.id] = d ? normalize(d.score, d.maxScore, 10) : 0
      })
      return row
    })
    
    console.log('📊 RADAR DATA ANALYSIS:', {
      profilesUsed: profiles.map(p => ({ 
        id: p.id, 
        name: p.name, 
        dataLength: p.data.length,
        sampleCompetences: p.data.slice(0, 3).map(d => ({ competence: d.competence, score: d.score }))
      })),
      radarDataGenerated: radarData.map(r => ({ 
        competence: r.competence, 
        values: Object.keys(r).filter(k => k !== 'competence' && k !== '_key').map(k => ({ [k]: r[k] }))
      })),
      isUsingFallbackData: profiles.some(p => p.data.every(d => Number(d.score) === 0))
    })
    
    return radarData
  }, [profiles])

  // keys à afficher : soit 1 enfant (switch), soit plusieurs (compare)
  // Pour les enfants, toujours un seul profil
  const activeKeys = useMemo(() => {
    if (isChild || profiles.length <= 1) {
      return profiles.length ? [profiles[0].id] : []
    }
    if (compareMode) return profiles.map(p => p.id)
    return profiles.length ? [selectedChildId || profiles[0].id] : []
  }, [profiles, compareMode, selectedChildId, isChild])

  // palette cohérente par enfant - tableau de couleurs pour Nivo
  const colors = useMemo(() => {
    return activeKeys.map(key => {
      const profile = profiles.find(p => p.id === key)
      return profile?.color || '#7E66FF'
    })
  }, [profiles, activeKeys])

  // scores totaux / niveau (pour le header)
  const { totalScore, maxTotalScore, percentage } = useMemo(() => {
    // Pour les enfants, toujours utiliser le premier profil uniquement
    const pick = isChild || profiles.length <= 1 
      ? profiles.slice(0, 1)
      : compareMode 
        ? profiles 
        : profiles.filter(p => p.id === activeKeys[0])
    
    const totals = pick.map(p => ({
      total: p.data.reduce((s, d) => s + Number(d.score), 0),
      max:   p.data.reduce((s, d) => s + d.maxScore, 0),
    }))
    const totalScore = totals.reduce((s, t) => s + t.total, 0)
    const maxTotalScore = totals.reduce((s, t) => s + t.max, 0)
    const percentage = maxTotalScore ? Math.round((totalScore / maxTotalScore) * 100) : 0
    return { 
      totalScore: Number(totalScore.toFixed(2)), 
      maxTotalScore: Number(maxTotalScore.toFixed(2)), 
      percentage 
    }
  }, [profiles, activeKeys, compareMode, isChild])

  const getLevel = (pct: number) => {
    if (pct >= 90) return { level: 'Maître', color: '#F59E0B', Icon: AwardIcon }
    if (pct >= 75) return { level: 'Expert', color: '#8B5CF6', Icon: StarIcon }
    if (pct >= 60) return { level: 'Avancé', color: '#10B981', Icon: ZapIcon }
    if (pct >= 40) return { level: 'Intermédiaire', color: '#3B82F6', Icon: SwitchCameraIcon }
    return { level: 'Débutant', color: '#6B7280', Icon: ShieldIcon }
  }
  const { level, color: levelColor, Icon } = getLevel(percentage)

  // Affichage de chargement
  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-6 h-6">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${className}`}>
      {/* Header épuré */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isChild ? 'Mon Bouclier' : 'Compétences'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isChild ? 'Mes progrès' : `${profiles.length > 1 ? 'Vue famille' : 'Suivi individuel'}`}
              </p>
            </div>
          </div>
          
          {/* Résumé compact */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: levelColor }}>{percentage}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{level}</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
              <Icon className="w-8 h-8" style={{ color: levelColor }} />
            </div>
          </div>
        </div>
      </motion.div>


      {/* Sélecteurs - Uniquement pour les parents avec plusieurs enfants et si l'âge le permet */}
      {!isChild && profiles.length > 1 && isFeatureAvailable(averageAge, 'enableComparison') && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Switch enfant (si non compare) */}
          {!compareMode && (
            <select
              className="px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700"
              value={selectedChildId}
              onChange={(e) => setSelectedChildIdLocal(e.target.value)}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Toggle comparaison */}
          <button
            onClick={() => setCompareMode(v => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Comparer plusieurs enfants"
          >
            <SwitchCameraIcon className="w-4 h-4" />
            {compareMode ? 'Mode : Comparaison' : 'Mode : Enfant unique'}
          </button>

          {/* Légende */}
          <div className="ml-auto flex items-center gap-3">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-lg border dark:border-gray-700">
                <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-200">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RADAR - PLEINE LARGEUR EN HAUT */}
      <div className="w-full mb-12">
        <div className="h-[600px] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6">
            <ResponsiveRadar
              data={radarData}
              keys={activeKeys}
              indexBy="competence"
              maxValue={10}
              valueFormat={(value) => `${Number(value).toFixed(2)}`}
              margin={{ top: 80, right: 120, bottom: 80, left: 120 }}
              gridLabelOffset={36}
              gridShape="linear"
              curve="linearClosed"
              enableDots
              dotSize={10}
              dotBorderWidth={2}
              colors={colors}
              borderColor={{ from: 'color' }}
              fillOpacity={0.35}
              blendMode="multiply"
              animate
              motionConfig="gentle"
              theme={{
                background: 'transparent',
                text: { fontSize: 13, fill: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600 },
                grid: { line: { stroke: '#E5E7EB', strokeWidth: 1.5, strokeOpacity: 0.5 } },
                tooltip: {
                  container: {
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                  }
                }
              }}
              onClick={(point) => {
              const competenceLabel = point?.data?.competence || point?.indexValue || point?.index || point?.id
              if (competenceLabel) {
                const competence = CAUSAL_COMPETENCES.find(c => c.label === competenceLabel)
                if (competence) {
                  handleSetFocusedCompetence(competence.key)
                }
                }
              }}
              legends={[]}
            />
          </div>
        </div>

       {/* BOUTONS DE COMPÉTENCES - UNE SEULE LIGNE */}
       <div className="mb-8 w-full">
         <div className="flex gap-2 w-full overflow-x-auto pb-2">
           {CAUSAL_COMPETENCES.map((comp, idx) => {
             const selected = isChild 
               ? profiles[0] 
               : profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
             const d = selected?.data.find(x => x.competence === comp.key)
             const score = d ? normalize(Number(d.score), d.maxScore, 10) : 0
             const { level, color } = getScoreLevel(score)

             return (
               <motion.button
                 key={comp.key}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.03 }}
                 className={`group relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all duration-200 text-center border flex-1 min-w-[110px] hover:shadow-lg hover:scale-105 ${
                   focusedCompetence === comp.key
                     ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-lg scale-105 ring-2 ring-blue-200 dark:ring-blue-700'
                     : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-600'
                 }`}
                 onClick={() => {
                   handleSetFocusedCompetence(comp.key)
                   // Déclencher automatiquement l'analyse Bubix pour les parents
                   if (!isChild) {
                     // L'analyse sera automatiquement déclenchée via le BubixAnalysisPanel
                     // quand focusedCompetence change
                   }
                 }}
               >
                 {/* Nom de la compétence */}
                 <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                   {comp.label}
                 </h4>
                 
                 {/* Score */}
                 <div className="text-lg font-bold mb-1" style={{ color }}>
                   {score.toFixed(1)}<span className="text-xs text-gray-400 ml-0.5">/10</span>
                 </div>
                 
                 {/* Niveau */}
                 <div className="text-xs text-gray-500 dark:text-gray-400">
                   {level}
                 </div>

                 {/* Indicateur cliquable pour les parents */}
                 {!isChild && (
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                   </div>
                 )}
               </motion.button>
             )
           })}
         </div>
       </div>

       {/* ANALYSE BUBIX - VERSION ÉPURÉE */}
       {!isChild && (
         <div className="w-full mt-8">
           <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
             <div className="flex items-center gap-3 mb-4">
               <MessageCircleIcon className="w-5 h-5 text-blue-600" />
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                 Analyse Pédagogique
               </h3>
             </div>

             {focusedCompetence ? (
               <BubixAnalysisPanel
                 childId={profiles[0]?.id || ''}
                 competence={focusedCompetence}
                 competenceLabel={CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.label || ''}
                 childProfile={profiles[0]}
                 competenceScore={(() => {
                   const selected = isChild ? profiles[0] : profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
                   const d = selected?.data.find(x => x.competence === focusedCompetence)
                   return d ? normalize(Number(d.score), d.maxScore, 10) : 0
                 })()}
                 competenceLevel={(() => {
                   const selected = isChild ? profiles[0] : profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
                   const d = selected?.data.find(x => x.competence === focusedCompetence)
                   const score = d ? normalize(Number(d.score), d.maxScore, 10) : 0
                   return getScoreLevel(score).level
                 })()}
                 isChild={isChild}
               />
             ) : (
               <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                 <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                 <p className="text-sm">
                   Sélectionnez une compétence pour voir l'analyse détaillée
                 </p>
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  )
}
