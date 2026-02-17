import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';
import { read } from '../controllers/formsController.js';
import { validateReadAPI } from '../middlewares/formsValidator.js';


const router = express.Router();

router.get('/content/v1/read/*rest', kongProxy);
router.get('/course/v1/hierarchy/*rest', kongProxy);
router.post('/org/v2/search', kongProxy);
router.get('/data/v1/system/settings/get/*rest', kongProxy);
router.post('/composite/v1/search', kongProxy);
router.post('/data/v1/form/read', validateReadAPI, read);

export default router;
