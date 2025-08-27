import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { apiError } from "../utils/errors";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: 'Minimum 6 caractères' }),
  firstName: z.string().min(2, { message: 'Prénom trop court' }),
  lastName: z.string().min(2, { message: 'Nom trop court' }),
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(apiError('Validation échouée', 'VALIDATION_ERROR', parse.error.flatten()))
  const { email, password, firstName, lastName } = parse.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json(apiError('Cet email est déjà utilisé', 'EMAIL_TAKEN'))
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, firstName, lastName } });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, email: user.email, firstName, lastName, role: user.role } });
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: 'Mot de passe requis' })
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(apiError('Validation échouée', 'VALIDATION_ERROR', parse.error.flatten()))
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json(apiError('Identifiants incorrects', 'INVALID_CREDENTIALS'))
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json(apiError('Identifiants incorrects', 'INVALID_CREDENTIALS'))
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

router.get("/me", async (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.json({ user: null });
  try {
    const payload = jwt.verify(auth.replace("Bearer ", ""), JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.json({ user: null });
    return res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch {
    return res.json({ user: null });
  }
});

export default router;
