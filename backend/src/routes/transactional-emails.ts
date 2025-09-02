import express from 'express';
import { generateEmail, sendTransactionalEmail, EMAIL_EXAMPLES } from '../services/emailTemplates';

const router = express.Router();

// Route pour tester la génération d'emails
router.post('/generate', async (req, res) => {
  try {
    const { type, variables, emailType = 'noreply' } = req.body;

    if (!type || !variables) {
      return res.status(400).json({
        success: false,
        error: 'Type et variables requis'
      });
    }

    const email = await generateEmail(type, variables, emailType);

    res.json({
      success: true,
      email: {
        subject: email.subject,
        from: email.from,
        replyTo: email.replyTo,
        htmlLength: email.html.length,
        textLength: email.text.length,
        html: email.html,
        text: email.text
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération d\'email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour envoyer un email transactionnel
router.post('/send', async (req, res) => {
  try {
    const { type, to, variables, emailType = 'noreply' } = req.body;

    if (!type || !to || !variables) {
      return res.status(400).json({
        success: false,
        error: 'Type, destinataire et variables requis'
      });
    }

    const result = await sendTransactionalEmail(type, to, variables, emailType);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Email envoyé avec succès'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour obtenir les exemples de variables
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    examples: EMAIL_EXAMPLES,
    availableTypes: [
      'account_creation',
      'daily_report',
      'password_reset_request',
      'password_reset_confirmation',
      'billing_confirmation',
      'support_receipt'
    ]
  });
});

// Route pour tester avec des données d'exemple
router.post('/test', async (req, res) => {
  try {
    const { type = 'account_creation', to, emailType = 'noreply' } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Adresse email de test requise'
      });
    }

    const example = EMAIL_EXAMPLES[type as keyof typeof EMAIL_EXAMPLES];
    if (!example) {
      return res.status(400).json({
        success: false,
        error: `Type d'email non trouvé: ${type}`
      });
    }

    const result = await sendTransactionalEmail(type, to, example.variables, emailType);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: `Email de test ${type} envoyé avec succès à ${to}`,
        variables: example.variables
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
