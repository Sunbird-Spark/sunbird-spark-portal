import { Router } from 'express';
import { getAuthInfo } from '../controllers/userAuthInfoController.js';

const router = Router();

router.get('/info', getAuthInfo);

export default router;
