import { Controller, Get, Param, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SearchDto } from '../../common/dto/search.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(@Body() dto: CreateStockMovementDto, @GetUser() user: AuthenticatedUser) {
    return this.stockMovementsService.create(dto, user.tenantId);
  }

  @Get()
  findAll(
    @Query() search: SearchDto,
    @Query() query: StockMovementQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.stockMovementsService.findAll(search, query, user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.stockMovementsService.findOne(id, user.tenantId);
  }
}
