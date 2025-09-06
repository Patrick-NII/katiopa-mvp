import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import mjml from 'mjml';
import mustache from 'mustache';

const prisma = new PrismaClient();

// Configuration des couleurs CubeAI
const CUBEAI_COLORS = {
  primary: '#6C5CE7',      // Violet principal
  secondary: '#A29BFE',    // Violet doux
  background: '#FCFCFD',   // Fond clair
  text: '#222222',         // Texte principal
  muted: '#666666',        // Texte secondaire
  light: '#F7F7FB',        // Fond clair pour cartes
  white: '#FFFFFF',        // Blanc
  success: '#10B981',      // Vert
  warning: '#F59E0B',      // Orange
  error: '#EF4444',        // Rouge
  colors: [
    '#3B82F6', // bleu ciel
    '#8B5CF6', // violet doux
    '#EC4899', // rose framboise
    '#10B981', // vert menthe
    '#F59E0B'  // orange pêche
  ]
};

// Configuration des emails par type
const EMAIL_CONFIGS = {
  noreply: {
    from: 'noreply@cube-ai.fr',
    replyTo: 'support@cube-ai.fr',
    name: 'CubeAI'
  },
  support: {
    from: 'support@cube-ai.fr',
    replyTo: 'support@cube-ai.fr',
    name: 'CubeAI Support'
  },
  hello: {
    from: 'hello@cube-ai.fr',
    replyTo: 'hello@cube-ai.fr',
    name: 'CubeAI'
  }
};

// Template MJML de base avec le logo CubeAI
const BASE_MJML_TEMPLATE = `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" />
      <mj-text font-size="14px" color="${CUBEAI_COLORS.text}" line-height="1.6" />
      <mj-button background-color="${CUBEAI_COLORS.primary}" color="${CUBEAI_COLORS.white}" inner-padding="10px 20px" border-radius="10px" font-weight="bold" />
    </mj-attributes>
    <mj-style inline="inline">
      .muted { color:${CUBEAI_COLORS.muted}; } 
      .small { font-size:12px;color:#777; }
      .card { border:1px solid #eee; border-radius:10px; padding:16px; background:${CUBEAI_COLORS.light}; }
      .mono { font-family: ui-monospace, Menlo, Consolas, "Courier New", monospace; }
      .kpi { display:inline-block; background:#F1F0FE; color:#4338CA; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
      .logo-c { color:${CUBEAI_COLORS.colors[0]}; }
      .logo-u { color:${CUBEAI_COLORS.colors[1]}; }
      .logo-b { color:${CUBEAI_COLORS.colors[2]}; }
      .logo-e { color:${CUBEAI_COLORS.colors[3]}; }
      .logo-a { color:${CUBEAI_COLORS.colors[4]}; }
      .logo-i { color:${CUBEAI_COLORS.colors[0]}; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${CUBEAI_COLORS.background}">
    <mj-section background-color="${CUBEAI_COLORS.primary}" padding="12px 0">
      <mj-column>
        <mj-text align="center" color="${CUBEAI_COLORS.white}" font-weight="700" font-size="24px">
          <span class="logo-c">C</span><span class="logo-u">u</span><span class="logo-b">b</span><span class="logo-e">e</span><span class="logo-a">A</span><span class="logo-i">I</span>
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="${CUBEAI_COLORS.white}" padding="20px">
      <mj-column>
        {{content}}
      </mj-column>
    </mj-section>

    <mj-section background-color="${CUBEAI_COLORS.primary}" padding="14px 0">
      <mj-column>
        <mj-text align="center" color="${CUBEAI_COLORS.white}" font-size="12px">© {{year}} CubeAI — Tous droits réservés</mj-text>
        <mj-text align="center" color="#E6E3FF" font-size="12px">
          <a href="{{legal_url}}" style="color:${CUBEAI_COLORS.white};text-decoration:none;">Mentions légales</a> •
          <a href="{{privacy_url}}" style="color:${CUBEAI_COLORS.white};text-decoration:none;">Confidentialité</a>
          {{#manage_link}} • <a href="{{manage_link}}" style="color:${CUBEAI_COLORS.white};text-decoration:none;">Préférences emails</a>{{/manage_link}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

// Templates spécifiques pour chaque type d'email
const EMAIL_TEMPLATES = {
  // A. Création de compte (parent)
  account_creation: {
    subject: 'CubeAI — Votre compte parent est prêt ({{account_id}})',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Bienvenue sur CubeAI</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>
      <mj-spacer height="8px" />
      <mj-text>Bonjour {{parent_full_name}},</mj-text>
      <mj-text>Votre compte a bien été créé. Configurez vos sessions enfant, objectifs d'apprentissage et préférences d'email.</mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Informations destinataire</mj-text>
      <mj-text class="card">
        <span class="mono">Email :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}<br/>
        <span class="mono">Fuseau horaire :</span> {{timezone}}
      </mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Sessions enfant</mj-text>
      <mj-table>
        <tr style="background:${CUBEAI_COLORS.light}; font-weight:600;">
          <th align="left">ID Session</th><th align="left">Prénom</th><th align="left">Nom</th><th align="left">Âge</th>
        </tr>
        {{#sessions}}
        <tr><td class="mono">{{id}}</td><td>{{first_name}}</td><td>{{last_name}}</td><td>{{age}}</td></tr>
        {{/sessions}}
      </mj-table>

      <mj-spacer height="12px" />
      <mj-button href="{{parent_dashboard_url}}">Ouvrir le tableau de bord parent</mj-button>
      <mj-text class="small">Besoin d'aide ? support@cube-ai.fr</mj-text>
    `,
    text: `
Bienvenue sur CubeAI
{{today_fr}}

Bonjour {{parent_full_name}},

Votre compte a bien été créé. Configurez vos sessions enfant, objectifs d'apprentissage et préférences d'email.

INFORMATIONS DESTINATAIRE
Email : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}
Fuseau horaire : {{timezone}}

SESSIONS ENFANT
{{#sessions}}
- {{id}} : {{first_name}} {{last_name}} ({{age}} ans)
{{/sessions}}

Ouvrir le tableau de bord parent : {{parent_dashboard_url}}

Besoin d'aide ? support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Préférences emails : {{manage_link}}
    `
  },

  // B. Bilan quotidien enfant
  daily_report: {
    subject: 'CubeAI — Bilan du jour pour {{child_nickname}} ({{today_fr}})',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Bilan du jour — {{child_nickname}}</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text class="card">
        <b>Destinataire</b><br/>
        <span class="mono">Email :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}<br/>
        <span class="mono">Session :</span> {{session_id}} ({{child_first_name}} {{child_last_name}}, {{child_age}} ans)
      </mj-text>

      <mj-spacer height="8px" />
      <mj-text>
        <span class="kpi">Assiduité {{kpi_assiduite}}/100</span>
        &nbsp;<span class="kpi">Compréhension {{kpi_comprehension}}/100</span>
        &nbsp;<span class="kpi">Progression {{kpi_progression}}/100</span>
      </mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Résumé</mj-text>
      <mj-text>{{report_text}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text class="small">
        Préférences emails : <a href="{{manage_link}}">gérer ici</a> •
        Désinscription : <a href="{{unsubscribe_link}}">se désinscrire</a>
      </mj-text>
    `,
    text: `
Bilan du jour — {{child_nickname}}
{{today_fr}}

DESTINATAIRE
Email : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}
Session : {{session_id}} ({{child_first_name}} {{child_last_name}}, {{child_age}} ans)

