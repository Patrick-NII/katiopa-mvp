"use client";
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Award, 
  Activity, 
  Brain,
  Calculator,
  Timer,
  Star,
  Trophy,
  TrendingDown,
  Lightbulb,
  Users,
  Calendar
} from 'lucide-react';
import { cubematchAPI } from '../../lib/api/cubematch';

interface CubeMatchStats {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  totalTimePlayed: number;
  averageTimePlayed: number;
  highestLevel: number;
  totalPlayers?: number;
  averageLevel?: number;
  mostUsedOperator?: string;
}

interface OperatorStats {
  operator: string;
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  accuracyRate: number;
  totalTimePlayed: number;
  averageTimePerGame: number;
  totalMoves: number;
  successfulMoves: number;
  failedMoves: number;
  averageMoveTime: number;
  averageLevel: number;
  highestLevel: number;
  lastPlayed: string;
}

interface GameInsights {
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedOperators: string[];
  progressScore: number;
  consistencyScore: number;
  challengeReadiness: number;
  bestPlayingHours: string[];
  optimalSessionDuration: number;
  recommendedBreakFrequency: number;
}

type Category = 'overview' | 'operators' | 'performance' | 'insights' | 'sessions' | 'comparison';

export default function CubeMatchStats() {
  const [activeCategory, setActiveCategory] = useState<Category>('overview');
  const [stats, setStats] = useState<CubeMatchStats | null>(null);
  const [operatorStats, setOperatorStats] = useState<OperatorStats[]>([]);
  const [insights, setInsights] = useState<GameInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [statsData, operatorData, insightsData] = await Promise.all([
        cubematchAPI.getStats(),
        cubematchAPI.getOperatorStats(timeRange),
        cubematchAPI.getInsights()
      ]);
      
      setStats(statsData);
      setOperatorStats(operatorData || []);
      setInsights(insightsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const getOperatorIcon = (operator: string) => {
    switch (operator) {
      case 'ADD': return '+';
      case 'SUB': return '−';
      case 'MUL': return '×';
      case 'DIV': return '÷';
      default: return operator;
    }
  };

  const getOperatorColor = (operator: string) => {
    switch (operator) {
      case 'ADD': return 'text-green-600 bg-green-100';
      case 'SUB': return 'text-blue-600 bg-blue-100';
      case 'MUL': return 'text-purple-600 bg-purple-100';
      case 'DIV': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'operators', name: 'Par opération', icon: Calculator },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
    { id: 'insights', name: 'Insights IA', icon: Brain },
    { id: 'sessions', name: 'Sessions', icon: Clock },
    { id: 'comparison', name: 'Comparaison', icon: Users }
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Statistiques CubeMatch
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Analysez vos performances et découvrez vos patterns de jeu
          </p>
        </div>

        {/* Filtres temporels */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { value: 'week', label: '7 jours' },
              { value: 'month', label: '30 jours' },
              { value: 'all', label: 'Tout' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation par catégorie */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu par catégorie */}
        <div className="space-y-8">
          {activeCategory === 'overview' && (
            <OverviewCategory stats={stats} />
          )}
          
          {activeCategory === 'operators' && (
            <OperatorsCategory operatorStats={operatorStats} />
          )}
          
          {activeCategory === 'performance' && (
            <PerformanceCategory stats={stats} operatorStats={operatorStats} />
          )}
          
          {activeCategory === 'insights' && (
            <InsightsCategory insights={insights} />
          )}
          
          {activeCategory === 'sessions' && (
            <SessionsCategory />
          )}
          
          {activeCategory === 'comparison' && (
            <ComparisonCategory stats={stats} operatorStats={operatorStats} />
          )}
        </div>
      </div>
    </div>
  );
}

// Composant Vue d'ensemble
function OverviewCategory({ stats }: { stats: CubeMatchStats | null }) {
  if (!stats) return <div>Aucune donnée disponible</div>;

  const metrics = [
    {
      title: 'Parties jouées',
      value: stats.totalGames,
      icon: Activity,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Score total',
      value: formatScore(stats.totalScore),
      icon: Trophy,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Score moyen',
      value: Math.round(stats.averageScore),
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Meilleur score',
      value: formatScore(stats.bestScore),
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Temps total',
      value: formatTime(stats.totalTimePlayed),
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      title: 'Niveau max',
      value: stats.highestLevel,
      icon: Target,
      color: 'text-red-600 bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vue d'ensemble</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {metric.title}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant Par opération
function OperatorsCategory({ operatorStats }: { operatorStats: OperatorStats[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance par opération</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {operatorStats.map((op) => (
          <div key={op.operator} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg text-2xl font-bold ${getOperatorColor(op.operator)}`}>
                {getOperatorIcon(op.operator)}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(op.averageScore)}
                </div>
                <div className="text-sm text-gray-500">Score moyen</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Parties</div>
                <div className="text-lg font-semibold">{op.totalGames}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Précision</div>
                <div className="text-lg font-semibold">{op.accuracyRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Meilleur score</div>
                <div className="text-lg font-semibold">{formatScore(op.bestScore)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Niveau max</div>
                <div className="text-lg font-semibold">{op.highestLevel}</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 mb-2">Progression</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, op.accuracyRate)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant Performance
function PerformanceCategory({ stats, operatorStats }: { stats: CubeMatchStats | null, operatorStats: OperatorStats[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analyse de performance</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de progression */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Progression par opération</h3>
          <div className="space-y-4">
            {operatorStats.map((op) => (
              <div key={op.operator} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${getOperatorColor(op.operator)}`}>
                  {getOperatorIcon(op.operator)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Niveau {op.averageLevel.toFixed(1)}</span>
                    <span>{op.accuracyRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${op.accuracyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métriques de temps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Métriques de temps</h3>
          <div className="space-y-4">
            {operatorStats.map((op) => (
              <div key={op.operator} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-sm ${getOperatorColor(op.operator)}`}>
                    {getOperatorIcon(op.operator)}
                  </div>
                  <span className="text-sm">{op.operator}</span>
                </div>
                <div className="text-sm font-medium">
                  {formatTime(op.averageTimePerGame)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Insights IA
function InsightsCategory({ insights }: { insights: GameInsights | null }) {
  if (!insights) return <div>Aucun insight disponible</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Insights IA</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forces */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Vos forces</h3>
          </div>
          <div className="space-y-2">
            {insights.strengthAreas.map((area, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Axes d'amélioration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Axes d'amélioration</h3>
          </div>
          <div className="space-y-2">
            {insights.improvementAreas.map((area, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Recommandations</h3>
          </div>
          <div className="space-y-2">
            {insights.recommendedOperators.map((op, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Pratiquer {op}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Scores de progression</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progression</span>
                <span>{insights.progressScore.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${insights.progressScore}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Consistance</span>
                <span>{insights.consistencyScore.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${insights.consistencyScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Sessions
function SessionsCategory() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions de jeu</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-gray-500">Fonctionnalité en cours de développement...</p>
      </div>
    </div>
  );
}

// Composant Comparaison
function ComparisonCategory({ stats, operatorStats }: { stats: CubeMatchStats | null, operatorStats: OperatorStats[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comparaison</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-gray-500">Fonctionnalité en cours de développement...</p>
      </div>
    </div>
  );
}
