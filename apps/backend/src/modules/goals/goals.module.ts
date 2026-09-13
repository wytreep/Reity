import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalOrmEntity } from '../../infrastructure/database/typeorm/entities/goal.entity';
import { GoalContributionOrmEntity } from '../../infrastructure/database/typeorm/entities/goal-contribution.entity';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoalOrmEntity, GoalContributionOrmEntity])],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
