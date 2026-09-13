import { IsNumber, IsPositive, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContributionDto {
  @ApiProperty({ example: 200000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-08-21' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Ahorro de agosto' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
