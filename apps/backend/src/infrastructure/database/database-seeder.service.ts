import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedCategories } from './seeds/categories.seed';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await seedCategories(this.dataSource);
      console.log('✅ Categorías inicializadas correctamente');
    } catch (error) {
      console.warn(
        '⚠️ Error inicializando categorías:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}