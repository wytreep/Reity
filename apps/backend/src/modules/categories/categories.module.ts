import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryOrmEntity } from '../../infrastructure/database/typeorm/entities/category.entity';
import { DatabaseSeederService } from '../../infrastructure/database/database-seeder.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoriesController],
  providers: [CategoriesService, DatabaseSeederService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
