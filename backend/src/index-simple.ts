import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

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

// Middleware de base
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour le développement
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Trop de tentatives, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes de base
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Erreur de santé:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    res.json({
      success: true,
      message: 'Connexion DB réussie',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur test DB:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de connexion DB'
    });
  }
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API v2 fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erreur globale:', error);
  
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Conflit de données' });
  }
  
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test DB: http://localhost:${PORT}/test-db`);
  console.log(`🔌 Test API: http://localhost:${PORT}/api/test`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});


