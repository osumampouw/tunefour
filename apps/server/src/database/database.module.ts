import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../entities';

/**
 * Connects NestJS to PostgreSQL via TypeORM, reading DATABASE_URL from
 * configuration. Uses the same options as the standalone migration DataSource;
 * schema changes are applied through migrations (synchronize is off).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities,
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
