export const IDENTIFIER_REGEX =
    /^([6-9]\d{9}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,4})$/;

export const OTP_REGEX = /^\d{6}$/;

export const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

export const maskIdentifier = (value: string) => {
    if (value.includes('@')) {
        const [localPart = '', domain = ''] = value.split('@');

        if (!localPart || !domain) return value;

        return `${localPart.slice(0, 2)}***@${domain}`;
    }

    return value.slice(0, 2) + '******' + value.slice(-2);
};