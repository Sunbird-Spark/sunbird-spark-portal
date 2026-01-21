import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

interface ErrorObj {
    id?: string;
    err?: unknown;
    errmsg?: unknown;
    responseCode?: string;
}

interface ResultObj {
    id?: string;
    data?: unknown;
}

export class FormResponse {
    public id: string;
    public ver: string;
    public ts: Date;
    public params: Record<string, unknown>;
    public responseCode: string = "";
    public result: Record<string, unknown> = {};

    constructor(error?: ErrorObj, result?: ResultObj) {
        this.id = _.get(result, 'id') || _.get(error, 'id') || 'api.form.response';
        this.ver = "1.0";
        this.ts = new Date();
        this.params = {
            resmsgid: uuidv4(),
            msgid: uuidv4(),
            status: "successful",
            err: null,
            errmsg: null
        };

        if (error) {
            this.params.status = "failed";
            this.params.err = error.err;
            this.params.errmsg = error.errmsg;
            this.responseCode = error.responseCode || "SERVER_ERROR";
        }

        if (result) {
            this.params.status = "successful";
            this.responseCode = "OK";
            this.result = result.data as Record<string, unknown>;
        }
    }
}
