import { OtpIdentifier } from './forgotPasswordTypes';

export const buildValidIdentifiers = (results: any[]): OtpIdentifier[] => {
    const keys = [
        'phone',
        'email',
        'prevUsedEmail',
        'prevUsedPhone',
        'recoveryEmail',
        'recoveryPhone'
    ];

    const list: OtpIdentifier[] = [];

    results.forEach(user => {
        keys.forEach(key => {
            if (user[key]) {
                list.push({
                    id: user.id,
                    type: key,
                    value: user[key]
                });
            }
        });
    });

    return list;
};

export const redirectWithError = (message: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('error_message', message);
    const errorCallback = params.get('error_callback');
    if (errorCallback) {
        window.location.href = `${errorCallback}?${params.toString()}`;
    }
};
