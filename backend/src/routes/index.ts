import { Router } from "express";
import authRoutes from "./auth";
import statsRoutes from "./stats";
import llmRoutes from "./llm";
import activityRoutes from "./activity";
import chatRoutes from "./chat";
import ragRoutes from "./rag";
import v2Routes from "../api/v2";

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des statistiques
router.use('/stats', statsRoutes);

// Routes LLM
router.use('/llm', llmRoutes);

// Routes des activités
router.use('/activity', activityRoutes);

// Routes du chat IA
router.use('/chat', chatRoutes);

// Routes RAG avancées
router.use('/rag', ragRoutes);

// Routes API v2 - Comptes parent + sous-comptes enfants
router.use('/v2', v2Routes);

export default router;
