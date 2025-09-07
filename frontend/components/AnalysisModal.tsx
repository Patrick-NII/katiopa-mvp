'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Copy, 
  Printer, 
  Share2, 
  ThumbsUp, 
  Download, 
  Trash2,
  MessageCircle,
  Star,
  Clock,
  User
} from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: {
    type: 'compte_rendu' | 'appreciation' | 'conseils' | 'vigilance';
    content: string;
    timestamp: Date;
    sessionId: string;
    childName?: string;
  };
  onSave?: (analysis: any) => void;
  onDelete?: (analysisId: string) => void;
  onLike?: (analysisId: string) => void;
  onFavorite?: (analysisId: string) => void;
  onDialogue?: (analysisId: string) => void;
  isLiked?: boolean;
  isFavorite?: boolean;
  canDialogue?: boolean;
}

export default function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  onSave,
  onDelete,
  onLike,
  onFavorite,
  onDialogue,
  isLiked = false,
  isFavorite = false,
  canDialogue = false
}: AnalysisModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueMessage, setDialogueMessage] = useState('');
  const [actionStates, setActionStates] = useState<{[key: string]: boolean}>({});
  const [buttonAnimations, setButtonAnimations] = useState<{[key: string]: 'success' | 'error' | null}>({});

  // Fonction pour jouer un son de confirmation
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio non disponible');
    }
  };

  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('Audio non disponible');
    }
  };

  // Fonction pour animer un bouton
  const animateButton = (action: string, type: 'success' | 'error') => {
    setButtonAnimations(prev => ({ ...prev, [action]: type }));
    
    if (type === 'success') {
      playSuccessSound();
    } else {
      playErrorSound();
    }
    
    setTimeout(() => {
      setButtonAnimations(prev => ({ ...prev, [action]: null }));
    }, 1500);
  };

  // Fonction pour gérer les états des actions
  const setActionState = (action: string, isLoading: boolean) => {
    setActionStates(prev => ({ ...prev, [action]: isLoading }));
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return '';
      case 'appreciation':
        return '🎯';
      case 'conseils':
        return '';
      case 'vigilance':
        return '';
      default:
        return '';
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return 'Compte Rendu';
      case 'appreciation':
        return 'Points Forts & Améliorations';
      case 'conseils':
        return 'Meilleurs Moments pour Apprendre';
      case 'vigilance':
        return 'Vigilance & Alertes';
      default:
        return 'Analyse';
    }
  };

  const handleSave = async () => {
    try {
      setActionState('save', true);
      
      const response = await fetch('/api/analyses/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: analysis.sessionId,
          analysisType: analysis.type,
          content: analysis.content,
          prompt: `Analyse ${analysis.type} pour ${analysis.childName}`,
          context: {
            childName: analysis.childName,
            timestamp: analysis.timestamp,
            type: analysis.type
          },
          metadata: {
            savedAt: new Date().toISOString(),
            source: 'dashboard_modal'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      
      if (result.success) {
        animateButton('save', 'success');
        playSuccessSound();
        
        // Appeler la fonction onSave si elle existe
        if (onSave) {
          onSave(result.analysis);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      animateButton('save', 'error');
      playErrorSound();
    } finally {
      setActionState('save', false);
    }
  };

  const handleCopy = async () => {
    try {
      setActionState('copy', true);
      await navigator.clipboard.writeText(analysis.content);
      setIsCopied(true);
      animateButton('copy', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      animateButton('copy', 'error');
    } finally {
      setActionState('copy', false);
    }
  };

  const handlePrint = () => {
    try {
      setActionState('print', true);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Analyse Bubix - ${getTypeTitle(analysis.type)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #3B82F6; padding-bottom: 10px; margin-bottom: 20px; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${getTypeTitle(analysis.type)}</h1>
                <p><strong>Enfant:</strong> ${analysis.childName || 'Non spécifié'}</p>
                <p><strong>Date:</strong> ${analysis.timestamp.toLocaleString('fr-FR')}</p>
              </div>
              <div class="content">
                ${analysis.content.replace(/\n/g, '<br>')}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        animateButton('print', 'success');
      }
    } catch (error) {
      animateButton('print', 'error');
    } finally {
      setActionState('print', false);
    }
  };

  // Composant de bouton animé
  const AnimatedButton = ({ 
    action, 
    onClick, 
    disabled, 
    children, 
    className, 
    title 
  }: {
    action: string;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className: string;
    title: string;
  }) => {
    const animation = buttonAnimations[action];
    const isLoading = actionStates[action];
    
    return (
      <motion.button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={className}
        title={title}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: animation === 'success' ? [1, 1.1, 1] : 1,
          backgroundColor: animation === 'success' ? ['#dbeafe', '#3b82f6', '#dbeafe'] : undefined,
        }}
        transition={{
          duration: animation === 'success' ? 0.6 : 0.1,
          times: animation === 'success' ? [0, 0.5, 1] : undefined,
        }}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Analyse Bubix - ${getTypeTitle(analysis.type)}`,
          text: analysis.content,
          url: window.location.href
        });
      } catch (err) {
        console.error('Erreur lors du partage:', err);
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Share
      handleCopy();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([analysis.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-bubix-${analysis.type}-${analysis.timestamp.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDialogue = () => {
    if (dialogueMessage.trim()) {
      // Ici on pourrait envoyer le message à Bubix pour une réponse
      console.log('Message envoyé à Bubix:', dialogueMessage);
      setDialogueMessage('');
      setShowDialogue(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(analysis.type)}</span>
                  <div>
                    <h2 className="text-xl font-bold">{getTypeTitle(analysis.type)}</h2>
                    <div className="flex items-center gap-4 text-sm text-blue-100">
                      <div className="flex items-center gap-1 text-white">
                        <User className="w-4 h-4 text-white" />
                        {analysis.childName || 'Enfant'}
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <Clock className="w-4 h-4" />
                        {analysis.timestamp.toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {analysis.content}
                </div>
              </div>
            </div>

            {/* Actions du modal - Réorganisées par logique d'utilisation */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex items-center justify-center gap-8">
                {/* Actions principales - Sauvegarde et export */}
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    action="save"
                    onClick={handleSave}
                    className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Sauvegarder"
                  >
                    <Save className="w-5 h-5" />
                  </AnimatedButton>
                  
                  <AnimatedButton
                    action="download"
                    onClick={handleDownload}
                    className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5" />
                  </AnimatedButton>
                </div>

                {/* Séparateur visuel */}
                <div className="w-px h-8 bg-gray-300"></div>

                {/* Actions de partage et communication */}
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    action="copy"
                    onClick={handleCopy}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isCopied 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                    title={isCopied ? 'Copié!' : 'Copier'}
                  >
                    <Copy className="w-5 h-5" />
                  </AnimatedButton>
                  
                  <AnimatedButton
                    action="share"
                    onClick={handleShare}
                    className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Partager"
                  >
                    <Share2 className="w-5 h-5" />
                  </AnimatedButton>
                  
                  <AnimatedButton
                    action="print"
                    onClick={handlePrint}
                    className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Imprimer"
                  >
                    <Printer className="w-5 h-5" />
                  </AnimatedButton>
                </div>

                {/* Séparateur visuel */}
                <div className="w-px h-8 bg-gray-300"></div>

                {/* Actions d'interaction et feedback */}
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    action="like"
                    onClick={() => {
                      onLike?.(analysis.sessionId);
                      animateButton('like', 'success');
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isLiked 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                    title={isLiked ? 'Retirer le like' : 'J\'aime'}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </AnimatedButton>
                  
                  <AnimatedButton
                    action="favorite"
                    onClick={() => {
                      onFavorite?.(analysis.sessionId);
                      animateButton('favorite', 'success');
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isFavorite 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Star className="w-5 h-5" />
                  </AnimatedButton>
                  
                  {canDialogue && (
                    <AnimatedButton
                      action="dialogue"
                      onClick={() => {
                        setShowDialogue(true);
                        animateButton('dialogue', 'success');
                      }}
                      className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Dialogue Bubix Pro"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </AnimatedButton>
                  )}
                </div>

                {/* Séparateur visuel */}
                <div className="w-px h-8 bg-gray-300"></div>

                {/* Action de suppression (isolée pour éviter les clics accidentels) */}
                <div className="flex items-center gap-4">
                  <AnimatedButton
                    action="delete"
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
                        onDelete?.(analysis.sessionId);
                        animateButton('delete', 'success');
                      }
                    }}
                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </AnimatedButton>
                </div>
              </div>
            </div>

            {/* Modal de dialogue Bubix Pro */}
            {showDialogue && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Dialogue avec Bubix Pro</h3>
                  <textarea
                    value={dialogueMessage}
                    onChange={(e) => setDialogueMessage(e.target.value)}
                    placeholder="Posez votre question à Bubix..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowDialogue(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDialogue}
                      disabled={!dialogueMessage.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
