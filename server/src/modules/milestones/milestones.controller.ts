import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.create(dto, user.tenantId);
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
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.milestonesService.findAll(pagination, search, status, priority, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.milestonesService.findOne(id, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.update(id, dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.milestonesService.remove(id, user.tenantId);
  }
}
