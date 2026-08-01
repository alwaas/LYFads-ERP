import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectTimelineDto } from './create-project-timeline.dto';

export class UpdateProjectTimelineDto extends PartialType(
  CreateProjectTimelineDto,
) {}