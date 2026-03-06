import { Router } from 'express';
import { initiateGoogleAuth, handleGoogleAuthCallback } from '../controllers/googleController.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';

const router = Router();

// Session middleware is required — both handlers read/write req.session.googleOAuth
router.get('/auth', sessionMiddleware, initiateGoogleAuth);
router.get('/auth/callback', sessionMiddleware, handleGoogleAuthCallback);

export default router;
