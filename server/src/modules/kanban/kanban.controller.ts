import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';

import { KanbanService } from './kanban.service';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller('kanban')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get('project/:projectId')
  getBoard(@Param('projectId') projectId: string) {
    return this.kanbanService.getBoard(projectId);
  }

  @Patch('task/:taskId/move')
  moveTask(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.kanbanService.moveTask(taskId, dto);
  }

  @Get('statistics/:projectId')
  statistics(@Param('projectId') projectId: string) {
    return this.kanbanService.statistics(projectId);
  }
}