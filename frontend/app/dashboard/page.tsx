'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SidebarNavigation from '@/components/SidebarNavigation';
import DashboardTab from '@/components/DashboardTab';
import StatisticsTab from '@/components/StatisticsTab';
import CubeAIExperiencesTab from '@/components/CubeAIExperiencesTab'
import { ProfileTab } from '@/components/ProfileTab';
import { SubscriptionTab } from '@/components/SubscriptionTab';
import { BillingTab } from '@/components/BillingTab';
import FamilyMembersTab from '@/components/FamilyMembersTab';
import { authAPI, statsAPI } from '@/lib/api';

interface User {
  id: string;
  sessionId: string;
  firstName: string;
  lastName: string;
  userType: string;
  subscriptionType: string;
}

interface Summary {
  totalTime: number;
  averageScore: number;
  totalActivities: number;
  domains: Array<{
    name: string;
    count: number;
    averageScore: number;
    activities: any[];
  }>;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ready, setReady] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Chargement des données
  const loadData = async () => {
    try {
      // Récupération de l'utilisateur connecté
      const userResponse = await authAPI.verify();
      if (userResponse.success) {
        setUser(userResponse.user);
      }

      // Récupération des statistiques
      try {
        const summaryData = await statsAPI.getSummary();
        setSummary(summaryData);
      } catch (error) {
        console.warn('⚠️ Impossible de charger les statistiques:', error);
        // Utiliser des données par défaut au lieu de null
        setSummary({
          totalTime: 0,
          averageScore: 0,
          totalActivities: 0,
          domains: []
        });
      }

      setReady(true);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setReady(false);
    }
  };

  // Envoi d'un message chat
  const sendChatMessage = async (message: string) => {
    if (!message.trim()) return;

    setChatLoading(true);
    setChatResponse('');

    try {
      // TODO: Implémenter l'API de chat
      // const response = await chatAPI.sendMessage(message);
      // setChatResponse(response.message);
      
      // Simulation temporaire
      setTimeout(() => {
        setChatResponse('Fonctionnalité de chat en cours de développement...');
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      setChatResponse('Erreur lors de l\'envoi du message');
      setChatLoading(false);
    }
  };

  // Chargement de l'historique du chat
  const loadChatHistory = async () => {
    try {
      // TODO: Implémenter l'API de récupération de l'historique
      // const history = await chatAPI.getHistory();
      // setChatHistory(history);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (ready) {
      loadChatHistory();
    }
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">Utilisateur non connecté</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'statistics', label: 'Statistiques', icon: '📈' },
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'subscription', label: 'Abonnements', icon: '💳' },
    { id: 'billing', label: 'Facturation', icon: '🧾' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            user={user}
            activities={[]}
            summary={summary as any}
            llmResponse={null}
            loading={false}
            focus={''}
            onFocusChange={() => {}}
            onEvaluateLLM={() => {}}
            onExerciseSelect={() => {}}
            onSendChatMessage={sendChatMessage}
            chatResponse={chatResponse}
            chatLoading={chatLoading}
            chatHistory={chatHistory}
            onLoadChatHistory={loadChatHistory}
          />
        );
      case 'statistiques':
        return <StatisticsTab user={user} activities={[]} summary={summary} />;
      case 'cubeai-experiences':
        return <CubeAIExperiencesTab />;
      case 'profile':
        return <ProfileTab user={user} />;
      case 'subscription':
        return <SubscriptionTab user={user} />;
      case 'billing':
        return <BillingTab user={user} />;
      case 'family-members':
        return <FamilyMembersTab />;
      default:
        return (
          <DashboardTab
            user={user}
            activities={[]}
            summary={summary as any}
            llmResponse={null}
            loading={false}
            focus={''}
            onFocusChange={() => {}}
            onEvaluateLLM={() => {}}
            onExerciseSelect={() => {}}
            onSendChatMessage={sendChatMessage}
            chatResponse={chatResponse}
            chatLoading={chatLoading}
            chatHistory={chatHistory}
            onLoadChatHistory={loadChatHistory}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation latérale */}
      <SidebarNavigation
        activeTab={activeTab as any}
        onTabChange={setActiveTab as any}
        userSubscriptionType={user.subscriptionType}
        userType={user.userType as any}
      />

      {/* Contenu principal */}
      <main className="flex-1 ml-64 p-6 min-h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 
