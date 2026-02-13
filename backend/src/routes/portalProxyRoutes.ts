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

// These routes are defined relative to the mount path of this router.
// When the router is mounted at '/portal', Express will serve them as
// '/portal/user/v1/exists/email/:emailId', '/portal/user/v1/exists/phone/:phoneNumber', etc.
router.all(recaptchaProtectedRoutes, validateRecaptcha, kongProxy);
// The catch-all proxy route
// When this router is mounted at '/portal', this handler will match '/portal/*rest'.
router.all('/*rest', keycloak.middleware({ admin: '/home', logout: '/portal/logout' }),
    keycloak.protect(),
    kongProxy);

export default router;
