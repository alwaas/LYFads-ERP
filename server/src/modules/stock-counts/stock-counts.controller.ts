import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { StockCountsService } from './stock-counts.service';
import { CreateStockCountDto } from './dto/create-stock-count.dto';

@Controller('stock-counts')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class StockCountsController {
  constructor(private readonly stockCountsService: StockCountsService) {}

  @Post()
  create(@Body() dto: CreateStockCountDto, @GetUser() user: AuthenticatedUser) {
    return this.stockCountsService.createDraft(
      {
        warehouseId: dto.warehouseId,
        countDate: dto.countDate ? new Date(dto.countDate) : undefined,
        notes: dto.notes,
        lines: dto.lines,
      },
      user.tenantId,
    );
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.stockCountsService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.stockCountsService.findOne(id, user.tenantId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.stockCountsService.approve(id, user.tenantId, user.userId);
  }
}
