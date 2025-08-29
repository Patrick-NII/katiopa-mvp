import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../prisma";
import OpenAI from "openai";
import { apiError } from "../utils/errors";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/evaluate", requireAuth, async (req: AuthRequest, res) => {
  const fallback = {
    assessment: "Tu progresses bien ! Continuons avec des petits défis adaptés.",
    exercises: [
      { title: "Additions faciles (1 chiffre)", nodeKey: "maths.addition.1digit", description: "Résous 5 petites additions pour gagner un badge." },
      { title: "Comparer des nombres", nodeKey: "maths.compare.1digit", description: "Dis quel nombre est le plus grand entre deux." },
      { title: "Formes et couleurs", nodeKey: "coding.logic.shapes", description: "Classe des formes simples par couleur et taille." }
    ]
  };

  try {
    const userSessionId = req.user!.id;
    const focus = (req.body?.focus as string) ?? "maths";

    const activities = await prisma.activity.findMany({
      where: { userSessionId, domain: focus },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const statsText = activities
      .map(a => `${a.createdAt.toISOString()} | ${a.domain} | ${a.nodeKey} | score:${a.score} | attempts:${a.attempts} | durationMs:${a.durationMs}`)
      .join("\n");

    const system = `Tu es un pédagogue pour enfants de 5 à 7 ans.
Analyse des activités (scores 0-100). Fais un court bilan positif, puis propose 3 exercices adaptés,
clairs et motivants, sous forme d'objectifs atteignables. Les exercices doivent référencer un nodeKey (maths.*, francais.*, sciences.* ou coding.*).`;

    const user = `Données récentes:
${statsText}

Contrainte: âge 5-7, langage simple, ton bienveillant. Génère JSON strict.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    });

    let out: any = null;
    try {
      out = JSON.parse(completion.choices[0].message?.content ?? "{}");
    } catch {
      out = null;
    }

    return res.json(out && out.assessment ? out : fallback);
  } catch (error) {
    console.error('❌ Erreur lors de l\'évaluation LLM:', error);
    return res.json(fallback);
  }
});

export default router;