import { Router } from 'express';
import { FormController } from '../controllers/formController.js';

const router = Router();
const formController = new FormController();

router.post('/create', (req, res) => formController.create(req, res));
router.post('/read', (req, res) => formController.read(req, res));
router.post('/update', (req, res) => formController.update(req, res));
router.post('/list', (req, res) => formController.listAll(req, res));

export default router;
