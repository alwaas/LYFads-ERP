import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateMilestoneDto } from './create-milestone.dto';

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @IsOptional()
  @IsString()
  tenantId?: string;
}
