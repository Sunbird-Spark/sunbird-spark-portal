import express from 'express';
import { userProxy } from '../proxies/userProxy.js';
import { kongProxy } from '../proxies/kongProxy.js';
import { validateRecaptcha } from '../middlewares/googleAuth.js';
import { handlePassword } from '../middlewares/passwordHandler.js';
import { keycloak } from '../auth/keycloakProvider.js';

const router = express.Router();

router.post('/user/v1/fuzzy/search', validateRecaptcha, userProxy);
router.post('/user/v1/password/reset', handlePassword, userProxy);
router.post('/otp/v1/verify', kongProxy);
router.post('/user/v2/signup', handlePassword, kongProxy);

const recaptchaProtectedRoutes: string[] = [
    '/user/v1/exists/email/:emailId',
    '/user/v1/exists/phone/:phoneNumber',
    '/user/v1/get/phone/*rest',
    '/user/v1/get/email/*rest',
    '/otp/v1/generate',
];

// Note: routes are mounted at /portal, so we adjust paths if needed. 
// app.ts uses: app.all(recaptchaProtectedRoutes, ...) where routes start with /portal
// If we mount this router at /portal, we should remove /portal prefix from paths here?
// app.ts has: '/portal/user/v1/exists/email/:emailId'
// If mounted at /portal, path should be '/user/v1/exists/email/:emailId'

router.all(recaptchaProtectedRoutes, validateRecaptcha, kongProxy);

// The catch-all proxy route
// app.ts has: app.all('/portal/*rest', ...)
// If mounted at /portal, path is '/*rest'
router.all('/*rest', keycloak.middleware({ admin: '/home', logout: '/portal/logout' }),
    keycloak.protect(),
    kongProxy);

export default router;
