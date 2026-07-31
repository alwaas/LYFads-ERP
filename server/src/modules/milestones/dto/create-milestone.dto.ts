import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { MilestonePriority, MilestoneStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMilestoneDto {
  @ApiProperty({
    example: 'Frontend Design Complete',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Complete dashboard UI',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'cmxxxxxprojectid',
  })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({
    enum: MilestoneStatus,
    default: MilestoneStatus.NOT_STARTED,
  })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional({
    enum: MilestonePriority,
    default: MilestonePriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(MilestonePriority)
  priority?: MilestonePriority;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-08-15T00:00:00.000Z',
  })
  @IsDateString()
  deadline: string;
}
