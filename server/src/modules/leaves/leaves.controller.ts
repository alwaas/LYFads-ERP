import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from "./dto/update-leave.dto";
import { LeavesService } from './leaves.service';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('leaves')
@Roles(UserRole.SUPER_ADMIN)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  create(@Body() dto: CreateLeaveDto) {
    return this.leavesService.create(dto);
  }

  @Patch(":id")
    update(
      @Param("id") id: string,
      @Body() dto: UpdateLeaveDto,
    ) {
      return this.leavesService.update(id, dto);
  }

  @Patch(':id/status')
    updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
    ) {
    return this.leavesService.updateStatus(id, dto);
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.leavesService.findOne(id);
  }

  @Get()
    findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    ) {
    return this.leavesService.findAll(
        pagination,
        search,
    );
  }
}
