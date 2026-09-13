import {
  Injectable, NotFoundException,
  ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BudgetOrmEntity } from '../../infrastructure/database/typeorm/entities/budget.entity';
import { TransactionOrmEntity } from '../../infrastructure/database/typeorm/entities/transaction.entity';
import { CategoryOrmEntity } from '../../infrastructure/database/typeorm/entities/category.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

// Umbrales de alerta
const WARN_THRESHOLD  = 0.8;  // 80%
const LIMIT_THRESHOLD = 1.0;  // 100%

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    @InjectRepository(BudgetOrmEntity)
    private readonly budgetRepo: Repository<BudgetOrmEntity>,
    @InjectRepository(TransactionOrmEntity)
    private readonly txRepo: Repository<TransactionOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly catRepo: Repository<CategoryOrmEntity>,
  ) {}

  // ─────────────────────────────────────────────────────────
  // LISTAR + ejecución del mes solicitado
  // ─────────────────────────────────────────────────────────
  async findAll(userId: string, month: number, year: number) {
    const budgets = await this.budgetRepo.find({
      where: { userId, month, year },
      relations: ['category'],
      order: { category: { name: 'ASC' } },
    });

    // Calcular gasto real de cada presupuesto
    const results = await Promise.all(
      budgets.map((b) => this.enrichWithExecution(b, userId)),
    );

    const totalBudget = results.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent  = results.reduce((s, b) => s + b.spent, 0);

    return {
      month,
      year,
      totalBudget,
      totalSpent,
      totalPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      budgets: results,
    };
  }

  // ─────────────────────────────────────────────────────────
  // CREAR
  // ─────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateBudgetDto) {
    // Verificar que la categoría existe
    const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');

    // Verificar unicidad: un presupuesto por categoría/mes/año
    const exists = await this.budgetRepo.findOne({
      where: {
        userId,
        categoryId: dto.categoryId,
        month: dto.month,
        year: dto.year,
      },
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe un presupuesto para esta categoría en ese mes',
      );
    }

    const budget = this.budgetRepo.create({ ...dto, userId });
    const saved  = await this.budgetRepo.save(budget);
    return this.enrichWithExecution(saved, userId);
  }

  // ─────────────────────────────────────────────────────────
  // ACTUALIZAR
  // ─────────────────────────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOneOwned(userId, id);
    Object.assign(budget, dto);
    const saved = await this.budgetRepo.save(budget);
    return this.enrichWithExecution(saved, userId);
  }

  // ─────────────────────────────────────────────────────────
  // ELIMINAR
  // ─────────────────────────────────────────────────────────
  async remove(userId: string, id: string) {
    const budget = await this.findOneOwned(userId, id);
    await this.budgetRepo.remove(budget);
    return { message: 'Presupuesto eliminado' };
  }

  // ─────────────────────────────────────────────────────────
  // EJECUCIÓN — gasto real vs límite por categoría
  // ─────────────────────────────────────────────────────────
  async getExecution(userId: string, month: number, year: number) {
    const { budgets, totalBudget, totalSpent, totalPercentage } =
      await this.findAll(userId, month, year);

    const alerts = budgets.filter((b) => b.percentage >= WARN_THRESHOLD * 100);

    return {
      month,
      year,
      totalBudget,
      totalSpent,
      totalPercentage,
      alerts,
      budgets,
    };
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────
  private async findOneOwned(userId: string, id: string) {
    const budget = await this.budgetRepo.findOne({
      where: { id, userId },
      relations: ['category'],
    });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    return budget;
  }

  private async enrichWithExecution(budget: BudgetOrmEntity, userId: string) {
    const start = new Date(budget.year, budget.month - 1, 1);
    const end   = new Date(budget.year, budget.month, 0);

    // Sumar gastos reales de esa categoría en ese mes
    const txs = await this.txRepo.find({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'expense',
        date: Between(start as any, end as any),
      },
    });

    const spent      = txs.reduce((s, t) => s + Number(t.amount), 0);
    const amount     = Number(budget.amount);
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    const remaining  = Math.max(amount - spent, 0);

    // Estado semáforo
    let status: 'ok' | 'warning' | 'exceeded';
    if (percentage >= LIMIT_THRESHOLD * 100) status = 'exceeded';
    else if (percentage >= WARN_THRESHOLD * 100) status = 'warning';
    else status = 'ok';

    return {
      ...budget,
      amount,
      spent,
      remaining,
      percentage: Math.round(percentage * 10) / 10,
      status,
    };
  }
}
