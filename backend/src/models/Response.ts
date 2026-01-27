import { v4 as uuidv4 } from 'uuid';

interface ErrorObj {
    err?: unknown;
    errmsg?: unknown;
    responseCode?: string;
}

interface ResultObj {
    data?: unknown;
}

export class Response {
    public id: string;
    public ver: string;
    public ts: Date;
    public params: Record<string, unknown>;
    public responseCode: string;
    public result: Record<string, unknown>;

    constructor(id: string, ver: string = "1.0") {
        this.id = id;
        this.ver = ver;
        this.ts = new Date();
        this.params = {
            resmsgid: uuidv4(),
            msgid: uuidv4(),
            status: "successful",
            err: null,
            errmsg: null
        };
        this.responseCode = "OK";
        this.result = {};
    }

    public setError(error: ErrorObj, result?: ResultObj) {
        this.params.status = "failed";
        this.params.err = error.err;
        this.params.errmsg = error.errmsg;
        this.responseCode = error.responseCode || "SERVER_ERROR";
        if (result && result.data) {
            this.result = result.data as Record<string, unknown>;
        }
    }

    public setResult(result: ResultObj) {
        this.params.status = "successful";
        this.responseCode = "OK";
        this.result = result.data as Record<string, unknown>;
    }
}
