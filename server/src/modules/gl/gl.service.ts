import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, PrismaClient, AccountType, NormalBalanceSide, JournalEntry, JournalEntryLine, Account } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

export interface JournalEntryLineInput {
  accountId: string;
  description?: string | null;
  debitAmount?: number | string | Prisma.Decimal;
  creditAmount?: number | string | Prisma.Decimal;
}

export interface CreateJournalEntryInput {
  date?: Date | string;
  description?: string | null;
  referenceId?: string | null;
  lines: JournalEntryLineInput[];
  fiscalYearId?: string | null;
  createdById?: string | null;
  posted?: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: Array<{
  code: string;
  name: string;
  type: AccountType;
  normalBalanceSide: NormalBalanceSide;
}> = [
  { code: '1000', name: 'Cash', type: AccountType.ASSET, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '1010', name: 'Accounts Receivable', type: AccountType.ASSET, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '1020', name: 'Inventory', type: AccountType.ASSET, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '1030', name: 'Prepaid Expenses', type: AccountType.ASSET, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '1040', name: 'Fixed Assets', type: AccountType.ASSET, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '2010', name: 'Accrued Expenses', type: AccountType.LIABILITY, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '2020', name: 'Taxes Payable', type: AccountType.LIABILITY, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '3000', name: 'Retained Earnings', type: AccountType.EQUITY, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '4000', name: 'Sales Revenue', type: AccountType.INCOME, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '4010', name: 'Service Revenue', type: AccountType.INCOME, normalBalanceSide: NormalBalanceSide.CREDIT },
  { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '5010', name: 'Operating Expenses', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '5020', name: 'Bank Fees', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '5030', name: 'Utilities Expense', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '5040', name: 'Salaries Expense', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '5050', name: 'Inventory Adjustments', type: AccountType.EXPENSE, normalBalanceSide: NormalBalanceSide.DEBIT },
  { code: '2100', name: 'Salaries Payable', type: AccountType.LIABILITY, normalBalanceSide: NormalBalanceSide.CREDIT },
];

@Injectable()
export class GlService {
  constructor(private readonly prisma: PrismaService) {}

  private toDecimal(value?: number | string | Prisma.Decimal): Prisma.Decimal {
    if (value === undefined || value === null || value === '') {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(value as number | string);
  }

  async ensureDefaultAccounts(tenantId: string): Promise<void> {
    const existing = await this.prisma.account.count({ where: { tenantId } });
    if (existing > 0) return;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currency: true },
    });
    const currency = tenant?.currency ?? 'USD';

