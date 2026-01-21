import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

export class FormResponse {
    public id: string;
    public ver: string;
    public ts: Date;
    public params: any;
    public responseCode: string = "";
    public result: any = {};

    constructor(error?: any, result?: any) {
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
            this.result = result.data;
        }
    }
}
