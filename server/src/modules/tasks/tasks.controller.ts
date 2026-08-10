import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.create(dto, req.user);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
  ) {
    return this.tasksService.findAll(pagination, search);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
  )
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(id, dto, req.user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.remove(id, req.user);
  }
}
