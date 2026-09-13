import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionSummary } from './transactions.types';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { Auth } from '../../shared/decorators/auth.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';

@ApiTags('Transactions')
@Auth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar transacciones con filtros opcionales' })
  findAll(
    @CurrentUser() user: UserOrmEntity,
    @Query() filters: FilterTransactionDto,
  ) {
    return this.svc.findAll(user.id, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen mensual: ingresos, gastos, neto, gráfica' })
  getSummary(
    @CurrentUser() user: UserOrmEntity,
    @Query('month') month: number = new Date().getMonth() + 1,
    @Query('year')  year: number  = new Date().getFullYear(),
  ): Promise<TransactionSummary> {
    return this.svc.getSummary(user.id, Number(month), Number(year));
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: UserOrmEntity,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.svc.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
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
