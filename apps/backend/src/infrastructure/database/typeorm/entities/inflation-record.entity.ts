import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Unique,
} from 'typeorm';

@Entity('inflation_records')
@Unique(['month', 'year'])
export class InflationRecordOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ name: 'ipc_monthly', type: 'decimal', precision: 8, scale: 4 })
  ipcMonthly: number;

  @Column({ name: 'ipc_annual', type: 'decimal', precision: 8, scale: 4 })
  ipcAnnual: number;

  @Column({ length: 100, nullable: true })
  source: string;

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;
}
