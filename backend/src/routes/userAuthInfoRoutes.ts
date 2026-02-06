import { Router } from 'express';
import { getAuthInfo } from '../controllers/authController.js';

const router = Router();

router.get('/info', getAuthInfo);

export default router;
