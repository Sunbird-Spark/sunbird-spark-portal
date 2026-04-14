import { Router } from 'express';
import { initiateGoogleAuth, handleGoogleAuthCallback } from '../controllers/googleController.js';
import { sessionMiddleware, anonymousMiddlewares } from '../middlewares/conditionalSession.js';

const router = Router();

// Session middleware is required — both handlers read/write req.session.googleOAuth
router.get('/auth', sessionMiddleware, initiateGoogleAuth);
// anonymousMiddlewares ensures a valid Kong device token is in the session before
// handleGoogleAuthCallback calls getUserByEmail / createUserWithEmail.
// Without it, resolveKongBearerToken falls back to KONG_ANONYMOUS_FALLBACK_TOKEN
// which lacks the permissions for /user/v1/exists/email → 400.
router.get('/auth/callback', sessionMiddleware, ...anonymousMiddlewares, handleGoogleAuthCallback);

export default router;
