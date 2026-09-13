import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalOrmEntity } from '../../infrastructure/database/typeorm/entities/goal.entity';
import { GoalContributionOrmEntity } from '../../infrastructure/database/typeorm/entities/goal-contribution.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(GoalOrmEntity)
    private readonly goalRepo: Repository<GoalOrmEntity>,
    @InjectRepository(GoalContributionOrmEntity)
    private readonly contribRepo: Repository<GoalContributionOrmEntity>,
  ) {}

  // ─────────────────────────────────────────────────────────
  // LISTAR
  // ─────────────────────────────────────────────────────────
  async findAll(userId: string) {
    const goals = await this.goalRepo.find({
      where: { userId },
      relations: ['contributions'],
      order: { createdAt: 'DESC' },
    });
    return goals.map((g) => this.enrichGoal(g));
  }

  // ─────────────────────────────────────────────────────────
  // OBTENER UNA
  // ─────────────────────────────────────────────────────────
  async findOne(userId: string, id: string) {
    const goal = await this.goalRepo.findOne({
      where: { id, userId },
      relations: ['contributions'],
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return this.enrichGoal(goal);
  }

  // ─────────────────────────────────────────────────────────
  // CREAR
  // ─────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateGoalDto) {
    const goal = this.goalRepo.create({
      ...dto,
      userId,
      currentAmount: 0,
      status: 'active',
    });
    const saved = await this.goalRepo.save(goal);
    return this.enrichGoal({ ...saved, contributions: [] });
  }

  // ─────────────────────────────────────────────────────────
  // ACTUALIZAR
  // ─────────────────────────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.findOneRaw(userId, id);
    Object.assign(goal, dto);
    const saved = await this.goalRepo.save(goal);
    return this.findOne(userId, saved.id);
  }

  // ─────────────────────────────────────────────────────────
  // ELIMINAR
  // ─────────────────────────────────────────────────────────
  async remove(userId: string, id: string) {
    const goal = await this.findOneRaw(userId, id);
    await this.goalRepo.remove(goal);
    return { message: 'Meta eliminada' };
  }

  // ─────────────────────────────────────────────────────────
  // AGREGAR CONTRIBUCIÓN
  // ─────────────────────────────────────────────────────────
  async addContribution(userId: string, goalId: string, dto: CreateContributionDto) {
    const goal = await this.findOneRaw(userId, goalId);

    if (goal.status !== 'active') {
      throw new BadRequestException('Solo puedes aportar a metas activas');
    }

    // Guardar contribución
    const contribution = this.contribRepo.create({ ...dto, goalId });
    await this.contribRepo.save(contribution);

    // Actualizar monto acumulado en la meta
    goal.currentAmount = Number(goal.currentAmount) + Number(dto.amount);

    // Marcar como completada si alcanzó el objetivo
    if (goal.currentAmount >= Number(goal.targetAmount)) {
      goal.status = 'completed';
    }

    await this.goalRepo.save(goal);
    return this.findOne(userId, goalId);
  }

  // ─────────────────────────────────────────────────────────
  // HISTORIAL DE CONTRIBUCIONES
  // ─────────────────────────────────────────────────────────
  async getContributions(userId: string, goalId: string) {
    await this.findOneRaw(userId, goalId); // valida propiedad
    return this.contribRepo.find({
      where: { goalId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────
  private async findOneRaw(userId: string, id: string) {
    const goal = await this.goalRepo.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return goal;
  }

  private enrichGoal(goal: GoalOrmEntity & { contributions?: any[] }) {
    const target  = Number(goal.targetAmount);
    const current = Number(goal.currentAmount);
    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const remaining = Math.max(target - current, 0);

    // Proyección de cumplimiento basada en promedio de aportes
    let projectedDate: string | null = null;
    let monthsToComplete: number | null = null;

    const contribs = goal.contributions ?? [];
    if (contribs.length > 0 && remaining > 0) {
      const totalContributed = contribs.reduce((s, c) => s + Number(c.amount), 0);
      const avgPerContrib    = totalContributed / contribs.length;

      if (avgPerContrib > 0) {
        // Estimar aportes mensuales (asume ~4 aportes/mes si hay varios)
        const monthlyRate =
          contribs.length >= 2
            ? this.estimateMonthlyRate(contribs, totalContributed)
            : avgPerContrib;

        if (monthlyRate > 0) {
          monthsToComplete = Math.ceil(remaining / monthlyRate);
          const projected  = new Date();
          projected.setMonth(projected.getMonth() + monthsToComplete);
          projectedDate = projected.toISOString().split('T')[0];
        }
      }
    }

    return {
      ...goal,
      currentAmount: current,
      targetAmount:  target,
      progressPercentage: Math.round(progress * 10) / 10,
      remaining,
      projectedDate,
      monthsToComplete,
      contributionCount: contribs.length,
    };
  }

  private estimateMonthlyRate(contribs: any[], total: number): number {
    if (contribs.length < 2) return total;
    const dates  = contribs.map((c) => new Date(c.date).getTime()).sort();
    const spanMs = dates[dates.length - 1] - dates[0];
    const months = spanMs / (1000 * 60 * 60 * 24 * 30) || 1;
    return total / months;
  }
}
