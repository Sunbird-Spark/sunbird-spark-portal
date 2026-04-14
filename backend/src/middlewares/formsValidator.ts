import { Ajv } from 'ajv';
import { Response as ApiResponse } from '../models/Response.js';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

const ajv = new Ajv({ allErrors: true });

// Common validation schemas
const formSchemas = {
    create: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    type: { type: "string", minLength: 3 },
                    subType: { type: "string", minLength: 1 },
                    action: { type: "string", minLength: 3 },
                    component: { type: "string", minLength: 1 },
                    rootOrgId: { type: "string", minLength: 1 },
                    framework: { type: "string", minLength: 1 },
                    data: { type: "object" }
                },
                required: ["type", "action", "data"],
                additionalProperties: true
            }
        },
        required: ["request"]
    },
    update: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    type: { type: "string", minLength: 3 },
                    subType: { type: "string", minLength: 1 },
                    action: { type: "string", minLength: 3 },
                    component: { type: "string", minLength: 1 },
                    rootOrgId: { type: "string", minLength: 1 },
                    framework: { type: "string", minLength: 1 },
                    data: { type: "object" }
                },
                required: ["type", "action", "data"],
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
                    type: { type: "string", minLength: 3 },
                    subType: { type: "string", minLength: 1 },
                    action: { type: "string", minLength: 3 },
                    component: { type: "string", minLength: 1 },
                    rootOrgId: { type: "string", minLength: 1 },
                    framework: { type: "string", minLength: 1 }
                },
                required: ["type", "action"],
                additionalProperties: true
            }
        },
        required: ["request"]
    },
    list: {
        type: "object",
        properties: {
            request: {
                type: "object",
                properties: {
                    rootOrgId: { type: "string", minLength: 1 }
                },
                required: ["rootOrgId"],
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
    schema: object,
    fields: string[],
    checkFramework = true
) => {
    try {
        const requestBody = _.get(req, 'body.request');
        if (!requestBody) {
            return sendError(res, apiId, errCode, "Request body is missing");
        }

        const validate = ajv.compile(schema);
        const body = { request: _.pick(requestBody, fields) };

        if (!validate(body)) {
            const errorMsg = validate.errors?.map((d: unknown) => (d as { message: string }).message).join(', ') || 'Validation failed';
            return sendError(res, apiId, errCode, errorMsg);
        }

        if (checkFramework) {
            const framework = _.get(requestBody, 'framework');
            const rootOrgId = _.get(requestBody, 'rootOrgId');

            if (framework && !rootOrgId) {
                return sendError(res, apiId, errCode, 'specify "rootOrgId" along with "framework"');
            }
        }

        next();
    } catch (error) {
        sendError(res, apiId, errCode, (error as Error).message || "Internal Server Error");
    }
};

export const validateCreateAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.form.create",
        "ERR_CREATE_FORM_DATA",
        formSchemas.create,
        ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']
    );
};

export const validateUpdateAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.form.update",
        "ERR_UPDATE_FORM_DATA",
        formSchemas.update,
        ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']
    );
};

export const validateReadAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.form.read",
        "ERR_READ_FORM_DATA",
        formSchemas.read,
        ['type', 'subType', 'action', 'rootOrgId', 'framework', 'component']
    );
};

export const validateListAPI = (req: Request, res: Response, next: NextFunction) => {
    validateRequest(
        req, res, next,
        "api.form.list",
        "ERR_LIST_ALL_FORM",
        formSchemas.list,
        ['rootOrgId'],
        false
    );
};
