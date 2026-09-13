import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensiones
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name"     VARCHAR(150) NOT NULL,
        "currency"      VARCHAR(3) DEFAULT 'COP',
        "created_at"    TIMESTAMP DEFAULT NOW(),
        "updated_at"    TIMESTAMP DEFAULT NOW()
      )
    `);

    // Categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "name"       VARCHAR(100) NOT NULL,
        "icon"       VARCHAR(50),
        "color"      VARCHAR(7),
        "type"       VARCHAR(10) CHECK (type IN ('income','expense')) NOT NULL,
        "is_default" BOOLEAN DEFAULT FALSE
      )
    `);

    // Transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" UUID REFERENCES "categories"("id"),
        "amount"      DECIMAL(15,2) NOT NULL,
        "type"        VARCHAR(10) CHECK (type IN ('income','expense')) NOT NULL,
        "note"        TEXT,
        "date"        DATE NOT NULL,
        "created_at"  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Budgets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" UUID NOT NULL REFERENCES "categories"("id"),
        "amount"      DECIMAL(15,2) NOT NULL,
        "month"       INT NOT NULL,
        "year"        INT NOT NULL,
        "rollover"    BOOLEAN DEFAULT FALSE,
        UNIQUE ("user_id","category_id","month","year")
      )
    `);

    // Goals
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name"           VARCHAR(150) NOT NULL,
        "target_amount"  DECIMAL(15,2) NOT NULL,
        "current_amount" DECIMAL(15,2) DEFAULT 0,
        "deadline"       DATE,
        "status"         VARCHAR(20) DEFAULT 'active',
        "created_at"     TIMESTAMP DEFAULT NOW()
      )
    `);

    // Goal contributions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "goal_contributions" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "goal_id"    UUID NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
        "amount"     DECIMAL(15,2) NOT NULL,
        "note"       TEXT,
        "date"       DATE NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inflation records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inflation_records" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "month"       INT NOT NULL,
        "year"        INT NOT NULL,
        "ipc_monthly" DECIMAL(8,4) NOT NULL,
        "ipc_annual"  DECIMAL(8,4) NOT NULL,
        "source"      VARCHAR(100),
        "fetched_at"  TIMESTAMP DEFAULT NOW(),
        UNIQUE ("month","year")
      )
    `);

    // Índices para performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions(user_id, type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id, month, year)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id, status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inflation_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "goal_contributions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "goals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
