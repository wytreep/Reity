import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Decorador compuesto: protege la ruta con JWT y documenta en Swagger.
 * Uso: @Auth() en lugar de @UseGuards(JwtAuthGuard) + @ApiBearerAuth()
 */
export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}
