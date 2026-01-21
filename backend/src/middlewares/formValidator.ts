import Ajv from 'ajv';
import { FormResponse } from '../models/FormResponse.js';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ajv = new (Ajv as any)({ allErrors: true });

export class RequestValidator {

    public validateCreateAPI(req: Request, res: Response, next: NextFunction) {
        const schema = {
            type: "object",
            properties: {
                request: {
                    type: "object",
                    properties: {
                        type: { type: "string" },
                        subType: { type: "string" },
                        action: { type: "string" },
                        component: { type: "string" },
                        rootOrgId: { type: "string" },
                        framework: { type: "string" },
                        data: { type: "object" }
                    },
                    required: ["type", "action", "data"],
                    additionalProperties: true
                }
            },
            required: ["request"]
        };

        const validate = ajv.compile(schema);
        const body = { request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']) };
        const valid = validate(body);

        if (!valid) {
            res.status(400).send(new FormResponse({
                id: "api.form.create",
                err: "ERR_CREATE_FORM_DATA",
                errmsg: validate.errors?.map((d: unknown) => (d as { message: string }).message).join(', '),
                responseCode: "CLIENT_ERROR"
            }));
        } else if (!req.body.request.framework && !req.body.request.rootOrgId) {
            next();
        } else if (req.body.request.framework && !req.body.request.rootOrgId) {
            res.status(400).send(new FormResponse({
                id: "api.form.create",
                err: "ERR_CREATE_FORM_DATA",
                errmsg: `specify "rootOrgId" along with "framework"`,
                responseCode: "CLIENT_ERROR"
            }));
        } else {
            next();
        }
    }

    public validateUpdateAPI(req: Request, res: Response, next: NextFunction) {
        const schema = {
            type: "object",
            properties: {
                request: {
                    type: "object",
                    properties: {
                        type: { type: "string" },
                        subType: { type: "string" },
                        action: { type: "string" },
                        component: { type: "string" },
                        rootOrgId: { type: "string" },
                        framework: { type: "string" },
                        data: { type: "object" }
                    },
                    required: ["type", "action", "data"],
                    additionalProperties: true
                }
            },
            required: ["request"]
        };

        const validate = ajv.compile(schema);
        const body = { request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']) };
        const valid = validate(body);

        if (!valid) {
            res.status(400).send(new FormResponse({
                id: "api.form.update",
                err: "ERR_UPDATE_FORM_DATA",
                errmsg: validate.errors?.map((d: unknown) => (d as { message: string }).message).join(', '),
                responseCode: "CLIENT_ERROR"
            }));
        } else if (!req.body.request.framework && !req.body.request.rootOrgId) {
            next();
        } else if (req.body.request.framework && !req.body.request.rootOrgId) {
            res.status(400).send(new FormResponse({
                id: "api.form.update",
                err: "ERR_UPDATE_FORM_DATA",
                errmsg: `specify "rootOrgId" along with "framework"`,
                responseCode: "CLIENT_ERROR"
            }));
        } else {
            next();
        }
    }

    public validateReadAPI(req: Request, res: Response, next: NextFunction) {
        const schema = {
            type: "object",
            properties: {
                request: {
                    type: "object",
                    properties: {
                        type: { type: "string" },
                        subType: { type: "string" },
                        action: { type: "string" },
                        component: { type: "string" },
                        rootOrgId: { type: "string" },
                        framework: { type: "string" }
                    },
                    required: ["type", "action"],
                    additionalProperties: true
                }
            },
            required: ["request"]
        };

        const validate = ajv.compile(schema);
        const body = { request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'component']) };
        const valid = validate(body);

        if (!valid) {
            res.status(400).send(new FormResponse({
                id: "api.form.read",
                err: "ERR_READ_FORM_DATA",
                errmsg: validate.errors?.map((d: unknown) => (d as { message: string }).message).join(', '),
                responseCode: "CLIENT_ERROR"
            }));
        } else if (!req.body.request.framework && !req.body.request.rootOrgId) {
            next();
        } else if (req.body.request.framework && !req.body.request.rootOrgId) {
            res.status(400).send(new FormResponse({
                id: "api.form.read",
                err: "ERR_READ_FORM_DATA",
                errmsg: `specify "rootOrgId" along with "framework"`,
                responseCode: "CLIENT_ERROR"
            }));
        } else {
            next();
        }
    }
}
