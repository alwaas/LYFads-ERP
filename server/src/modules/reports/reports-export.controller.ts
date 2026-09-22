import { Controller, Get, UseGuards, Query, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import { ReportsExportService } from './reports-export.service';
import {
  DashboardQueryDto,
  ExpenseQueryDto,
  PurchaseQueryDto,
  CustomerQueryDto,
  VendorQueryDto,
  InventoryQueryDto,
  SalesOrderQueryDto,
} from './dto/report-query.dto';

@Controller('reports/export')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class ReportsExportController {
  constructor(private readonly reportsExportService: ReportsExportService) {}

  @Get(':reportType/csv')
  @HttpCode(HttpStatus.OK)
  async exportCsv(
    @Param('reportType') reportType: string,
    @GetUser() user: AuthenticatedUser,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const { take, skip, ...restQuery } = query;
    const result = await this.reportsExportService.exportReport({
      reportType: reportType as any,
      tenantId: user.tenantId,
      format: 'csv',
      query: restQuery,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get(':reportType/excel')
  @HttpCode(HttpStatus.OK)
  async exportExcel(
    @Param('reportType') reportType: string,
    @GetUser() user: AuthenticatedUser,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const { take, skip, ...restQuery } = query;
    const result = await this.reportsExportService.exportReport({
      reportType: reportType as any,
      tenantId: user.tenantId,
      format: 'excel',
      query: restQuery,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get(':reportType/pdf')
  @HttpCode(HttpStatus.OK)
  async exportPdf(
    @Param('reportType') reportType: string,
    @GetUser() user: AuthenticatedUser,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const { take, skip, ...restQuery } = query;
    const result = await this.reportsExportService.exportReport({
      reportType: reportType as any,
      tenantId: user.tenantId,
      format: 'pdf',
      query: restQuery,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }
}
