import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

export interface OverdueInvoicesResult {
  processedCount: number;
  updatedIds: string[];
}

export interface ExpiredSubscriptionsResult {
  processedCount: number;
  updatedIds: string[];
}

export interface LifecycleRunResult {
  timestamp: string;
  overdueInvoices: OverdueInvoicesResult;
  expiredSubscriptions: ExpiredSubscriptionsResult;
}

@Injectable()
export class LifecycleService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(LifecycleService.name);
  private timerRef: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  onApplicationBootstrap(): void {
    // Only schedule background interval if not running inside a test runner
    if (process.env.NODE_ENV !== 'test') {
      const HOURLY_MS = 60 * 60 * 1000;
      this.timerRef = setInterval(() => {
        void this.handleScheduledTasks();
      }, HOURLY_MS);
      this.logger.log('Automated background lifecycle processor initialized (1h interval).');
    }
  }

  onModuleDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  /**
   * Periodic execution runner.
   */
  async handleScheduledTasks(): Promise<void> {
    this.logger.log('Starting automated lifecycle checks...');
    try {
      const result = await this.processAll();
      this.logger.log(
        `Automated lifecycle run complete: ${result.overdueInvoices.processedCount} invoice(s) marked OVERDUE, ${result.expiredSubscriptions.processedCount} subscription(s) marked EXPIRED.`,
      );
    } catch (err: any) {
      this.logger.error(
        `Automated lifecycle run encountered an error: ${err?.message}`,
        err?.stack,
      );
    }
  }

  /**
   * Process and mark overdue invoices.
   * Idempotent, tenant-safe, transactional.
   */
  async processOverdueInvoices(tenantId?: string): Promise<OverdueInvoicesResult> {
    const now = new Date();

    const whereClause: Prisma.InvoiceWhereInput = {
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
      dueDate: { lt: now },
      balanceAmount: { gt: 0 },
      ...(tenantId ? { tenantId } : {}),
    };

    const overdueCandidates = await this.prisma.invoice.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        tenantId: true,
        dueDate: true,
        balanceAmount: true,
      },
    });

    if (overdueCandidates.length === 0) {
      return { processedCount: 0, updatedIds: [] };
    }

    const updatedIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const candidate of overdueCandidates) {
        await tx.invoice.update({
          where: { id: candidate.id },
          data: { status: InvoiceStatus.OVERDUE },
        });
        updatedIds.push(candidate.id);
      }
    });

    // Log activity for each updated invoice
    for (const candidate of overdueCandidates) {
      try {
        await this.activityLogsService.log({
          action: 'STATUS_CHANGE',
          module: 'INVOICE',
          description: `Invoice ${candidate.invoiceNumber} automatically transitioned to OVERDUE (due date: ${candidate.dueDate.toISOString().slice(0, 10)}, balance: ${candidate.balanceAmount.toString()}).`,
          tenantId: candidate.tenantId,
        });
      } catch (err) {
        void err;
      }
    }

    return {
      processedCount: updatedIds.length,
      updatedIds,
    };
  }

  /**
   * Process and mark expired subscriptions / trials.
   * Idempotent, tenant-safe, transactional.
   */
  async processExpiredSubscriptions(tenantId?: string): Promise<ExpiredSubscriptionsResult> {
    const now = new Date();

    const whereClause: Prisma.TenantSubscriptionWhereInput = {
      OR: [
        {
          status: SubscriptionStatus.TRIAL,
          trialEndDate: { lt: now },
        },
        {
          status: SubscriptionStatus.ACTIVE,
          endDate: { lt: now },
          autoRenew: false,
        },
      ],
      ...(tenantId ? { tenantId } : {}),
    };

    const expiredCandidates = await this.prisma.tenantSubscription.findMany({
      where: whereClause,
      select: {
        id: true,
        tenantId: true,
        status: true,
        trialEndDate: true,
        endDate: true,
      },
    });

    if (expiredCandidates.length === 0) {
      return { processedCount: 0, updatedIds: [] };
    }

    const updatedIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const candidate of expiredCandidates) {
        await tx.tenantSubscription.update({
          where: { id: candidate.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        updatedIds.push(candidate.id);
      }
    });

    // Log activity for each updated subscription
    for (const candidate of expiredCandidates) {
      try {
        await this.activityLogsService.log({
          action: 'STATUS_CHANGE',
          module: 'SUBSCRIPTION',
          description: `Tenant subscription automatically transitioned to EXPIRED from ${candidate.status}.`,
          tenantId: candidate.tenantId,
        });
      } catch (err) {
        void err;
      }
    }

    return {
      processedCount: updatedIds.length,
      updatedIds,
    };
  }

  /**
   * Process all lifecycle routines.
   */
  async processAll(tenantId?: string): Promise<LifecycleRunResult> {
    const overdueInvoices = await this.processOverdueInvoices(tenantId);
    const expiredSubscriptions = await this.processExpiredSubscriptions(tenantId);

    return {
      timestamp: new Date().toISOString(),
      overdueInvoices,
      expiredSubscriptions,
    };
  }
}
