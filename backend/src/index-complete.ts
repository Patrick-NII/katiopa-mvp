import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Configuration des variables d'environnement
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialisation de Prisma
const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Configuration Express
const app = express();

// Middleware de sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS sécurisé avec support des cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware des cookies
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret-change-me'));

// Logging et parsing
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting strict pour l'authentification
const authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: 'connected',
      security: {
        jwtEnabled: !!process.env.JWT_SECRET,
        cookiesEnabled: !!process.env.COOKIE_SECRET,
        rateLimiting: 'enabled'
      }
    });
  } catch (error) {
    console.error('❌ Erreur de santé:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ===== ROUTES D'AUTHENTIFICATION =====

// Schéma de validation pour la connexion
const loginSchema = z.object({
  sessionId: z.string().min(3).max(50).trim(),
  password: z.string().min(8).max(128)
});

// Route de connexion sécurisée
app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    // Validation des données
    const { sessionId, password } = loginSchema.parse(req.body);
    
    // Recherche de l'utilisateur
    const userSession = await prisma.userSession.findFirst({
      where: { sessionId },
      include: { account: true }
    });

    if (!userSession) {
      console.warn('⚠️ Tentative de connexion échouée - utilisateur non trouvé:', {
        sessionId: sessionId.substring(0, 3) + '***',
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        error: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérification du mot de passe
    let isValidPassword = false;
    
    if (userSession.password && userSession.password.startsWith('$2a$')) {
      // Mot de passe déjà hashé
      isValidPassword = await bcrypt.compare(password, userSession.password);
    } else if (userSession.password === password) {
      // Mot de passe en clair (migration immédiate)
      console.warn('⚠️ Mot de passe en clair détecté, migration immédiate:', {
        sessionId: userSession.sessionId,
        userId: userSession.id,
        timestamp: new Date().toISOString()
      });
      
      isValidPassword = true;
      
      // Migration immédiate
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.userSession.update({
          where: { id: userSession.id },
          data: { password: hashedPassword }
        });
        
        console.info('✅ Mot de passe migré vers hash:', {
          sessionId: userSession.sessionId,
          userId: userSession.id,
          timestamp: new Date().toISOString()
        });
      } catch (migrationError) {
        console.error('❌ Erreur lors de la migration du mot de passe:', migrationError);
      }
    }

    if (!isValidPassword) {
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

    // Génération du token JWT
    const accessToken = jwt.sign(
      { 
        userId: userSession.id, 
        sessionId: userSession.sessionId,
        accountId: userSession.accountId,
        userType: userSession.userType || 'PARENT'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );

    // Cookie HttpOnly sécurisé
    res.cookie('katiopa_at', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2h
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
      data: { lastLoginAt: new Date() }
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

// ===== ROUTES D'INSCRIPTION =====

// Schéma de validation pour l'inscription
const registerSchema = z.object({
  email: z.string().email().max(100),
  subscriptionType: z.enum(['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE']).default('FREE'),
  maxSessions: z.number().min(1).max(10).default(2),
  familyMembers: z.array(z.object({
    firstName: z.string().min(2).max(50).trim(),
    lastName: z.string().min(2).max(50).trim(),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
    userType: z.enum(['PARENT', 'CHILD']).default('CHILD'),
    dateOfBirth: z.string().optional(),
    grade: z.string().max(20).optional(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(1)
  })).min(1).max(10)
});

// Route d'inscription
app.post('/api/auth/register', globalLimiter, async (req, res) => {
  try {
    // Validation des données
    const { email, subscriptionType, maxSessions, familyMembers } = registerSchema.parse(req.body);
    
    // Vérification de l'unicité de l'email
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return res.status(400).json({ 
        error: 'Un compte avec cet email existe déjà',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Vérification de la cohérence des données
    if (familyMembers.length > maxSessions) {
      return res.status(400).json({ 
        error: `Le plan ${subscriptionType} ne permet que ${maxSessions} sessions`,
        code: 'PLAN_LIMIT_EXCEEDED'
      });
    }

    // Vérification des mots de passe
    for (const member of familyMembers) {
      if (member.password !== member.confirmPassword) {
        return res.status(400).json({ 
          error: `Les mots de passe de ${member.firstName} ${member.lastName} ne correspondent pas`,
          code: 'PASSWORD_MISMATCH'
        });
      }
    }

    // Création du compte principal
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        maxSessions,
        totalAccountConnectionDurationMs: 0n
      }
    });

    console.log(`✅ Compte créé: ${email} (${subscriptionType})`);

    // Tableau pour stocker les identifiants de connexion
    const sessionCredentials: Array<{
      firstName: string;
      lastName: string;
      sessionId: string;
      password: string;
      userType: string;
    }> = [];

    // Création des sessions utilisateur
    for (const member of familyMembers) {
      try {
        // Calcul de l'âge si date de naissance fournie
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

        // Génération d'un ID de session unique
        const sessionId = generateUniqueSessionId(member.firstName, member.lastName);

        // Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(member.password, 12);

        // Création de la session utilisateur
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

        console.log(`✅ Session créée pour: ${member.firstName} ${member.lastName} (${sessionId})`);

        // Stockage des identifiants de connexion
        sessionCredentials.push({
          firstName: member.firstName,
          lastName: member.lastName,
          sessionId,
          password: member.password, // Mot de passe en clair pour l'affichage
          userType: member.userType
        });

        // Création du profil utilisateur pour les enfants
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
                sessionPreferences: {
                  sessionDuration: 30,
                  breakFrequency: 10,
                  rewardSystem: true
                },
                interests: ['apprentissage', 'découverte', 'jeux éducatifs'],
                specialNeeds: [],
                customNotes: 'Nouvel utilisateur',
                parentWishes: 'Encourager l\'autonomie et la persévérance'
              }
            });
            console.log(`✅ Profil créé pour: ${member.firstName}`);
          } catch (profileError) {
            console.warn('⚠️ Erreur lors de la création du profil:', profileError);
          }
        }

      } catch (memberError) {
        console.error('❌ Erreur lors de la création du membre:', member.firstName, memberError);
        return res.status(500).json({ 
          error: `Erreur lors de la création du membre ${member.firstName}`,
          code: 'MEMBER_CREATION_ERROR'
        });
      }
    }

    // Création de l'enregistrement de facturation pour les comptes payants
    if (subscriptionType !== 'FREE') {
      try {
        const amount = subscriptionType === 'PRO' ? 9.99 : 
                      subscriptionType === 'PRO_PLUS' ? 19.99 : 49.99;
        
        await prisma.billingRecord.create({
          data: {
            accountId: account.id,
            amount,
            currency: 'EUR',
            description: `Abonnement ${subscriptionType} - Inscription`,
            status: 'PENDING',
            billingDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paidAt: null
          }
        });
        console.log(`✅ Enregistrement de facturation créé pour ${subscriptionType}`);
      } catch (billingError) {
        console.warn('⚠️ Erreur lors de la création de la facturation:', billingError);
      }
    }

    console.log('🎉 Inscription terminée avec succès pour:', email);

    // Envoi de la réponse
    res.json({
      success: true,
      message: 'Compte créé avec succès',
      account: {
        id: account.id,
        email: account.email,
        subscriptionType: account.subscriptionType,
        maxSessions: account.maxSessions,
        createdAt: account.createdAt
      },
      sessions: sessionCredentials,
      instructions: {
        email: `Un email de confirmation a été envoyé à ${email}`,
        login: 'Utilisez vos identifiants de session pour vous connecter',
        support: 'Contactez le support si vous avez des questions'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données d\'inscription invalides',
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

// ===== ROUTES DE VÉRIFICATION ET GESTION =====

// Vérification du token
app.get('/api/auth/verify', async (req, res) => {
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

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('katiopa_at', { path: '/' });
  res.json({ success: true });
});

// ===== ROUTES DES STATISTIQUES =====

// Récupération des statistiques utilisateur
app.get('/api/stats/summary', async (req, res) => {
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

    // Récupération des activités de l'utilisateur
    const activities = await prisma.activity.findMany({
      where: { userSessionId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calcul du temps total
    const totalTimeMs = activities.reduce((total, activity) => {
      if (activity.durationMs) {
        return total + activity.durationMs;
      }
      return total;
    }, 0);

    const totalTime = Math.round(totalTimeMs / 60000); // Conversion en minutes

    // Calcul du score moyen
    const scores = activities.filter(a => a.score !== null).map(a => a.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Domaines d'apprentissage
    const domains = activities
      .filter(a => a.domain)
      .reduce((acc, activity) => {
        const domain = activity.domain!;
        if (!acc[domain]) {
          acc[domain] = { count: 0, totalScore: 0, activities: [] };
        }
        acc[domain].count++;
        if (activity.score) {
          acc[domain].totalScore += activity.score;
        }
        acc[domain].activities.push(activity);
        return acc;
      }, {} as Record<string, any>);

    // Conversion en tableau avec scores moyens
    const domainsArray = Object.entries(domains).map(([name, data]) => ({
      name,
      count: data.count,
      averageScore: data.totalScore / data.count,
      activities: data.activities
    }));

    res.json({
      totalTime,
      averageScore: Math.round(averageScore * 100) / 100,
      totalActivities: activities.length,
      domains: domainsArray
    });

  } catch (error) {
    console.error('❌ Erreur des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ===== ROUTES CUBEMATCH =====
import cubematchRouter from './routes/cubematch';
app.use('/api/cubematch', cubematchRouter);

// ===== ROUTES EXPERIENCES =====
import experiencesRouter from './routes/experiences';
app.use('/api/experiences', experiencesRouter);

// ===== GESTION DES ERREURS =====

// 404 handler
app.use('*', (req, res) => {
  console.warn('🚫 Route non trouvée:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  res.status(404).json({ 
    error: 'Route non trouvée',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erreur globale:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// ===== FONCTIONS UTILITAIRES =====

// Fonction pour générer un ID de session unique
function generateUniqueSessionId(firstName: string, lastName: string): string {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    return `${initials}_${timestamp}_${random}`;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'ID de session:', error);
    // Fallback en cas d'erreur
    return `USER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// ===== DÉMARRAGE DU SERVEUR =====

app.listen(PORT, () => {
  console.log(`🚀 Serveur KATIOPA COMPLET démarré sur le port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/stats/summary`);
  console.log(`🔒 Sécurité: JWT=${!!process.env.JWT_SECRET}, Cookies=${!!process.env.COOKIE_SECRET}`);
  console.log(`🌍 Environnement: ${NODE_ENV}`);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', async () => {
  console.log('🛑 Arrêt du serveur (SIGTERM)...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur (SIGINT)...');
  await prisma.$disconnect();
  process.exit(0);
});
