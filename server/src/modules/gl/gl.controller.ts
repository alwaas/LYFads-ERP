import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { GlService } from './gl.service';
import {
  CreateJournalEntryDto,
  CreateAccountDto,
  JournalEntryQueryDto,
  TrialBalanceQueryDto,
  ProfitAndLossQueryDto,
  GeneralLedgerQueryDto,
  CreateFiscalYearDto,
} from './dto/gl.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class GlController {
  constructor(private readonly glService: GlService) {}

  @Get('accounts')
  accounts(
    @Query() pagination: PaginationDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.findAccounts(user.tenantId, pagination);
  }

  @Post('accounts')
  createAccount(
    @Body() dto: CreateAccountDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.createAccount(user.tenantId, dto);
  }

  @Get('journal-entries')
  journalEntries(
    @Query() query: JournalEntryQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const pagination: PaginationDto = {
      page: query.page,
      limit: query.limit,
      skip: query.skip,
    };
    return this.glService.findJournalEntries(user.tenantId, pagination, query);
  }

  @Post('journal-entries')
  createJournalEntry(
    @Body() dto: CreateJournalEntryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.createJournalEntry(
      {
        date: dto.date,
        description: dto.description,
        referenceId: dto.referenceId,
        lines: dto.lines,
        fiscalYearId: dto.fiscalYearId,
        posted: dto.posted,
        createdById: user.userId,
      },
      user.tenantId,
    );
  }

  @Get('fiscal-years')
  fiscalYears(@GetUser() user: AuthenticatedUser) {
    return this.glService.findFiscalYears(user.tenantId);
  }

  @Post('fiscal-years')
  createFiscalYear(
    @Body() dto: CreateFiscalYearDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.createFiscalYear(user.tenantId, {
      year: dto.year,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  @Get('trial-balance')
  trialBalance(
    @Query() query: TrialBalanceQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.getTrialBalance(user.tenantId, query);
  }

  @Get('profit-loss')
  profitLoss(
    @Query() query: ProfitAndLossQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.getProfitAndLoss(user.tenantId, query);
  }

  @Get('general-ledger')
  generalLedger(
    @Query() query: GeneralLedgerQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.glService.getGeneralLedger(user.tenantId, query);
  }

  @Post('seed-accounts')
  seedAccounts(@GetUser() user: AuthenticatedUser) {
    return this.glService.ensureDefaultAccounts(user.tenantId);
  }
}
