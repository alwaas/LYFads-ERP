import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDecimal,
  ValidateNested,
} from 'class-validator';
import { AccountType, NormalBalanceSide } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class JournalEntryLineDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal()
  debitAmount?: string;

  @IsOptional()
  @IsDecimal()
  creditAmount?: string;
}

export class CreateJournalEntryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  fiscalYearId?: string;

  @IsOptional()
  @IsBoolean()
  posted?: boolean;

  @IsArray()
  @ArrayMinSize(2, { message: 'At least two journal entry lines are required' })
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines!: JournalEntryLineDto[];
}

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEnum(NormalBalanceSide)
  normalBalanceSide: NormalBalanceSide;
}

export class JournalEntryQueryDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  posted?: boolean;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class FiscalYearQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class TrialBalanceQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ProfitAndLossQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class GeneralLedgerQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class CreateFiscalYearDto {
  @IsNumber()
  year: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
