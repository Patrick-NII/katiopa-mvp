import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../prisma";
import { z } from "zod";
import { apiError } from "../utils/errors";

const router = Router();

const schema = z.object({
  domain: z.enum(["maths", "coding"]),
  nodeKey: z.string().min(3),
  score: z.number().int().min(0).max(100),
  attempts: z.number().int().min(1).default(1),
  durationMs: z.number().int().min(1000)
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(apiError('Validation échouée', 'VALIDATION_ERROR', parse.error.flatten()));
  const { domain, nodeKey, score, attempts, durationMs } = parse.data;
  const a = await prisma.activity.create({
    data: { userId: req.user!.id, domain, nodeKey, score, attempts, durationMs }
  });
  res.status(201).json({ activity: a });
});

export default router;