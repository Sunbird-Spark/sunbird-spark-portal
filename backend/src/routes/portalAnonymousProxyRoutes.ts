import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';

const router = express.Router();

router.get('/content/v1/read/*rest', kongProxy);
router.post('/org/v2/search', kongProxy);
router.get('/data/v1/system/settings/get/*rest', kongProxy);
router.post('/composite/v1/search', kongProxy);

export default router;
