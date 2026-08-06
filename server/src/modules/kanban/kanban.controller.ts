import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { KanbanService } from './kanban.service';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller('kanban')
export class KanbanController {
  constructor(
    private readonly kanbanService: KanbanService,
  ) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('project/:projectId')
  getBoard(@Param('projectId') projectId: string) {
    return this.kanbanService.getBoard(projectId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
  )
  @Patch('task/:taskId/move')
  moveTask(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.kanbanService.moveTask(taskId, dto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('statistics/:projectId')
  statistics(@Param('projectId') projectId: string) {
    return this.kanbanService.statistics(projectId);
  }
}
