import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, OneToMany,
} from 'typeorm';
import { UserOrmEntity } from './user.entity';
import { GoalContributionOrmEntity } from './goal-contribution.entity';

@Entity('goals')
export class GoalOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'target_amount', type: 'decimal', precision: 15, scale: 2 })
  targetAmount: number;

  @Column({ name: 'current_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ length: 20, default: 'active' })
  status: 'active' | 'completed' | 'cancelled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserOrmEntity, (u) => u.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @OneToMany(() => GoalContributionOrmEntity, (c) => c.goal)
  contributions: GoalContributionOrmEntity[];
}
