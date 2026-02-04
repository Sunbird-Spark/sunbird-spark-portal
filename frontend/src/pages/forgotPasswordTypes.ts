export type Step = 1 | 2 | 3 | 4;
export type IdentifierStatus = '' | 'MATCHED' | 'NOT_MATCHED' | 'VALIDATING_FAILED';

export interface OtpIdentifier {
    id: string;
    type: string;
    value: string;
}
