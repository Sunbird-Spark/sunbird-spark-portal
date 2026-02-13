import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';

const router = express.Router();

router.get('/content/v1/read/*rest', kongProxy);

export default router;
