export type Step = 1 | 2 | 3 | 4;
export type IdentifierStatus = '' | 'MATCHED' | 'NOT_MATCHED' | 'VALIDATING_FAILED';

export type IdentifierType = 'phone' | 'email' | 'prevUsedEmail' | 'prevUsedPhone' | 'recoveryEmail' | 'recoveryPhone';

export interface OtpIdentifier {
    id: string;
    type: IdentifierType;
    value: string;
}
