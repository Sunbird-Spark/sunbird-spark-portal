import express from 'express';
import { userProxy } from '../proxies/userProxy.js';
import { kongProxy } from '../proxies/kongProxy.js';
import { viewerProxy } from '../proxies/viewerProxy.js';
import { validateRecaptcha } from '../middlewares/googleAuth.js';
import { handlePassword } from '../middlewares/passwordHandler.js';
import { requireAuth } from '../auth/oidcMiddleware.js';

const router = express.Router();

router.post('/user/v1/fuzzy/search', validateRecaptcha, userProxy);
router.post('/user/v1/password/reset', handlePassword, userProxy);
router.post('/otp/v1/verify', kongProxy);
router.post('/user/v2/signup', handlePassword, kongProxy);

// Viewer Service routes - registered above the catch-all so they resolve to
// viewerProxy instead of kongProxy. Confirmed route list (method + path):
//   POST   /v1/view/start
//   POST   /v1/view/update
//   POST   /v1/assessment/submit
//   POST   /v1/view/end
//   POST   /v1/view/read
//   POST   /v1/assessment/read
//   GET    /v1/summary/list/:userId
//   POST   /v1/summary/read
//   DELETE /v1/summary/delete/:userId          (?all=true for all enrolments, else specific)
//   GET    /v1/summary/download/:userId        (?format=csv)
router.post('/v1/view/start', requireAuth(), viewerProxy);
router.post('/v1/view/update', requireAuth(), viewerProxy);
router.post('/v1/assessment/submit', requireAuth(), viewerProxy);
router.post('/v1/view/end', requireAuth(), viewerProxy);
router.post('/v1/view/read', requireAuth(), viewerProxy);
router.post('/v1/assessment/read', requireAuth(), viewerProxy);
router.get('/v1/summary/list/:userId', requireAuth(), viewerProxy);
router.post('/v1/summary/read', requireAuth(), viewerProxy);
router.delete('/v1/summary/delete/:userId', requireAuth(), viewerProxy);
router.get('/v1/summary/download/:userId', requireAuth(), viewerProxy);

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
