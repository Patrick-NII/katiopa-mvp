import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/activities", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ activities });
});

router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const rows = await prisma.$queryRaw<Array<{ domain: string; avg: number }>>`
    SELECT domain, AVG(score)::float AS avg
    FROM "Activity"
    WHERE "userId" = ${userId}
    GROUP BY domain
    ORDER BY domain
  `;
  res.json({ summary: rows });
});

export default router;