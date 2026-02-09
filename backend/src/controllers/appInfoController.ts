import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Response as ApiResponse } from '../models/Response.js';
import { envConfig } from '../config/env.js';
import packageJson from '../../package.json' with { type: 'json' };

const { version, buildHash } = packageJson as { version: string; buildHash?: string };

const appId = envConfig.APPID;
const finalBuildHash = buildHash || uuidv4();

export const getAppInfo = (req: Request, res: Response) => {
    const apiId = 'api.app.info';
    const response = new ApiResponse(apiId);

    const appInfo = {
        version: version,
        buildHash: finalBuildHash,
        appId: appId
    };

    response.setResult({ data: appInfo });
    res.status(200).send(response);
};