    await this.prisma.account.createMany({
      data: DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalanceSide: acc.normalBalanceSide,
        isActive: true,
        tenantId,
        currency,
      })),
      skipDuplicates: true,
    });
  }

  async getAccountByCode(tenantId: string, code: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { code_tenantId: { code, tenantId } },
    });
    if (!account) {
      throw new NotFoundException(`Account with code ${code} not found for tenant`);
    }
    return account;
  }

  async getAccountById(tenantId: string, accountId: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId, tenantId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found for tenant`);
    }
    return account;
  }

  private validateBalanced(lines: JournalEntryLineInput[]): void {
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const line of lines) {
      const debit = this.toDecimal(line.debitAmount);
      const credit = this.toDecimal(line.creditAmount);

      if (debit.gt(0) && credit.gt(0)) {
        throw new BadRequestException(
          'A journal entry line cannot have both debit and credit amounts',
        );
      }
      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
    }

    if (!totalDebit.eq(totalCredit)) {
      throw new BadRequestException(
        `Journal entry is not balanced. Total debits: ${totalDebit.toString()}, total credits: ${totalCredit.toString()}`,
      );
    }
  }

  async createJournalEntry(
    input: CreateJournalEntryInput,
    tenantId: string,
  ): Promise<JournalEntry> {
    if (input.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least two lines');
    }

    this.validateBalanced(input.lines);

    for (const line of input.lines) {
      await this.getAccountById(tenantId, line.accountId);
    }

    return this.prisma.$transaction(async (tx) => {
      let fiscalYear: { id: string } | null = null;
      const date = input.date ? new Date(input.date) : new Date();

      if (input.fiscalYearId) {
        fiscalYear = await tx.fiscalYear.findFirst({
          where: { id: input.fiscalYearId, tenantId },
          select: { id: true },
        });
        if (!fiscalYear) {
          throw new NotFoundException('Fiscal year not found for tenant');
        }
      } else {
        const year = date.getFullYear();
        fiscalYear = await tx.fiscalYear.findFirst({
          where: { year, tenantId },
          select: { id: true },
        });
      }

      const referenceId = input.referenceId;
      if (referenceId) {
        const existing = await tx.journalEntry.findFirst({
          where: { tenantId, referenceId },
        });
        if (existing) {
          throw new ConflictException(
            `A journal entry with referenceId '${referenceId}' already exists`,
          );
        }
      }

      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { currency: true },
      });
      const currency = tenant?.currency ?? 'USD';

      return tx.journalEntry.create({
        data: {
          tenantId,
          fiscalYearId: fiscalYear?.id,
          date,
          description: input.description,
          referenceId: referenceId ?? undefined,
          posted: input.posted ?? false,
          postedAt: input.posted ? new Date() : undefined,
          createdById: input.createdById,
          currency,
          lines: {
            create: input.lines.map((line) => ({
              tenantId,
              accountId: line.accountId,
              debitAmount: this.toDecimal(line.debitAmount),
              creditAmount: this.toDecimal(line.creditAmount),
              description: line.description ?? undefined,
            })),
          },
        },
        include: {
          lines: {
            include: { account: true },
          },
        },
      });
    });
  }

  async createJournalEntryInTransaction(
    tx: Prisma.TransactionClient,
    input: CreateJournalEntryInput,
    tenantId: string,
  ): Promise<JournalEntry> {
    if (input.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least two lines');
    }

    this.validateBalanced(input.lines);

for (const line of input.lines) {
        await this.getAccountById(tenantId, line.accountId);
      }

    const date = input.date ? new Date(input.date) : new Date();
    let fiscalYearId: string | undefined;

    if (input.fiscalYearId) {
      fiscalYearId = input.fiscalYearId;
    } else {
      const year = date.getFullYear();
      const fiscalYear = await tx.fiscalYear.findFirst({
        where: { year, tenantId },
        select: { id: true },
      });
      fiscalYearId = fiscalYear?.id;
    }

    const referenceId = input.referenceId;
    if (referenceId) {
      const existing = await tx.journalEntry.findFirst({
        where: { tenantId, referenceId },
      });
      if (existing) {
        throw new ConflictException(
          `A journal entry with referenceId '${referenceId}' already exists`,
        );
      }
    }

    return tx.journalEntry.create({
      data: {
        tenantId,
        fiscalYearId: fiscalYearId ?? undefined,
        date,
        description: input.description,
        referenceId: referenceId ?? undefined,
        posted: input.posted ?? false,
        postedAt: input.posted ? new Date() : undefined,
        createdById: input.createdById,
        lines: {
          create: input.lines.map((line) => ({
            tenantId,
            accountId: line.accountId,
            debitAmount: this.toDecimal(line.debitAmount),
            creditAmount: this.toDecimal(line.creditAmount),
            description: line.description ?? undefined,
          })),
        },
      },
      include: {
        lines: {
          include: { account: true },
        },
      },
    });
  }

  async postInvoice(tenantId: string, invoiceId: string, amount: Prisma.Decimal | number, taxAmount?: Prisma.Decimal | number, userId?: string): Promise<void> {
    const arAccount = await this.getAccountByCode(tenantId, '1010');
    const revenueAccount = await this.getAccountByCode(tenantId, '4000');
    const taxAccount = await this.getAccountByCode(tenantId, '2020');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: arAccount.id,
        debitAmount: amount,
      },
      {
        accountId: revenueAccount.id,
        creditAmount: amount,
      },
    ];

    const taxDec = this.toDecimal(taxAmount);
    if (taxDec.gt(0)) {
      lines[0].debitAmount = this.toDecimal(amount).plus(taxDec);
      lines.push({
        accountId: taxAccount.id,
        creditAmount: taxDec,
      });
    }

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Invoice ${invoiceId} posted`,
        referenceId: `invoice_${invoiceId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postInvoicePayment(tenantId: string, paymentId: string, amount: Prisma.Decimal | number, invoiceId?: string, userId?: string): Promise<void> {
    const bankAccount = await this.getAccountByCode(tenantId, '1000');
    const arAccount = await this.getAccountByCode(tenantId, '1010');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: bankAccount.id,
        debitAmount: amount,
      },
      {
        accountId: arAccount.id,
        creditAmount: amount,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Payment ${paymentId} received${invoiceId ? ` against invoice ${invoiceId}` : ''}`,
        referenceId: `payment_${paymentId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postVendorBill(tenantId: string, billId: string, amount: Prisma.Decimal | number, taxAmount?: Prisma.Decimal | number, userId?: string): Promise<void> {
    const expenseAccount = await this.getAccountByCode(tenantId, '5010');
    const inventoryAccount = await this.getAccountByCode(tenantId, '1020');
    const apAccount = await this.getAccountByCode(tenantId, '2000');
    const taxAccount = await this.getAccountByCode(tenantId, '2020');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: expenseAccount.id,
        debitAmount: amount,
      },
      {
        accountId: apAccount.id,
        creditAmount: amount,
      },
    ];

    const taxDec = this.toDecimal(taxAmount);
    if (taxDec.gt(0)) {
      lines[1].creditAmount = this.toDecimal(amount).plus(taxDec);
      lines.push({
        accountId: taxAccount.id,
        debitAmount: taxDec,
      });
    }

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Vendor bill ${billId} posted`,
        referenceId: `bill_${billId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postVendorPayment(tenantId: string, paymentId: string, amount: Prisma.Decimal | number, billId?: string, userId?: string): Promise<void> {
    const apAccount = await this.getAccountByCode(tenantId, '2000');
    const bankAccount = await this.getAccountByCode(tenantId, '1000');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: apAccount.id,
        debitAmount: amount,
      },
      {
        accountId: bankAccount.id,
        creditAmount: amount,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Vendor payment ${paymentId}${billId ? ` against bill ${billId}` : ''}`,
        referenceId: `vendor_payment_${paymentId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postCogs(tenantId: string, salesOrderId: string, productId: string, totalCost: Prisma.Decimal | number, userId?: string): Promise<void> {
    const cogsAccount = await this.getAccountByCode(tenantId, '5000');
    const inventoryAccount = await this.getAccountByCode(tenantId, '1020');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: cogsAccount.id,
        debitAmount: totalCost,
      },
      {
        accountId: inventoryAccount.id,
        creditAmount: totalCost,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `COGS for sales order ${salesOrderId} (product ${productId})`,
        referenceId: `cogs_${salesOrderId}_${productId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postInventoryReceipt(tenantId: string, purchaseOrderId: string, productId: string, totalCost: Prisma.Decimal | number, userId?: string): Promise<void> {
    const inventoryAccount = await this.getAccountByCode(tenantId, '1020');
    const apAccount = await this.getAccountByCode(tenantId, '2000');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: inventoryAccount.id,
        debitAmount: totalCost,
      },
      {
        accountId: apAccount.id,
        creditAmount: totalCost,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Inventory receipt for PO ${purchaseOrderId} (product ${productId})`,
        referenceId: `inventory_receipt_${purchaseOrderId}_${productId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postExpense(
    tenantId: string,
    expenseId: string,
    amount: Prisma.Decimal | number,
    userId?: string,
    options?: {
      glAccountId?: string | null;
      vendorId?: string | null;
      taxAmount?: Prisma.Decimal | number;
    },
  ): Promise<void> {
    const expenseAccount = options?.glAccountId
      ? await this.getAccountById(tenantId, options.glAccountId)
      : await this.getAccountByCode(tenantId, '5010');

    const amountDec = this.toDecimal(amount);
    const taxDec = this.toDecimal(options?.taxAmount);
    const totalDec = taxDec.gt(0) ? amountDec.plus(taxDec) : amountDec;

    const creditAccountCode = options?.vendorId ? '2000' : '1000';
    const creditAccount = await this.getAccountByCode(tenantId, creditAccountCode);

    const lines: JournalEntryLineInput[] = [
      {
        accountId: expenseAccount.id,
        description: `Expense ${expenseId} recorded`,
        debitAmount: totalDec,
      },
      {
        accountId: creditAccount.id,
        description: `Expense ${expenseId} ${options?.vendorId ? 'on account' : 'paid'}`,
        creditAmount: totalDec,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Expense ${expenseId} posted`,
        referenceId: `expense_${expenseId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postExpensePayment(
    tenantId: string,
    paymentId: string,
    amount: Prisma.Decimal | number,
    expenseId?: string,
    userId?: string,
  ): Promise<void> {
    const apAccount = await this.getAccountByCode(tenantId, '2000');
    const bankAccount = await this.getAccountByCode(tenantId, '1000');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: apAccount.id,
        debitAmount: amount,
        description: `Expense ${expenseId ?? ''} payment`,
      },
      {
        accountId: bankAccount.id,
        creditAmount: amount,
        description: `Payment ${paymentId} for expense ${expenseId ?? ''}`,
      },
    ];

    await this.createJournalEntry(
      {
        date: new Date(),
        description: `Expense payment ${paymentId}${expenseId ? ` against expense ${expenseId}` : ''}`,
        referenceId: `expense_payment_${paymentId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postPayrollInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    payrollId: string,
    amount: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry> {
    const expenseAccount = await tx.account.findUnique({
      where: { code_tenantId: { code: '5040', tenantId } },
      select: { id: true },
    });

    if (!expenseAccount) {
      throw new NotFoundException('Account with code 5040 not found for tenant');
    }

    const payableAccount = await tx.account.findUnique({
      where: { code_tenantId: { code: '2100', tenantId } },
      select: { id: true },
    });

    if (!payableAccount) {
      throw new NotFoundException('Account with code 2100 not found for tenant');
    }

    const lines: JournalEntryLineInput[] = [
      {
        accountId: expenseAccount.id,
        description: `Payroll ${payrollId} salary expense`,
        debitAmount: amount,
      },
      {
        accountId: payableAccount.id,
        description: `Payroll ${payrollId} salary payable`,
        creditAmount: amount,
      },
    ];

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description: `Payroll ${payrollId} approved`,
        referenceId: `payroll_${payrollId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postPayrollPayment(
    tenantId: string,
    paymentId: string,
    amount: Prisma.Decimal | number,
    payrollId?: string,
    userId?: string,
  ): Promise<void> {
    const payableAccount = await this.getAccountByCode(tenantId, '2100');
    const bankAccount = await this.getAccountByCode(tenantId, '1000');

    const lines: JournalEntryLineInput[] = [
      {
        accountId: payableAccount.id,
        debitAmount: amount,
        description: `Payroll ${payrollId ?? ''} settlement`,
      },
      {
        accountId: bankAccount.id,
        creditAmount: amount,
        description: `Payment ${paymentId}${payrollId ? ` for payroll ${payrollId}` : ''}`,
      },
    ];

     await this.createJournalEntry(
      {
        date: new Date(),
        description: `Payroll payment ${paymentId}${payrollId ? ` against payroll ${payrollId}` : ''}`,
        referenceId: `payroll_payment_${paymentId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postPayrollPaymentInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    paymentId: string,
    amount: Prisma.Decimal | number,
    payrollId: string,
    userId?: string,
  ): Promise<JournalEntry> {
    const payableAccount = await tx.account.findUnique({
      where: { code_tenantId: { code: '2100', tenantId } },
      select: { id: true },
    });

    if (!payableAccount) {
      throw new NotFoundException('Account with code 2100 not found for tenant');
    }

    const bankAccount = await tx.account.findUnique({
      where: { code_tenantId: { code: '1000', tenantId } },
      select: { id: true },
    });

    if (!bankAccount) {
      throw new NotFoundException('Account with code 1000 not found for tenant');
    }

    const lines: JournalEntryLineInput[] = [
      {
        accountId: payableAccount.id,
        description: `Payroll ${payrollId} payment settlement`,
        debitAmount: amount,
      },
      {
        accountId: bankAccount.id,
        description: `Payment ${paymentId} for payroll ${payrollId}`,
        creditAmount: amount,
      },
    ];

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description: `Payroll payment ${paymentId} against payroll ${payrollId}`,
        referenceId: `payroll_payment_${paymentId}`,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async reverseInvoiceInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    invoiceId: string,
    amount: Prisma.Decimal | number,
    taxAmount?: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry> {
    const referenceId = `invoice_cancel_${invoiceId}`;
    const existing = await tx.journalEntry.findFirst({
      where: { tenantId, referenceId },
      include: { lines: { include: { account: true } } },
    });
    if (existing) return existing;

    const revenueAccount = await this.getAccountByCode(tenantId, '4000');
    const taxAccount = await this.getAccountByCode(tenantId, '2020');
    const arAccount = await this.getAccountByCode(tenantId, '1010');

    const amountDec = this.toDecimal(amount);
    const taxDec = this.toDecimal(taxAmount);
    const totalDec = taxDec.gt(0) ? amountDec.plus(taxDec) : amountDec;

    const lines: JournalEntryLineInput[] = [
      {
        accountId: revenueAccount.id,
        debitAmount: amountDec,
        description: `Invoice ${invoiceId} cancelled - revenue reversal`,
      },
      {
        accountId: arAccount.id,
        creditAmount: totalDec,
        description: `Invoice ${invoiceId} cancelled - AR reversal`,
      },
    ];

    if (taxDec.gt(0)) {
      lines.push({
        accountId: taxAccount.id,
        debitAmount: taxDec,
        description: `Invoice ${invoiceId} cancelled - tax reversal`,
      });
    }

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description: `Invoice ${invoiceId} cancelled reversal`,
        referenceId,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async reverseInvoice(
    tenantId: string,
    invoiceId: string,
    amount: Prisma.Decimal | number,
    taxAmount?: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry> {
    return this.prisma.$transaction((tx) =>
      this.reverseInvoiceInTransaction(tx, tenantId, invoiceId, amount, taxAmount, userId),
    );
  }

  async reverseVendorBillInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    billId: string,
    amount: Prisma.Decimal | number,
    taxAmount?: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry> {
    const referenceId = `bill_cancel_${billId}`;
    const existing = await tx.journalEntry.findFirst({
      where: { tenantId, referenceId },
      include: { lines: { include: { account: true } } },
    });
    if (existing) return existing;

    const apAccount = await this.getAccountByCode(tenantId, '2000');
    const expenseAccount = await this.getAccountByCode(tenantId, '5010');
    const taxAccount = await this.getAccountByCode(tenantId, '2020');

    const amountDec = this.toDecimal(amount);
    const taxDec = this.toDecimal(taxAmount);
    const totalDec = taxDec.gt(0) ? amountDec.plus(taxDec) : amountDec;

    const lines: JournalEntryLineInput[] = [
      {
        accountId: apAccount.id,
        debitAmount: totalDec,
        description: `Vendor bill ${billId} cancelled - AP reversal`,
      },
      {
        accountId: expenseAccount.id,
        creditAmount: amountDec,
        description: `Vendor bill ${billId} cancelled - expense reversal`,
      },
    ];

    if (taxDec.gt(0)) {
      lines.push({
        accountId: taxAccount.id,
        creditAmount: taxDec,
        description: `Vendor bill ${billId} cancelled - tax reversal`,
      });
    }

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description: `Vendor bill ${billId} cancelled reversal`,
        referenceId,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async reverseVendorBill(
    tenantId: string,
    billId: string,
    amount: Prisma.Decimal | number,
    taxAmount?: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry> {
    return this.prisma.$transaction((tx) =>
      this.reverseVendorBillInTransaction(tx, tenantId, billId, amount, taxAmount, userId),
    );
  }

  async reversePaymentInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    payment: {
      id: string;
      amount: Prisma.Decimal | number;
      invoiceId?: string | null;
      purchaseInvoiceId?: string | null;
      expenseId?: string | null;
      payrollId?: string | null;
    },
    userId?: string,
  ): Promise<JournalEntry | null> {
    const referenceId = `payment_void_${payment.id}`;
    const existing = await tx.journalEntry.findFirst({
      where: { tenantId, referenceId },
      include: { lines: { include: { account: true } } },
    });
    if (existing) return existing;

    const amountDec = this.toDecimal(payment.amount);
    if (amountDec.lte(0)) return null;

    let lines: JournalEntryLineInput[] = [];
    let description = `Payment void reversal ${payment.id}`;

    if (payment.invoiceId) {
      const arAccount = await this.getAccountByCode(tenantId, '1010');
      const bankAccount = await this.getAccountByCode(tenantId, '1000');
      lines = [
        {
          accountId: arAccount.id,
          debitAmount: amountDec,
          description: `Void payment ${payment.id} against invoice ${payment.invoiceId} - AR restoration`,
        },
        {
          accountId: bankAccount.id,
          creditAmount: amountDec,
          description: `Void payment ${payment.id} against invoice ${payment.invoiceId} - cash reversal`,
        },
      ];
      description = `Payment ${payment.id} void reversal for invoice ${payment.invoiceId}`;
    } else if (payment.purchaseInvoiceId) {
      const bankAccount = await this.getAccountByCode(tenantId, '1000');
      const apAccount = await this.getAccountByCode(tenantId, '2000');
      lines = [
        {
          accountId: bankAccount.id,
          debitAmount: amountDec,
          description: `Void vendor payment ${payment.id} against bill ${payment.purchaseInvoiceId} - cash restoration`,
        },
        {
          accountId: apAccount.id,
          creditAmount: amountDec,
          description: `Void vendor payment ${payment.id} against bill ${payment.purchaseInvoiceId} - AP restoration`,
        },
      ];
      description = `Vendor payment ${payment.id} void reversal for bill ${payment.purchaseInvoiceId}`;
    } else if (payment.expenseId) {
      const bankAccount = await this.getAccountByCode(tenantId, '1000');
      const apAccount = await this.getAccountByCode(tenantId, '2000');
      lines = [
        {
          accountId: bankAccount.id,
          debitAmount: amountDec,
          description: `Void expense payment ${payment.id} against expense ${payment.expenseId} - cash restoration`,
        },
        {
          accountId: apAccount.id,
          creditAmount: amountDec,
          description: `Void expense payment ${payment.id} against expense ${payment.expenseId} - AP restoration`,
        },
      ];
      description = `Expense payment ${payment.id} void reversal for expense ${payment.expenseId}`;
    } else if (payment.payrollId) {
      const bankAccount = await this.getAccountByCode(tenantId, '1000');
      const payableAccount = await this.getAccountByCode(tenantId, '2100');
      lines = [
        {
          accountId: bankAccount.id,
          debitAmount: amountDec,
          description: `Void payroll payment ${payment.id} against payroll ${payment.payrollId} - cash restoration`,
        },
        {
          accountId: payableAccount.id,
          creditAmount: amountDec,
          description: `Void payroll payment ${payment.id} against payroll ${payment.payrollId} - salaries payable restoration`,
        },
      ];
      description = `Payroll payment ${payment.id} void reversal for payroll ${payment.payrollId}`;
    } else {
      return null;
    }

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description,
        referenceId,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async reversePayment(
    tenantId: string,
    payment: {
      id: string;
      amount: Prisma.Decimal | number;
      invoiceId?: string | null;
      purchaseInvoiceId?: string | null;
      expenseId?: string | null;
      payrollId?: string | null;
    },
    userId?: string,
  ): Promise<JournalEntry | null> {
    return this.prisma.$transaction((tx) =>
      this.reversePaymentInTransaction(tx, tenantId, payment, userId),
    );
  }

  async postInventoryAdjustmentInTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    countId: string,
    lineId: string,
    variance: number,
    totalCost: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry | null> {
    const referenceId = `stock_count_adj_${countId}_${lineId}`;
    const existing = await tx.journalEntry.findFirst({
      where: { tenantId, referenceId },
      include: { lines: { include: { account: true } } },
    });
    if (existing) return existing;

    const costDec = this.toDecimal(totalCost).abs();
    if (costDec.lte(0)) return null;

    const inventoryAccount = await this.getAccountByCode(tenantId, '1020');
    let adjustmentAccount: Account;
    try {
      adjustmentAccount = await this.getAccountByCode(tenantId, '5050');
    } catch {
      adjustmentAccount = await this.getAccountByCode(tenantId, '5010');
    }

    let lines: JournalEntryLineInput[];
    let description: string;

    if (variance > 0) {
      // Surplus: DR Inventory Asset (1020) / CR Inventory Adjustments (5050)
      lines = [
        {
          accountId: inventoryAccount.id,
          debitAmount: costDec,
          description: `Stock count ${countId} surplus adjustment - inventory addition`,
        },
        {
          accountId: adjustmentAccount.id,
          creditAmount: costDec,
          description: `Stock count ${countId} surplus adjustment - inventory gain`,
        },
      ];
      description = `Stock count ${countId} line ${lineId} positive variance adjustment`;
    } else {
      // Shrinkage: DR Inventory Adjustments (5050) / CR Inventory Asset (1020)
      lines = [
        {
          accountId: adjustmentAccount.id,
          debitAmount: costDec,
          description: `Stock count ${countId} shrinkage adjustment - inventory loss`,
        },
        {
          accountId: inventoryAccount.id,
          creditAmount: costDec,
          description: `Stock count ${countId} shrinkage adjustment - inventory reduction`,
        },
      ];
      description = `Stock count ${countId} line ${lineId} negative variance adjustment`;
    }

    return this.createJournalEntryInTransaction(
      tx,
      {
        date: new Date(),
        description,
        referenceId,
        lines,
        posted: true,
        createdById: userId,
      },
      tenantId,
    );
  }

  async postInventoryAdjustment(
    tenantId: string,
    countId: string,
    lineId: string,
    variance: number,
    totalCost: Prisma.Decimal | number,
    userId?: string,
  ): Promise<JournalEntry | null> {
    return this.prisma.$transaction((tx) =>
      this.postInventoryAdjustmentInTransaction(tx, tenantId, countId, lineId, variance, totalCost, userId),
    );
  }

  async findAccounts(tenantId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const where = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async createAccount(tenantId: string, dto: { code: string; name: string; type: AccountType; normalBalanceSide: NormalBalanceSide }) {
    try {
      return await this.prisma.account.create({
        data: {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          normalBalanceSide: dto.normalBalanceSide,
          isActive: true,
          tenantId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Account with code ${dto.code} already exists for this tenant`);
      }
      throw error;
    }
  }

  async findJournalEntries(tenantId: string, pagination: PaginationDto, query?: { dateFrom?: string; dateTo?: string; posted?: boolean; referenceId?: string; accountId?: string }) {
    const { skip, limit } = pagination;
    const where: Prisma.JournalEntryWhereInput = { tenantId };

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }
    if (query?.posted !== undefined) where.posted = query.posted === true || String(query.posted) === 'true';
    if (query?.referenceId) where.referenceId = query.referenceId;
    if (query?.accountId) {
      where.lines = { some: { accountId: query.accountId } };
    }

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          lines: {
            include: { account: true },
          },
        },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async getTrialBalance(tenantId: string, query?: { dateFrom?: string; dateTo?: string }): Promise<{
    accounts: Array<{
      accountId: string;
      code: string;
      name: string;
      type: AccountType;
      normalBalanceSide: NormalBalanceSide;
      debitBalance: number;
      creditBalance: number;
      balance: number;
    }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    isBalanced: boolean;
  }> {
    const where: Prisma.JournalEntryWhereInput = { tenantId, posted: true };

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    const entries = await this.prisma.journalEntry.findMany({
      where,
      select: {
        lines: {
          select: {
            accountId: true,
            debitAmount: true,
            creditAmount: true,
          },
        },
      },
    });

    const accountBalances = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();

    for (const entry of entries) {
      for (const line of entry.lines) {
        const current = accountBalances.get(line.accountId) || {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(0),
        };
        current.debit = current.debit.plus(line.debitAmount);
        current.credit = current.credit.plus(line.creditAmount);
        accountBalances.set(line.accountId, current);
      }
    }

    const accounts = await this.prisma.account.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const result = accounts.map((account) => {
      const bal = accountBalances.get(account.id) || {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      };
      const debitBalance = bal.debit.toNumber();
      const creditBalance = bal.credit.toNumber();
      const balance =
        account.type === AccountType.ASSET
          ? debitBalance - creditBalance
          : creditBalance - debitBalance;
      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalanceSide: account.normalBalanceSide,
        debitBalance,
        creditBalance,
        balance,
      };
    });

    const totalAssets = result.filter((a) => a.type === AccountType.ASSET).reduce((s, a) => s + Math.abs(a.balance), 0);
    const totalLiabilities = result.filter((a) => a.type === AccountType.LIABILITY).reduce((s, a) => s + Math.abs(a.balance), 0);
    const totalEquity = result.filter((a) => a.type === AccountType.EQUITY).reduce((s, a) => s + Math.abs(a.balance), 0);
    const totalRevenue = result.filter((a) => a.type === AccountType.INCOME).reduce((s, a) => s + Math.abs(a.balance), 0);
    const totalExpenses = result.filter((a) => a.type === AccountType.EXPENSE).reduce((s, a) => s + Math.abs(a.balance), 0);

    return {
      accounts: result,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async getProfitAndLoss(tenantId: string, query?: { dateFrom?: string; dateTo?: string }): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    byAccount: Array<{ accountId: string; code: string; name: string; type: AccountType; amount: number }>;
  }> {
    const where: Prisma.JournalEntryWhereInput = { tenantId, posted: true };

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    const entries = await this.prisma.journalEntry.findMany({
      where,
      select: {
        lines: {
          select: {
            accountId: true,
            debitAmount: true,
            creditAmount: true,
          },
        },
      },
    });

    const accountTotals = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();

    for (const entry of entries) {
      for (const line of entry.lines) {
        const current = accountTotals.get(line.accountId) || {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(0),
        };
        current.debit = current.debit.plus(line.debitAmount);
        current.credit = current.credit.plus(line.creditAmount);
        accountTotals.set(line.accountId, current);
      }
    }

    const accounts = await this.prisma.account.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });

    let totalRevenue = new Prisma.Decimal(0);
    let totalExpenses = new Prisma.Decimal(0);

    const byAccount: Array<{ accountId: string; code: string; name: string; type: AccountType; amount: number }> = [];

    for (const account of accounts) {
      if (account.type !== AccountType.INCOME && account.type !== AccountType.EXPENSE) continue;

      const bal = accountTotals.get(account.id) || {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      };

      let amount: Prisma.Decimal;
      if (account.type === AccountType.INCOME) {
        amount = bal.credit.minus(bal.debit);
        totalRevenue = totalRevenue.plus(amount);
      } else {
        amount = bal.debit.minus(bal.credit);
        totalExpenses = totalExpenses.plus(amount);
      }

      byAccount.push({
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        amount: amount.toNumber(),
      });
    }

    return {
      totalRevenue: totalRevenue.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      netIncome: totalRevenue.minus(totalExpenses).toNumber(),
      byAccount,
    };
  }

  async getGeneralLedger(tenantId: string, query?: { dateFrom?: string; dateTo?: string; accountId?: string; referenceId?: string }): Promise<Array<{
    date: Date;
    description: string | null;
    referenceId: string | null;
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
  }>> {
    const where: Prisma.JournalEntryWhereInput = { tenantId, posted: true };

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }
    if (query?.referenceId) where.referenceId = query.referenceId;
    if (query?.accountId) {
      where.lines = { some: { accountId: query.accountId } };
    }

    const entries = await this.prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        date: true,
        description: true,
        referenceId: true,
        lines: {
          select: {
            account: { select: { code: true, name: true } },
            description: true,
            debitAmount: true,
            creditAmount: true,
          },
        },
      },
    });

    const result: Array<{
      date: Date;
      description: string | null;
      referenceId: string | null;
      accountCode: string;
      accountName: string;
      debitAmount: number;
      creditAmount: number;
    }> = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        result.push({
          date: entry.date,
          description: line.description ?? entry.description,
          referenceId: entry.referenceId,
          accountCode: line.account.code,
          accountName: line.account.name,
          debitAmount: line.debitAmount.toNumber(),
          creditAmount: line.creditAmount.toNumber(),
        });
      }
    }

    return result;
  }

  async findFiscalYears(tenantId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { tenantId },
      orderBy: { year: 'desc' },
    });
  }

  async createFiscalYear(tenantId: string, dto: { year: number; startDate: Date; endDate: Date }) {
    return this.prisma.fiscalYear.create({
      data: {
        year: dto.year,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: 'OPEN',
        tenantId,
      },
    });
  }
}
