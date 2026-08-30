import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

@Controller('tenants')
@Roles(UserRole.SUPER_ADMIN)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(
    @Body() dto: CreateTenantDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.update(id, dto, user.id);
  }

  @Patch(':id/suspend')
  suspend(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.suspend(id, user.id);
  }

  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.activate(id, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.remove(id, user.id);
  }
}
