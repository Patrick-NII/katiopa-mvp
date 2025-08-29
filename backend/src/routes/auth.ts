import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();
const router = Router();

// Validation des données avec Zod
const loginSchema = z.object({
  sessionId: z.string().min(3).max(50).trim(),
  password: z.string().min(8).max(128)
});

// Ancien schéma (non utilisé) conservé à titre indicatif
const registerSchema = z.object({
  sessionId: z.string().min(3).max(50).trim(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  userType: z.enum(['PARENT', 'CHILD']).default('PARENT')
});

// Nouveau schéma pour l'inscription de compte + membres de famille
const registerAccountSchema = z.object({
  email: z.string().email().max(100),
  // Accepte les types frontend (STARTER/PRO/PREMIUM) et backend (FREE/PRO/PRO_PLUS/ENTERPRISE)
  subscriptionType: z.enum(['STARTER', 'PRO', 'PREMIUM', 'FREE', 'PRO_PLUS', 'ENTERPRISE']).default('STARTER'),
  maxSessions: z.number().min(1).max(10).default(2),
  familyMembers: z.array(z.object({
    firstName: z.string().min(2).max(50).trim(),
    lastName: z.string().min(2).max(50).trim(),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
    userType: z.enum(['PARENT', 'CHILD']).default('CHILD'),
    dateOfBirth: z.string().optional(),
    grade: z.string().max(20).optional(),
    // Champ utilisé par le frontend pour l'identifiant de connexion (sessionId)
    username: z.string().min(3).max(50).trim().optional(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(1)
  })).min(1).max(10)
});

// Utilitaires locaux
function generateUniqueSessionId(firstName: string, lastName: string): string {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return `${initials}_${timestamp}_${random}`;
  } catch (error) {
    return `USER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

function mapSubscriptionToBackend(type: string): 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE' {
  switch (type) {
    case 'STARTER':
    case 'FREE':
      return 'FREE';
    case 'PRO':
      return 'PRO';
    case 'PREMIUM':
    case 'PRO_PLUS':
      return 'PRO_PLUS';
    case 'ENTERPRISE':
      return 'ENTERPRISE';
    default:
      return 'FREE';
  }
}

// Rate limiting STRICT pour l'authentification
const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10'), // 10 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    // Log de suspicion de brute-force
    console.warn('🚨 Suspicion de brute-force détectée:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      endpoint: req.path
    });
    
    res.status(429).json({ 
      error: 'Trop de tentatives, réessayez plus tard',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '300000') / 1000)
    });
  }
});

// Route de connexion sécurisée
router.post('/login', authRateLimit, async (req, res) => {
  try {
    // Validation des données
    const { sessionId, password } = loginSchema.parse(req.body);
    
    // Recherche de l'utilisateur
    const userSession = await prisma.userSession.findFirst({
      where: { sessionId },
      include: { account: true }
    });
    
    if (!userSession) {
      // Log de tentative échouée (sans révéler d'informations sensibles)
      console.warn('⚠️ Tentative de connexion échouée - utilisateur non trouvé:', {
        sessionId: sessionId.substring(0, 3) + '***', // Masquage partiel
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        error: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Vérification du mot de passe (HASHÉ)
    let isValidPassword = false;
    
    if (userSession.password && userSession.password.startsWith('$2a$')) {
      // Mot de passe déjà hashé avec bcrypt
      isValidPassword = await bcrypt.compare(password, userSession.password);
    } else if (userSession.password === password) {
      // Mot de passe en clair (MIGRATION IMMÉDIATE REQUISE)
      console.warn('⚠️ Mot de passe en clair détecté, migration immédiate:', {
        sessionId: userSession.sessionId,
        userId: userSession.id,
        timestamp: new Date().toISOString()
      });
      
      isValidPassword = true;
      
      // MIGRATION IMMÉDIATE: Hasher le mot de passe
      try {
        const hashedPassword = await bcrypt.hash(password, 12); // Cost 12 pour la sécurité
        await prisma.userSession.update({
          where: { id: userSession.id },
          data: { 
            password: hashedPassword // Remplace le mot de passe en clair par le hash
          }
        });
        
        console.info('✅ Mot de passe migré vers hash:', {
          sessionId: userSession.sessionId,
          userId: userSession.id,
          timestamp: new Date().toISOString()
        });
      } catch (migrationError) {
        console.error('❌ Erreur lors de la migration du mot de passe:', migrationError);
        // Continuer avec la connexion même si la migration échoue
      }
    }
    
    if (!isValidPassword) {
      // Log de tentative échouée
      console.warn('⚠️ Tentative de connexion échouée - mot de passe incorrect:', {
        sessionId: userSession.sessionId,
        userId: userSession.id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        error: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Génération du token JWT (courte durée pour la sécurité)
    const accessToken = jwt.sign(
      { 
        userId: userSession.id, 
        sessionId: userSession.sessionId,
        accountId: userSession.accountId,
        userType: userSession.userType || 'PARENT'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' } // Réduit de 7 jours à 2h
    );
    
    // Génération du refresh token (plus longue durée)
    const refreshToken = jwt.sign(
      { 
        userId: userSession.id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    
    // Cookie HttpOnly sécurisé pour l'access token
    res.cookie('katiopa_at', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2h
      path: '/'
    });
    
    // Cookie HttpOnly pour le refresh token
    res.cookie('katiopa_rt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/'
    });
    
    // Log de connexion réussie
    console.info('✅ Connexion réussie:', {
      sessionId: userSession.sessionId,
      userId: userSession.id,
      userType: userSession.userType,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Mise à jour de la dernière connexion
    await prisma.userSession.update({
      where: { id: userSession.id },
      data: { 
        lastLoginAt: new Date()
      }
    });
    
    res.json({
      success: true,
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        userType: userSession.userType || 'PARENT',
        subscriptionType: userSession.account?.subscriptionType || 'FREE'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Endpoint de refresh du token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.katiopa_rt;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token manquant',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }
    
    // Vérification du refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'INVALID_TOKEN_TYPE'
      });
    }
    
    // Vérification que l'utilisateur existe toujours
    const userSession = await prisma.userSession.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!userSession) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Génération d'un nouveau access token
    const newAccessToken = jwt.sign(
      { 
        userId: userSession.id, 
        sessionId: userSession.sessionId,
        accountId: userSession.accountId,
        userType: userSession.userType || 'PARENT'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );
    
    // Nouveau cookie
    res.cookie('katiopa_at', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000,
      path: '/'
    });
    
    console.info('🔄 Token rafraîchi:', {
      userId: userSession.id,
      sessionId: userSession.sessionId,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Erreur de refresh:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Refresh token invalide',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout avec invalidation des cookies
router.post('/logout', async (req, res) => {
  try {
    // Récupération de l'utilisateur si possible
    const accessToken = req.cookies?.katiopa_at;
    let userId = null;
    
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
      } catch (error) {
        // Token invalide, continuer avec le logout
      }
    }
    
    // Log de déconnexion
    if (userId) {
      console.info('👋 Déconnexion:', {
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
    
    // Suppression des cookies
    res.clearCookie('katiopa_at', { path: '/' });
    res.clearCookie('katiopa_rt', { path: '/' });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Erreur de logout:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Vérification du token (pour le frontend)
router.get('/verify', async (req, res) => {
  try {
    const accessToken = req.cookies?.katiopa_at;
    
    if (!accessToken) {
      return res.status(401).json({ 
        error: 'Token manquant',
        code: 'TOKEN_MISSING'
      });
    }
    
    // Vérification du token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    
    // Récupération des informations utilisateur
    const userSession = await prisma.userSession.findUnique({
      where: { id: decoded.userId },
      include: { account: true }
    });
    
    if (!userSession) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        userType: userSession.userType || 'PARENT',
        subscriptionType: userSession.account?.subscriptionType || 'FREE'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur de vérification:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;

// Inscription d'un compte + membres (frontend /register)
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, subscriptionType, maxSessions, familyMembers } = registerAccountSchema.parse(req.body);

    // Vérifier doublon d'email
    const existingAccount = await prisma.account.findUnique({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({
        error: 'Un compte avec cet email existe déjà',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    if (familyMembers.length > maxSessions) {
      return res.status(400).json({
        error: `Le plan sélectionné ne permet que ${maxSessions} sessions`,
        code: 'PLAN_LIMIT_EXCEEDED'
      });
    }

    // Vérification mots de passe
    for (const m of familyMembers) {
      if (m.password !== m.confirmPassword) {
        return res.status(400).json({
          error: `Les mots de passe de ${m.firstName} ${m.lastName} ne correspondent pas`,
          code: 'PASSWORD_MISMATCH'
        });
      }
    }

    const mappedType = mapSubscriptionToBackend(subscriptionType);

    // Création du compte
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType: mappedType,
        maxSessions,
        isActive: true,
        totalAccountConnectionDurationMs: 0n
      }
    });

    const sessions: Array<{ firstName: string; lastName: string; sessionId: string; password: string; userType: string; }>
      = [];

    // Vérifier unicité des usernames côté payload
    const usernames = new Set<string>();
    for (const m of familyMembers) {
      if (m.username) {
        const key = m.username.toLowerCase();
        if (usernames.has(key)) {
          return res.status(400).json({
            error: `L'identifiant ${m.username} est en doublon dans la famille`,
            code: 'USERNAME_DUPLICATE'
          });
        }
        usernames.add(key);
      }
    }

    for (const member of familyMembers) {
      try {
        // Calcule l'âge si date de naissance fournie
        let age: number | undefined;
        if (member.dateOfBirth) {
          const birthDate = new Date(member.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age <= 0) age = undefined;
        }

        // Déterminer le sessionId (username fourni ou génération)
        let sessionId = member.username && member.username.trim()
          ? member.username.trim().toUpperCase().replace(/\s+/g, '_')
          : generateUniqueSessionId(member.firstName, member.lastName);

        // S'assurer de l'unicité en base
        const exists = await prisma.userSession.findUnique({ where: { sessionId } });
        if (exists) {
          // Si le username proposé existe déjà, fallback sur un ID généré
          sessionId = generateUniqueSessionId(member.firstName, member.lastName);
        }

        const hashedPassword = await bcrypt.hash(member.password, 12);

        const userSession = await prisma.userSession.create({
          data: {
            sessionId,
            firstName: member.firstName,
            lastName: member.lastName,
            gender: member.gender,
            userType: member.userType,
            age,
            grade: member.grade,
            password: hashedPassword,
            country: 'France',
            timezone: 'Europe/Paris',
            preferences: {
              learningStyle: 'mixed',
              preferredSubjects: ['maths', 'français', 'sciences'],
              interests: ['apprentissage', 'découverte']
            },
            accountId: account.id,
            isActive: true,
            lastLoginAt: null,
            currentSessionStartTime: null,
            totalConnectionDurationMs: 0n
          }
        });

        // Crée un profil pour les enfants
        if (member.userType === 'CHILD') {
          try {
            await prisma.userProfile.create({
              data: {
                userSessionId: userSession.id,
                learningGoals: [
                  'Améliorer les compétences en mathématiques',
                  'Développer la créativité',
                  'Renforcer la confiance en soi'
                ],
                preferredSubjects: ['maths', 'français', 'sciences'],
                learningStyle: 'mixed',
                difficulty: 'adaptative',
                sessionPreferences: { sessionDuration: 30, breakFrequency: 10, rewardSystem: true },
                interests: ['apprentissage', 'découverte', 'jeux éducatifs'],
                specialNeeds: [],
                customNotes: 'Nouvel utilisateur',
                parentWishes: 'Encourager l\'autonomie et la persévérance'
              }
            });
          } catch {
            // Ne bloque pas l'inscription si le profil échoue
          }
        }

        sessions.push({
          firstName: member.firstName,
          lastName: member.lastName,
          sessionId,
          password: member.password,
          userType: member.userType
        });
      } catch (memberError) {
        console.error('❌ Erreur création membre:', memberError);
        return res.status(500).json({
          error: `Erreur lors de la création du membre ${member.firstName}`,
          code: 'MEMBER_CREATION_ERROR'
        });
      }
    }

    // Génère un enregistrement de facturation pour plans payants
    if (mappedType !== 'FREE') {
      const amount = mappedType === 'PRO' ? 9.99 : mappedType === 'PRO_PLUS' ? 19.99 : 49.99;
      try {
        await prisma.billingRecord.create({
          data: {
            accountId: account.id,
            amount,
            currency: 'EUR',
            description: `Abonnement ${mappedType} - Inscription`,
            status: 'PENDING',
            billingDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paidAt: null
          }
        });
      } catch (billingErr) {
        console.warn('⚠️ Erreur facturation:', billingErr);
      }
    }

    return res.json({
      success: true,
      message: 'Compte créé avec succès',
      account: {
        id: account.id,
        email: account.email,
        subscriptionType: account.subscriptionType,
        maxSessions: account.maxSessions,
        createdAt: account.createdAt
      },
      sessions
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

