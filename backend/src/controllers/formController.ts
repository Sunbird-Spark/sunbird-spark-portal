import { Request, Response } from 'express';
import { FormService } from '../services/formService.js';
import { FormResponse } from '../models/FormResponse.js';
import _ from 'lodash';

export class FormController {
    private formService: FormService;

    constructor() {
        this.formService = new FormService();
    }

    private convertToLowerCase(obj: any, keys: Array<string>) {
        keys.forEach(element => obj[element] = obj[element] && obj[element].toLowerCase());
    }

    public async create(req: Request, res: Response) {
        const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
        this.convertToLowerCase(data, ['type', 'subType', 'action']);


        try {
            await this.formService.create(data);
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.create',
                data: { created: 'OK' }
            }));
        } catch (error: any) {
            console.error('Error creating form:', error);
            res.status(500).send(new FormResponse({
                id: "api.form.create",
                err: "ERR_CREATE_FORM_DATA",
                errmsg: error?.message || error?.toString() || 'Unknown error'
            }));
        }
    }

    public async update(req: Request, res: Response) {
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

        try {
            const result = await this.formService.update(query, updateValue);
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.update',
                data: { "response": [result] }
            }));
        } catch (error: any) {
            if (error.client_error) {
                res.status(400).send(new FormResponse({ // Standard HTTP 400 for client error
                    id: "api.form.update",
                    err: "ERR_UPDATE_FORM_DATA",
                    responseCode: "CLIENT_ERROR",
                    errmsg: error.msg
                }));
            } else {
                res.status(404).send(new FormResponse({ // Original caught 404 in second catch block
                    id: "api.form.update",
                    err: "ERR_UPDATE_FORM_DATA",
                    errmsg: error
                }));
            }
        }
    }

    public async read(req: Request, res: Response) {
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

        try {
            let result = await this.formService.read(query);

            if (!result) result = {};

            let responseData = { ...result };
            if (responseData && typeof responseData.data === "string") {
                try {
                    responseData.data = JSON.parse(responseData.data);
                } catch (e) {

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
            res.status(404).send(new FormResponse({
                id: "api.form.read",
                err: "ERR_READ_FORM_DATA",
                errmsg: error
            }));
        }
    }

    public async listAll(req: Request, res: Response) {
        const data = _.pick(req.body.request, ['rootOrgId']);
        try {
            const formDetails = await this.formService.listAll(data.rootOrgId);
            const apiResponse = {
                forms: formDetails,
                count: formDetails ? formDetails.length : 0
            };
            res.status(200).send(new FormResponse(undefined, {
                id: 'api.form.list',
                data: apiResponse
            }));
        } catch (error) {
            res.status(500).send(new FormResponse({
                id: "api.form.list",
                err: "ERR_LIST_ALL_FORM",
                errmsg: error
            }));
        }
    }
}
