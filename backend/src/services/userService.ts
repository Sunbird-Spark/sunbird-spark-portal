import _ from 'lodash';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import dateFormat from 'dateformat';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';
import { UserApiResponse } from '../types/user.js';

const {
    KONG_URL,
    KONG_LOGGEDIN_FALLBACK_TOKEN,
    KONG_ANONYMOUS_FALLBACK_TOKEN
} = envConfig;

const populateSessionFromUserProfile = (req: Request, userApiResponse: UserApiResponse) => {
    try {
        if (userApiResponse.responseCode !== 'OK') return;

        const profile = userApiResponse.result.response;
        req.session.userId = profile.id ?? profile.userId;
        req.session.userName = profile.userName;
        req.session.userSid = req.sessionID;
        const directRoles = _.map(profile.roles, (role: any) =>
            typeof role === 'string' ? role : role.role
        ) as string[];
        let roles = [...directRoles];

        const organisationIds: string[] = [];

        _.forEach(profile.organisations, (org) => {
            if (Array.isArray(org.roles)) {
                roles = _.union(roles, org.roles);
            }
            if (org.organisationId) {
                organisationIds.push(org.organisationId);
            }
        });

        req.session.roles = _.uniq([...roles, 'PUBLIC', 'ANONYMOUS']);
        req.session.orgs = _.compact(_.uniq(organisationIds));

        if (profile.rootOrg?.id) {
            req.session.rootOrgId = profile.rootOrg.id;
            req.session.rootOrghashTagId = profile.rootOrg.hashTagId;
            req.session.rootOrg = {
                id: profile.rootOrg.id,
                slug: profile.rootOrg.slug,
                orgName: profile.rootOrg.orgName,
                channel: profile.rootOrg.channel,
                hashTagId: profile.rootOrg.hashTagId,
                rootOrgId: profile.rootOrg.rootOrgId
            };
        }

    } catch (err) {
        logger.error('populateSessionFromUserProfile :: Failed to persist user session data', err);
    }
};

const getKeycloakAccessToken = (req: Request): string | undefined => {
    return (req.kauth?.grant?.access_token as any)?.token;
};

const resolveKongBearerToken = (req: Request): string => {
    const kongDeviceToken = _.get(req, 'session.kongToken');

    if (kongDeviceToken) {
        return kongDeviceToken;
    }

    return req.session.userId ? KONG_LOGGEDIN_FALLBACK_TOKEN : KONG_ANONYMOUS_FALLBACK_TOKEN;
};

export const getCurrentUser = async (req: Request): Promise<void> => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            throw new Error('fetchAndStoreCurrentUser :: userId missing from session');
        }

        const url = `${KONG_URL}/user/v5/read/${userId}`;
        logger.info('fetchAndStoreCurrentUser :: calling user API', url);

        const headers = {
            'x-msgid': uuidv4(),
            ts: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: `Bearer ${resolveKongBearerToken(req)}`,
            'x-authenticated-user-token': getKeycloakAccessToken(req)
        };

        req.session.roles = [];
        req.session.orgs = [];

        const response = await axios.get(url, { headers });
        const userApiResponse: UserApiResponse = response.data;

        if (userApiResponse?.responseCode === 'OK') {
            populateSessionFromUserProfile(req, userApiResponse);

            await saveSession(req);

            const sessionSnapshot = {
                userId: req.session.userId ?? null,
                rootOrgId: req.session.rootOrgId ?? null,
                roles: req.session.roles ?? null,
                userSid: req.session.userSid ?? null,
                orgs: req.session.orgs ?? null
            };

            logger.info('fetchAndStoreCurrentUser :: session data set successfully', sessionSnapshot);

            return;
        }

        logger.error('fetchAndStoreCurrentUser :: user API returned non-OK response', userApiResponse);

        throw userApiResponse;

    } catch (error) {
        const statusCode = _.get(error, 'response.status');
        logger.error(`fetchAndStoreCurrentUser :: user API call failed with status ${statusCode}`, _.get(error, 'response.data'));
        throw error;
    }
};
