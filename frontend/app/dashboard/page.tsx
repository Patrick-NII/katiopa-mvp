'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SidebarNavigation from '@/components/SidebarNavigation';
import DashboardTab from '@/components/DashboardTab';
import StatisticsTab from '@/components/StatisticsTab';
import { ProfileTab } from '@/components/ProfileTab';
import { SubscriptionTab } from '@/components/SubscriptionTab';
import { BillingTab } from '@/components/BillingTab';
import FamilyMembersTab from '@/components/FamilyMembersTab';
import CubeAIExperiencesTab from '@/components/CubeAIExperiencesTab';
import ChatbotWrapper from '@/components/chatbot/ChatbotWrapper';
import KidsGamesTab from '@/components/kids/KidsGamesTab';
import KidsSettingsTab from '@/components/kids/KidsSettingsTab';
import UserHeader from '@/components/UserHeader';
import SettingsTab from '@/components/SettingsTab';
import { authAPI, statsAPI } from '@/lib/api';

// Import des nouvelles pages des cubes
import MathCubePage from './mathcube/page';
import CodeCubePage from './codecube/page';
import PlayCubePage from './playcube/page';
import ScienceCubePage from './sciencecube/page';
import DreamCubePage from './dreamcube/page';
import ComCubePage from './comcube/page';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chargement des données
  const loadData = async () => {
    try {
      // Récupération de l'utilisateur connecté
      const userResponse = await authAPI.verify();
      if (userResponse.success) {
        setUser(userResponse.user);
        if (userResponse.user.userType === 'CHILD') {
          setActiveTab('experiences');
        }
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

  // Fonction pour rendre le contenu des onglets
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab user={user} summary={summary} />;
      case 'statistiques':
        return <StatisticsTab user={user} summary={summary} />;
      case 'experiences':
        return <CubeAIExperiencesTab
          userType={user?.userType || 'PARENT'}
          userSubscriptionType={user?.subscriptionType || 'FREE'}
          firstName={user?.firstName || ''}
          lastName={user?.lastName || ''}
        />;
      case 'mathcube':
        return <MathCubePage />;
      case 'codecube':
        return <CodeCubePage />;
      case 'playcube':
        return <PlayCubePage />;
      case 'sciencecube':
        return <ScienceCubePage />;
      case 'dreamcube':
        return <DreamCubePage />;
      case 'comcube':
        return <ComCubePage />;
      case 'informations':
        return <ProfileTab user={user} />;
      case 'abonnements':
        return <SubscriptionTab user={user} />;
      case 'family-members':
        return <FamilyMembersTab user={user} />;
      case 'facturation':
        return <BillingTab user={user} />;
      case 'reglages':
        return <SettingsTab userType={user.userType as any} />;
      case 'aide':
        return <div className="p-6">Page d'aide et support</div>;
      default:
        return <DashboardTab user={user} summary={summary} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête utilisateur avec avatar */}
      <UserHeader 
        userType={user?.userType as any}
        subscriptionType={user?.subscriptionType}
      />

      {/* Sidebar de navigation */}
      <SidebarNavigation
        activeTab={activeTab as any}
        onTabChange={setActiveTab}
        userSubscriptionType={user?.subscriptionType || 'FREE'}
        userType={user?.userType as any}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        <main className="p-6">
          {ready ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {renderTabContent()}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          )}
        </main>
      </div>

      {/* Chatbot flottant */}
      <ChatbotWrapper />
    </div>
  );
} 
