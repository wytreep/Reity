import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT reutilizable.
 * Uso: @UseGuards(JwtAuthGuard) o mediante el decorator @Auth()
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
