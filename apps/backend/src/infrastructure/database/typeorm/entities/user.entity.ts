import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { TransactionOrmEntity } from './transaction.entity';
import { BudgetOrmEntity } from './budget.entity';
import { GoalOrmEntity } from './goal.entity';
import { CategoryOrmEntity } from './category.entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ length: 3, default: 'COP' })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TransactionOrmEntity, (t) => t.user)
  transactions: TransactionOrmEntity[];

  @OneToMany(() => BudgetOrmEntity, (b) => b.user)
  budgets: BudgetOrmEntity[];

  @OneToMany(() => GoalOrmEntity, (g) => g.user)
  goals: GoalOrmEntity[];

  @OneToMany(() => CategoryOrmEntity, (c) => c.user)
  categories: CategoryOrmEntity[];
}
