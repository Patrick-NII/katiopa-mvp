import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { sendWelcomeEmail } from '../utils/sendWelcomeEmail';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Inscription d'un nouveau compte complet
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      subscriptionType = 'FREE',
      maxSessions,
      familyMembers = [],
      parentPrompts = {},
      paymentInfo = {}
    } = req.body;

    console.log('📝 Données d\'inscription reçues:', {
      email,
      subscriptionType,
      maxSessions,
      familyMembersCount: familyMembers.length,
      hasParentPrompts: !!parentPrompts,
      hasPaymentInfo: !!paymentInfo
    });

    // Validation des données de base
    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
        code: 'MISSING_EMAIL'
      });
    }

    // Validation des membres de la famille
    if (!familyMembers || familyMembers.length === 0) {
      return res.status(400).json({
        error: 'Au moins un membre de la famille est requis',
        code: 'MISSING_FAMILY_MEMBERS'
      });
    }

    // Vérification si l'email existe déjà
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return res.status(409).json({
        error: 'Un compte avec cet email existe déjà',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Création du compte avec toutes les informations
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        maxSessions: maxSessions || (subscriptionType === 'FREE' ? 1 : 
                     subscriptionType === 'PRO' ? 2 : 
                     subscriptionType === 'PRO_PLUS' ? 4 : 10),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Compte créé:', account.id);

    // Création des sessions utilisateur pour tous les membres de la famille
    const createdSessions = [];
    
    for (const member of familyMembers) {
      const {
        firstName,
        lastName,
        gender = 'UNKNOWN',
        userType = 'CHILD',
        dateOfBirth,
        grade,
        username,
        password
      } = member;

      // Validation des données du membre
      if (!firstName || !lastName || !password) {
        console.warn('⚠️ Membre invalide ignoré:', { firstName, lastName, hasPassword: !!password });
        continue; // Ignorer les membres invalides
      }

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Création de la session utilisateur
      const userSession = await prisma.userSession.create({
        data: {
          accountId: account.id,
          sessionId: username || `${firstName.toLowerCase()}_${Date.now()}`,
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
        maxChildren: maxSessions || (subscriptionType === 'FREE' ? 1 : 
                    subscriptionType === 'PRO' ? 2 : 
                    subscriptionType === 'PRO_PLUS' ? 4 : 10)
      }
    });

    console.log('✅ Plan de sièges créé');

    // Enregistrement des informations de paiement (optionnel)
    if (paymentInfo && Object.keys(paymentInfo).length > 0) {
      console.log('💳 Informations de paiement reçues:', {
        accountId: account.id,
        cardHolderName: paymentInfo.cardHolderName,
        billingAddress: paymentInfo.billingAddress,
        acceptTerms: paymentInfo.acceptTerms,
        acceptMarketing: paymentInfo.acceptMarketing
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

      await sendWelcomeEmail({
        toEmail: account.email,
        toName: toName || account.email,
        subscriptionType: account.subscriptionType,
        familyMembers: familyMembers || [],
        createdSessions: createdSessions as any,
        registrationId,
      })
      console.log('📧 Email de bienvenue déclenché pour', account.email)
    } catch (e) {
      console.warn('⚠️ Envoi de l\'email de bienvenue échoué (non bloquant):', (e as any)?.message)
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte',
      code: 'REGISTRATION_ERROR',
      details: error.message
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
      account = await prisma.account.findUnique({
        where: { email },
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

      // Recherche de la session utilisateur avec le mot de passe
      userSession = account.userSessions.find(session => 
        bcrypt.compareSync(password, session.password)
      );
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

      // Vérification du mot de passe
      if (!bcrypt.compareSync(password, userSession.password)) {
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

// Vérification de l'authentification
router.get('/me', requireAuth, async (req, res) => {
  try {
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

export default router;
