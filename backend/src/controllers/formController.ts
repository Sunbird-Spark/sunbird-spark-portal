import { Request, Response } from 'express';
import { FormService } from '../services/formService.js';
import { FormResponse } from '../models/FormResponse.js';
import _ from 'lodash';
import { logger } from '../utils/logger.js';

export class FormController {
    private formService: FormService;

    constructor() {
        this.formService = new FormService();
    }

    private convertToLowerCase(obj: Record<string, unknown>, keys: Array<string>) {
        keys.forEach(element => {
            if (typeof obj[element] === 'string') {
                obj[element] = (obj[element] as string).toLowerCase();
            }
        });
    }

    public async create(req: Request, res: Response) {
        try {
            const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
            this.convertToLowerCase(data, ['type', 'subType', 'action']);

            await this.formService.create(data);
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.create',
                data: { created: 'OK' }
            }));
        } catch (error) {
            logger.error('Error creating form:', error);
            res.status(500).send(new FormResponse({
                id: "api.form.create",
                err: "ERR_CREATE_FORM_DATA",
                errmsg: (error as Error)?.message || String(error) || 'Unknown error'
            }));
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
            this.convertToLowerCase(data, ['type', 'subType', 'action']);

            const query = {
                root_org: data.rootOrgId || '*',
                framework: data.framework || '*',
                type: data.type,
                action: data.action,
                subtype: data.subType || '*',
                component: data.component || '*'
            };

            const updateValue = {
                data: JSON.stringify(data.data),
                last_modified_on: new Date()
            };

            const result = await this.formService.update(query, updateValue);
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.update',
                data: { "response": [result] }
            }));
        } catch (error) {
            logger.error('Error updating form:', error);
            const err = error as Record<string, unknown>;
            const statusCode = (err.statusCode as number) || 500;
            res.status(statusCode).send(new FormResponse({
                id: "api.form.update",
                err: "ERR_UPDATE_FORM_DATA",
                responseCode: statusCode === 404 ? "RESOURCE_NOT_FOUND" : "SERVER_ERROR",
                errmsg: (err.msg as string) || (err.message as string) || "Unknown error"
            }));
        }
    }

    public async read(req: Request, res: Response) {
        try {
            const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
            this.convertToLowerCase(data, ['type', 'subType', 'action']);

            const query = {
                root_org: data.rootOrgId || '*',
                framework: data.framework || '*',
                type: data.type,
                action: data.action,
                subtype: data.subType || '*',
                component: data.component || '*'
            };

            let result = await this.formService.read(query);

            if (!result) result = {};

            let responseData = { ...result };
            if (typeof responseData.data === "string") {
                try {
                    responseData.data = JSON.parse(responseData.data);
                } catch {
                    // ignore if parsing fails
                }
            }

            if (responseData.root_org) {
                responseData.rootOrgId = responseData.root_org;
                responseData = _.omit(responseData, ['root_org']);
            }

            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.read',
                data: { form: responseData }
            }));

        } catch (error) {
            logger.error('Error reading form:', error);
            res.status(404).send(new FormResponse({
                id: "api.form.read",
                err: "ERR_READ_FORM_DATA",
                errmsg: (error as Error)?.message || 'Form data not found'
            }));
        }
    }

    public async listAll(req: Request, res: Response) {
        try {
            const data = _.pick(req.body.request, ['rootOrgId']);
            const rootOrgId = data.rootOrgId as string;

            if (!rootOrgId || typeof rootOrgId !== 'string' || !rootOrgId.trim()) {
                return res.status(400).send(new FormResponse({
                    id: 'api.form.list',
                    err: 'ERR_INVALID_ROOT_ORG_ID',
                    errmsg: 'A valid non-empty rootOrgId must be provided.'
                }));
            }

            const formDetails = await this.formService.listAll(rootOrgId);
            const apiResponse = {
                forms: formDetails,
                count: formDetails ? formDetails.length : 0
            };
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.list',
                data: apiResponse
            }));
        } catch (error) {
            logger.error('Error listing forms:', error);
            res.status(500).send(new FormResponse({
                id: "api.form.list",
                err: "ERR_LIST_ALL_FORM",
                errmsg: (error as Error)?.message || String(error) || 'Unknown error'
            }));
        }
    }
}
