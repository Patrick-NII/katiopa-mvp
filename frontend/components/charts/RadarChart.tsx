'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveRadar } from '@nivo/radar'
import { Shield, Star, Award, Zap, MessageCircle, SwitchCamera } from 'lucide-react'
import { useRadarData, useMultiChildRadarData } from '../../hooks/useRadarData'
import { useRadarDataContext } from '../../contexts/RadarDataContext'

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
  { key: 'concentration',            label: 'Concentration',                   icon: '🎯', type: 'cause', description: 'Capacité à maintenir son attention' },
  { key: 'connaissances_generales',  label: 'Connaissances générales',         icon: '📚', type: 'cause', description: 'Base culturelle et informationnelle' },
  { key: 'creativite',               label: 'Créativité',                      icon: '🎨', type: 'cause', description: 'Pensée divergente et innovation' },
  { key: 'sens_critique',            label: 'Sens critique',                   icon: '🔍', type: 'cause', description: 'Capacité d\'analyse et d\'évaluation' },
  
  // Variables dépendantes (effets) - compétences qui découlent des causes
  { key: 'resolution_problemes',     label: 'Résolution de problèmes',         icon: '🧩', type: 'effect', description: 'Application méthodique des connaissances' },
  { key: 'communication',            label: 'Communication',                   icon: '💬', type: 'effect', description: 'Expression et partage des idées' },
  { key: 'programmation',            label: 'Programmation',                   icon: '💻', type: 'effect', description: 'Logique structurée et créative' },
  { key: 'mathematiques',            label: 'Mathématiques',                   icon: '🔢', type: 'effect', description: 'Raisonnement logique et abstrait' },
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
const toDict = (arr: CompetenceData[]) =>
  arr.reduce<Record<string, CompetenceData>>((acc, d) => { acc[d.competence] = d; return acc }, {})

const normalize = (score: number, max: number, targetMax = 10) =>
  max > 0 ? Number(((score / max) * targetMax).toFixed(2)) : 0

const byAlpha = (a: ChildProfile, b: ChildProfile) => a.name.localeCompare(b.name, 'fr')

/* ===== Analyse causale intelligente ===== */
function getCausalAnalysis(competence: AxisKey, childId: string, profiles: ChildProfile[]) {
  const profile = profiles.find(p => p.id === childId)
  if (!profile) return 'Analyse en cours...'
  
  const competenceData = profile.data.find(d => d.competence === competence)
  if (!competenceData) return 'Données insuffisantes pour cette compétence.'
  
  const score = competenceData.score
  const maxScore = competenceData.maxScore
  const normalizedScore = normalize(score, maxScore, 10)
  
  const competenceInfo = CAUSAL_COMPETENCES.find(c => c.key === competence)
  if (!competenceInfo) return 'Compétence non reconnue.'
  
  // Analyse selon le type (cause ou effet)
  if (competenceInfo.type === 'cause') {
    return getCauseAnalysis(competence, normalizedScore, profile)
  } else {
    return getEffectAnalysis(competence, normalizedScore, profile)
  }
}

function getCauseAnalysis(competence: AxisKey, score: number, profile: ChildProfile) {
  const effects = CAUSAL_RELATIONS[competence as keyof typeof CAUSAL_RELATIONS] || []
  const effectScores = effects.map((effectKey: string) => {
    const effectData = profile.data.find(d => d.competence === effectKey)
    return effectData ? normalize(effectData.score, effectData.maxScore, 10) : 0
  })
  
  const avgEffectScore = effectScores.reduce((sum: number, s: number) => sum + s, 0) / effectScores.length
  
  if (score >= 7) {
    return `Excellent niveau en ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10) ! Cette compétence de base influence positivement les autres domaines. C'est un levier puissant pour progresser.`
  } else if (score >= 5) {
    return `Bon niveau en ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10). Cette compétence fondamentale peut encore être renforcée pour améliorer les compétences qui en dépendent.`
  } else {
    return `Niveau en développement pour ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10). C'est une compétence clé à travailler car elle influence directement d'autres domaines d'apprentissage.`
  }
}

