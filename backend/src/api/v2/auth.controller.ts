// Contrôleur d'authentification v2
// Gestion des connexions parent et enfant
// Minimal-diff: réutilisation des utilitaires existants

import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { mapSubscriptionTypeToPlan } from "../../domain/plan/planPolicy";

const prisma = new PrismaClient();

// Schémas de validation
const parentSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  subscriptionType: z.enum(["FREE", "PRO", "PRO_PLUS", "ENTERPRISE"]).default("FREE")
});

const parentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const childLoginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(1),
  accountId: z.string().optional() // Optionnel pour la recherche
});

/**
 * Inscription d'un nouveau parent
 * POST /api/v2/auth/parent/signup
 */
export async function parentSignup(req: Request, res: Response): Promise<void> {
  try {
    // Validation des données
    const validationResult = parentSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        message: "Données invalides",
        details: validationResult.error.errors 
      });
    }
    
    const { email, password, firstName, lastName, subscriptionType } = validationResult.data;
    
    // Vérification que l'email n'existe pas déjà
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });
    
    if (existingAccount) {
      return res.status(409).json({ 
        error: "EMAIL_ALREADY_EXISTS",
        message: "Cette adresse email est déjà utilisée" 
      });
    }
    
    // Hachage du mot de passe
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Mappage du plan
    const plan = mapSubscriptionTypeToPlan(subscriptionType);
    
    // Création du compte parent
    const account = await prisma.account.create({
      data: {
        email,
        subscriptionType,
        plan,
        maxSessions: subscriptionType === "FREE" ? 1 : subscriptionType === "PRO" ? 2 : 4
      }
    });
    
    // Création du plan seat
    const maxChildren = subscriptionType === "FREE" ? 1 : subscriptionType === "PRO" ? 2 : 4;
    await prisma.planSeat.create({
      data: {
        accountId: account.id,
        maxChildren
      }
    });
    
    // Création du membre parent admin
    const parentMember = await prisma.accountMember.create({
      data: {
        accountId: account.id,
        role: "PARENT_ADMIN",
        username: email.split('@')[0], // Username basé sur l'email
        passwordHash,
        displayName: `${firstName} ${lastName}`,
        status: "active"
      }
    });
    
    // Génération du JWT
    const token = jwt.sign(
      {
        accountId: account.id,
        memberId: parentMember.id,
        role: "PARENT_ADMIN",
        plan: plan
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ Compte parent créé: ${email} avec plan ${plan}`);
    
    res.status(201).json({
      success: true,
      message: "Compte parent créé avec succès",
      token,
      account: {
        id: account.id,
        email: account.email,
        plan: account.plan,
        subscriptionType: account.subscriptionType
      },
      member: {
        id: parentMember.id,
        username: parentMember.username,
        displayName: parentMember.displayName,
        role: parentMember.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur inscription parent:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Connexion d'un parent
 * POST /api/v2/auth/parent/login
 */
export async function parentLogin(req: Request, res: Response): Promise<void> {
  try {
    // Validation des données
    const validationResult = parentLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        message: "Données invalides",
        details: validationResult.error.errors 
      });
    }
    
    const { email, password } = validationResult.data;
    
    // Recherche du compte et du membre parent
    const account = await prisma.account.findUnique({
      where: { email },
      include: {
        planSeat: true
      }
    });
    
    if (!account) {
      return res.status(401).json({ 
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    // Recherche du membre parent admin
    const parentMember = await prisma.accountMember.findFirst({
      where: {
        accountId: account.id,
        role: "PARENT_ADMIN",
        status: "active"
      }
    });
    
    if (!parentMember) {
      return res.status(401).json({ 
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    // Vérification du mot de passe
    const isValidPassword = await compare(password, parentMember.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    // Génération du JWT
    const token = jwt.sign(
      {
        accountId: account.id,
        memberId: parentMember.id,
        role: "PARENT_ADMIN",
        plan: account.plan
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ Connexion parent réussie: ${email}`);
    
    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      account: {
        id: account.id,
        email: account.email,
        plan: account.plan,
        subscriptionType: account.subscriptionType
      },
      member: {
        id: parentMember.id,
        username: parentMember.username,
        displayName: parentMember.displayName,
        role: parentMember.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion parent:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Connexion d'un enfant
 * POST /api/v2/auth/child/login
 */
export async function childLogin(req: Request, res: Response): Promise<void> {
  try {
    // Validation des données
    const validationResult = childLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        message: "Données invalides",
        details: validationResult.error.errors 
      });
    }
    
    const { username, password, accountId } = validationResult.data;
    
    // Recherche du membre enfant
    let childMember;
    
    if (accountId) {
      // Recherche dans un compte spécifique
      childMember = await prisma.accountMember.findFirst({
        where: {
          accountId,
          username,
          role: "CHILD_MEMBER",
          status: "active"
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              plan: true,
              subscriptionType: true
            }
          }
        }
      });
    } else {
      // Recherche globale (plus lente mais plus flexible)
      childMember = await prisma.accountMember.findFirst({
        where: {
          username,
          role: "CHILD_MEMBER",
          status: "active"
        },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              plan: true,
              subscriptionType: true
            }
          }
        }
      });
    }
    
    if (!childMember) {
      return res.status(401).json({ 
        error: "INVALID_CREDENTIALS",
        message: "Nom d'utilisateur ou mot de passe incorrect" 
      });
    }
    
    // Vérification du mot de passe
    const isValidPassword = await compare(password, childMember.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: "INVALID_CREDENTIALS",
        message: "Nom d'utilisateur ou mot de passe incorrect" 
      });
    }
    
    // Génération du JWT
    const token = jwt.sign(
      {
        accountId: childMember.account.id,
        memberId: childMember.id,
        role: "CHILD_MEMBER",
        plan: childMember.account.plan
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ Connexion enfant réussie: ${username} dans le compte ${childMember.account.email}`);
    
    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      account: {
        id: childMember.account.id,
        email: childMember.account.email,
        plan: childMember.account.plan,
        subscriptionType: childMember.account.subscriptionType
      },
      member: {
        id: childMember.id,
        username: childMember.username,
        displayName: childMember.displayName,
        role: childMember.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion enfant:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Informations sur l'utilisateur connecté
 * GET /api/v2/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Récupération des informations du compte
    const account = await prisma.account.findUnique({
      where: { id: auth.accountId },
      include: {
        planSeat: true
      }
    });
    
    if (!account) {
      return res.status(404).json({ 
        error: "ACCOUNT_NOT_FOUND",
        message: "Compte non trouvé" 
      });
    }
    
    // Récupération des informations du membre
    const member = await prisma.accountMember.findUnique({
      where: { id: auth.memberId }
    });
    
    if (!member) {
      return res.status(404).json({ 
        error: "MEMBER_NOT_FOUND",
        message: "Membre non trouvé" 
      });
    }
    
    // Récupération des permissions
    const { getUserPermissions } = require("../../domain/auth/rbac");
    const permissions = getUserPermissions(auth);
    
    res.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        plan: account.plan,
        subscriptionType: account.subscriptionType,
        maxSessions: account.maxSessions
      },
      member: {
        id: member.id,
        username: member.username,
        displayName: member.displayName,
        role: member.role,
        status: member.status
      },
      plan: {
        maxChildren: account.planSeat?.maxChildren || 1,
        permissions
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

