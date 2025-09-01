import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { trackingAPI } from '@/lib/api';

interface TrackingConfig {
  trackClicks?: boolean;
  trackInputs?: boolean;
  trackNavigation?: boolean;
  trackPerformance?: boolean;
  trackPrompts?: boolean;
}

export const useTracking = (config: TrackingConfig = {}) => {
  // Désactiver le tracking en développement pour éviter les erreurs
  if (process.env.NODE_ENV === 'development') {
    return {
      trackClick: () => {},
      trackInput: () => {},
      trackPrompt: () => {},
      trackMetric: () => {},
      startNavigationSession: () => Promise.resolve(),
      endNavigationSession: () => Promise.resolve()
    };
  }

  const router = useRouter();
  const pathname = usePathname();
  const navigationSessionId = useRef<string | null>(null);
  const sessionStartTime = useRef<number>(Date.now());

  const {
    trackClicks = true,
    trackInputs = true,
    trackNavigation = true,
    trackPerformance = true,
    trackPrompts = true
  } = config;

    // Démarrer une session de navigation
  const startNavigationSession = useCallback(async () => {
    if (trackNavigation) {
      try {
        const session = await trackingAPI.startNavigationSession({
          initialPage: pathname,
          sessionData: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        });
        if (session) {
          navigationSessionId.current = session.id;
        }
      } catch (error) {
        console.warn('Erreur lors du démarrage de la session de navigation:', error);
      }
    }
  }, [trackNavigation, pathname]);

  // Terminer la session de navigation
  const endNavigationSession = useCallback(async () => {
    if (trackNavigation && navigationSessionId.current) {
      try {
        await trackingAPI.endNavigationSession(navigationSessionId.current);
        navigationSessionId.current = null;
      } catch (error) {
        console.warn('Erreur lors de la terminaison de la session de navigation:', error);
      }
    }
  }, [trackNavigation]);

  // Tracker un clic
  const trackClick = useCallback((event: MouseEvent) => {
    if (!trackClicks) return;

    const target = event.target as HTMLElement;
    const elementId = target.id || target.getAttribute('data-id');
    const elementName = target.tagName.toLowerCase();
    const elementValue = target.textContent?.trim() || target.getAttribute('value') || '';

    trackingAPI.trackInteraction({
      interactionType: 'CLICK',
      elementType: getElementType(target),
      elementId: elementId || undefined,
      elementName,
      elementValue,
      pageUrl: pathname,
      pageTitle: document.title,
      sessionDuration: Date.now() - sessionStartTime.current,
      metadata: {
        x: event.clientX,
        y: event.clientY,
        button: event.button
      }
    });
  }, [trackClicks, pathname]);

  // Tracker un input
  const trackInput = useCallback((event: Event) => {
    if (!trackInputs) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const elementId = target.id || target.getAttribute('data-id');
    const elementName = target.tagName.toLowerCase();
    const elementValue = target.value;

    trackingAPI.trackInteraction({
      interactionType: 'INPUT',
      elementType: getElementType(target),
      elementId: elementId || undefined,
      elementName,
      elementValue,
      pageUrl: pathname,
      pageTitle: document.title,
      sessionDuration: Date.now() - sessionStartTime.current,
      metadata: {
        inputType: target.type,
        maxLength: target.maxLength
      }
    });
  }, [trackInputs, pathname]);

  // Tracker un prompt
  const trackPrompt = useCallback((data: {
    promptType: string;
    content: string;
    context?: any;
    response?: string;
    responseTime?: number;
    tokensUsed?: number;
    modelUsed?: string;
    success?: boolean;
    errorMessage?: string;
  }) => {
    if (!trackPrompts) return;

    trackingAPI.trackPrompt(data);
  }, [trackPrompts]);

  // Tracker une métrique de performance
  const trackMetric = useCallback((data: {
    metricType: string;
    value: number;
    unit?: string;
    context?: any;
  }) => {
    if (!trackPerformance) return;

    trackingAPI.trackMetric(data);
  }, [trackPerformance]);

  // Déterminer le type d'élément
  const getElementType = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';

    if (tagName === 'button' || className.includes('btn') || id.includes('btn')) return 'BUTTON';
    if (tagName === 'input') return 'INPUT';
    if (tagName === 'textarea') return 'TEXTAREA';
    if (tagName === 'select') return 'SELECT';
    if (tagName === 'a' || className.includes('link') || id.includes('link')) return 'LINK';
    if (className.includes('tab') || id.includes('tab')) return 'TAB';
    if (className.includes('card') || id.includes('card')) return 'CARD';
    if (className.includes('modal') || id.includes('modal')) return 'MODAL';
    if (className.includes('sidebar') || id.includes('sidebar')) return 'SIDEBAR';
    if (className.includes('header') || id.includes('header')) return 'HEADER';
    if (className.includes('footer') || id.includes('footer')) return 'FOOTER';
    if (className.includes('nav') || id.includes('nav')) return 'NAVIGATION';
    if (tagName === 'form' || className.includes('form')) return 'FORM';
    if (className.includes('chat') || id.includes('chat')) return 'CHAT_INPUT';
    if (className.includes('ai') || id.includes('ai')) return 'AI_RESPONSE';
    if (className.includes('exercise') || id.includes('exercise')) return 'EXERCISE';
    if (className.includes('game') || id.includes('game')) return 'GAME';

    return 'OTHER';
  };

  // Initialisation du tracking
  useEffect(() => {
    // Démarrer la session de navigation
    startNavigationSession();

    // Tracker les clics
    if (trackClicks) {
      document.addEventListener('click', trackClick);
    }

    // Tracker les inputs
    if (trackInputs) {
      document.addEventListener('input', trackInput);
      document.addEventListener('change', trackInput);
    }

    // Tracker les métriques de performance
    if (trackPerformance) {
              // Temps de chargement de la page
        if (typeof window !== 'undefined') {
          window.addEventListener('load', () => {
            const loadTime = performance.now();
            trackMetric({
              metricType: 'LOAD_TIME',
              value: loadTime,
              unit: 'ms',
              context: { page: pathname }
            });
          });

        // Temps de réponse des requêtes
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const startTime = performance.now();
          try {
            const response = await originalFetch(...args);
            const endTime = performance.now();
            trackMetric({
              metricType: 'RESPONSE_TIME',
              value: endTime - startTime,
              unit: 'ms',
              context: { url: args[0] }
            });
            return response;
          } catch (error) {
            const endTime = performance.now();
            trackMetric({
              metricType: 'ERROR_RATE',
              value: 1,
              unit: 'count',
              context: { url: args[0], error: error instanceof Error ? error.message : String(error) }
            });
            throw error;
          }
        };
      }
    }

    // Nettoyage lors du démontage
    return () => {
      if (trackClicks) {
        document.removeEventListener('click', trackClick);
      }
      if (trackInputs) {
        document.removeEventListener('input', trackInput);
        document.removeEventListener('change', trackInput);
      }
      endNavigationSession();
    };
  }, [trackClicks, trackInputs, trackPerformance, trackNavigation, startNavigationSession, endNavigationSession, trackClick, trackInput]);

  // Tracker les changements de route
  useEffect(() => {
    if (trackNavigation && navigationSessionId.current) {
      trackingAPI.updateNavigationSession(navigationSessionId.current, {
        pageUrl: pathname,
        actionPerformed: true,
        sessionData: {
          currentPage: pathname,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [pathname, trackNavigation]);

  // Tracker la fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      endNavigationSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endNavigationSession]);

  return {
    trackClick,
    trackInput,
    trackPrompt,
    trackMetric,
    startNavigationSession,
    endNavigationSession
  };
};
