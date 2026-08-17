import { Controller, Get } from '@nestjs/common';

import { ReportsService } from './reports.service';
import { GetUser } from '../modules/auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/types/auth-user.type';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(@GetUser() user: AuthenticatedUser) {
    return this.reportsService.dashboard(user.tenantId);
  }
}
