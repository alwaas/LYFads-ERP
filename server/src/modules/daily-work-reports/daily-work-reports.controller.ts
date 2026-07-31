import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { DailyWorkReportsService } from './daily-work-reports.service';

import { CreateDailyWorkReportDto } from './dto/create-daily-work-report.dto';
import { UpdateDailyWorkReportDto } from './dto/update-daily-work-report.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('daily-work-reports')
@Roles(UserRole.SUPER_ADMIN)
export class DailyWorkReportsController {
  constructor(
    private readonly dailyWorkReportsService: DailyWorkReportsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDailyWorkReportDto) {
    return this.dailyWorkReportsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDailyWorkReportDto) {
    return this.dailyWorkReportsService.update(id, dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @Query() search: SearchDto) {
    return this.dailyWorkReportsService.findAll(pagination, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyWorkReportsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyWorkReportsService.delete(id);
  }
}
