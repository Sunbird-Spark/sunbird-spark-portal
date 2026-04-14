import { Request, Response } from 'express';
import { ReviewCommentService } from '../services/reviewCommentService.js';
import { Response as ApiResponse } from '../models/Response.js';
import { logger } from '../utils/logger.js';

const reviewCommentService = new ReviewCommentService();

export const createComment = async (req: Request, res: Response) => {
    const apiId = 'api.review.create.comment';
    const response = new ApiResponse(apiId);
    try {
        const data = req.body.request;
        const result = await reviewCommentService.createComment(data);
        response.setResult({ data: result });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error creating comment:', error);
        const statusCode = (error as { statusCode?: number }).statusCode || 500;
        response.setError({
            err: "ERR_CREATE_COMMENT",
            errmsg: (error as Error)?.message || String(error) || 'Unknown error',
            responseCode: statusCode === 404 ? "RESOURCE_NOT_FOUND" : "SERVER_ERROR"
        });
        res.status(statusCode).send(response);
    }
};

export const readComments = async (req: Request, res: Response) => {
    const apiId = 'api.review.read.comment';
    const response = new ApiResponse(apiId);
    try {
        const contextDetails = req.body.request.contextDetails;
        const comments = await reviewCommentService.readComments(contextDetails);
        response.setResult({ data: { comments } });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error reading comments:', error);
        const statusCode = (error as { statusCode?: number }).statusCode || 500;
        response.setError({
            err: "ERR_READ_COMMENTS",
            errmsg: (error as Error)?.message || 'Failed to read comments',
            responseCode: statusCode === 404 ? "RESOURCE_NOT_FOUND" : "SERVER_ERROR"
        });
        res.status(statusCode).send(response);
    }
};

export const deleteComments = async (req: Request, res: Response) => {
    const apiId = 'api.review.delete.comment';
    const response = new ApiResponse(apiId);
    try {
        const contextDetails = req.body.request.contextDetails;
        const result = await reviewCommentService.deleteComments(contextDetails);
        response.setResult({ data: result });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error deleting comments:', error);
        const statusCode = (error as { statusCode?: number }).statusCode || 500;
        response.setError({
            err: "ERR_DELETE_COMMENTS",
            errmsg: (error as Error)?.message || 'Failed to delete comments',
            responseCode: statusCode === 404 ? "RESOURCE_NOT_FOUND" : "SERVER_ERROR"
        });
        res.status(statusCode).send(response);
    }
};
