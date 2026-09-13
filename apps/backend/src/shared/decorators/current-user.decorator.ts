import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';

/**
 * Extrae el usuario autenticado del request.
 * Uso: @CurrentUser() user: UserOrmEntity
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserOrmEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
