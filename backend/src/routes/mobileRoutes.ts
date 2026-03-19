import { Router } from 'express';
import { handleMobileKeycloakLogin } from '../controllers/mobileKeycloakController.js';
import { handleMobileGoogleLogin } from '../controllers/mobileGoogleController.js';
import { handleMobileTokenRefresh } from '../controllers/mobileTokenRefreshController.js';

const router = Router();

// Native username/password login for Android/mobile
router.post('/keycloak/login', handleMobileKeycloakLogin);

// Google Sign-In for Android (and iOS) via native SDK ID token
router.post('/google/auth/android', handleMobileGoogleLogin);

// Token refresh for all whitelisted mobile clients
router.post('/auth/v1/refresh/token', handleMobileTokenRefresh);

export default router;