function getEffectAnalysis(competence: AxisKey, score: number, profile: ChildProfile) {
  // Trouver les causes qui influencent cette compétence
  const causes = Object.entries(CAUSAL_RELATIONS)
    .filter(([_, effects]) => (effects as readonly string[]).includes(competence as string))
    .map(([cause, _]) => cause)
  
  const causeScores = causes.map((causeKey: string) => {
    const causeData = profile.data.find(d => d.competence === causeKey)
    return causeData ? normalize(causeData.score, causeData.maxScore, 10) : 0
  })
  
  const avgCauseScore = causeScores.reduce((sum: number, s: number) => sum + s, 0) / causeScores.length
  
  if (score >= 7) {
    return `Excellent niveau en ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10) ! Cette compétence bénéficie de bonnes bases dans les domaines qui l'influencent.`
  } else if (score >= 5) {
    if (avgCauseScore < 5) {
      return `Niveau correct en ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10), mais pourrait être amélioré en renforçant les compétences de base qui l'influencent.`
    } else {
      return `Bon niveau en ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10). Les compétences de base sont solides, continuez sur cette lancée !`
    }
  } else {
    if (avgCauseScore < 5) {
      return `Niveau en développement pour ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10). Le travail sur les compétences de base aidera à améliorer cette compétence.`
    } else {
      return `Niveau en progression pour ${CAUSAL_COMPETENCES.find(c => c.key === competence)?.label} (${score.toFixed(1)}/10). Malgré de bonnes bases, cette compétence nécessite plus de pratique.`
    }
  }
}

