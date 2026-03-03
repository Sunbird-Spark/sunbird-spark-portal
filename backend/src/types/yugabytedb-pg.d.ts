/* eslint-disable */
declare module '@yugabytedb/pg' {
    import { PoolConfig, Pool as PgPool } from 'pg';

    export class Pool extends PgPool {
        constructor(config?: PoolConfig);
    }
}
