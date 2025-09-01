import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import routes from "./routes";

// Configuration des variables d'environnement
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : []
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// CORS sécurisé avec support des cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // IMPORTANT pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Middleware des cookies (AVANT les routes)
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret-change-me'));

// Logging structuré
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: NODE_ENV === 'development' ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn('🚨 Rate limit global dépassé:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    res.status(429).json({ 
      error: 'Trop de requêtes, réessayez plus tard',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Routes de base avec health checks
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

app.get('/test-db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    res.json({
      success: true,
      message: 'Connexion DB réussie',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur test DB:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de connexion DB',
      timestamp: new Date().toISOString()
    });
  }
});

// Toutes les routes de l'API avec rate limiting global
app.use('/api', globalLimiter, routes);

// 404 handler
app.use('*', (req, res) => {
  console.warn('🚫 Route non trouvée:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
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
  
  if (error.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Conflit de données',
      code: 'DATA_CONFLICT',
      timestamp: new Date().toISOString()
    });
  }
  
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

    console.log(`🚀 Serveur KATIOPA démarré sur le port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API: http://localhost:${PORT}/api`);
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

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});
