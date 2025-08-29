// Contrôleur des membres pour l'API v2
// Gestion des comptes enfants par les parents
// Minimal-diff: réutilisation des utilitaires existants

import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { canCreateChild, seatsForPlan } from "../../domain/plan/planPolicy";
import { assertParentAdmin } from "../../domain/auth/rbac";

const prisma = new PrismaClient();

// Schémas de validation
const createMemberSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, "Username doit contenir uniquement des lettres, chiffres, tirets et underscores"),
  password: z.string().min(4).max(50), // PIN possible
  displayName: z.string().min(1).max(50).optional(),
  ageBracket: z.enum(["5-7", "8-11", "12-15"]).optional(),
  email: z.string().email().optional()
});

const updateMemberSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, "Username doit contenir uniquement des lettres, chiffres, tirets et underscores").optional(),
  password: z.string().min(4).max(50).optional(),
  displayName: z.string().min(1).max(50).optional(),
  ageBracket: z.enum(["5-7", "8-11", "12-15"]).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional()
});

/**
 * Création d'un nouveau membre enfant
 * POST /api/v2/members
 */
export async function createMember(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Vérification du rôle parent admin
    try {
      assertParentAdmin(auth);
    } catch (error) {
      return res.status(403).json({ 
        error: "FORBIDDEN_PARENT_ADMIN_ONLY",
        message: "Seuls les parents administrateurs peuvent créer des membres" 
      });
    }
    
    // Validation des données
    const validationResult = createMemberSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        message: "Données invalides",
        details: validationResult.error.errors 
      });
    }
    
    const { username, password, displayName, ageBracket, email } = validationResult.data;
    
    // Vérification de la limite de sièges
    const limit = seatsForPlan(auth.plan as any);
    if (limit !== "UNLIMITED") {
      const currentCount = await prisma.accountMember.count({ 
        where: { 
          accountId: auth.accountId, 
          role: "CHILD_MEMBER" 
        } 
      });
      
      if (currentCount >= limit) {
        return res.status(402).json({ 
          error: "SEAT_LIMIT_REACHED",
          message: `Limite de ${limit} enfants atteinte pour ce plan`,
          currentCount,
          limit
        });
      }
    }
    
    // Vérification de l'unicité du username dans le compte
    const existingMember = await prisma.accountMember.findFirst({
      where: {
        accountId: auth.accountId,
        username: username
      }
    });
    
    if (existingMember) {
      return res.status(409).json({ 
        error: "USERNAME_ALREADY_EXISTS",
        message: "Ce nom d'utilisateur existe déjà dans ce compte" 
      });
    }
    
    // Hachage du mot de passe
    const passwordHash = await hash(password, 10);
    
    // Création du membre
    const member = await prisma.accountMember.create({
      data: { 
        accountId: auth.accountId, 
        role: "CHILD_MEMBER", 
        username, 
        passwordHash, 
        displayName: displayName || username,
        ageBracket,
        email
      },
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        ageBracket: true,
        email: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Membre créé: ${username} dans le compte ${auth.accountId}`);
    
    res.status(201).json({
      success: true,
      message: "Membre créé avec succès",
      member
    });
    
  } catch (error) {
    console.error('❌ Erreur création membre:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Mise à jour d'un membre existant
 * PATCH /api/v2/members/:id
 */
export async function updateMember(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    const memberId = req.params.id;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Vérification du rôle parent admin
    try {
      assertParentAdmin(auth);
    } catch (error) {
      return res.status(403).json({ 
        error: "FORBIDDEN_PARENT_ADMIN_ONLY",
        message: "Seuls les parents administrateurs peuvent modifier des membres" 
      });
    }
    
    if (!memberId) {
      return res.status(400).json({ 
        error: "MISSING_MEMBER_ID",
        message: "ID du membre manquant" 
      });
    }
    
    // Vérification que le membre appartient au compte
    const existingMember = await prisma.accountMember.findFirst({
      where: {
        id: memberId,
        accountId: auth.accountId,
        role: "CHILD_MEMBER"
      }
    });
    
    if (!existingMember) {
      return res.status(404).json({ 
        error: "MEMBER_NOT_FOUND",
        message: "Membre non trouvé" 
      });
    }
    
    // Validation des données
    const validationResult = updateMemberSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR",
        message: "Données invalides",
        details: validationResult.error.errors 
      });
    }
    
    const updateData: any = { ...validationResult.data };
    
    // Hachage du mot de passe si fourni
    if (updateData.password) {
      updateData.passwordHash = await hash(updateData.password, 10);
      delete updateData.password;
    }
    
    // Mise à jour du membre
    const updatedMember = await prisma.accountMember.update({
      where: { id: memberId },
      data: updateData,
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        ageBracket: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });
    
    console.log(`✅ Membre mis à jour: ${memberId} dans le compte ${auth.accountId}`);
    
    res.json({
      success: true,
      message: "Membre mis à jour avec succès",
      member: updatedMember
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour membre:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Liste des membres du compte
 * GET /api/v2/members
 */
export async function listMembers(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Vérification du rôle parent admin
    try {
      assertParentAdmin(auth);
    } catch (error) {
      return res.status(403).json({ 
        error: "FORBIDDEN_PARENT_ADMIN_ONLY",
        message: "Seuls les parents administrateurs peuvent lister les membres" 
      });
    }
    
    // Récupération des membres
    const members = await prisma.accountMember.findMany({
      where: {
        accountId: auth.accountId,
        role: "CHILD_MEMBER"
      },
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        ageBracket: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Récupération des informations du plan
    const planSeat = await prisma.planSeat.findUnique({
      where: { accountId: auth.accountId }
    });
    
    res.json({
      success: true,
      members,
      plan: {
        current: members.length,
        limit: planSeat?.maxChildren || 1,
        canCreateMore: canCreateChild(auth.plan as any, members.length)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur liste membres:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Détails d'un membre spécifique
 * GET /api/v2/members/:id
 */
export async function getMember(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    const memberId = req.params.id;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    if (!memberId) {
      return res.status(400).json({ 
        error: "MISSING_MEMBER_ID",
        message: "ID du membre manquant" 
      });
    }
    
    // Récupération du membre
    const member = await prisma.accountMember.findFirst({
      where: {
        id: memberId,
        accountId: auth.accountId
      },
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        ageBracket: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!member) {
      return res.status(404).json({ 
        error: "MEMBER_NOT_FOUND",
        message: "Membre non trouvé" 
      });
    }
    
    res.json({
      success: true,
      member
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération membre:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
    });
  }
}

/**
 * Suppression d'un membre (désactivation)
 * DELETE /api/v2/members/:id
 */
export async function deleteMember(req: Request, res: Response): Promise<void> {
  try {
    const auth = (req as any).auth;
    const memberId = req.params.id;
    
    if (!auth) {
      return res.status(401).json({ 
        error: "NOT_AUTHENTICATED",
        message: "Utilisateur non authentifié" 
      });
    }
    
    // Vérification du rôle parent admin
    try {
      assertParentAdmin(auth);
    } catch (error) {
      return res.status(403).json({ 
        error: "FORBIDDEN_PARENT_ADMIN_ONLY",
        message: "Seuls les parents administrateurs peuvent supprimer des membres" 
      });
    }
    
    if (!memberId) {
      return res.status(400).json({ 
        error: "MISSING_MEMBER_ID",
        message: "ID du membre manquant" 
      });
    }
    
    // Vérification que le membre appartient au compte
    const existingMember = await prisma.accountMember.findFirst({
      where: {
        id: memberId,
        accountId: auth.accountId,
        role: "CHILD_MEMBER"
      }
    });
    
    if (!existingMember) {
      return res.status(404).json({ 
        error: "MEMBER_NOT_FOUND",
        message: "Membre non trouvé" 
      });
    }
    
    // Désactivation du membre (pas de suppression physique)
    const updatedMember = await prisma.accountMember.update({
      where: { id: memberId },
      data: { status: "inactive" },
      select: { 
        id: true, 
        username: true, 
        status: true,
        updatedAt: true
      }
    });
    
    console.log(`✅ Membre désactivé: ${memberId} dans le compte ${auth.accountId}`);
    
    res.json({
      success: true,
      message: "Membre désactivé avec succès",
      member: updatedMember
    });
    
  } catch (error) {
    console.error('❌ Erreur désactivation membre:', error);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: "Erreur interne du serveur" 
      });
  }
}

