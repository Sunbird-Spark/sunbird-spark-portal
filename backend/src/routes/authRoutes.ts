import { Router } from 'express';
import { getAuthStatus } from '../controllers/authController.js';

const router = Router();

router.get('/info', getAuthStatus);

export default router;
