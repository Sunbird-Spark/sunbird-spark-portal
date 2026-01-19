import _ from 'lodash';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import dateFormat from 'dateformat';
import logger from '../utils/logger.js';

const { SUNBIRD_LEARNER_PLAYER_URL, KONG_LOGGEDIN_FALLBACK_TOKEN, KONG_ANONYMOUS_FALLBACK_TOKEN } = envConfig

const setUserSessionData = (req: Request, body: { responseCode: string; result: { response: { id: string | number | undefined; userId: string | number | undefined; userName: any; managedBy: any; managedToken: any; roles: _.Dictionary<unknown> | _.NumericDictionary<unknown> | null | undefined; organisations: any; rootOrg: { id: string | undefined; hashTagId: any; }; }; }; }) => {
    try {
        if (body.responseCode === 'OK') {
            req.session.userId = body.result.response.id ? body.result.response.id : body.result.response.userId;
            req.session.userName = body.result.response.userName;
            if (body.result.response.managedBy) {
                req.session.userSid = uuidv4();
            } else {
                req.session.userSid = req.sessionID;
            }
            if (body.result.response.managedToken) {
                req.session.managedToken = body.result.response.managedToken
            }
            req.session.roles = _.map(body.result.response.roles, 'role') || [];
            req.session.orgs = []; // Initialize orgs array as empty array
            if (body.result.response.organisations) {
                _.forEach(body.result.response.organisations, function (org) {
                    if (org.roles && _.isArray(org.roles)) {
                        req.session.roles = _.union(req.session.roles, org.roles)
                    }
                    if (org.organisationId) {
                        req.session.orgs!.push(org.organisationId)
                    }
                })
            }
            req.session.orgs = _.uniq(req.session.orgs);
            req.session.orgs = _.compact(req.session.orgs);
            req.session.roles = _.uniq(req.session.roles)
            if (body.result.response.rootOrg && body.result.response.rootOrg.id) {
                req.session.rootOrgId = body.result.response.rootOrg.id
                req.session.rootOrghashTagId = body.result.response.rootOrg.hashTagId
                req.session.rootOrg = {};
                req.session['rootOrg']['id'] = _.get(body, 'result.response.rootOrg.id');
                req.session['rootOrg']['slug'] = _.get(body, 'result.response.rootOrg.slug');
                req.session['rootOrg']['orgName'] = _.get(body, 'result.response.rootOrg.orgName');
                req.session['rootOrg']['channel'] = _.get(body, 'result.response.rootOrg.channel');
                req.session['rootOrg']['hashTagId'] = _.get(body, 'result.response.rootOrg.hashTagId');
                req.session['rootOrg']['rootOrgId'] = _.get(body, 'result.response.rootOrg.rootOrgId');
            }
            // For bulk upload user(s); `PUBLIC` role added.
            if (!_.includes(req.session.roles, 'PUBLIC')) {
                req.session.roles.push('PUBLIC');
            }
            if (!_.includes(req.session.roles, 'ANONYMOUS')) {
                req.session.roles.push('ANONYMOUS');
            }
        }
    } catch (e) {
        logger.error({ msg: 'setUserSessionData :: Error while saving user session data', err: e });
        console.log(e)
    }
};

const getAuthToken = (req: Request) => {
    return (req.kauth?.grant?.access_token as any)?.token;
};

const getBearerToken = (req: Request) => {
    const deviceToken = _.get(req, 'session.kongToken');

    if (deviceToken) {
        return deviceToken;
    }

    return req.session.userId ? KONG_LOGGEDIN_FALLBACK_TOKEN : KONG_ANONYMOUS_FALLBACK_TOKEN;
};


export const getCurrentUser = async (req: Request): Promise<void> => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            throw new Error('userIdentifier is required');
        }

        let url = `${SUNBIRD_LEARNER_PLAYER_URL}/user/v5/read/${userId}`;
        logger.info(`url: ${url}`)

        const headers = {
            'x-msgid': uuidv4(),
            ts: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: 'Bearer ' + getBearerToken(req),
            'x-authenticated-user-token': getAuthToken(req),
        };

        req.session.roles = [];
        req.session.orgs = [];
        const response = await axios.get(url, { headers });
        logger.info(`response ${response}`)
        logger.info(`response ${response.data}`)
        const body = response.data;

        if (body && body.responseCode === 'OK') {
            setUserSessionData(req, body);
            await new Promise<void>((resolve, reject) => {
                req.session.save((err: Error) => {
                    if (err) {
                        logger.error('LOGGEDIN_KONG_TOKEN :: failed to save session', err);
                        reject(err);
                    } else {
                        logger.info(`LOGGEDIN_KONG_TOKEN :: session saved successfully with ID: ${req.sessionID}`);
                        resolve();
                    }
                });
            });

            let _sessionLog = {
                userId: req.session.userId || null,
                rootOrgId: req.session.rootOrgId || null,
                roles: req.session.roles || null,
                userSid: req.session.userSid || null,
                orgs: req.session.orgs || null
            };

            logger.info({
                msg: 'getCurrentUser :: Session data set success',
                session: _sessionLog
            });

            await new Promise<void>((resolve, reject) => {
                req.session.save(function (error) {
                    if (error) reject(error);
                    else resolve();
                });
            });

            return body;
        }

        logger.error({
            msg: 'getCurrentUser :: Error while reading user/v5/read',
            body
        });

        throw body;
    } catch (error: any) {
        const statusCode = _.get(error, 'response.status');

        logger.error({
            msg: `getCurrentUser :: Error while calling user/v5/read with status ${statusCode}`,
            error: _.get(error, 'response.data') || error.message || error
        });

        throw error;
    }
}