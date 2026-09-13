import {
  IsUUID, IsNumber, IsPositive,
  IsInt, Min, Max, IsBoolean, IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ example: 'uuid-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 8 })
  @IsInt() @Min(1) @Max(12)
  month: number;

  @ApiProperty({ example: 2026 })
  @IsInt() @Min(2020)
  year: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  rollover?: boolean;
}
