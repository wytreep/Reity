import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { Auth } from '../../shared/decorators/auth.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';

@ApiTags('Goals')
@Auth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly svc: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar metas con progreso y proyección' })
  findAll(@CurrentUser() user: UserOrmEntity) {
    return this.svc.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: UserOrmEntity, @Body() dto: CreateGoalDto) {
    return this.svc.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
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

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Agregar aporte a una meta' })
  addContribution(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.svc.addContribution(user.id, id, dto);
  }

  @Get(':id/contributions')
  @ApiOperation({ summary: 'Historial de aportes de una meta' })
  getContributions(
    @CurrentUser() user: UserOrmEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.getContributions(user.id, id);
  }
}
