import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/requireAuth';
import authCompleteRoutes from './auth-complete';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Utiliser la route d'inscription complète
router.use('/', authCompleteRoutes);

const router = express.Router();
const prisma = new PrismaClient();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Inscription d'un nouveau compte
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, subscriptionType = 'FREE' } = req.body;

    // Validation des données
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Tous les champs sont requis',
        code: 'MISSING_FIELDS'
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

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création du compte
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        maxSessions: subscriptionType === 'FREE' ? 1 : 
                     subscriptionType === 'PRO' ? 2 : 
                     subscriptionType === 'PRO_PLUS' ? 4 : 10
      }
    });

    // Création de la session utilisateur principale (parent)
    const userSession = await prisma.userSession.create({
      data: {
        accountId: account.id,
        sessionId: `${firstName.toLowerCase()}_${Date.now()}`,
        password: hashedPassword,
        firstName,
        lastName,
        userType: 'PARENT',
        isActive: true
      }
    });

    // Création du profil utilisateur
    await prisma.userProfile.create({
      data: {
        userSessionId: userSession.id,
        learningGoals: [],
        preferredSubjects: [],
        interests: [],
        specialNeeds: []
      }
    });

    // Création du plan de sièges
    await prisma.planSeat.create({
      data: {
        accountId: account.id,
        maxChildren: subscriptionType === 'FREE' ? 1 : 
                    subscriptionType === 'PRO' ? 2 : 
                    subscriptionType === 'PRO_PLUS' ? 4 : 10
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

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
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
          userType: userSession.userType
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Recherche du compte
    const account = await prisma.account.findUnique({
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
    const userSession = account.userSessions.find(session => 
      bcrypt.compareSync(password, session.password)
    );

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
    console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification de l\'authentification',
      code: 'AUTH_VERIFICATION_ERROR'
    });
  }
});

// Création d'une session enfant
router.post('/child-session', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.user;
    const { firstName, lastName, age, grade, gender = 'UNKNOWN' } = req.body;

    // Validation des données
    if (!firstName || !lastName || !age || !grade) {
      return res.status(400).json({
        error: 'Tous les champs sont requis',
        code: 'MISSING_FIELDS'
      });
    }

    // Vérification des limites du plan
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        userSessions: true,
        planSeat: true
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Compte non trouvé',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    const currentChildSessions = account.userSessions.filter(
      session => session.userType === 'CHILD'
    ).length;

    if (currentChildSessions >= account.planSeat!.maxChildren) {
      return res.status(403).json({
        error: 'Limite du plan atteinte',
        code: 'PLAN_LIMIT_REACHED'
      });
    }

    // Génération d'un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Création de la session enfant
    const childSession = await prisma.userSession.create({
      data: {
        accountId,
        sessionId: `${firstName.toLowerCase()}_${Date.now()}`,
        password: hashedPassword,
        firstName,
        lastName,
        age,
        grade,
        gender,
        userType: 'CHILD',
        isActive: true
      }
    });

    // Création du profil enfant
    await prisma.userProfile.create({
      data: {
        userSessionId: childSession.id,
        learningGoals: [],
        preferredSubjects: [],
        interests: [],
        specialNeeds: []
      }
    });

    res.status(201).json({
      success: true,
      message: 'Session enfant créée avec succès',
      data: {
        childSession: {
          id: childSession.id,
          firstName: childSession.firstName,
          lastName: childSession.lastName,
          age: childSession.age,
          grade: childSession.grade,
          gender: childSession.gender,
          tempPassword
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la session enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de la session enfant',
      code: 'CHILD_SESSION_CREATION_ERROR'
    });
  }
});

// Récupération des sessions utilisateur d'un compte
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.user;

    const userSessions = await prisma.userSession.findMany({
      where: { accountId },
      include: {
        profile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: userSessions
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des sessions',
      code: 'SESSIONS_RETRIEVAL_ERROR'
    });
  }
});

// Route pour récupérer les comptes de test
router.get('/test-accounts', async (req, res) => {
  try {
    // Récupérer tous les comptes avec leurs sessions utilisateur
    const accounts = await prisma.account.findMany({
      include: {
        userSessions: {
          where: { isActive: true },
          select: {
            id: true,
            sessionId: true,
            firstName: true,
            lastName: true,
            userType: true,
            password: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formater les comptes de test
    const testAccounts = accounts.flatMap(account => 
      account.userSessions.map(session => ({
        name: `${session.firstName} ${session.lastName} (${account.subscriptionType})`,
        sessionId: session.sessionId,
        password: session.password, // En production, ne pas exposer les mots de passe
        type: session.userType,
        subscriptionType: account.subscriptionType,
        email: account.email
      }))
    );

    res.json({
      success: true,
      data: testAccounts
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des comptes de test:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

