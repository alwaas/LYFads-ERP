import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Query } from '@nestjs/common';
import { GetLeadsDto } from './dto/get-leads.dto';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('leads')
  create(@Body() dto: CreateLeadDto) {
    return this.crmService.create(dto);
  }

  @Get('leads')
  findAll(@Query() query: GetLeadsDto) {
    return this.crmService.findAll(query);
  }

  @Get('leads/:id')
  findOne(@Param('id') id: string) {
    return this.crmService.findOne(id);
  }

  @Patch('leads/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.crmService.update(id, dto);
  }

  @Delete('leads/:id')
  remove(@Param('id') id: string) {
    return this.crmService.remove(id);
  }
}
