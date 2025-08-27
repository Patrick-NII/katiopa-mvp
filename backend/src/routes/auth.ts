import { Router } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { apiError } from "../utils/errors";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// Schéma de connexion avec sessionId et password
const loginSchema = z.object({
  sessionId: z.string().min(3, { message: 'ID de session requis' }),
  password: z.string().min(1, { message: 'Mot de passe requis' })
});

// Route de connexion
router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(apiError('Validation échouée', 'VALIDATION_ERROR', parse.error.flatten()));
  }
  
  const { sessionId, password } = parse.data;
  
  try {
    // Rechercher la session utilisateur
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        account: true
      }
    });
    
    if (!userSession) {
      return res.status(401).json(apiError('Identifiants incorrects', 'INVALID_CREDENTIALS'));
    }
    
    // Vérifier le mot de passe
    if (userSession.password !== password) {
      return res.status(401).json(apiError('Identifiants incorrects', 'INVALID_CREDENTIALS'));
    }
    
    // Vérifier que la session est active
    if (!userSession.isActive) {
      return res.status(401).json(apiError('Session désactivée', 'SESSION_DISABLED'));
    }
    
    // Mettre à jour la dernière connexion
    await prisma.userSession.update({
      where: { id: userSession.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Créer le token JWT avec les informations de session
    const token = jwt.sign({ 
      sessionId: userSession.sessionId,
      userId: userSession.id,
      accountId: userSession.accountId,
      userType: userSession.userType
    }, JWT_SECRET, { expiresIn: "7d" });
    
    // Retourner les données utilisateur et le token
    return res.json({
      token,
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        email: userSession.account.email,
        gender: userSession.gender,
        userType: userSession.userType,
        age: userSession.age,
        grade: userSession.grade,
        subscriptionType: userSession.account.subscriptionType,
        createdAt: userSession.createdAt,
        accountId: userSession.accountId
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json(apiError('Erreur interne du serveur', 'INTERNAL_ERROR'));
  }
});

// Route pour récupérer le profil utilisateur
router.get("/me", async (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.json({ user: null });
  }
  
  try {
    const payload = jwt.verify(auth.replace("Bearer ", ""), JWT_SECRET) as any;
    
    // Rechercher la session utilisateur par l'ID de session
    const userSession = await prisma.userSession.findUnique({
      where: { sessionId: payload.sessionId },
      include: {
        account: true,
        profile: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!userSession) {
      return res.json({ user: null });
    }
    
    // Retourner les données complètes
    return res.json({
      user: {
        id: userSession.id,
        sessionId: userSession.sessionId,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        email: userSession.account.email,
        gender: userSession.gender,
        userType: userSession.userType,
        age: userSession.age,
        grade: userSession.grade,
        country: userSession.country,
        timezone: userSession.timezone,
        preferences: userSession.preferences,
        subscriptionType: userSession.account.subscriptionType,
        createdAt: userSession.createdAt,
        accountId: userSession.accountId,
        account: {
          id: userSession.account.id,
          email: userSession.account.email,
          subscriptionType: userSession.account.subscriptionType,
          maxSessions: userSession.account.maxSessions,
          createdAt: userSession.account.createdAt,
          totalAccountConnectionDurationMs: userSession.account.totalAccountConnectionDurationMs
        },
        profile: userSession.profile,
        recentActivities: userSession.activities
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return res.json({ user: null });
  }
});

// Route pour récupérer toutes les sessions d'un compte
router.get("/sessions/:accountId", async (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json(apiError('Non autorisé', 'UNAUTHORIZED'));
  }
  
  try {
    const payload = jwt.verify(auth.replace("Bearer ", ""), JWT_SECRET) as any;
    const { accountId } = req.params;
    
    // Vérifier que l'utilisateur appartient à ce compte
    if (payload.accountId !== accountId) {
      return res.status(403).json(apiError('Accès interdit', 'FORBIDDEN'));
    }
    
    // Récupérer toutes les sessions du compte
    const sessions = await prisma.userSession.findMany({
      where: { accountId },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        gender: true,
        userType: true,
        age: true,
        grade: true,
        isActive: true,
        createdAt: true
      }
    });
    
    return res.json({ sessions });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return res.status(500).json(apiError('Erreur interne du serveur', 'INTERNAL_ERROR'));
  }
});

export default router;
