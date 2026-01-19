import axios from 'axios';
import { envConfig } from '../config/env.js';

const verificationUrl = envConfig.GOOGLE_RECAPTCHA_VERIFY_URL;

export const verifyRecaptcha = async (captchaResponse: string): Promise<void> => {

    const params = new URLSearchParams();
    params.append('secret', envConfig.GOOGLE_RECAPTCHA_SECRET);
    params.append('response', captchaResponse);
    return axios.post(verificationUrl, params);

}