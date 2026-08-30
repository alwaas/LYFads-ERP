import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GetUser } from '../../modules/auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Body() dto: CreateExpenseDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.create(dto, user.tenantId, user.id);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.expensesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.expensesService.update(id, dto, user.tenantId, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.expensesService.remove(id, user.tenantId, user.id);
  }
}
