import _ from 'lodash';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import dayjs from 'dayjs';
import logger from '../utils/logger.js';
import { UserApiResponse } from '../types/user.js';
import { saveSession } from '../utils/sessionUtils.js';

const {
    KONG_URL,
    KONG_LOGGEDIN_FALLBACK_TOKEN,
    KONG_ANONYMOUS_FALLBACK_TOKEN
} = envConfig;

const getOidcAccessToken = (req: Request): string | undefined =>
    req.oidc?.accessToken;

const resolveKongBearerToken = (req: Request): string => {
    const kongDeviceToken = _.get(req, 'session.kongToken');
    if (kongDeviceToken) return kongDeviceToken;

    return req.session?.userId
        ? KONG_LOGGEDIN_FALLBACK_TOKEN
        : KONG_ANONYMOUS_FALLBACK_TOKEN;
};

export const setUserSession = async (req: Request, userApiResponse: UserApiResponse): Promise<void> => {
    try {
        if (userApiResponse.responseCode !== 'OK') {
            logger.error(`Failed to fetch user: ${userApiResponse.responseCode}`);
            return;
        }

        const profile = userApiResponse.result.response;
        req.session.userId = profile.id ?? profile.userId;
        req.session.userName = profile.userName;
        req.session.userSid = req.sessionID;
        const roles = _.map(profile.roles, (role: any) =>
            typeof role === 'string' ? role : role.role
        ) as string[];

        const organisationIds: string[] = [];

        _.forEach(profile.organisations, (org) => {
            if (org.organisationId) {
                organisationIds.push(org.organisationId);
            }
        });

        req.session.roles = _.uniq([...roles, 'PUBLIC']);
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

        await saveSession(req);

    } catch (err) {
        logger.error('setUserSession :: Failed to persist user session data', err);
    }
};

export const fetchUserById = async (userId: string | number, req: Request): Promise<UserApiResponse> => {
    const url = `${KONG_URL}/user/v5/read/${userId}`;

    const headers = {
        'x-msgid': uuidv4(),
        ts: dayjs(new Date()).format('yyyy-mm-dd HH:MM:ss:lo'),
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${resolveKongBearerToken(req)}`,
        'x-authenticated-user-token': getOidcAccessToken(req)
    };

    const response = await axios.get(url, { headers });
    const result = response.data;
    if (result.responseCode !== 'OK') {
        throw new Error(`Failed to fetch user: ${result.responseCode}`);
    }
    return result;
};

export const getUserByEmail = async (emailId: string, req: Request): Promise<boolean> => {
    const url = `${KONG_URL}/user/v1/exists/email/${emailId}`;

    const headers = {
        'x-device-id': req.get('x-device-id'),
        'x-msgid': uuidv4(),
        ts: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:SSS'),
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${resolveKongBearerToken(req)}`,
    };

    const response = await axios.get(url, { headers });
    const responseData = response.data;
    if (responseData.responseCode !== 'OK') {
        logger.error(`Failed to fetch user by google emailid: ${responseData.responseCode}`);
        throw new Error(_.get(responseData, 'params.errmsg') || _.get(responseData, 'params.err'));
    }
    return responseData.result.exists;
};

export const createUserWithEmail = async (googleUser: any, client_id: string, req: Request): Promise<UserApiResponse> => {
    if (_.isEmpty(googleUser.name)) {
        throw new Error('USER_NAME_NOT_PRESENT');
    }
    if (!_.isString(googleUser.emailId) || _.isEmpty(googleUser.emailId.trim())) {
        throw new Error('USER_EMAIL_NOT_PRESENT');
    }
    const url = `${KONG_URL}/user/v2/signup`;

    const headers = {
        'x-device-id': req.get('x-device-id'),
        'x-msgid': uuidv4(),
        ts: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:SSS'),
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${resolveKongBearerToken(req)}`,
    };

    const response = await axios.post(url, {
        request: {
            firstName: googleUser.name,
            email: googleUser.emailId,
            emailVerified: true
        },
        params: {
            source: client_id,
            signupType: 'google'
        }
    }, { headers });
    const result = response.data;
    if (result.responseCode !== 'OK') {
        logger.error(`Failed to create user with google emailid, response: ${result.responseCode}`);
        throw new Error(_.get(result, 'params.errmsg') || _.get(result, 'params.err'));
    }
    return result;
};
