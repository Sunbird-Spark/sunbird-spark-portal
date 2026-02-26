import { Ajv } from 'ajv';
import { Response as ApiResponse } from '../models/Response.js';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

const ajv = new Ajv({ allErrors: true });

const reviewCommentSchemas = {
    create: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    contextDetails: {
                        type: "object",
                        properties: {
                            contentVer: { type: "string", minLength: 1 },
                            contentId: { type: "string", minLength: 1 },
                            contentType: { type: "string", minLength: 1 },
                            stageId: { type: "string" }
                        },
                        required: ["contentVer", "contentId", "contentType"],
                        additionalProperties: true
                    },
                    body: { type: "string", minLength: 1 },
                    userId: { type: "string", minLength: 1 },
                    userInfo: {
                        type: "object",
                        properties: {
                            name: { type: "string", minLength: 1 },
                            logo: { type: "string" }
                        },
                        required: ["name"],
                        additionalProperties: true
                    }
                },
                required: ["contextDetails", "body", "userId", "userInfo"],
                additionalProperties: true
            }
        },
        required: ["request"]
    },
    read: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    contextDetails: {
                        type: "object",
                        properties: {
                            contentVer: { type: "string", minLength: 1 },
                            contentId: { type: "string", minLength: 1 },
                            contentType: { type: "string", minLength: 1 },
                            stageId: { type: "string" }
                        },
                        required: ["contentVer", "contentId", "contentType"],
                        additionalProperties: true
                    }
                },
                required: ["contextDetails"],
                additionalProperties: true
            }
        },
        required: ["request"]
    },
    delete: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    contextDetails: {
                        type: "object",
                        properties: {
                            contentVer: { type: "string", minLength: 1 },
                            contentId: { type: "string", minLength: 1 },
                            contentType: { type: "string", minLength: 1 },
                            stageId: { type: "string" }
                        },
                        required: ["contentVer", "contentId", "contentType"],
                        additionalProperties: true
                    }
                },
                required: ["contextDetails"],
                additionalProperties: true
            }
        },
        required: ["request"]
    }
};

const sendError = (res: Response, apiId: string, errCode: string, message: string) => {
    const response = new ApiResponse(apiId);
    response.setError({
        err: errCode,
        errmsg: message,
        responseCode: "CLIENT_ERROR"
    });
    res.status(400).send(response);
};

const validateRequest = (
    req: Request,
    res: Response,
    next: NextFunction,
    apiId: string,
    errCode: string,
    schema: object
) => {
    try {
        const requestBody = _.get(req, 'body.request');
        if (!requestBody) {
            return sendError(res, apiId, errCode, "Request body is missing");
        }

        const validate = ajv.compile(schema);
        const body = { request: requestBody };

        if (!validate(body)) {
            const errorMsg = validate.errors?.map((d: unknown) => (d as { message: string }).message).join(', ') || 'Validation failed';
            return sendError(res, apiId, errCode, errorMsg);
        }

        next();
    } catch (error) {
        sendError(res, apiId, errCode, (error as Error).message || "Internal Server Error");
    }
};

export const validateCreateCommentAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.review.create.comment",
        "ERR_CREATE_COMMENT",
        reviewCommentSchemas.create
    );
};

export const validateReadCommentAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.review.read.comment",
        "ERR_READ_COMMENTS",
        reviewCommentSchemas.read
    );
};

export const validateDeleteCommentAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.review.delete.comment",
        "ERR_DELETE_COMMENTS",
        reviewCommentSchemas.delete
    );
};
