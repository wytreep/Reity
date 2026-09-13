import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { UserOrmEntity } from './user.entity';
import { TransactionOrmEntity } from './transaction.entity';

@Entity('categories')
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId: string | undefined;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ length: 7, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 10 })
  type: 'income' | 'expense';

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(() => UserOrmEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @OneToMany(() => TransactionOrmEntity, (t) => t.category)
  transactions: TransactionOrmEntity[];
}
