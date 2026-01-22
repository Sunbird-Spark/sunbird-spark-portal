import { Router } from 'express';
import { create, read, update, listAll } from '../controllers/formController.js';
import { validateCreateAPI, validateReadAPI, validateUpdateAPI, validateListAPI } from '../middlewares/formValidator.js';

const router = Router();

router.post('/create', validateCreateAPI, create);
router.post('/read', validateReadAPI, read);
router.post('/update', validateUpdateAPI, update);
router.post('/list', validateListAPI, listAll);

export default router;
