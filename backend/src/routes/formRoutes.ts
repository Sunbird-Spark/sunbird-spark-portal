import { Router } from 'express';
import { FormController } from '../controllers/formController.js';
import { RequestValidator } from '../middlewares/formValidator.js';

const router = Router();
const formController = new FormController();
const validator = new RequestValidator();

router.post('/create', (req, res, next) => validator.validateCreateAPI(req, res, next), (req, res) => formController.create(req, res));
router.post('/read', (req, res, next) => validator.validateReadAPI(req, res, next), (req, res) => formController.read(req, res));
router.post('/update', (req, res, next) => validator.validateUpdateAPI(req, res, next), (req, res) => formController.update(req, res));
router.post('/list', (req, res, next) => validator.validateListAPI(req, res, next), (req, res) => formController.listAll(req, res));

export default router;
