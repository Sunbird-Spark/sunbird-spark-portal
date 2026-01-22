import { Request, Response } from 'express';
import { FormService } from '../services/formService.js';
import { Response as ApiResponse } from '../models/Response.js';
import _ from 'lodash';
import { logger } from '../utils/logger.js';

const formService = new FormService();

const getSanitizedData = (req: Request) => {
    return _.mapValues(
        _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']),
        (value, key) => {
            if (_.isString(value)) {
                const trimmed = _.trim(value);
                return (['type', 'subType', 'action'].includes(key)) ? _.toLower(trimmed) : trimmed;
            }
            return value;
        }
    );
}

export const create = async (req: Request, res: Response) => {
    const apiId = 'api.form.create';
    try {
        const data = getSanitizedData(req);
        await formService.create(data);

        const response = new ApiResponse(apiId);
        response.setResult({ data: { created: 'OK' } });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error creating form:', error);
        const response = new ApiResponse(apiId);
        response.setError({
            err: "ERR_CREATE_FORM_DATA",
            errmsg: (error as Error)?.message || String(error) || 'Unknown error'
        });
        res.status(500).send(response);
    }
}

export const update = async (req: Request, res: Response) => {
    const apiId = 'api.form.update';
    try {
        const data = getSanitizedData(req);

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

        const result = await formService.update(query, updateValue);

        const response = new ApiResponse(apiId);
        response.setResult({ data: { "response": [result] } });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error updating form:', error);
        const err = error as Record<string, unknown>;
        const statusCode = (err.statusCode as number) || 500;

        const response = new ApiResponse(apiId);
        response.setError({
            err: "ERR_UPDATE_FORM_DATA",
            errmsg: (err.msg as string) || (err.message as string) || "Unknown error",
            responseCode: statusCode === 404 ? "RESOURCE_NOT_FOUND" : "SERVER_ERROR"
        });
        res.status(statusCode).send(response);
    }
}

export const read = async (req: Request, res: Response) => {
    const apiId = 'api.form.read';
    try {
        const data = getSanitizedData(req);

        const query = {
            root_org: data.rootOrgId || '*',
            framework: data.framework || '*',
            type: data.type,
            action: data.action,
            subtype: data.subType || '*',
            component: data.component || '*'
        };

        let result = await formService.read(query);

        if (!result) result = {};

        let responseData = { ...result };
        if (_.isString(responseData.data)) {
            try {
                responseData.data = JSON.parse(responseData.data);
            } catch (parseError) {
                logger.debug('JSON parse failed, keeping data as string:', parseError);
            }
        }

        if (responseData.root_org) {
            responseData.rootOrgId = responseData.root_org;
            responseData = _.omit(responseData, ['root_org']);
        }

        const response = new ApiResponse(apiId);
        response.setResult({ data: { form: responseData } });
        res.status(200).send(response);

    } catch (error) {
        logger.error('Error reading form:', error);
        const response = new ApiResponse(apiId);
        response.setError({
            err: "ERR_READ_FORM_DATA",
            errmsg: (error as Error)?.message || 'Form data not found'
        });
        res.status(404).send(response);
    }
}

export const listAll = async (req: Request, res: Response) => {
    const apiId = 'api.form.list';
    try {
        const data = _.pick(req.body.request, ['rootOrgId']);
        const rootOrgId = _.isString(data.rootOrgId) ? _.trim(data.rootOrgId) : data.rootOrgId;

        if (_.isNil(rootOrgId) || !_.isString(rootOrgId) || _.size(rootOrgId) === 0) {
            const response = new ApiResponse(apiId);
            response.setError({
                err: 'ERR_INVALID_ROOT_ORG_ID',
                errmsg: 'A valid non-empty rootOrgId must be provided.'
            });
            return res.status(400).send(response);
        }

        const formDetails = await formService.listAll(rootOrgId);
        const apiResponse = {
            forms: formDetails,
            count: formDetails ? formDetails.length : 0
        };

        const response = new ApiResponse(apiId);
        response.setResult({ data: apiResponse });
        res.status(200).send(response);
    } catch (error) {
        logger.error('Error listing forms:', error);
        const response = new ApiResponse(apiId);
        response.setError({
            err: "ERR_LIST_ALL_FORM",
            errmsg: (error as Error)?.message || String(error) || 'Unknown error'
        });
        res.status(500).send(response);
    }
}
