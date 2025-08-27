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

// Schéma d'inscription
const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  subscriptionType: z.enum(['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE']),
  maxSessions: z.number().min(1).max(10),
  familyMembers: z.array(z.object({
    firstName: z.string().min(2, { message: 'Prénom trop court' }),
    lastName: z.string().min(2, { message: 'Nom trop court' }),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
    userType: z.enum(['CHILD', 'PARENT']),
    dateOfBirth: z.string(),
    grade: z.string().optional()
  })).min(1, { message: 'Au moins un membre requis' })
});

// Route d'inscription
router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(apiError('Validation échouée', 'VALIDATION_ERROR', parse.error.flatten()));
  }
  
  const { email, subscriptionType, maxSessions, familyMembers } = parse.data;
  
  try {
    // Vérifier que l'email n'est pas déjà utilisé
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });
    
    if (existingAccount) {
      return res.status(400).json(apiError('Cet email est déjà utilisé', 'EMAIL_TAKEN'));
    }
    
    // Vérifier que le nombre de membres ne dépasse pas la limite
    if (familyMembers.length > maxSessions) {
      return res.status(400).json(apiError(`Le plan ${subscriptionType} ne permet que ${maxSessions} sessions`));
    }
    
    // Créer le compte principal
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        maxSessions,
        createdAt: new Date(), // Date d'inscription = aujourd'hui
        totalAccountConnectionDurationMs: BigInt(0)
      }
    });
    
    console.log(`✅ Compte créé: ${account.email} (${account.id})`);
    
    // Créer les sessions utilisateur
    const createdSessions = [];
    const sessionCredentials = [];
    
    for (let i = 0; i < familyMembers.length; i++) {
      const member = familyMembers[i];
      
      // Générer un ID de session unique
      const sessionId = `${member.firstName.toUpperCase()}_${String(i + 1).padStart(3, '0')}`;
      
      // Générer un mot de passe simple (en production, utiliser un générateur plus sécurisé)
      const password = `${member.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
      
      // Calculer l'âge
      const birthDate = new Date(member.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Créer la session utilisateur
      const userSession = await prisma.userSession.create({
        data: {
          accountId: account.id,
          sessionId,
          password,
          firstName: member.firstName,
          lastName: member.lastName,
          gender: member.gender,
          userType: member.userType,
          age: age > 0 ? age : undefined,
          grade: member.grade,
          country: 'France', // Par défaut
          timezone: 'Europe/Paris', // Par défaut
          preferences: {
            learningStyle: 'mixed',
            preferredSubjects: ['maths', 'français', 'sciences'],
            interests: ['apprentissage', 'découverte']
          },
          isActive: true,
          createdAt: new Date(), // Date d'inscription = aujourd'hui
          totalConnectionDurationMs: BigInt(0),
          currentSessionStartTime: null
        }
      });
      
      createdSessions.push(userSession);
      sessionCredentials.push({
        sessionId,
        password,
        firstName: member.firstName,
        lastName: member.lastName,
        userType: member.userType,
        age
      });
      
      console.log(`✅ Session créée: ${sessionId} pour ${member.firstName} ${member.lastName}`);
      
      // Créer un profil utilisateur pour les enfants
      if (member.userType === 'CHILD') {
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
      }
    }
    
    // Créer un enregistrement de facturation pour les comptes payants
    if (subscriptionType !== 'FREE') {
      await prisma.billingRecord.create({
        data: {
          accountId: account.id,
          amount: subscriptionType === 'PRO' ? 9.99 : 19.99,
          currency: 'EUR',
          description: `Abonnement ${subscriptionType} - Inscription`,
          status: 'PENDING',
          billingDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          paidAt: null
        }
      });
      
      console.log(`✅ Enregistrement de facturation créé pour ${subscriptionType}`);
    }
    
    // Retourner les informations de connexion
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
      sessions: sessionCredentials,
      instructions: {
        email: `Un email de confirmation a été envoyé à ${email}`,
        login: 'Utilisez vos identifiants de session pour vous connecter',
        support: 'Contactez le support si vous avez des questions'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json(apiError('Erreur interne du serveur', 'INTERNAL_ERROR'));
  }
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