KPIs : Assiduité {{kpi_assiduite}}/100, Compréhension {{kpi_comprehension}}/100, Progression {{kpi_progression}}/100

RÉSUMÉ
{{report_text}}

Préférences emails : {{manage_link}}
Désinscription : {{unsubscribe_link}}

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
    `
  },

  // D. Inscription — Email de bienvenue avec détails du plan
  account_creation_enhanced: {
    subject: 'CubeAI — Bienvenue {{firstName}} ! Votre compte {{subscriptionType}} est prêt',
    mjml: `
      <mj-text font-size="24px" font-weight="600" color="#1F2937" font-family="Fredoka, Arial, sans-serif" padding-bottom="20px">
        🎉 Bienvenue {{firstName}} !
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        Félicitations ! Votre compte CubeAI a été créé avec succès. Vous faites maintenant partie de la révolution de l'éducation intelligente pour les enfants de 5 à 7 ans.
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        📋 Votre plan d'abonnement {{subscriptionType}}
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Plan :</strong> {{subscriptionType}}<br>
        <strong>Prix :</strong> {{price}}/mois<br>
        <strong>Sessions incluses :</strong> {{maxSessions}} session(s) simultanée(s)<br>
        <strong>Mode de paiement :</strong> {{paymentMethod}}<br>
        <strong>Cycle de facturation :</strong> {{billingCycle}}
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="15px">
        ⏰ Informations importantes sur votre période d'essai
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>{{trialDetails.startMessage}}</strong><br>
        <strong>Début de l'essai :</strong> {{trialStartDate}}<br>
        <strong>Fin de l'essai :</strong> {{trialEndDate}}<br>
        <strong>Première facturation :</strong> {{firstBillingDate}}<br>
        <strong>Montant après essai :</strong> {{monthlyPrice}}/mois
      </mj-text>

      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px" style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B;">
        <strong>⚠️ Important :</strong> {{trialDetails.endMessage}}<br>
        <strong>💡 Bonne nouvelle :</strong> {{trialDetails.cancellation}}
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="20px" padding-bottom="10px">
        ✨ Fonctionnalités incluses dans votre plan :
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="15px">
        {{#features}}
        • {{.}}<br>
        {{/features}}
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="10px">
        🔐 Vos informations de connexion
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px">
        <strong>ID de session parent :</strong> {{parentSessionId}}<br>
        <strong>ID de session enfant :</strong> {{childSessionId}}<br>
        <strong>Mot de passe :</strong> Celui que vous avez choisi lors de l'inscription
      </mj-text>

      <mj-button background-color="#3B82F6" color="#FFFFFF" font-size="16px" font-weight="600" href="{{loginUrl}}" padding="15px 30px" border-radius="8px" align="center">
        🚀 Commencer l'aventure
      </mj-button>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        📝 Prochaines étapes
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        1. <strong>Connectez-vous</strong> avec vos identifiants<br>
        2. <strong>Personnalisez</strong> le profil de votre enfant<br>
        3. <strong>Découvrez</strong> les premiers exercices adaptatifs<br>
        4. <strong>Suivez</strong> les progrès en temps réel
      </mj-text>

      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-top="20px">
        Besoin d'aide ? Notre équipe support est disponible à <a href="mailto:support@cube-ai.fr" style="color: #3B82F6;">support@cube-ai.fr</a>
      </mj-text>
    `,
    text: `
🎉 Bienvenue {{firstName}} !

Félicitations ! Votre compte CubeAI a été créé avec succès. Vous faites maintenant partie de la révolution de l'éducation intelligente pour les enfants de 5 à 7 ans.

📋 Votre plan d'abonnement
Plan : {{subscriptionType}}
Prix : {{price}}/mois
Sessions incluses : {{maxSessions}} session(s) simultanée(s)
Période d'essai : {{trialPeriod}}

✨ Fonctionnalités incluses dans votre plan :
{{#features}}
• {{.}}
{{/features}}

🔐 Vos informations de connexion
ID de session parent : {{parentSessionId}}
ID de session enfant : {{childSessionId}}
Mot de passe : Celui que vous avez choisi lors de l'inscription

🚀 Commencer l'aventure : {{loginUrl}}

📝 Prochaines étapes
1. Connectez-vous avec vos identifiants
2. Personnalisez le profil de votre enfant
3. Découvrez les premiers exercices adaptatifs
4. Suivez les progrès en temps réel

Besoin d'aide ? Notre équipe support est disponible à support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Préférences emails : {{preferencesUrl}}
    `
  },

  // E. Confirmation de paiement — Email avec détails du plan
  billing_confirmation_enhanced: {
    subject: 'CubeAI — ✅ Paiement confirmé ! Votre abonnement {{subscriptionType}} est actif',
    mjml: `
      <mj-text font-size="24px" font-weight="600" color="#1F2937" font-family="Fredoka, Arial, sans-serif" padding-bottom="20px">
        ✅ Paiement confirmé !
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        Bonjour {{firstName}},<br><br>
        Nous confirmons la réception de votre paiement. Votre abonnement CubeAI est maintenant actif et vous avez accès à toutes les fonctionnalités de votre plan.
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        💳 Détails de votre transaction
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Numéro de facture :</strong> {{invoiceNumber}}<br>
        <strong>Date de paiement :</strong> {{paymentDate}}<br>
        <strong>Montant payé :</strong> {{amount}} {{currency}}<br>
        <strong>Méthode de paiement :</strong> {{paymentMethod}}<br>
        <strong>Statut :</strong> <span style="color: #10B981; font-weight: 600;">✅ Payé et confirmé</span>
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="15px">
        📋 Votre plan d'abonnement {{subscriptionType}}
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Plan :</strong> {{subscriptionType}}<br>
        <strong>Prix mensuel :</strong> {{monthlyPrice}} {{currency}}<br>
        <strong>Prochain prélèvement :</strong> {{nextBillingDate}}<br>
        <strong>Cycle de facturation :</strong> {{billingCycle}}<br>
        <strong>Mode de paiement :</strong> {{paymentMethod}}
      </mj-text>

      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px" style="background-color: #ECFDF5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
        <strong>🎉 Votre abonnement est maintenant actif !</strong><br>
        Vous avez accès à toutes les fonctionnalités de votre plan {{subscriptionType}} dès maintenant.
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="20px" padding-bottom="10px">
        ✨ Fonctionnalités incluses dans votre plan :
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="15px">
        {{#features}}
        • {{.}}<br>
        {{/features}}
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="20px" padding-bottom="10px">
        🎯 Avantages de votre plan {{subscriptionType}} :
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px">
        {{#advantages}}
        • {{.}}<br>
        {{/advantages}}
      </mj-text>

      <mj-button background-color="#10B981" color="#FFFFFF" font-size="16px" font-weight="600" href="{{dashboardUrl}}" padding="15px 30px" border-radius="8px" align="center">
        🎮 Accéder à la plateforme
      </mj-button>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        ℹ️ Informations importantes sur votre abonnement
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>Facturation automatique :</strong> Votre abonnement sera renouvelé automatiquement le {{nextBillingDate}}<br>
        • <strong>Résiliation :</strong> Vous pouvez annuler votre abonnement à tout moment depuis votre espace parent<br>
        • <strong>Support :</strong> Notre équipe est disponible 24/7 pour vous accompagner<br>
        • <strong>Gestion de facturation :</strong> <a href="{{billingUrl}}" style="color: #3B82F6;">Accéder à vos factures</a>
      </mj-text>

      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-top="20px">
        Questions ? Contactez-nous à <a href="mailto:billing@cube-ai.fr" style="color: #3B82F6;">billing@cube-ai.fr</a> ou <a href="mailto:support@cube-ai.fr" style="color: #3B82F6;">support@cube-ai.fr</a>
      </mj-text>
    `,
    text: `
✅ Paiement confirmé !

Bonjour {{firstName}},

Nous confirmons la réception de votre paiement. Votre abonnement CubeAI est maintenant actif et vous avez accès à toutes les fonctionnalités de votre plan.

💳 Détails de votre transaction
Numéro de facture : {{invoiceNumber}}
Date de paiement : {{paymentDate}}
Montant payé : {{amount}} {{currency}}
Méthode de paiement : {{paymentMethod}}

📋 Votre plan d'abonnement {{subscriptionType}}
Plan : {{subscriptionType}}
Prix mensuel : {{monthlyPrice}} {{currency}}
Prochain prélèvement : {{nextBillingDate}}
Durée d'engagement : {{commitmentPeriod}}

✨ Fonctionnalités incluses dans votre plan :
{{#features}}
• {{.}}
{{/features}}

🎯 Avantages de votre plan {{subscriptionType}} :
{{#advantages}}
• {{.}}
{{/advantages}}

🎮 Accéder à la plateforme : {{dashboardUrl}}

ℹ️ Informations importantes
• Facturation : Votre abonnement sera renouvelé automatiquement le {{nextBillingDate}}
• Résiliation : Vous pouvez annuler votre abonnement à tout moment depuis votre espace parent
• Support : Notre équipe est disponible 24/7 pour vous accompagner

Questions ? Contactez-nous à billing@cube-ai.fr ou support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Gestion de facturation : {{billingUrl}}
    `
  },

  // G. Paiement réussi — Confirmation de prélèvement automatique
  payment_success: {
    subject: 'CubeAI — ✅ Prélèvement {{subscriptionType}} réussi ({{paymentDate}})',
    mjml: `
      <mj-text font-size="24px" font-weight="600" color="#1F2937" font-family="Fredoka, Arial, sans-serif" padding-bottom="20px">
        ✅ Prélèvement réussi !
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        Bonjour {{firstName}},<br><br>
        Nous confirmons que votre prélèvement automatique a été traité avec succès. Votre abonnement CubeAI continue sans interruption.
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        💳 Détails du prélèvement
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Date de prélèvement :</strong> {{paymentDate}}<br>
        <strong>Montant prélevé :</strong> {{amount}} {{currency}}<br>
        <strong>Plan :</strong> {{subscriptionType}}<br>
        <strong>Numéro de facture :</strong> {{invoiceNumber}}<br>
        <strong>Mode de paiement :</strong> {{paymentMethod}}<br>
        <strong>Statut :</strong> <span style="color: #10B981; font-weight: 600;">✅ Traité avec succès</span>
      </mj-text>

      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px" style="background-color: #ECFDF5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
        <strong>🎉 Votre abonnement est renouvelé !</strong><br>
        Vous continuez à bénéficier de toutes les fonctionnalités de votre plan {{subscriptionType}}.
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="15px">
        📅 Prochain prélèvement
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Prochain prélèvement :</strong> {{nextBillingDate}}<br>
        <strong>Montant :</strong> {{amount}} {{currency}}<br>
        <strong>Cycle :</strong> {{billingCycle}}
      </mj-text>

      <mj-button background-color="#10B981" color="#FFFFFF" font-size="16px" font-weight="600" href="{{dashboardUrl}}" padding="15px 30px" border-radius="8px" align="center">
        🎮 Continuer l'apprentissage
      </mj-button>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        📊 Votre activité récente
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>Dernière connexion :</strong> {{lastLoginDate}}<br>
        • <strong>Exercices complétés :</strong> {{exercisesCompleted}} ce mois<br>
        • <strong>Progression :</strong> {{progressPercentage}}% d'objectifs atteints
      </mj-text>

      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-top="20px">
        Questions ? Contactez-nous à <a href="mailto:billing@cube-ai.fr" style="color: #3B82F6;">billing@cube-ai.fr</a> ou <a href="mailto:support@cube-ai.fr" style="color: #3B82F6;">support@cube-ai.fr</a>
      </mj-text>
    `,
    text: `
✅ Prélèvement réussi !

Bonjour {{firstName}},

Nous confirmons que votre prélèvement automatique a été traité avec succès. Votre abonnement CubeAI continue sans interruption.

💳 Détails du prélèvement
Date de prélèvement : {{paymentDate}}
Montant prélevé : {{amount}} {{currency}}
Plan : {{subscriptionType}}
Numéro de facture : {{invoiceNumber}}
Mode de paiement : {{paymentMethod}}
Statut : Traité avec succès

🎉 Votre abonnement est renouvelé !
Vous continuez à bénéficier de toutes les fonctionnalités de votre plan {{subscriptionType}}.

📅 Prochain prélèvement
Prochain prélèvement : {{nextBillingDate}}
Montant : {{amount}} {{currency}}
Cycle : {{billingCycle}}

🎮 Continuer l'apprentissage : {{dashboardUrl}}

📊 Votre activité récente
Dernière connexion : {{lastLoginDate}}
Exercices complétés : {{exercisesCompleted}} ce mois
Progression : {{progressPercentage}}% d'objectifs atteints

Questions ? Contactez-nous à billing@cube-ai.fr ou support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Gestion de facturation : {{billingUrl}}
    `
  },

  // H. Paiement échoué — Notification d'échec de prélèvement
  payment_failed: {
    subject: 'CubeAI — ⚠️ Prélèvement {{subscriptionType}} échoué - Action requise',
    mjml: `
      <mj-text font-size="24px" font-weight="600" color="#1F2937" font-family="Fredoka, Arial, sans-serif" padding-bottom="20px">
        ⚠️ Prélèvement échoué
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        Bonjour {{firstName}},<br><br>
        Nous n'avons pas pu traiter votre prélèvement automatique. Votre accès CubeAI pourrait être suspendu si le problème n'est pas résolu rapidement.
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        💳 Détails du prélèvement échoué
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Date de tentative :</strong> {{paymentDate}}<br>
        <strong>Montant :</strong> {{amount}} {{currency}}<br>
        <strong>Plan :</strong> {{subscriptionType}}<br>
        <strong>Mode de paiement :</strong> {{paymentMethod}}<br>
        <strong>Statut :</strong> <span style="color: #EF4444; font-weight: 600;">❌ Échec du prélèvement</span><br>
        <strong>Raison :</strong> {{failureReason}}
      </mj-text>

      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px" style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444;">
        <strong>⚠️ Action requise :</strong> Votre accès sera suspendu le {{suspensionDate}} si le problème n'est pas résolu.<br>
        <strong>💡 Solution rapide :</strong> Mettez à jour vos informations de paiement ci-dessous.
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="15px">
        🔧 Solutions possibles
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>Carte expirée :</strong> Mettez à jour votre carte bancaire<br>
        • <strong>Fonds insuffisants :</strong> Vérifiez votre solde bancaire<br>
        • <strong>Carte bloquée :</strong> Contactez votre banque<br>
        • <strong>Problème technique :</strong> Essayez une autre carte
      </mj-text>

      <mj-button background-color="#3B82F6" color="#FFFFFF" font-size="16px" font-weight="600" href="{{updatePaymentUrl}}" padding="15px 30px" border-radius="8px" align="center">
        🔧 Mettre à jour le paiement
      </mj-button>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        ⏰ Prochaines tentatives
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>1ère nouvelle tentative :</strong> {{nextRetryDate}}<br>
        • <strong>2ème tentative :</strong> {{secondRetryDate}}<br>
        • <strong>Suspension de l'accès :</strong> {{suspensionDate}}<br>
        • <strong>Réactivation :</strong> Immédiate après paiement réussi
      </mj-text>

      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-top="20px">
        Besoin d'aide ? Contactez-nous immédiatement à <a href="mailto:billing@cube-ai.fr" style="color: #3B82F6;">billing@cube-ai.fr</a> ou <a href="mailto:support@cube-ai.fr" style="color: #3B82F6;">support@cube-ai.fr</a>
      </mj-text>
    `,
    text: `
⚠️ Prélèvement échoué

Bonjour {{firstName}},

Nous n'avons pas pu traiter votre prélèvement automatique. Votre accès CubeAI pourrait être suspendu si le problème n'est pas résolu rapidement.

💳 Détails du prélèvement échoué
Date de tentative : {{paymentDate}}
Montant : {{amount}} {{currency}}
Plan : {{subscriptionType}}
Mode de paiement : {{paymentMethod}}
Statut : Échec du prélèvement
Raison : {{failureReason}}

⚠️ Action requise : Votre accès sera suspendu le {{suspensionDate}} si le problème n'est pas résolu.
💡 Solution rapide : Mettez à jour vos informations de paiement.

🔧 Solutions possibles
• Carte expirée : Mettez à jour votre carte bancaire
• Fonds insuffisants : Vérifiez votre solde bancaire
• Carte bloquée : Contactez votre banque
• Problème technique : Essayez une autre carte

🔧 Mettre à jour le paiement : {{updatePaymentUrl}}

⏰ Prochaines tentatives
1ère nouvelle tentative : {{nextRetryDate}}
2ème tentative : {{secondRetryDate}}
Suspension de l'accès : {{suspensionDate}}
Réactivation : Immédiate après paiement réussi

Besoin d'aide ? Contactez-nous immédiatement à billing@cube-ai.fr ou support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Gestion de facturation : {{billingUrl}}
    `
  },

  // I. Suspension de compte — Accès suspendu pour non-paiement
  account_suspended: {
    subject: 'CubeAI — 🚫 Accès suspendu - Paiement en retard',
    mjml: `
      <mj-text font-size="24px" font-weight="600" color="#1F2937" font-family="Fredoka, Arial, sans-serif" padding-bottom="20px">
        🚫 Accès suspendu
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        Bonjour {{firstName}},<br><br>
        Votre accès CubeAI a été temporairement suspendu en raison d'un retard de paiement. Vos données sont sauvegardées et votre compte sera réactivé dès le paiement effectué.
      </mj-text>

      <mj-text font-size="18px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        📊 Résumé de la situation
      </mj-text>
      
      <mj-text font-size="16px" line-height="1.6" color="#374151" padding-bottom="20px">
        <strong>Plan :</strong> {{subscriptionType}}<br>
        <strong>Montant dû :</strong> {{amount}} {{currency}}<br>
        <strong>Date de suspension :</strong> {{suspensionDate}}<br>
        <strong>Dernière tentative :</strong> {{lastPaymentAttempt}}<br>
        <strong>Raison :</strong> {{failureReason}}
      </mj-text>

      <mj-text font-size="14px" line-height="1.5" color="#6B7280" padding-bottom="20px" style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444;">
        <strong>💾 Vos données sont sauvegardées :</strong> Tous vos progrès, exercices et paramètres sont conservés.<br>
        <strong>🔄 Réactivation immédiate :</strong> Votre accès sera rétabli dès le paiement effectué.
      </mj-text>

      <mj-button background-color="#EF4444" color="#FFFFFF" font-size="16px" font-weight="600" href="{{reactivateUrl}}" padding="15px 30px" border-radius="8px" align="center">
        🔄 Réactiver mon compte
      </mj-button>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="30px" padding-bottom="15px">
        📈 Vos progrès sauvegardés
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>Exercices complétés :</strong> {{totalExercises}}<br>
        • <strong>Heures d'apprentissage :</strong> {{totalHours}} heures<br>
        • <strong>Certificats obtenus :</strong> {{certificatesCount}}<br>
        • <strong>Progression moyenne :</strong> {{averageProgress}}%
      </mj-text>

      <mj-text font-size="16px" font-weight="600" color="#1F2937" padding-top="25px" padding-bottom="15px">
        💳 Options de paiement
      </mj-text>
      
      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-bottom="20px">
        • <strong>Carte bancaire :</strong> Mise à jour en ligne<br>
        • <strong>Virement bancaire :</strong> Contactez-nous<br>
        • <strong>Paiement échelonné :</strong> Disponible sur demande<br>
        • <strong>Changement de plan :</strong> Vers un plan plus abordable
      </mj-text>

      <mj-text font-size="14px" line-height="1.6" color="#6B7280" padding-top="20px">
        Besoin d'aide ? Notre équipe est là pour vous accompagner : <a href="mailto:support@cube-ai.fr" style="color: #3B82F6;">support@cube-ai.fr</a>
      </mj-text>
    `,
    text: `
🚫 Accès suspendu

Bonjour {{firstName}},

Votre accès CubeAI a été temporairement suspendu en raison d'un retard de paiement. Vos données sont sauvegardées et votre compte sera réactivé dès le paiement effectué.

📊 Résumé de la situation
Plan : {{subscriptionType}}
Montant dû : {{amount}} {{currency}}
Date de suspension : {{suspensionDate}}
Dernière tentative : {{lastPaymentAttempt}}
Raison : {{failureReason}}

💾 Vos données sont sauvegardées : Tous vos progrès, exercices et paramètres sont conservés.
🔄 Réactivation immédiate : Votre accès sera rétabli dès le paiement effectué.

🔄 Réactiver mon compte : {{reactivateUrl}}

📈 Vos progrès sauvegardés
Exercices complétés : {{totalExercises}}
Heures d'apprentissage : {{totalHours}} heures
Certificats obtenus : {{certificatesCount}}
Progression moyenne : {{averageProgress}}%

💳 Options de paiement
• Carte bancaire : Mise à jour en ligne
• Virement bancaire : Contactez-nous
• Paiement échelonné : Disponible sur demande
• Changement de plan : Vers un plan plus abordable

Besoin d'aide ? Notre équipe est là pour vous accompagner : support@cube-ai.fr

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
Gestion de facturation : {{billingUrl}}
    `
  },

  // F. Mot de passe oublié — Mail de demande
  password_reset_request: {
    subject: 'CubeAI — Réinitialisation de mot de passe ({{account_id}})',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Réinitialisation de mot de passe</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text>Nous avons reçu une demande de réinitialisation. Ce lien est valable {{token_ttl_minutes}} minutes.</mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Informations destinataire</mj-text>
      <mj-text class="card">
        <span class="mono">Email associé :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}
      </mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Sessions liées</mj-text>
      <mj-table>
        <tr style="background:${CUBEAI_COLORS.light}; font-weight:600;">
          <th align="left">ID Session</th><th align="left">Prénom</th><th align="left">Nom</th>
        </tr>
        {{#sessions}}
        <tr><td class="mono">{{id}}</td><td>{{first_name}}</td><td>{{last_name}}</td></tr>
        {{/sessions}}
      </mj-table>

      <mj-spacer height="12px" />
      <mj-button href="{{reset_start_url}}?token={{reset_token}}">Commencer la réinitialisation</mj-button>

      <mj-spacer height="8px" />
      <mj-text class="small">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Aucune modification ne sera effectuée.
      </mj-text>
    `,
    text: `
Réinitialisation de mot de passe
{{today_fr}}

Nous avons reçu une demande de réinitialisation. Ce lien est valable {{token_ttl_minutes}} minutes.

INFORMATIONS DESTINATAIRE
Email associé : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}

SESSIONS LIÉES
{{#sessions}}
- {{id}} : {{first_name}} {{last_name}}
{{/sessions}}

Commencer la réinitialisation : {{reset_start_url}}?token={{reset_token}}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Aucune modification ne sera effectuée.

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
    `
  },

  // D. Mot de passe oublié — Confirmation
  password_reset_confirmation: {
    subject: 'CubeAI — Mot de passe mis à jour (Session {{updated_session_id}})',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Mot de passe modifié</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text>Le mot de passe a été mis à jour avec succès pour la session suivante :</mj-text>

      <mj-text class="card">
        <span class="mono">ID Session :</span> {{updated_session_id}}<br/>
        <span class="mono">Prénom / Nom :</span> {{updated_first_name}} {{updated_last_name}}
      </mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Récapitulatif destinataire</mj-text>
      <mj-text class="card">
        <span class="mono">Email :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}
      </mj-text>

      <mj-text class="small">Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement support@cube-ai.fr.</mj-text>
    `,
    text: `
Mot de passe modifié
{{today_fr}}

Le mot de passe a été mis à jour avec succès pour la session suivante :

ID Session : {{updated_session_id}}
Prénom / Nom : {{updated_first_name}} {{updated_last_name}}

RÉCAPITULATIF DESTINATAIRE
Email : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}

Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement support@cube-ai.fr.

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
    `
  },

  // E. Facturation
  billing_confirmation: {
    subject: 'CubeAI — Confirmation d\'abonnement {{plan_name}}',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Confirmation d'abonnement</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text>Bonjour {{parent_full_name}}, votre abonnement <b>{{plan_name}}</b> est actif. Prochain prélèvement le <b>{{next_billing_date_fr}}</b>.</mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Informations destinataire</mj-text>
      <mj-text class="card">
        <span class="mono">Email :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}
      </mj-text>

      <mj-text font-weight="700">Détails</mj-text>
      <mj-text class="card">
        <span class="mono">Offre :</span> {{plan_name}}<br/>
        <span class="mono">Montant TTC :</span> {{amount_ttc}} {{currency}}<br/>
        <span class="mono">Mode de paiement :</span> {{payment_method}}<br/>
        <span class="mono">Prochain prélèvement :</span> {{next_billing_date_fr}}<br/>
        <span class="mono">Facture :</span> {{invoice_number}}
      </mj-text>

      <mj-spacer height="12px" />
      <mj-button href="{{billing_portal_url}}">Gérer mon abonnement</mj-button>
    `,
    text: `
Confirmation d'abonnement
{{today_fr}}

Bonjour {{parent_full_name}}, votre abonnement {{plan_name}} est actif. Prochain prélèvement le {{next_billing_date_fr}}.

INFORMATIONS DESTINATAIRE
Email : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}

DÉTAILS
Offre : {{plan_name}}
Montant TTC : {{amount_ttc}} {{currency}}
Mode de paiement : {{payment_method}}
Prochain prélèvement : {{next_billing_date_fr}}
Facture : {{invoice_number}}

Gérer mon abonnement : {{billing_portal_url}}

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
    `
  },

  // F. Support
  support_receipt: {
    subject: 'CubeAI — Accusé de réception (Ticket {{ticket_id}})',
    mjml: `
      <mj-text font-size="18px" font-weight="700">Nous avons reçu votre demande</mj-text>
      <mj-text class="muted">{{today_fr}}</mj-text>

      <mj-spacer height="8px" />
      <mj-text>Bonjour {{parent_full_name}}, votre message a été enregistré. Notre équipe vous répondra sous peu.</mj-text>

      <mj-spacer height="8px" />
      <mj-text font-weight="700">Informations destinataire</mj-text>
      <mj-text class="card">
        <span class="mono">Email :</span> {{parent_email}}<br/>
        <span class="mono">Type de compte :</span> {{account_type}}<br/>
        <span class="mono">ID compte :</span> {{account_id}}
      </mj-text>

      <mj-text font-weight="700">Ticket</mj-text>
      <mj-text class="card">
        <span class="mono">Ticket ID :</span> {{ticket_id}}<br/>
        <span class="mono">Objet :</span> {{subject_line}}<br/>
        <span class="mono">Priorité :</span> {{priority}}<br/>
        <span class="mono">Reçu le :</span> {{received_at_fr}}
      </mj-text>

      <mj-text class="small">Pour compléter votre demande, répondez à cet email en conservant l'objet.</mj-text>
    `,
    text: `
Nous avons reçu votre demande
{{today_fr}}

Bonjour {{parent_full_name}}, votre message a été enregistré. Notre équipe vous répondra sous peu.

INFORMATIONS DESTINATAIRE
Email : {{parent_email}}
Type de compte : {{account_type}}
ID compte : {{account_id}}

TICKET
Ticket ID : {{ticket_id}}
Objet : {{subject_line}}
Priorité : {{priority}}
Reçu le : {{received_at_fr}}

Pour compléter votre demande, répondez à cet email en conservant l'objet.

© {{year}} CubeAI — Tous droits réservés
Mentions légales : {{legal_url}}
Confidentialité : {{privacy_url}}
    `
  }
};

// Fonction pour compiler MJML en HTML inline
function compileMJML(mjmlContent: string): string {
  try {
    const result = mjml(mjmlContent, {
      keepComments: false,
      beautify: false,
      minify: true
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('Erreurs MJML:', result.errors);
      throw new Error('Erreur de compilation MJML');
    }
    
    return result.html;
  } catch (error) {
    console.error('Erreur lors de la compilation MJML:', error);
    throw error;
  }
}

// Fonction pour remplacer les variables dans le template
function renderTemplate(template: string, variables: any): string {
  try {
    return mustache.render(template, variables);
  } catch (error) {
    console.error('Erreur lors du rendu du template:', error);
    throw error;
  }
}

// Fonction pour générer un email complet
export async function generateEmail(
  type: keyof typeof EMAIL_TEMPLATES,
  variables: any,
  emailType: 'noreply' | 'support' | 'hello' = 'noreply'
): Promise<{
  subject: string;
  html: string;
  text: string;
  from: string;
  replyTo: string;
}> {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    throw new Error(`Template d'email non trouvé: ${type}`);
  }

  // Variables communes
  const commonVariables = {
    year: new Date().getFullYear(),
    today_fr: new Date().toLocaleDateString('fr-FR'),
    legal_url: 'https://cube-ai.fr/mentions-legales',
    privacy_url: 'https://cube-ai.fr/confidentialite',
    ...variables
  };

  // Rendre le sujet
  const subject = renderTemplate(template.subject, commonVariables);

  // Rendre le contenu MJML
  const mjmlContent = renderTemplate(BASE_MJML_TEMPLATE, {
    title: subject,
    content: renderTemplate(template.mjml, commonVariables),
    ...commonVariables
  });

  // Compiler en HTML
  const html = compileMJML(mjmlContent);

  // Rendre la version texte
  const text = renderTemplate(template.text, commonVariables);

  // Configuration de l'expéditeur
  const config = EMAIL_CONFIGS[emailType];

  return {
    subject,
    html,
    text,
    from: `${config.name} <${config.from}>`,
    replyTo: config.replyTo
  };
}

// Fonction pour envoyer un email avec logging
export async function sendTransactionalEmail(
  type: keyof typeof EMAIL_TEMPLATES,
  to: string,
  variables: any,
  emailType: 'noreply' | 'support' | 'hello' = 'noreply'
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Générer l'email
    const email = await generateEmail(type, variables, emailType);

    // Configuration SMTP selon le type d'email
    const smtpConfig = getEmailConfig(emailType);
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtpServer,
      port: smtpConfig.smtpPort,
      secure: smtpConfig.smtpPort === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: email.from,
      to: to,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    // Logger l'email
    await prisma.emailLog.create({
      data: {
        emailType: emailType.toUpperCase() as any,
        fromEmail: email.from,
        toEmail: to,
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        status: 'SENT',
        messageId: info.messageId,
        sentAt: new Date(),
      },
    });

    console.log(`✅ Email ${type} envoyé avec succès à ${to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email ${type} à ${to}:`, error);

    // Logger l'erreur
    await prisma.emailLog.create({
      data: {
        emailType: emailType.toUpperCase() as 'HELLO' | 'SUPPORT' | 'NOREPLY',
        fromEmail: EMAIL_CONFIGS[emailType].from,
        toEmail: to,
        subject: `Erreur - ${type}`,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Fonction utilitaire pour obtenir la configuration email
function getEmailConfig(emailType: 'noreply' | 'support' | 'hello') {
  const configs = {
    noreply: {
      user: process.env.NOREPLY_EMAIL_USER!,
      password: process.env.NOREPLY_EMAIL_PASSWORD!,
      smtpServer: process.env.NOREPLY_SMTP_SERVER!,
      smtpPort: parseInt(process.env.NOREPLY_SMTP_PORT!),
    },
    support: {
      user: process.env.SUPPORT_EMAIL_USER!,
      password: process.env.SUPPORT_EMAIL_PASSWORD!,
      smtpServer: process.env.SUPPORT_SMTP_SERVER!,
      smtpPort: parseInt(process.env.SUPPORT_SMTP_PORT!),
    },
    hello: {
      user: process.env.HELLO_EMAIL_USER!,
      password: process.env.HELLO_EMAIL_PASSWORD!,
      smtpServer: process.env.HELLO_SMTP_SERVER!,
      smtpPort: parseInt(process.env.HELLO_SMTP_PORT!),
    },
  };

  return configs[emailType];
}

// Configuration des plans d'abonnement pour les emails
export const SUBSCRIPTION_PLANS_DATA = {
  FREE: {
    name: 'Découverte',
    price: '4,99€',
    monthlyPrice: '4,99€',
    maxSessions: 2,
    trialPeriod: 'Sans engagement',
    trialStartDate: '{{trialStartDate}}',
    trialEndDate: 'Non applicable',
    firstBillingDate: 'Non applicable',
    billingCycle: 'Mensuel',
    paymentMethod: 'Carte bancaire',
    features: [
      '1 parent + 1 enfant',
      'Bubix (version simplifiée)',
      'MathCube — bases en jouant',
      'Expériences (lite)',
      '1 analyse simple par semaine'
    ],
    advantages: [
      'Parfait pour commencer l\'aventure',
      'Aucun engagement',
      'Accès immédiat'
    ],
    trialDetails: {
      duration: 'Sans période d\'essai',
      startMessage: 'Votre abonnement Découverte commence immédiatement',
      endMessage: 'Facturation mensuelle de 4,99€',
      cancellation: 'Résiliation possible à tout moment'
    }
  },
  PRO: {
    name: 'Explorateur',
    price: '29,99€',
    monthlyPrice: '29,99€',
    maxSessions: 3,
    trialPeriod: 'Sans engagement',
    trialStartDate: '{{trialStartDate}}',
    trialEndDate: '{{trialEndDate}}',
    firstBillingDate: '{{firstBillingDate}}',
    billingCycle: 'Mensuel',
    paymentMethod: 'Carte bancaire',
    features: [
      '1 parent + 2 enfants',
      'Bubix avancé (professeur/coach/ami)',
      'Tous les onglets enfants (Math, Code, Play, Science, Dream, Expériences)',
      'Dashboard parental complet + ComCube',
      'Analyses hebdomadaires + export PDF/Excel',
      'Radar de connaissance complet',
      'Certificats simples',
      'Support email + chat + téléphone'
    ],
    advantages: [
      'L\'expérience complète recommandée',
      'Contenu premium illimité',
      'Support prioritaire'
    ],
    trialDetails: {
      duration: 'Sans période d\'essai',
      startMessage: 'Votre abonnement Pro commence immédiatement',
      endMessage: 'Facturation mensuelle de 9,99€',
      cancellation: 'Résiliation possible à tout moment'
    }
  },
  PRO_PLUS: {
    name: 'Maître',
    price: '59,99€',
    monthlyPrice: '59,99€',
    maxSessions: 5,
    trialPeriod: 'Sans engagement',
    trialStartDate: '{{trialStartDate}}',
    trialEndDate: '{{trialEndDate}}',
    firstBillingDate: '{{firstBillingDate}}',
    billingCycle: 'Mensuel',
    paymentMethod: 'Carte bancaire',
    features: [
      '1 parent + 4 enfants',
      'Bubix premium: prédictions et adaptation automatique',
      'Analyses quotidiennes et prédictives',
      'Radar de connaissance évolutif dense',
      'Contenus exclusifs & défis communautaires',
      'Diplômes officiels et badges',
      'Dashboard parental enrichi (comparatifs IA)',
      'Sauvegarde cloud + historique illimité',
      'Support VIP prioritaire (WhatsApp & téléphone)'
    ],
    advantages: [
      'La solution complète pour les familles',
      'Support 24/7',
      'Contenus exclusifs'
    ],
    trialDetails: {
      duration: 'Sans période d\'essai',
      startMessage: 'Votre abonnement Pro Plus commence immédiatement',
      endMessage: 'Facturation mensuelle de 19,99€',
      cancellation: 'Résiliation possible à tout moment'
    }
  }
};

// Fonction pour enrichir les données d'email avec les informations du plan
export function enrichEmailDataWithPlan(data: any, subscriptionType: keyof typeof SUBSCRIPTION_PLANS_DATA) {
  const plan = SUBSCRIPTION_PLANS_DATA[subscriptionType];
  
  // Calcul des dates importantes
  const today = new Date();
  const trialStartDate = today.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  let trialEndDate = '';
  let firstBillingDate = '';
  
  if (subscriptionType === 'FREE') {
    // Plus de période d'essai — plan gratuit sans facturation
    trialEndDate = 'Non applicable';
    firstBillingDate = 'Non applicable';
  } else {
    // Plans payants : facturation immédiate
    trialEndDate = 'Facturation immédiate';
    firstBillingDate = trialStartDate;
  }
  
  return {
    ...data,
    subscriptionType: plan.name,
    price: plan.price,
    monthlyPrice: plan.monthlyPrice,
    maxSessions: plan.maxSessions,
    trialPeriod: plan.trialPeriod,
    trialStartDate,
    trialEndDate,
    firstBillingDate,
    billingCycle: plan.billingCycle,
    paymentMethod: plan.paymentMethod,
    features: plan.features,
    advantages: plan.advantages,
    trialDetails: plan.trialDetails,
    loginUrl: `${process.env.FRONTEND_URL}/login`,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    preferencesUrl: `${process.env.FRONTEND_URL}/preferences?account=${data.accountId || data.account_id}`,
    billingUrl: `${process.env.FRONTEND_URL}/billing?account=${data.accountId || data.account_id}`,
    legal_url: 'https://cube-ai.fr/mentions-legales',
    privacy_url: 'https://cube-ai.fr/confidentialite',
    year: new Date().getFullYear()
  };
}

// Fonction pour enrichir les données d'email de paiement réussi
export function enrichPaymentSuccessData(data: any, subscriptionType: keyof typeof SUBSCRIPTION_PLANS_DATA) {
  const plan = SUBSCRIPTION_PLANS_DATA[subscriptionType];
  
  // Calcul des dates pour le prochain prélèvement
  const paymentDate = new Date(data.paymentDate);
  const nextBillingDate = new Date(paymentDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  
  return {
    ...data,
    subscriptionType: plan.name,
    paymentDate: paymentDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    nextBillingDate: nextBillingDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    billingCycle: plan.billingCycle,
    paymentMethod: plan.paymentMethod,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    billingUrl: `${process.env.FRONTEND_URL}/billing?account=${data.accountId || data.account_id}`,
    legal_url: 'https://cube-ai.fr/mentions-legales',
    privacy_url: 'https://cube-ai.fr/confidentialite',
    year: new Date().getFullYear()
  };
}

// Fonction pour enrichir les données d'email de paiement échoué
export function enrichPaymentFailedData(data: any, subscriptionType: keyof typeof SUBSCRIPTION_PLANS_DATA) {
  const plan = SUBSCRIPTION_PLANS_DATA[subscriptionType];
  
  // Calcul des dates pour les tentatives et suspension
  const paymentDate = new Date(data.paymentDate);
  const nextRetryDate = new Date(paymentDate);
  nextRetryDate.setDate(nextRetryDate.getDate() + 3); // 3 jours après
  
  const secondRetryDate = new Date(paymentDate);
  secondRetryDate.setDate(secondRetryDate.getDate() + 7); // 7 jours après
  
  const suspensionDate = new Date(paymentDate);
  suspensionDate.setDate(suspensionDate.getDate() + 14); // 14 jours après
  
  return {
    ...data,
    subscriptionType: plan.name,
    paymentDate: paymentDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    nextRetryDate: nextRetryDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    secondRetryDate: secondRetryDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    suspensionDate: suspensionDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    paymentMethod: plan.paymentMethod,
    updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/update-payment?account=${data.accountId || data.account_id}`,
    billingUrl: `${process.env.FRONTEND_URL}/billing?account=${data.accountId || data.account_id}`,
    legal_url: 'https://cube-ai.fr/mentions-legales',
    privacy_url: 'https://cube-ai.fr/confidentialite',
    year: new Date().getFullYear()
  };
}

// Fonction pour enrichir les données d'email de suspension de compte
export function enrichAccountSuspendedData(data: any, subscriptionType: keyof typeof SUBSCRIPTION_PLANS_DATA) {
  const plan = SUBSCRIPTION_PLANS_DATA[subscriptionType];
  
  return {
    ...data,
    subscriptionType: plan.name,
    suspensionDate: new Date(data.suspensionDate).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    lastPaymentAttempt: new Date(data.lastPaymentAttempt).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    reactivateUrl: `${process.env.FRONTEND_URL}/billing/reactivate?account=${data.accountId || data.account_id}`,
    billingUrl: `${process.env.FRONTEND_URL}/billing?account=${data.accountId || data.account_id}`,
    legal_url: 'https://cube-ai.fr/mentions-legales',
    privacy_url: 'https://cube-ai.fr/confidentialite',
    year: new Date().getFullYear()
  };
}

// Exemples d'utilisation
export const EMAIL_EXAMPLES = {
  account_creation: {
    variables: {
      parent_email: 'parent.martin@example.com',
      parent_full_name: 'Mme Martin',
      account_id: 'ACC-9F27A3',
      account_type: 'Familial',
      timezone: 'Europe/Paris',
      sessions: [
        { id: 'SESS-2F0C', first_name: 'Lina', last_name: 'M.', age: 6 },
        { id: 'SESS-7A11', first_name: 'Yanis', last_name: 'M.', age: 5 }
      ],
      parent_dashboard_url: 'https://app.cube-ai.fr/parents/dashboard?account=ACC-9F27A3',
      manage_link: 'https://app.cube-ai.fr/parents/preferences?account=ACC-9F27A3'
    }
  },
  daily_report: {
    variables: {
      parent_email: 'parent.martin@example.com',
      account_type: 'Familial',
      account_id: 'ACC-9F27A3',
      session_id: 'SESS-2F0C',
      child_first_name: 'Lina',
      child_last_name: 'M.',
      child_nickname: 'Lina',
      child_age: 6,
      kpi_assiduite: 78,
      kpi_comprehension: 71,
      kpi_progression: 65,
      report_text: 'Lina a travaillé 22 minutes aujourd\'hui, régulier et concentré. Bonnes bases en additions ≤ 10. À renforcer : soustractions simples. Demain : 5 minutes d\'additions rapides (cartes/mini-jeux), puis 5 minutes de soustractions guidées avec objets.',
      manage_link: 'https://app.cube-ai.fr/parents/preferences?account=ACC-9F27A3',
      unsubscribe_link: 'https://app.cube-ai.fr/parents/unsubscribe?account=ACC-9F27A3'
    }
  }
};
