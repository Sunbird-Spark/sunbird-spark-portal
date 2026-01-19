import axios from 'axios';
import { envConfig } from '../config/env.js';

export const verifyRecaptcha = async (captchaResponse: string): Promise<void> => {

    const verificationUrl = `${envConfig.GOOGLE_RECAPTCHA_VERIFY_URL}?secret=${encodeURIComponent(
                envConfig.GOOGLE_RECAPTCHA_SECRET
            )}&response=${encodeURIComponent(captchaResponse)}`;
    return axios.post(verificationUrl);

}