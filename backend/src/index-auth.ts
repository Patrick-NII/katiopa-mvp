import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

// Middleware de base
app.use(helmet({
  contentSecurityPolicy: false,
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

// Route d'authentification simplifiée
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { sessionId, password } = req.body;
    
    if (!sessionId || !password) {
      return res.status(400).json({ error: 'ID de session et mot de passe requis' });
    }

    // Recherche de l'utilisateur par sessionId
    const user = await prisma.userSession.findFirst({
      where: { sessionId },
      include: {
        account: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: user.sessionId,
        accountId: user.accountId,
        userType: user.userType || 'PARENT'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        sessionId: user.sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType || 'PARENT',
        subscriptionType: user.account?.subscriptionType || 'STARTER'
      }
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route de vérification du token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await prisma.userSession.findUnique({
      where: { id: decoded.userId },
      include: { account: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        sessionId: user.sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType || 'PARENT',
        subscriptionType: user.account?.subscriptionType || 'STARTER'
      }
    });

  } catch (error) {
    console.error('❌ Erreur de vérification:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});

// Route des statistiques simplifiée
app.get('/api/stats/summary', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Récupération des activités de l'utilisateur
    const activities = await prisma.activity.findMany({
      where: { userSessionId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calcul du temps total
    const totalTimeMs = activities.reduce((total, activity) => {
      if (activity.duration) {
        return total + activity.duration;
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
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
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
  
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', async () => {
  console.log('🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});
