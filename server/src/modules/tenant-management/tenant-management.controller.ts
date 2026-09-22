import {
  Body,
  Controller,
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
import { PaginationDto } from '../../common/dto/pagination.dto';

import { TenantManagementService } from './tenant-management.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class TenantManagementController {
  constructor(
    private readonly tenantManagementService: TenantManagementService,
  ) {}

  @Get('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return this.tenantManagementService.findAll(pagination, search);
  }

  @Post('tenants')
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantManagementService.create(dto);
  }

  @Get('tenants/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getCurrentTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantManagementService.getCurrentTenant(user.tenantId);
  }

  @Patch('tenants/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateCurrentTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    return this.tenantManagementService.updateCurrentTenant(
      user.tenantId,
      dto,
    );
  }

  @Get('tenants/:id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.tenantManagementService.findOne(id);
  }

  @Patch('tenants/:id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantManagementService.update(id, dto);
  }

  @Post('tenants/:id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tenantManagementService.activate(id, user.id);
  }

  @Post('tenants/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  suspend(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tenantManagementService.suspend(id, user.id);
  }

  @Post('tenants/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tenantManagementService.deactivate(id, user.id);
  }
}
