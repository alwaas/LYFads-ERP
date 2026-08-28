import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';
import { GetUser } from '../auth/decorators/get-user.decorator';

import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  getSettings(@GetUser() user: AuthenticatedUser) {
    return this.settingsService.getSettings(user.tenantId);
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  updateSettings(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.tenantId, dto);
  }
}
