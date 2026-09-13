import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Auth } from '../../shared/decorators/auth.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';

@ApiTags('Budgets')
@Auth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly svc: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Presupuestos del mes con ejecución real' })
  findAll(
    @CurrentUser() user: UserOrmEntity,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year')  year: number  = new Date().getFullYear(),
  ) {
    return this.svc.findAll(user.id, Number(month), Number(year));
  }

  @Get('execution')
  @ApiOperation({ summary: 'Ejecución presupuestal con alertas' })
  getExecution(
    @CurrentUser() user: UserOrmEntity,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year')  year: number  = new Date().getFullYear(),
  ) {
    return this.svc.getExecution(user.id, Number(month), Number(year));
  }

  @Post()
  create(@CurrentUser() user: UserOrmEntity, @Body() dto: CreateBudgetDto) {
    return this.svc.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.remove(user.id, id);
  }
}