/* ===== Analyse Bubix (reprend tes textes) ===== */
function getBubixAnalysis(competence: AxisKey, childId: string) {
  const analyses: { [k in AxisKey]?: Record<string, string> } = {
    mathematiques: {
      'milan-session': 'Milan montre de bonnes bases en mathématiques avec un score de 5.60/10. Il maîtrise bien les opérations de base mais pourrait améliorer sa résolution de problèmes complexes.',
      'aylon-session': 'Aylon excelle en mathématiques avec un score de 6.80/10. Il comprend bien les concepts abstraits et résout efficacement les problèmes.',
      'milan123': 'Milan progresse bien en mathématiques. Il développe sa logique numérique.',
      'aylon': 'Aylon a de solides bases mathématiques. Il résout les problèmes avec confiance.',
      'sophie': 'Sophie montre un bon niveau en mathématiques. Elle applique bien les concepts.',
    },
    programmation: {
      'milan-session': 'Milan découvre la programmation avec un score de 3.30/10. Il commence à comprendre la logique algorithmique.',
      'aylon-session': 'Aylon progresse bien en programmation avec un score de 7.50/10. Il maîtrise les concepts de base.',
      'milan123': 'Milan explore la programmation. Il apprend la logique de code.',
      'aylon': 'Aylon excelle en programmation. Il crée des solutions innovantes.',
      'sophie': 'Sophie découvre la programmation. Elle comprend les concepts de base.',
    },
    creativite: {
      'milan-session': 'Milan a une créativité en développement avec un score de 1.90/10. Encouragez-le à exprimer ses idées.',
      'aylon-session': 'Aylon montre une créativité modérée avec un score de 6.20/10. Il a de bonnes idées originales.',
      'milan123': 'Milan développe sa créativité. Il a des idées originales.',
      'aylon': 'Aylon est très créatif. Il innove dans ses projets.',
      'sophie': 'Sophie exprime bien sa créativité. Elle a une imagination fertile.',
    },
    concentration: {
      'milan-session': 'Milan a une excellente concentration avec un score de 8.10/10. Il reste focus sur ses tâches.',
      'aylon-session': 'Aylon maintient bien sa concentration avec un score de 6.90/10. Il peut améliorer sa persévérance.',
      'milan123': 'Milan se concentre bien. Il termine ses tâches.',
      'aylon': 'Aylon maintient sa concentration. Il reste focus.',
      'sophie': 'Sophie a une bonne concentration. Elle reste attentive.',
    },
    resolution_problemes: {
      'milan-session': 'Milan résout les problèmes avec méthode avec un score de 4.60/10. Il développe sa logique.',
      'aylon-session': 'Aylon analyse bien les problèmes avec un score de 7.20/10. Il trouve des solutions créatives.',
      'milan123': 'Milan aborde les problèmes méthodiquement. Il développe sa logique.',
      'aylon': 'Aylon excelle en résolution de problèmes. Il trouve des solutions innovantes.',
      'sophie': 'Sophie résout bien les problèmes. Elle analyse avec méthode.',
    },
    communication: {
      'milan-session': 'Milan communique bien avec un score de 7.30/10. Il s\'exprime clairement et écoute les autres.',
      'aylon-session': 'Aylon communique efficacement avec un score de 6.50/10. Il partage ses idées avec confiance.',
      'milan123': 'Milan communique clairement. Il s\'exprime bien.',
      'aylon': 'Aylon est un excellent communicateur. Il partage ses idées.',
      'sophie': 'Sophie communique efficacement. Elle s\'exprime avec clarté.',
    },
    connaissances_generales: {
      'milan-session': 'Milan enrichit ses connaissances avec un score de 3.10/10. Il découvre le monde qui l\'entoure.',
      'aylon-session': 'Aylon a de bonnes connaissances générales avec un score de 7.10/10. Il est curieux et informé.',
      'milan123': 'Milan enrichit ses connaissances. Il découvre le monde.',
      'aylon': 'Aylon a une culture générale impressionnante. Il est très informé.',
      'sophie': 'Sophie a de bonnes connaissances. Elle est curieuse.',
    },
    sens_critique: {
      'milan-session': 'Milan développe son sens critique avec un score de 3.50/10. Il commence à questionner et analyser.',
      'aylon-session': 'Aylon a un bon sens critique avec un score de 6.80/10. Il analyse et évalue les informations.',
      'milan123': 'Milan développe son esprit critique. Il questionne.',
      'aylon': 'Aylon a un sens critique développé. Il analyse bien.',
      'sophie': 'Sophie développe son sens critique. Elle évalue les informations.',
    },
  }
  return analyses[competence]?.[childId] || 'Analyse en cours...'
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
  
  const { profiles: multiProfiles, loading: multiLoading, error: multiError, childSessions } = useMultiChildRadarData({ 
    userType: userType === 'PARENT' ? 'PARENT' : 'CHILD'
  })
  
  // Debug logs
  console.log('🔍 RadarChart Debug:', {
    userType,
    isChild,
    singleProfiles: singleProfiles.length,
    multiProfiles: multiProfiles.length,
    childSessions: childSessions.length,
    singleLoading,
    multiLoading,
    singleError,
    multiError
  })
  
  // Utiliser les données appropriées
  const profiles = useMemo(() => {
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
  }, [userType, multiProfiles, singleProfiles, childrenProfiles])
  
  const loading = userType === 'PARENT' ? multiLoading : singleLoading
  const error = userType === 'PARENT' ? multiError : singleError
  
  const [selectedChildId, setSelectedChildIdLocal] = useState(profiles[0]?.id || '')
  const [compareMode, setCompareMode] = useState(compareModeDefault)
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

  // construit l’objet data pour Nivo : un seul tableau avec toutes les keys (ids)
  const radarData = useMemo(() => {
    const dicts = profiles.reduce<Record<string, Record<string, CompetenceData>>>((acc, p) => {
      acc[p.id] = toDict(p.data)
      return acc
    }, {})

    return CAUSAL_COMPETENCES.map(({ key, label }) => {
      const row: any = { competence: label, _key: key } // _key = clé machine pour callbacks
      profiles.forEach((p) => {
        const d = dicts[p.id]?.[key]
        row[p.id] = d ? normalize(d.score, d.maxScore, 10) : 0
      })
      return row
    })
  }, [profiles])

  // keys à afficher : soit 1 enfant (switch), soit plusieurs (compare)
  const activeKeys = useMemo(() => {
    if (compareMode) return profiles.map(p => p.id)
    return profiles.length ? [selectedChildId || profiles[0].id] : []
  }, [profiles, compareMode, selectedChildId])

  // palette cohérente par enfant - tableau de couleurs pour Nivo
  const colors = useMemo(() => {
    return activeKeys.map(key => {
      const profile = profiles.find(p => p.id === key)
      return profile?.color || '#7E66FF'
    })
  }, [profiles, activeKeys])

  // scores totaux / niveau (pour le header)
  const { totalScore, maxTotalScore, percentage } = useMemo(() => {
    const pick = compareMode ? profiles : profiles.filter(p => p.id === activeKeys[0])
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
  }, [profiles, activeKeys, compareMode])

  const getLevel = (pct: number) => {
    if (pct >= 90) return { level: 'Maître', color: '#F59E0B', Icon: Award }
    if (pct >= 75) return { level: 'Expert', color: '#8B5CF6', Icon: Star }
    if (pct >= 60) return { level: 'Avancé', color: '#10B981', Icon: Zap }
    if (pct >= 40) return { level: 'Intermédiaire', color: '#3B82F6', Icon: Shield }
    return { level: 'Débutant', color: '#6B7280', Icon: Shield }
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
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isChild ? 'Mon Bouclier des Compétences' : 'Bouclier des Compétences'}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {isChild ? 'Chaque apprentissage renforce ton bouclier magique !' : 'Suivi des compétences pédagogiques'}
        </p>
      </motion.div>

      {/* Stats résumé */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalScore}/{maxTotalScore}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Points totaux</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: levelColor }}>{percentage}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Progression</div>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6" style={{ color: levelColor }} />
            <div className="text-lg font-semibold" style={{ color: levelColor }}>{level}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Niveau actuel</div>
        </div>
      </div>

      {/* Sélecteurs */}
      {!isChild && (
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
            <SwitchCamera className="w-4 h-4" />
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

      {/* Radar + Analyse */}
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="h-[600px] w-full">
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
                const competenceLabel = point?.index as string
                const competence = CAUSAL_COMPETENCES.find(c => c.label === competenceLabel)
                if (competence) {
                  handleSetFocusedCompetence(competence.key)
                }
              }}
              legends={[]}
            />
          </div>
        </div>

        {/* Analyse Bubix */}
        <div className="w-80">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 h-[600px] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analyse Bubix</h3>
            </div>

            {focusedCompetence ? (
              <>
                <h4 className="text-lg font-semibold mb-3">
                  {CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.label}
                </h4>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.type === 'cause' ? '🎯 Compétence de base (cause)' : '📈 Compétence dérivée (effet)'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {CAUSAL_COMPETENCES.find(c => c.key === focusedCompetence)?.description}
                  </p>
                </div>
                {(compareMode ? profiles : profiles.filter(p => activeKeys.includes(p.id))).map(p => (
                  <div key={p.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {getCausalAnalysis(focusedCompetence, p.id, profiles)}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Clique sur un axe du radar pour voir l’analyse détaillée.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Légende du système causal */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-700 dark:text-gray-300">Compétences de base (causes)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-gray-700 dark:text-gray-300">Compétences dérivées (effets)</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          Les compétences de base influencent les compétences dérivées. Travailler sur les causes améliore les effets.
        </p>
      </div>

      {/* Grille de compétences (résumé) */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Compétences développées</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CAUSAL_COMPETENCES.map((comp, idx) => {
            const selected = profiles.find(p => p.id === (activeKeys[0] || profiles[0]?.id))
            const d = selected?.data.find(x => x.competence === comp.key)
            const score = d?.score ?? 0
            const max = d?.maxScore ?? 10
            return (
              <motion.div
                key={comp.key}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  comp.type === 'cause' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-lg">{comp.icon}</span>
                  <span className={`text-xs px-1 py-0.5 rounded text-white font-medium ${
                    comp.type === 'cause' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {comp.type === 'cause' ? 'C' : 'E'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{comp.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{Number(score).toFixed(2)}/{max}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Message motivant */}
      {isChild && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-purple-600" />
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Bravo !</strong> Ton bouclier se renforce à chaque activité. Continue pour débloquer de nouveaux niveaux !
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}