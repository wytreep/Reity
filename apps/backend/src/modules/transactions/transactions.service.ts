import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { TransactionOrmEntity } from '../../infrastructure/database/typeorm/entities/transaction.entity';
import { CategoryOrmEntity } from '../../infrastructure/database/typeorm/entities/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { MonthlyFlowItem, TransactionSummary } from './transactions.types';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly catRepo: Repository<CategoryOrmEntity>,
  ) {}

  async findAll(userId: string, filters: FilterTransactionDto) {
    const where: FindOptionsWhere<TransactionOrmEntity> = { userId };

    if (filters.month && filters.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end   = new Date(filters.year, filters.month, 0);
      where.date  = Between(start, end) as any;
    } else if (filters.year) {
      const start = new Date(filters.year, 0, 1);
      const end   = new Date(filters.year, 11, 31);
      where.date  = Between(start, end) as any;
    }

    if (filters.type)       where.type       = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return this.repo.find({
      where,
      relations: ['category'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getSummary(userId: string, month: number, year: number): Promise<TransactionSummary> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0);

    const transactions = await this.repo.find({
      where: { userId, date: Between(start, end) as any },
      relations: ['category'],
      order: { date: 'DESC' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const byCategory = transactions.reduce(
      (acc, t) => {
        const key = t.categoryId ?? 'sin-categoria';
        if (!acc[key]) {
          acc[key] = {
            categoryId:    key,
            categoryName:  t.category?.name  ?? 'Sin categoría',
            categoryColor: t.category?.color ?? '#6B7280',
            categoryIcon:  t.category?.icon  ?? 'ellipsis-horizontal',
            type:          t.type,
            total:         0,
            count:         0,
          };
        }
        acc[key].total += Number(t.amount);
        acc[key].count += 1;
        return acc;
      },
      {} as Record<string, any>,
    );

    const monthlyFlow = await this.getMonthlyFlow(userId, month, year, 6);

    return {
      month, year, totalIncome, totalExpense,
      net: totalIncome - totalExpense,
      transactionCount: transactions.length,
      byCategory: Object.values(byCategory),
      monthlyFlow,
      transactions,
    };
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.categoryId) {
      const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException('Categoría no encontrada');
      if (!cat.isDefault && cat.userId !== userId) {
        throw new ForbiddenException('No tienes permiso sobre esta categoría');
      }
    }
    const transaction = this.repo.create({ ...dto, userId });
    return this.repo.save(transaction);
  }

  async findOne(userId: string, id: string) {
    const t = await this.repo.findOne({
      where: { id, userId },
      relations: ['category'],
    });
    if (!t) throw new NotFoundException('Transacción no encontrada');
    return t;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const transaction = await this.findOne(userId, id);
    Object.assign(transaction, dto);
    return this.repo.save(transaction);
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);
    await this.repo.remove(transaction);
    return { message: 'Transacción eliminada correctamente' };
  }

  private async getMonthlyFlow(
    userId: string,
    currentMonth: number,
    currentYear: number,
    months: number,
  ): Promise<MonthlyFlowItem[]> {
    const result: MonthlyFlowItem[] = [];
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    for (let i = months - 1; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }

      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 0);

      const txs = await this.repo.find({
        where: { userId, date: Between(start, end) as any },
      });

      const income  = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

      result.push({ month: m, year: y, label: monthNames[m - 1], income, expense, net: income - expense });
    }

    return result;
  }
}
