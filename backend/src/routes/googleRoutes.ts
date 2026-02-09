import { Router } from 'express';
import { initiateGoogleAuth, handleGoogleAuthCallback } from '../controllers/googleController.js';

const router = Router();

router.get('/auth', initiateGoogleAuth);
router.get('/auth/callback', handleGoogleAuthCallback);

export default router;
