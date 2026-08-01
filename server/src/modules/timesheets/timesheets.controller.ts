import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Controller('timesheets')
export class TimesheetsController {
  constructor(
    private readonly timesheetsService: TimesheetsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTimesheetDto) {
    return this.timesheetsService.create(dto);
  }

  @Get()
  findAll() {
    return this.timesheetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timesheetsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimesheetDto,
  ) {
    return this.timesheetsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timesheetsService.remove(id);
  }

  @Get('employee/:employeeId/summary')
  employeeSummary(
    @Param('employeeId') employeeId: string,
  ) {
    return this.timesheetsService.employeeSummary(employeeId);
  }

  @Get('project/:projectId/summary')
  projectSummary(
    @Param('projectId') projectId: string,
  ) {
    return this.timesheetsService.projectSummary(projectId);
  }
}