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

  // C. Mot de passe oublié — Mail de demande
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
