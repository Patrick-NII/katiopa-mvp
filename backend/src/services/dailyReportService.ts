import { PrismaClient } from '@prisma/client';
import { EmailService } from './emailService';
import { EmailLoggingService } from './emailLoggingService';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service de génération des rapports quotidiens automatisés
 */
export class DailyReportService {
  /**
   * Prompt système pour l'IA
   */
  private static readonly SYSTEM_PROMPT = `Tu es un tuteur pédagogique bienveillant. Tu écris un compte rendu quotidien
à destination des parents. Cible: enfant 5–7 ans. Style: clair, positif,
concis, orienté actions concrètes (2–3 conseils max). Jamais culpabilisant.
Pas d'emoji. Pas d'exagération. Pas de jargon.`;

  /**
   * Génère et envoie les rapports quotidiens pour une date donnée
   */
  static async generateAndSendDailyReports(targetDate: Date = new Date()) {
    console.log(`📊 Démarrage de la génération des rapports quotidiens pour ${targetDate.toISOString().split('T')[0]}`);

    try {
      // Calculer les statistiques pour la date
      await this.calculateDailyStats(targetDate);

      // Récupérer toutes les sessions avec consentement email
      const sessions = await prisma.userSession.findMany({
        where: {
          consentEmail: true,
          emailFrequency: { in: ['daily', 'weekly'] }
        },
        include: {
          sessionStats: {
            where: {
              date: targetDate
            }
          },
          account: {
            include: {
              reportPreferences: true
            }
          }
        }
      });

      console.log(`📧 ${sessions.length} sessions à traiter`);

      for (const session of sessions) {
        try {
          await this.generateAndSendReportForSession(session, targetDate);
        } catch (error) {
          console.error(`❌ Erreur pour la session ${session.id}:`, error);
        }
      }

      console.log('✅ Génération des rapports quotidiens terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la génération des rapports:', error);
      throw error;
    }
  }

