import 'reflect-metadata';
import 'dotenv/config';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { entities } from '../entities';

/**
 * Standalone TypeORM DataSource used by the command-line tool to generate and
 * run migrations. The NestJS app configures the same connection separately (see
 * database.module.ts); both read DATABASE_URL from the environment.
 *
 * `synchronize` is deliberately off — all schema changes go through reviewed
 * migrations, never automatic syncing.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
