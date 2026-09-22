import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, InvoiceStatus } from '@prisma/client';
import * as csv from 'csv-writer';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as os from 'os';
import * as fs from 'fs';
import { Readable } from 'stream';

type ReportType = 'dashboard' | 'sales' | 'receivables' | 'customers' | 'expenses' | 'purchases' | 'vendors' | 'inventory' | 'sales-orders' | 'employees' | 'attendance-summary' | 'leave-report' | 'payroll-summary';

interface ExportOptions {
  reportType: ReportType;
  tenantId: string;
  format: 'csv' | 'excel' | 'pdf';
  query?: any;
  take?: number;
  skip?: number;
}

@Injectable()
export class ReportsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportReport(options: ExportOptions): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    try {
      const { reportType, tenantId, format, query, take, skip } = options;

      const data = await this.getReportData(reportType, tenantId, query, take, skip);

      switch (format) {
        case 'csv':
          return this.exportCsv(reportType, data);
        case 'excel':
          return this.exportExcel(reportType, data);
        case 'pdf':
          return this.exportPdf(reportType, data);
        default:
          throw new BadRequestException('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  private async getReportData(reportType: ReportType, tenantId: string, query?: any, take?: number, skip?: number): Promise<any> {
    switch (reportType) {
      case 'dashboard':
        return this.prisma.$queryRaw`
          SELECT 
            (SELECT COALESCE(SUM(total), 0) FROM "Invoice" WHERE "tenantId" = ${tenantId} AND status NOT IN ('DRAFT', 'CANCELLED')) as total_sales,
            (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE "tenantId" = ${tenantId} AND status = 'ACTIVE') as total_payments,
            (SELECT COUNT(*) FROM "Invoice" WHERE "tenantId" = ${tenantId}) as invoice_count,
            (SELECT COUNT(*) FROM "Client" WHERE "tenantId" = ${tenantId} AND "isActive" = true) as customer_count
        `;

      case 'sales':
        return this.getSalesReport(tenantId, query, take, skip);

      case 'receivables':
        return this.getReceivablesReport(tenantId, take, skip);

      case 'customers':
        return this.getCustomerReport(tenantId, query, take, skip);

      case 'expenses':
        return this.getExpenseReport(tenantId, query, take, skip);

      case 'purchases':
        return this.getPurchaseReport(tenantId, query, take, skip);

      case 'vendors':
        return this.getVendorReport(tenantId, take, skip);

      case 'inventory':
        return this.getInventoryReport(tenantId, query, take, skip);

      case 'sales-orders':
        return this.getSalesOrderReport(tenantId, query, take, skip);

      case 'employees':
        return this.getEmployeeDirectory(tenantId, take, skip);

      case 'attendance-summary':
        return this.getAttendanceSummary(tenantId, query?.month, query?.year, take, skip);

      case 'leave-report':
        return this.getLeaveReport(tenantId, query?.month, query?.year, take, skip);

      case 'payroll-summary':
        return this.getPayrollSummary(tenantId, query?.month, query?.year, take, skip);

      default:
        throw new BadRequestException('Unsupported report type');
    }
  }

  private async getSalesReport(tenantId: string, query: any, take?: number, skip?: number) {
    // Reuse existing report logic - simplified for export
    const where: any = { tenantId };
    if (query?.dateFrom || query?.dateTo) {
      where.issueDate = {};
      if (query.dateFrom) where.issueDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.issueDate.lte = new Date(query.dateTo);
    }
    if (query?.status) where.status = query.status;
    if (query?.clientId) where.clientId = query.clientId;

    return this.prisma.invoice.findMany({
      where,
      include: { client: { select: { companyName: true } } },
      orderBy: { issueDate: 'desc' },
      take,
      skip,
    });
  }

  private async getReceivablesReport(tenantId: string, take?: number, skip?: number) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID] },
        balanceAmount: { gt: 0 },
      },
      include: { client: { select: { companyName: true } } },
      orderBy: { dueDate: 'asc' },
      take,
      skip,
    });
  }

  private async getCustomerReport(tenantId: string, _query: any, take?: number, skip?: number) {
    return this.prisma.client.findMany({
      where: { tenantId, isActive: true },
      include: {
        invoices: {
          where: { status: { not: 'DRAFT' } },
          select: { total: true, paidAmount: true, balanceAmount: true },
        },
      },
      take,
      skip,
    });
  }

  private async getExpenseReport(tenantId: string, query: any, take?: number, skip?: number) {
    const where: any = { tenantId };
    if (query?.category) {
      where.category = { contains: query.category, mode: Prisma.QueryMode.insensitive };
    }
    return this.prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, take, skip });
  }

  private async getPurchaseReport(tenantId: string, query: any, take?: number, skip?: number) {
    const where: any = { tenantId };
    if (query?.vendorId) where.vendorId = query.vendorId;
    return this.prisma.purchase.findMany({ where, orderBy: { purchaseDate: 'desc' }, take, skip });
  }

  private async getVendorReport(tenantId: string, _query: any, take?: number, skip?: number) {
    return this.prisma.vendor.findMany({
      where: { tenantId },
      include: { purchases: { select: { total: true } } },
      take,
      skip,
    });
  }

  private async getInventoryReport(tenantId: string, query: any, take?: number, skip?: number) {
    const where: any = { tenantId };
    if (query?.search) {
      where.name = { contains: query.search, mode: Prisma.QueryMode.insensitive };
    }
    return this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, take, skip });
  }

  private async getSalesOrderReport(tenantId: string, query: any, take?: number, skip?: number) {
    const where: any = { tenantId };
    if (query?.status) where.status = query.status;
    if (query?.clientId) where.clientId = query.clientId;
    if (query?.dateFrom || query?.dateTo) {
      where.orderDate = {};
      if (query.dateFrom) where.orderDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.orderDate.lte = new Date(query.dateTo);
    }
    return this.prisma.salesOrder.findMany({
      where,
      include: { client: { select: { companyName: true } } },
      orderBy: { orderDate: 'desc' },
      take,
      skip,
    });
  }

  private async getEmployeeDirectory(tenantId: string, take?: number, skip?: number) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      include: { user: { select: { fullName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  private async getAttendanceSummary(tenantId: string, month?: string, year?: string, take?: number, skip?: number) {
    const dateFrom = month && year ? new Date(`${year}-${month}-01`) : new Date();
    dateFrom.setDate(1);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 1);
    dateTo.setDate(0);
    dateTo.setHours(23, 59, 59, 999);

    return this.prisma.attendance.findMany({
      where: { tenantId, date: { gte: dateFrom, lte: dateTo } },
      include: { employee: { include: { user: { select: { fullName: true } } } } },
      take,
      skip,
    });
  }

  private async getLeaveReport(tenantId: string, month?: string, year?: string, take?: number, skip?: number) {
    const dateFrom = month && year ? new Date(`${year}-${month}-01`) : new Date();
    dateFrom.setDate(1);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 1);
    dateTo.setDate(0);
    dateTo.setHours(23, 59, 59, 999);

    return this.prisma.leave.findMany({
      where: { tenantId, startDate: { gte: dateFrom, lte: dateTo } },
      include: { employee: { include: { user: { select: { fullName: true } } } } },
      take,
      skip,
    });
  }

  private async getPayrollSummary(tenantId: string, month?: string, year?: string, take?: number, skip?: number) {
    const where: any = { tenantId };
    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }
    return this.prisma.payroll.findMany({
      where,
      include: { employee: { include: { user: { select: { fullName: true } } } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take,
      skip,
    });
  }

  private async exportCsv(reportType: ReportType, data: any): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const filename = `${reportType}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const records = this.normalizeDataForExport(reportType, data);
    const headers = this.getCsvHeaders(reportType);
    
    const tempFilename = `${reportType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.csv`;
    const tempPath = `${os.tmpdir()}/${tempFilename}`;
    
    try {
      const writer = csv.createObjectCsvWriter({
        path: tempPath,
        header: headers,
      });

      if (records.length > 0) {
        await writer.writeRecords(records);
      } else {
        const headerRow = headers.map(h => h.id).join(',') + '\n';
        fs.writeFileSync(tempPath, headerRow);
      }
    } catch (error) {
      console.error('CSV export error:', error);
      const headerRow = headers.map(h => h.id).join(',') + '\n';
      fs.writeFileSync(tempPath, headerRow);
    }

    const buffer = fs.readFileSync(tempPath);
    fs.unlinkSync(tempPath);

    return { buffer, filename, contentType: 'text/csv' };
  }

  private exportExcel(reportType: ReportType, data: any): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const filename = `${reportType}-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const records = this.normalizeDataForExport(reportType, data);
    const headers = this.getCsvHeaders(reportType);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType);

    worksheet.columns = headers.map((h) => ({ header: h.title, key: h.id, width: 15 }));
    worksheet.addRows(records);

    return workbook.xlsx.writeBuffer().then((buffer: any) => ({
      buffer: Buffer.from(buffer),
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));
  }

  private exportPdf(reportType: ReportType, data: any): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const filename = `${reportType}-export-${new Date().toISOString().slice(0, 10)}.pdf`;

    try {
      const doc = new PDFDocument();
      const stream = doc.pipe(new (require('stream').PassThrough)());
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        
        stream.on('error', (err) => {
          console.error('PDF stream error:', err);
          console.error('PDF stream error stack:', err.stack);
          console.error('PDF stream error name:', err.name);
          console.error('PDF stream error message:', err.message);
          reject(new BadRequestException('Failed to generate PDF'));
        });

        doc.on('error', (err) => {
          console.error('PDF document error:', err);
          console.error('PDF document error stack:', err.stack);
          console.error('PDF document error name:', err.name);
          console.error('PDF document error message:', err.message);
          reject(new BadRequestException('Failed to generate PDF'));
        });

        stream.on('finish', () => {
          try {
            const buffer = Buffer.concat(chunks);
            console.log('PDF generated successfully, buffer length:', buffer.length);
            console.log('PDF buffer starts with:', buffer.slice(0, 10).toString('hex'));
            resolve({ buffer, filename, contentType: 'application/pdf' });
          } catch (err) {
            console.error('PDF buffer concat error:', err);
            console.error('PDF buffer concat error stack:', err.stack);
            reject(new BadRequestException('Failed to generate PDF'));
          }
        });

        doc.fontSize(18).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        doc.end();
      });
    } catch (error) {
      console.error('PDF export outer error:', error);
      console.error('PDF export outer error stack:', error.stack);
      console.error('PDF export outer error name:', error.name);
      console.error('PDF export outer error message:', error.message);
      return Promise.reject(new BadRequestException('Failed to generate PDF'));
    }
  }

  private normalizeDataForExport(reportType: ReportType, data: any): any[] {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    switch (reportType) {
      case 'sales':
        return data.map((inv: any) => ({
          invoice_number: inv.invoiceNumber,
          client: inv.client?.companyName || '',
          total: inv.total,
          status: inv.status,
          issue_date: inv.issueDate,
          due_date: inv.dueDate,
        }));

      case 'receivables':
        return data.map((inv: any) => ({
          invoice_number: inv.invoiceNumber,
          client: inv.client?.companyName || '',
          total: inv.total,
          balance: inv.balanceAmount,
          status: inv.status,
          due_date: inv.dueDate,
        }));

      case 'expenses':
        return data.map((exp: any) => ({
          description: exp.description,
          category: exp.category,
          amount: exp.amount,
          expense_date: exp.expenseDate,
          payment_method: exp.paymentMethod,
        }));

      case 'purchases':
        return data.map((pur: any) => ({
          description: pur.description,
          vendor: pur.vendorInfo?.name || '',
          total: pur.total,
          purchase_date: pur.purchaseDate,
          status: pur.status,
        }));

      case 'vendors':
        return data.map((vendor: any) => ({
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          city: vendor.city,
          is_active: vendor.isActive,
        }));

      case 'inventory':
        return data.map((prod: any) => ({
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          stock_quantity: prod.stockQuantity,
          unit_price: prod.unitPrice,
          cost_price: prod.costPrice,
        }));

      case 'sales-orders':
        return data.map((order: any) => ({
          order_number: order.orderNumber,
          client: order.client?.companyName || '',
          total: order.total,
          status: order.status,
          order_date: order.orderDate,
          expected_delivery: order.expectedDeliveryDate,
        }));

      case 'employees':
        return data.map((emp: any) => ({
          employee_code: emp.employeeCode,
          full_name: emp.user?.fullName || '',
          email: emp.user?.email || '',
          designation: emp.designation,
          department: emp.department,
          joining_date: emp.joiningDate,
          status: emp.status,
        }));

      case 'attendance-summary':
        return data.map((att: any) => ({
          employee: att.employee?.user?.fullName || '',
          date: att.date,
          status: att.status,
          check_in: att.checkIn,
          check_out: att.checkOut,
        }));

      case 'leave-report':
        return data.map((leave: any) => ({
          employee: leave.employee?.user?.fullName || '',
          leave_type: leave.leaveType,
          start_date: leave.startDate,
          end_date: leave.endDate,
          status: leave.status,
          reason: leave.reason,
        }));

      case 'payroll-summary':
        return data.map((pay: any) => ({
          employee: pay.employee?.user?.fullName || '',
          month: pay.month,
          year: pay.year,
          basic_salary: pay.basicSalary,
          net_salary: pay.netSalary,
          status: pay.status,
          paid_at: pay.paidAt,
        }));

      default:
        return [];
    }
  }

  private getCsvHeaders(reportType: ReportType): any[] {
    switch (reportType) {
      case 'sales':
        return [
          { id: 'invoice_number', title: 'Invoice Number' },
          { id: 'client', title: 'Client' },
          { id: 'total', title: 'Total' },
          { id: 'status', title: 'Status' },
          { id: 'issue_date', title: 'Issue Date' },
          { id: 'due_date', title: 'Due Date' },
        ];
      case 'receivables':
        return [
          { id: 'invoice_number', title: 'Invoice Number' },
          { id: 'client', title: 'Client' },
          { id: 'total', title: 'Total' },
          { id: 'balance', title: 'Balance' },
          { id: 'status', title: 'Status' },
          { id: 'due_date', title: 'Due Date' },
        ];
      case 'expenses':
        return [
          { id: 'description', title: 'Description' },
          { id: 'category', title: 'Category' },
          { id: 'amount', title: 'Amount' },
          { id: 'expense_date', title: 'Date' },
          { id: 'payment_method', title: 'Payment Method' },
        ];
      case 'purchases':
        return [
          { id: 'description', title: 'Description' },
          { id: 'vendor', title: 'Vendor' },
          { id: 'total', title: 'Total' },
          { id: 'purchase_date', title: 'Date' },
          { id: 'status', title: 'Status' },
        ];
      case 'vendors':
        return [
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'phone', title: 'Phone' },
          { id: 'city', title: 'City' },
          { id: 'is_active', title: 'Active' },
        ];
      case 'inventory':
        return [
          { id: 'name', title: 'Product Name' },
          { id: 'sku', title: 'SKU' },
          { id: 'category', title: 'Category' },
          { id: 'stock_quantity', title: 'Stock Qty' },
          { id: 'unit_price', title: 'Unit Price' },
          { id: 'cost_price', title: 'Cost Price' },
        ];
      case 'sales-orders':
        return [
          { id: 'order_number', title: 'Order Number' },
          { id: 'client', title: 'Client' },
          { id: 'total', title: 'Total' },
          { id: 'status', title: 'Status' },
          { id: 'order_date', title: 'Order Date' },
          { id: 'expected_delivery', title: 'Expected Delivery' },
        ];
      case 'employees':
        return [
          { id: 'employee_code', title: 'Employee Code' },
          { id: 'full_name', title: 'Full Name' },
          { id: 'email', title: 'Email' },
          { id: 'designation', title: 'Designation' },
          { id: 'department', title: 'Department' },
          { id: 'joining_date', title: 'Joining Date' },
          { id: 'status', title: 'Status' },
        ];
      case 'attendance-summary':
        return [
          { id: 'employee', title: 'Employee' },
          { id: 'date', title: 'Date' },
          { id: 'status', title: 'Status' },
          { id: 'check_in', title: 'Check In' },
          { id: 'check_out', title: 'Check Out' },
        ];
      case 'leave-report':
        return [
          { id: 'employee', title: 'Employee' },
          { id: 'leave_type', title: 'Leave Type' },
          { id: 'start_date', title: 'Start Date' },
          { id: 'end_date', title: 'End Date' },
          { id: 'status', title: 'Status' },
          { id: 'reason', title: 'Reason' },
        ];
      case 'payroll-summary':
        return [
          { id: 'employee', title: 'Employee' },
          { id: 'month', title: 'Month' },
          { id: 'year', title: 'Year' },
          { id: 'basic_salary', title: 'Basic Salary' },
          { id: 'net_salary', title: 'Net Salary' },
          { id: 'status', title: 'Status' },
          { id: 'paid_at', title: 'Paid At' },
        ];
      default:
        return [];
    }
  }
}
