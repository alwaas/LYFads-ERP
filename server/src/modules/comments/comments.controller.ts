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

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Post()
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.create(dto, user.tenantId);
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
  ) {
    return this.commentsService.findAll(pagination, search, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.findOne(id, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.update(id, dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.remove(id, user.tenantId);
  }
}
