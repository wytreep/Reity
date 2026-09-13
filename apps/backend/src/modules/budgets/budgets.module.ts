import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetOrmEntity } from '../../infrastructure/database/typeorm/entities/budget.entity';
import { TransactionOrmEntity } from '../../infrastructure/database/typeorm/entities/transaction.entity';
import { CategoryOrmEntity } from '../../infrastructure/database/typeorm/entities/category.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BudgetOrmEntity,
      TransactionOrmEntity,
      CategoryOrmEntity,
    ]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
