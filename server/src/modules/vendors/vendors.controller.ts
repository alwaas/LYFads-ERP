import { Controller, Get, Param, Post, Body, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorQueryDto } from './dto/vendor-query.dto';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() dto: CreateVendorDto, @GetUser() user: AuthenticatedUser) {
    return this.vendorsService.create(dto, user.tenantId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @Query() query: VendorQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.vendorsService.findAll(pagination, search, query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.vendorsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.vendorsService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.vendorsService.remove(id, user.tenantId);
  }
}
