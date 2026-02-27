import { Router } from 'express';
import { createComment, readComments, deleteComments } from '../controllers/reviewCommentController.js';
import { validateCreateCommentAPI, validateReadCommentAPI, validateDeleteCommentAPI } from '../middlewares/reviewCommentValidator.js';

const router = Router();

router.post('/create/comment', validateCreateCommentAPI, createComment);
router.post('/read/comment', validateReadCommentAPI, readComments);
router.post('/delete/comment', validateDeleteCommentAPI, deleteComments);

export default router;
