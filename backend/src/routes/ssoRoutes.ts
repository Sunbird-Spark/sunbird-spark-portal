import { Router } from 'express';
import { initiateSsoAuth, handleSsoAuthCallback } from '../controllers/ssoController.js';
import { sessionMiddleware, anonymousMiddlewares } from '../middlewares/conditionalSession.js';

const router = Router();

// Session middleware is required — both handlers read/write req.session.ssoOAuth
router.get('/:provider/auth', sessionMiddleware, initiateSsoAuth);
// anonymousMiddlewares ensures a valid Kong device token is in the session before
// handleSsoAuthCallback calls getUserByEmail / createUserWithEmail.
// Without it, resolveKongBearerToken falls back to KONG_ANONYMOUS_FALLBACK_TOKEN
// which lacks the permissions for /user/v1/exists/email → 400.
router.get('/:provider/auth/callback', sessionMiddleware, ...anonymousMiddlewares, handleSsoAuthCallback);

export default router;
