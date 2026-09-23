import express, { Request, Response, NextFunction } from 'express';
import { userProxy } from '../proxies/userProxy.js';
import { kongProxy } from '../proxies/kongProxy.js';
import { validateRecaptcha } from '../middlewares/googleAuth.js';
import { handlePassword } from '../middlewares/passwordHandler.js';
import { requireAuth } from '../auth/oidcMiddleware.js';

const router = express.Router();

/**
 * Guards the Viewer summary routes' `:userId` path param against the
 * authenticated caller's own session identity. Without this, any
 * authenticated learner could read/delete another learner's summary data
 * simply by substituting a different `:userId` in the URL - `requireAuth()`
 * only checks that *someone* is logged in, it never scopes by identity.
 */
function requireOwnUserId(req: Request, res: Response, next: NextFunction) {
    const sessionUserId = req.session?.userId;
    if (sessionUserId == null || String(sessionUserId) !== req.params.userId) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}

router.post('/user/v1/fuzzy/search', validateRecaptcha, userProxy);
router.post('/user/v1/password/reset', handlePassword, userProxy);
router.post('/otp/v1/verify', kongProxy);
router.post('/user/v2/signup', handlePassword, kongProxy);

// Viewer Service routes, now fronted by Kong: the client-facing URI is
// `<prefix>/v1/<verb>` and Kong rewrites it onto the service's own
// `/v1/<resource>/<verb>`. Prefixes are the Helm `view_prefix` /
// `assessment_prefix` / `summary_prefix` values.
//
// These all resolve to kongProxy, which is also what the `/*rest` catch-all
// below would give them - so the seven bodyless POST routes are documentation
// of the supported surface rather than load-bearing routing. The three
// `:userId` routes ARE load-bearing: they must stay registered here to pick up
// requireOwnUserId (see above), which the catch-all does not apply.
//
// Confirmed route list (method + path):
//   POST   /view/v1/start
//   POST   /view/v1/update
//   POST   /assessment/v1/submit
//   POST   /view/v1/end
//   POST   /view/v1/read
//   POST   /assessment/v1/read
//   GET    /summary/v1/list/:userId
//   POST   /summary/v1/read
//   DELETE /summary/v1/delete/:userId          (?all=true for all enrolments, else specific)
//   GET    /summary/v1/download/:userId        (?format=csv)
//
// Kong also exposes /view/v1/agg, which the portal does not call.
router.post('/view/v1/start', requireAuth(), kongProxy);
router.post('/view/v1/update', requireAuth(), kongProxy);
router.post('/assessment/v1/submit', requireAuth(), kongProxy);
router.post('/view/v1/end', requireAuth(), kongProxy);
router.post('/view/v1/read', requireAuth(), kongProxy);
router.post('/assessment/v1/read', requireAuth(), kongProxy);
router.get('/summary/v1/list/:userId', requireAuth(), requireOwnUserId, kongProxy);
router.post('/summary/v1/read', requireAuth(), kongProxy);
router.delete('/summary/v1/delete/:userId', requireAuth(), requireOwnUserId, kongProxy);
router.get('/summary/v1/download/:userId', requireAuth(), requireOwnUserId, kongProxy);

const recaptchaProtectedRoutes: string[] = [
    '/user/v1/exists/email/:emailId',
    '/user/v1/exists/phone/:phoneNumber',
    '/otp/v1/generate',
];

// These routes are defined relative to the mount path of this router.
// When the router is mounted at '/portal', Express will serve them as
// '/portal/user/v1/exists/email/:emailId', '/portal/user/v1/exists/phone/:phoneNumber', etc.
router.all(recaptchaProtectedRoutes, validateRecaptcha, kongProxy);
// The catch-all proxy route
// When this router is mounted at '/portal', this handler will match '/portal/*rest'.
router.all('/*rest', requireAuth(), kongProxy);

export default router;