  /**
   * Génère et envoie un rapport pour une session spécifique
   */
  static async generateAndSendReportForSession(session: any, targetDate: Date) {
    const stats = session.sessionStats[0];
    
    if (!stats || stats.totalTimeMin === 0) {
      console.log(`⏭️ Pas d'activité pour ${session.childNickname} le ${targetDate.toISOString().split('T')[0]}`);
      return;
    }

    // Préparer les données pour l'IA
    const reportData = {
      child_nickname: session.childNickname,
      child_age: session.childAge,
      date_iso: targetDate.toISOString().split('T')[0],
      date_fr: targetDate.toLocaleDateString('fr-FR'),
      kpi_assiduite: Math.round(stats.kpiAssiduite),
      kpi_comprehension: Math.round(stats.kpiComprehension),
      kpi_progression: Math.round(stats.kpiProgression),
      total_time_min: stats.totalTimeMin,
      sessions_count: stats.sessionsCount,
      best_module: stats.bestModule || 'Aucun module testé',
      needs_help: stats.needsHelp || 'Aucun module en difficulté',
      consecutive_days: stats.consecutiveDays,
      focus_score: Math.round(stats.focusScore),
      goals_json: JSON.stringify(session.goals)
    };

    // Générer le contenu avec l'IA
    const reportContent = await this.generateReportContent(reportData);

    // Créer le rapport dans la base de données
    const report = await prisma.dailyReport.create({
      data: {
        sessionId: session.id,
        date: targetDate,
        subject: `CubeAI — Bilan du jour pour ${session.childNickname} (${reportData.date_fr})`,
        htmlContent: this.buildEmailHTML(reportContent, reportData),
        textContent: this.buildEmailText(reportContent, reportData),
        modelUsed: 'gpt-4',
        promptUsed: this.buildUserPrompt(reportData),
        kpisSnapshot: reportData,
        parentEmail: session.parentEmail,
        status: 'pending'
      }
    });

    // Envoyer l'email
    try {
      await EmailLoggingService.sendAndLogEmail('noreply', {
        to: session.parentEmail,
        subject: report.subject,
        html: report.htmlContent,
        text: report.textContent
      });

      // Mettre à jour le statut
      await prisma.dailyReport.update({
        where: { id: report.id },
        data: { status: 'sent' }
      });

      console.log(`✅ Rapport envoyé pour ${session.childNickname}`);
    } catch (error) {
      await prisma.dailyReport.update({
        where: { id: report.id },
        data: { 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      throw error;
    }
  }

  /**
   * Génère le contenu du rapport avec l'IA
   */
  static async generateReportContent(data: any): Promise<string> {
    const userPrompt = this.buildUserPrompt(data);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: this.SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return completion.choices[0].message.content || this.generateFallbackReport(data);
    } catch (error) {
      console.error('❌ Erreur IA, utilisation du rapport de fallback:', error);
      return this.generateFallbackReport(data);
    }
  }

  /**
   * Construit le prompt utilisateur pour l'IA
   */
  private static buildUserPrompt(data: any): string {
    return `Données du jour (format JSON):
- Enfant: ${data.child_nickname}, ${data.child_age} ans
- Date: ${data.date_iso}
- KPIs:
  - assiduite: ${data.kpi_assiduite}/100
  - comprehension: ${data.kpi_comprehension}/100
  - progression: ${data.kpi_progression}/100
  - total_time_min: ${data.total_time_min} min
  - sessions_count: ${data.sessions_count}
- Modules:
  - best_module: ${data.best_module}
  - needs_help: ${data.needs_help}
- Objectifs parents (si fournis): ${data.goals_json}

Consignes rédactionnelles:
1) En-tête: "Bilan du jour — ${data.child_nickname}" + date.
2) 3 rubriques courtes:
   - Assiduité: phrase simple + fait chiffré.
   - Compréhension & progrès: 1–2 phrases + module fort/faible.
   - Conseils pour demain: 2 puces max, très concrètes (5–10 min).
3) 1 phrase d'encouragement final neutre.

Réponds en Markdown structuré (## titres, listes). 120–160 mots.`;
  }

  /**
   * Génère un rapport de fallback si l'IA est indisponible
   */
  private static generateFallbackReport(data: any): string {
    return `## Bilan du jour — ${data.child_nickname}

**Assiduité**
${data.child_nickname} a passé ${data.total_time_min} minutes aujourd'hui sur CubeAI. ${data.sessions_count} session${data.sessions_count > 1 ? 's' : ''} réalisée${data.sessions_count > 1 ? 's' : ''}.

**Compréhension & progrès**
Score moyen de ${data.kpi_comprehension}/100. ${data.best_module !== 'Aucun module testé' ? `Meilleur module : ${data.best_module}.` : ''}

**Conseils pour demain**
- Prévoir 10-15 minutes d'activité
- Encourager la régularité

Continuez à accompagner ${data.child_nickname} dans ses apprentissages !`;
  }

  /**
   * Construit le contenu HTML de l'email
   */
  static buildEmailHTML(content: string, data: any): string {
    const markdownToHTML = content
      .replace(/## (.*)/g, '<h2 style="color: #3b82f6; margin: 20px 0 10px 0; font-size: 18px;">$1</h2>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6;">')
      .replace(/\n- /g, '</p><p style="margin: 5px 0; line-height: 1.6;">• ')
      .replace(/\n/g, '<br>');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bilan du jour - ${data.child_nickname}</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 12px 12px 0 0;
            }
            .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .title {
                font-size: 1.8rem;
                margin-bottom: 10px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .stat-card {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid #3b82f6;
            }
            .stat-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #3b82f6;
            }
            .stat-label {
                font-size: 0.9rem;
                color: #6b7280;
                margin-top: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 0.9rem;
            }
            .unsubscribe {
                margin-top: 15px;
                font-size: 0.8rem;
            }
            .unsubscribe a {
                color: #6b7280;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">CubeAI</div>
            <div class="title">Bilan du jour</div>
            <p>${data.date_fr}</p>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.total_time_min} min</div>
                    <div class="stat-label">Temps total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.kpi_comprehension}%</div>
                    <div class="stat-label">Compréhension</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.kpi_progression}%</div>
                    <div class="stat-label">Progression</div>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                ${markdownToHTML}
            </div>
            
            <div class="footer">
                <p>© 2024 CubeAI. Tous droits réservés.</p>
                <div class="unsubscribe">
                    <a href="${process.env.FRONTEND_URL || 'https://cube-ai.fr'}/unsubscribe?email=${encodeURIComponent(data.parent_email)}">Se désinscrire</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Construit le contenu texte de l'email
   */
  static buildEmailText(content: string, data: any): string {
    return `CubeAI - Bilan du jour pour ${data.child_nickname} (${data.date_fr})

${content}

---
© 2024 CubeAI. Tous droits réservés.
Se désinscrire: ${process.env.FRONTEND_URL || 'https://cube-ai.fr'}/unsubscribe?email=${encodeURIComponent(data.parent_email)}`;
  }

  /**
   * Calcule les statistiques journalières
   */
  private static async calculateDailyStats(targetDate: Date) {
    try {
      await prisma.$executeRaw`SELECT calculate_daily_stats(${targetDate})`;
      console.log(`📊 Statistiques calculées pour ${targetDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupère les rapports d'une session
   */
  static async getSessionReports(sessionId: string, limit: number = 10) {
    return await prisma.dailyReport.findMany({
      where: { sessionId },
      orderBy: { date: 'desc' },
      take: limit
    });
  }

  /**
   * Met à jour les préférences de rapport
   */
  static async updateReportPreferences(accountId: string, preferences: {
    frequency?: string;
    preferredTime?: string;
    domains?: string[];
    includeGoals?: boolean;
    includeAdvice?: boolean;
    includeStats?: boolean;
  }) {
    return await prisma.reportPreference.upsert({
      where: { accountId },
      update: preferences,
      create: {
        accountId,
        ...preferences
      }
    });
  }

  /**
   * Désactive les rapports pour une session
   */
  static async disableReports(sessionId: string) {
    return await prisma.userSession.update({
      where: { id: sessionId },
      data: { consentEmail: false }
    });
  }
}
