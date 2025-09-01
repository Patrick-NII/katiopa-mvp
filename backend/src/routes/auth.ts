import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { sendWelcomeEmail } from '../utils/sendWelcomeEmail';
import { sendPasswordResetEmail } from '../utils/sendPasswordResetEmail';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Vérification disponibilité d'un identifiant de session (username)
router.get('/check-session', async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'Identifiant requis', code: 'MISSING_SESSION_ID' });
    }
    const existing = await prisma.userSession.findFirst({
      where: { sessionId: { equals: sessionId, mode: 'insensitive' } }
    });
    return res.json({ success: true, available: !existing, exists: !!existing });
  } catch (error) {
    console.error('❌ Erreur check-session:', error);
    return res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Inscription d'un nouveau compte complet
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      firstName,
      lastName,
      password,
      confirmPassword,
      subscriptionType = 'FREE',
      familyMembers = [],
      parentPrompts = {},
      selectedPaymentMethod,
      payCard,
      paySEPA,
      payPaypal,
      promoCode,
      acceptTerms = false
    } = req.body;

    console.log('📝 Données d\'inscription reçues:', {
      email,
      firstName,
      lastName,
      subscriptionType,
      familyMembersCount: familyMembers.length,
      hasParentPrompts: !!parentPrompts,
      selectedPaymentMethod,
      hasPromoCode: !!promoCode,
      acceptTerms
    });

    // Validation des données de base
    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
        code: 'MISSING_EMAIL'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'Prénom et nom requis',
        code: 'MISSING_NAME'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: 'Mot de passe et confirmation requis',
        code: 'MISSING_PASSWORD'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Les mots de passe ne correspondent pas',
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (!acceptTerms) {
      return res.status(400).json({
        error: 'Vous devez accepter les conditions',
        code: 'TERMS_NOT_ACCEPTED'
      });
    }

    // Validation des membres de la famille
    console.log('👥 Membres de la famille reçus:', familyMembers?.length || 0);
    if (!familyMembers || familyMembers.length === 0) {
      return res.status(400).json({
        error: 'Au moins un membre de la famille est requis',
        code: 'MISSING_FAMILY_MEMBERS'
      });
    }

    // Vérification si l'email existe déjà
    const existingAccount = await prisma.account.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (existingAccount) {
      return res.status(409).json({
        error: 'Un compte avec cet email existe déjà',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // CONTRAINTES: usernames et mots de passe uniques au sein de la famille
    try {
      // Unicité des identifiants de session (dans la requête)
      const requestedUsernames = familyMembers.map((m: any, i: number) => {
        const base = (m.username || '').trim();
        return base ? base.toLowerCase() : `__auto__${i}`; // auto ignorés pour la vérif inter-membres
      });
      const filtered = requestedUsernames.filter(u => !u.startsWith('__auto__'));
      const dupUser = filtered.find((u, i) => filtered.indexOf(u) !== i);
      if (dupUser) {
        return res.status(400).json({ error: 'Identifiants de session en double', code: 'DUPLICATE_SESSION_ID' });
      }

      // Unicité des mots de passe (parent VS enfants et entre enfants)
      const requestedPasswords = familyMembers.map((m: any) => String(m.sessionPassword || ''));
      const pwdSet = new Set<string>();
      for (const p of requestedPasswords) {
        if (!p) continue;
        if (pwdSet.has(p)) {
          return res.status(400).json({ error: 'Réutilisation de mot de passe détectée', code: 'DUPLICATE_PASSWORD' });
        }
        pwdSet.add(p);
      }

      // Collision en base pour les usernames fournis
      const toCheck = familyMembers.map((m: any, i: number) => (m.username || '').trim()).filter(Boolean);
      if (toCheck.length > 0) {
        const collisions: string[] = [];
        for (const u of toCheck) {
          const exists = await prisma.userSession.findFirst({ where: { sessionId: { equals: u, mode: 'insensitive' } } });
          if (exists) collisions.push(u);
        }
        if (collisions.length > 0) {
          return res.status(409).json({ error: 'Certains identifiants sont déjà utilisés', code: 'SESSION_ID_ALREADY_EXISTS', details: collisions });
        }
      }
    } catch (vErr) {
      console.error('❌ Erreur validation pré-création:', vErr);
      return res.status(500).json({ error: 'Erreur de validation', code: 'VALIDATION_ERROR' });
    }

    // Calcul du nombre maximum de sessions selon le plan
    const maxSessions = subscriptionType === 'FREE' ? 1 : 
                       subscriptionType === 'PRO' ? 2 : 
                       subscriptionType === 'PRO_PLUS' ? 4 : 10;

    // Création du compte avec toutes les informations
    const account = await prisma.account.create({
      data: {
        email: normalizedEmail,
        subscriptionType,
        maxSessions,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Compte créé:', account.id);

    // Création des sessions utilisateur pour tous les membres de la famille
    const createdSessions = [];
    
    for (let index = 0; index < familyMembers.length; index++) {
      const member = familyMembers[index];
      const {
        firstName,
        lastName,
        gender = 'UNKNOWN',
        userType = 'CHILD',
        dateOfBirth,
        grade,
        username,
        sessionPassword
      } = member;

      // Validation des données du membre
      console.log(`🔍 Validation du membre ${index + 1}:`, { firstName, lastName, hasPassword: !!sessionPassword, userType });
      if (!firstName || !lastName || !sessionPassword) {
        console.warn('⚠️ Membre invalide ignoré:', { firstName, lastName, hasPassword: !!sessionPassword });
        continue; // Ignorer les membres invalides
      }

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(sessionPassword, 12);

      // Création de la session utilisateur (avec garantie d'unicité sessionId)
      const userSession = await prisma.userSession.create({
        data: {
          accountId: account.id,
          sessionId: username || `${firstName.toLowerCase()}_${Date.now()}_${index}`,
          password: hashedPassword,
          firstName,
          lastName,
          gender,
          userType,
          age: dateOfBirth ? calculateAge(dateOfBirth) : null,
          grade,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Session créée pour ${firstName} ${lastName}:`, userSession.sessionId);

      // Création du profil utilisateur avec les prompts parent
      if (userType === 'PARENT' && parentPrompts) {
        await prisma.userProfile.create({
          data: {
            userSessionId: userSession.id,
            learningGoals: parentPrompts.objectives ? [parentPrompts.objectives] : [],
            preferredSubjects: [],
            learningStyle: parentPrompts.preferences || null,
            difficulty: null,
            sessionPreferences: parentPrompts,
            interests: [],
            specialNeeds: parentPrompts.concerns ? [parentPrompts.concerns] : [],
            customNotes: parentPrompts.additionalInfo || null,
            parentWishes: parentPrompts.needs || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Profil parent créé pour ${firstName} ${lastName}`);
      } else {
        // Profil basique pour les enfants
        await prisma.userProfile.create({
          data: {
            userSessionId: userSession.id,
            learningGoals: [],
            preferredSubjects: [],
            interests: [],
            specialNeeds: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Profil enfant créé pour ${firstName} ${lastName}`);
      }

      createdSessions.push({
        id: userSession.id,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        sessionId: userSession.sessionId,
        userType: userSession.userType,
        createdAt: userSession.createdAt
      });
    }

    // Création du plan de sièges
    await prisma.planSeat.create({
      data: {
        accountId: account.id,
        maxChildren: maxSessions
      }
    });

    console.log('✅ Plan de sièges créé');

    // Enregistrement des informations de paiement (optionnel)
    if (selectedPaymentMethod) {
      console.log('💳 Informations de paiement reçues:', {
        accountId: account.id,
        selectedPaymentMethod,
        hasCardInfo: !!payCard,
        hasSEPAInfo: !!paySEPA,
        hasPayPalInfo: !!payPaypal,
        promoCode
      });
    }

    // Génération du token JWT pour le premier parent
    const parentSession = createdSessions.find(s => s.userType === 'PARENT');
    if (parentSession) {
      const token = jwt.sign(
        { 
          userId: parentSession.id, 
          accountId: account.id,
          userType: parentSession.userType 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Réponse avec cookie sécurisé
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
      });

      console.log('✅ Token JWT généré pour le parent');
    }

    // Générer un identifiant d'inscription unique (non stocké)
    const registrationId = `REG-${randomUUID()}`;

    const responseData = {
      success: true,
      message: 'Compte créé avec succès',
      data: {
        registrationId,
        account: {
          id: account.id,
          email: account.email,
          subscriptionType: account.subscriptionType,
          maxSessions: account.maxSessions,
          createdAt: account.createdAt
        },
        sessions: createdSessions,
        totalMembers: createdSessions.length
      }
    };

    console.log('🎉 Inscription terminée avec succès:', {
      accountId: account.id,
      totalMembers: createdSessions.length,
      sessions: createdSessions.map(s => `${s.firstName} ${s.lastName} (${s.userType})`)
    });

    // Envoi de l'email de bienvenue avec les identifiants
    try {
      const parentReq = familyMembers.find((m: any) => (m.userType || 'CHILD') === 'PARENT') || familyMembers[0]
      const toName = parentReq ? `${parentReq.firstName || ''} ${parentReq.lastName || ''}`.trim() : account.email

      // Préparer les données pour l'email avec les mots de passe en clair
      const emailFamilyMembers = familyMembers.map((member: any, index: number) => ({
        ...member,
        sessionPassword: member.sessionPassword || (index === 0 ? password : `${member.firstName?.toLowerCase() || 'user'}123`)
      }))

      await sendWelcomeEmail({
        toEmail: account.email,
        toName: toName || account.email,
        subscriptionType: account.subscriptionType,
        familyMembers: emailFamilyMembers,
        createdSessions: createdSessions as any,
        registrationId,
      })
      console.log('📧 Email de bienvenue envoyé avec succès pour', account.email, 'avec', emailFamilyMembers.length, 'membres')
    } catch (e) {
      console.warn('⚠️ Envoi de l\'email de bienvenue échoué (non bloquant):', (e as any)?.message)
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte',
      code: 'REGISTRATION_ERROR',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, sessionId, password } = req.body;

    // Validation des données
    if (!password) {
      return res.status(400).json({
        error: 'Mot de passe requis',
        code: 'MISSING_PASSWORD'
      });
    }

    if (!email && !sessionId) {
      return res.status(400).json({
        error: 'Email ou ID de session requis',
        code: 'MISSING_CREDENTIALS'
      });
    }

    let account;
    let userSession;

    if (email) {
      // Connexion par email
      account = await prisma.account.findFirst({
        where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
        include: {
          userSessions: {
            where: { isActive: true },
            include: {
              profile: true
            }
          }
        }
      });

      if (!account) {
        return res.status(401).json({
          error: 'Email ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Recherche de la session utilisateur avec vérification robuste (hash ou clair) — priorité au parent
      const byType = [...account.userSessions].sort((a: any, b: any) => (a.userType === 'PARENT' ? -1 : 1));
      for (const session of byType) {
        if (session.password && session.password.startsWith('$2')) {
          if (bcrypt.compareSync(password, session.password)) {
            userSession = session;
            break;
          }
        } else {
          if (session.password === password) {
            userSession = session;
            // Migration immédiate vers hash
            try {
              const hashed = await bcrypt.hash(password, 12);
              await prisma.userSession.update({ where: { id: session.id }, data: { password: hashed } });
            } catch (e) {
              console.warn('⚠️ Échec migration mot de passe (email path):', (e as any)?.message);
            }
            break;
          }
        }
      }
    } else {
      // Connexion par sessionId
      userSession = await prisma.userSession.findFirst({
        where: { 
          sessionId,
          isActive: true 
        },
        include: {
          account: {
            include: {
              userSessions: {
                where: { isActive: true },
                include: {
                  profile: true
                }
              }
            }
          },
          profile: true
        }
      });

      if (!userSession) {
        return res.status(401).json({
          error: 'ID de session ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Vérification du mot de passe (hash ou clair) + migration si nécessaire
      let valid = false;
      if (userSession.password && userSession.password.startsWith('$2')) {
        valid = bcrypt.compareSync(password, userSession.password);
      } else if (userSession.password === password) {
        valid = true;
        try {
          const hashed = await bcrypt.hash(password, 12);
          await prisma.userSession.update({ where: { id: userSession.id }, data: { password: hashed } });
        } catch (e) {
          console.warn('⚠️ Échec migration mot de passe (sessionId path):', (e as any)?.message);
        }
      }

      if (!valid) {
        return res.status(401).json({
          error: 'ID de session ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      account = userSession.account;
    }

    if (!userSession) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Mise à jour de la dernière connexion et marquer comme session active
    await prisma.userSession.update({
      where: { id: userSession.id },
      data: { 
        lastLoginAt: new Date(),
        currentSessionStartTime: new Date() // Marquer comme session active
      }
    });

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: userSession.id, 
        accountId: account.id,
        userType: userSession.userType 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Réponse avec cookie sécurisé
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        account: {
          id: account.id,
          email: account.email,
          subscriptionType: account.subscriptionType,
          maxSessions: account.maxSessions
        },
        userSession: {
          id: userSession.id,
          sessionId: userSession.sessionId,
          firstName: userSession.firstName,
          lastName: userSession.lastName,
          userType: userSession.userType,
          profile: userSession.profile
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion',
      code: 'LOGIN_ERROR'
    });
  }
});

// Déconnexion
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Vérification de l'authentification (alias pour /me)
router.get('/verify', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const { userId, accountId } = req.user;

    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true,
        profile: true
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        userType: userSession.userType,
        subscriptionType: userSession.account.subscriptionType
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Vérification de l'authentification
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const { userId, accountId } = req.user;

    const userSession = await prisma.userSession.findUnique({
      where: { id: userId },
      include: {
        account: true,
        profile: true
      }
    });

    if (!userSession) {
      return res.status(404).json({
        error: 'Session utilisateur non trouvée',
        code: 'USER_SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        account: {
          id: userSession.account.id,
          email: userSession.account.email,
          subscriptionType: userSession.account.subscriptionType,
          maxSessions: userSession.account.maxSessions
        },
        userSession: {
          id: userSession.id,
          sessionId: userSession.sessionId,
          firstName: userSession.firstName,
          lastName: userSession.lastName,
          userType: userSession.userType,
          profile: userSession.profile
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Fonction utilitaire pour calculer l'âge
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
// Vérification disponibilité email (case-insensitive)
router.get('/check-email', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim();
    if (!email) {
      return res.status(400).json({ error: 'Email requis', code: 'MISSING_EMAIL' });
    }
    // Recherche insensible à la casse
    const existing = await prisma.account.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    return res.json({ success: true, available: !existing, exists: !!existing });
  } catch (error) {
    console.error('❌ Erreur check-email:', error);
    return res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' });
  }
});

// Mot de passe oublié — demande de réinitialisation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, sessionId } = req.body || {};
    if (!email && !sessionId) {
      return res.status(400).json({ error: 'Email ou ID de session requis', code: 'MISSING_IDENTIFIER' });
    }

    let userSession: any = null;
    let account: any = null;

    if (email) {
      account = await prisma.account.findFirst({
        where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
        include: { userSessions: true }
      });
      if (!account) return res.json({ success: true });
      userSession = account.userSessions.find((s: any) => s.userType === 'PARENT') || account.userSessions[0];
    } else if (sessionId) {
      userSession = await prisma.userSession.findFirst({ where: { sessionId: { equals: String(sessionId).trim(), mode: 'insensitive' } }, include: { account: true } });
      if (!userSession) return res.json({ success: true });
      account = userSession.account;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { accountId: account.id, userSessionId: userSession.id, token, expiresAt } });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendPasswordResetEmail({ toEmail: account.email, toName: `${userSession.firstName} ${userSession.lastName}`.trim(), resetLink });
    } catch (e) {
      console.warn('⚠️ Envoi email reset échoué:', (e as any)?.message);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur forgot-password:', error);
    return res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' });
  }
});

// Réinitialisation avec token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis', code: 'MISSING_FIELDS' });
    }
    const entry = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token invalide ou expiré', code: 'TOKEN_INVALID' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.userSession.update({ where: { id: entry.userSessionId }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { id: entry.id }, data: { usedAt: new Date() } });
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur reset-password:', error);
    return res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' });
  }
});

export default router;
