declare module '@yugabytedb/pg' {
    import { PoolConfig, Pool as PgPool, QueryResult, QueryResultRow } from 'pg';

    export class Pool extends PgPool {
        constructor(config?: PoolConfig);
    }
}
