import { Request, Response, NextFunction } from 'express';
import { requireAuth as authMiddleware } from '../middleware/auth';

export const requireAuth = authMiddleware;
