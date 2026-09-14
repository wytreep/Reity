import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carga el .env desde la raíz del backend
dotenv.config({ path: resolve(process.cwd(), '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [resolve(process.cwd(), 'src/infrastructure/database/typeorm/entities/*.entity{.ts,.js}')],
  migrations: [resolve(process.cwd(), 'src/infrastructure/database/migrations/*{.ts,.js}')],
  ssl: { rejectUnauthorized: false },
});