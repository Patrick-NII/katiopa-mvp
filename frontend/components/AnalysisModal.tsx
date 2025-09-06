'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Copy, 
  Printer, 
  Share2, 
  Heart, 
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return '📊';
      case 'appreciation':
        return '🎯';
      case 'conseils':
        return '⏰';
      case 'vigilance':
        return '👁️';
      default:
        return '📝';
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysis.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const handlePrint = () => {
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
    }
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
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {analysis.childName || 'Enfant'}
                      </div>
                      <div className="flex items-center gap-1">
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
                  <X className="w-6 h-6" />
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

            {/* Actions du modal */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Actions principales */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSave?.(analysis)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                  
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isCopied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {isCopied ? 'Copié!' : 'Copier'}
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager
                  </button>
                </div>

                {/* Actions secondaires */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLike?.(analysis.sessionId)}
                    className={`p-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onFavorite?.(analysis.sessionId)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {canDialogue && (
                    <button
                      onClick={() => setShowDialogue(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Dialogue Bubix Pro
                    </button>
                  )}
                  
                  <button
                    onClick={() => onDelete?.(analysis.sessionId)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
