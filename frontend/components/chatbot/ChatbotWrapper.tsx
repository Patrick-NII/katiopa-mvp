'use client'
import dynamic from 'next/dynamic'

// Import dynamique du ChatBubble pour éviter les erreurs SSR
const ChatBubble = dynamic(() => import('./ChatBubble'), { 
  ssr: false,
  loading: () => {
    return (
      <div className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white">
        <div className="animate-pulse">💬</div>
      </div>
    )
  }
})

interface ChatbotWrapperProps {
  subscriptionType?: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  user?: {
    id: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    userType: string;
    subscriptionType: string;
  } | null;
  childSessions?: any[];
}

export default function ChatbotWrapper({ subscriptionType = 'FREE', user, childSessions }: ChatbotWrapperProps) {
  return <ChatBubble subscriptionType={subscriptionType} user={user} childSessions={childSessions} />
}
