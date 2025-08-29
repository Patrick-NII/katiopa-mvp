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

// Route d'authentification simplifiée
app.post('/api/auth/login', globalLimiter, async (req, res) => {
  try {
    const { sessionId, password } = req.body;
    
    if (!sessionId || !password) {
      return res.status(400).json({ 
        error: 'ID de session et mot de passe requis',
        code: 'MISSING_CREDENTIALS'
      });
    }

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
        subscriptionType: userSession.account?.subscriptionType || 'STARTER'
      },
      // Ajout du token pour compatibilité avec les tests utilisant Authorization: Bearer
      token: accessToken
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Vérification du token
app.get('/api/auth/verify', async (req, res) => {
  try {
    // Supporte cookie HttpOnly ET Authorization: Bearer
    const authHeader = req.headers.authorization;
    let accessToken = req.cookies?.katiopa_at as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
    
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
        subscriptionType: userSession.account?.subscriptionType || 'STARTER'
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

// Route /api/auth/me (compatibilité tests) — identique à /verify
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken = req.cookies?.katiopa_at as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    if (!accessToken) {
      return res.status(401).json({ 
        error: 'Token manquant',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
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
        subscriptionType: userSession.account?.subscriptionType || 'STARTER'
      }
    });

  } catch (error) {
    console.error('❌ Erreur /auth/me:', error);
    
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

// Démarrage séquentiel: connexion DB puis écoute du port
async function start() {
  try {
    console.log('⏳ Connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Base de données connectée');

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(PORT, () => resolve());
      server.on('error', reject);
    });

    console.log(`🚀 Serveur KATIOPA MINIMAL démarré sur le port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
    console.log(`🧭 Verify: http://localhost:${PORT}/api/auth/verify`);
    console.log(`🔒 Sécurité: JWT=${!!process.env.JWT_SECRET}, Cookies=${!!process.env.COOKIE_SECRET}`);
    console.log(`🌍 Environnement: ${NODE_ENV}`);
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
}

start();

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
