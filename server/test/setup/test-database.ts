import { PrismaClient } from '@prisma/client';

/**
 * Test database setup for tenant isolation tests
 * This uses a DEDICATED test database to avoid affecting development data
 */

// SAFETY GUARD: Known development/production database names
const PROTECTED_DATABASES = [
  'lyfads_erp',
  'postgres',
  'template0',
  'template1',
];
const TARGET_DATABASE = 'lyfads_erp_test';

// Verify the target database name from DATABASE_URL
function verifyDatabaseTarget(): void {
  const dbUrl = process.env.DATABASE_URL || '';

  // Extract database name from URL (after last '/' and before '?' or end)
  const urlParts = dbUrl.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const dbName = lastPart.split('?')[0];

  console.log('=== DATABASE SAFETY CHECK ===');
  console.log(`  Target Database: ${dbName}`);
  console.log(`  Expected Target: ${TARGET_DATABASE}`);
  console.log('');

  if (PROTECTED_DATABASES.includes(dbName)) {
    console.error('❌ SAFETY ERROR: Target database is a protected database!');
    console.error(`   Cannot create/clean database: ${dbName}`);
    console.error('   This would affect development/production data.');
    throw new Error(`Protected database: ${dbName}`);
  }

  if (dbName !== TARGET_DATABASE) {
    console.error('❌ SAFETY ERROR: Target database must be "lyfads_erp_test"');
    console.error(`   Current target: ${dbName}`);
    throw new Error(
      `Wrong target database: ${dbName}. Expected: ${TARGET_DATABASE}`,
    );
  }

  console.log('✓ Safety check passed - target is dedicated test database');
  console.log('');
}

const prisma = new PrismaClient();

export { prisma };

export async function cleanDatabase() {
  verifyDatabaseTarget();

  console.log('Cleaning test database...');

  // Clean all tables in dependency order (children first)
  try {
    await prisma.attachment.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.task.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.project.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.leave.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.client.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.tenantMembership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    console.log('✓ Test database cleaned');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

export async function setupTestDatabase() {
  verifyDatabaseTarget();
  await cleanDatabase();

  // Create Tenant A
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Test Tenant A',
      slug: 'test-tenant-a',
      status: 'ACTIVE',
    },
  });

  // Create Tenant B
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Test Tenant B',
      slug: 'test-tenant-b',
      status: 'ACTIVE',
    },
  });

  // Create users for Tenant A
  const tenantAAdmin = await prisma.user.create({
    data: {
      fullName: 'Tenant A Admin',
      email: 'admin@tenant-a.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'ADMIN',
      isActive: true,
      tenantId: tenantA.id,
    },
  });

  const tenantAManager = await prisma.user.create({
    data: {
      fullName: 'Tenant A Manager',
      email: 'manager@tenant-a.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'MANAGER',
      isActive: true,
      tenantId: tenantA.id,
    },
  });

  const tenantAEmployee = await prisma.user.create({
    data: {
      fullName: 'Tenant A Employee',
      email: 'employee@tenant-a.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'EMPLOYEE',
      isActive: true,
      tenantId: tenantA.id,
    },
  });

  // Create users for Tenant B
  const tenantBAdmin = await prisma.user.create({
    data: {
      fullName: 'Tenant B Admin',
      email: 'admin@tenant-b.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'ADMIN',
      isActive: true,
      tenantId: tenantB.id,
    },
  });

  const tenantBManager = await prisma.user.create({
    data: {
      fullName: 'Tenant B Manager',
      email: 'manager@tenant-b.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'MANAGER',
      isActive: true,
      tenantId: tenantB.id,
    },
  });

  const tenantBEmployee = await prisma.user.create({
    data: {
      fullName: 'Tenant B Employee',
      email: 'employee@tenant-b.com',
      password: '$2b$10$dummy.hash.for.testing',
      role: 'EMPLOYEE',
      isActive: true,
      tenantId: tenantB.id,
    },
  });

  // Create employees for Tenant A
  const tenantAEmployeeRecord = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-A-001',
      userId: tenantAEmployee.id,
      tenantId: tenantA.id,
      designation: 'Developer',
      department: 'Engineering',
      joiningDate: new Date('2024-01-01'),
      salary: 75000,
    },
  });

  // Create employees for Tenant B
  const tenantBEmployeeRecord = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-B-001',
      userId: tenantBEmployee.id,
      tenantId: tenantB.id,
      designation: 'Developer',
      department: 'Engineering',
      joiningDate: new Date('2024-01-01'),
      salary: 75000,
    },
  });

  // Create clients for Tenant A
  const tenantAClient = await prisma.client.create({
    data: {
      companyName: 'Tenant A Client',
      contactPerson: 'John Doe',
      email: 'john@tenant-a-client.com',
      phone: '1234567890',
      address: '123 Main St',
      tenantId: tenantA.id,
    },
  });

  // Create clients for Tenant B
  const tenantBClient = await prisma.client.create({
    data: {
      companyName: 'Tenant B Client',
      contactPerson: 'Jane Smith',
      email: 'jane@tenant-b-client.com',
      phone: '0987654321',
      address: '456 Oak Ave',
      tenantId: tenantB.id,
    },
  });

  // Create projects for Tenant A
  const tenantAProject = await prisma.project.create({
    data: {
      projectCode: 'TA-001',
      name: 'Tenant A Project',
      description: 'Test project for Tenant A',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 100000,
      clientId: tenantAClient.id,
      managerId: tenantAManager.id,
      tenantId: tenantA.id,
    },
  });

  // Create projects for Tenant B
  const tenantBProject = await prisma.project.create({
    data: {
      projectCode: 'TB-001',
      name: 'Tenant B Project',
      description: 'Test project for Tenant B',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 100000,
      clientId: tenantBClient.id,
      managerId: tenantBManager.id,
      tenantId: tenantB.id,
    },
  });

  // Create tasks for Tenant A
  const tenantATask = await prisma.task.create({
    data: {
      taskCode: 'TA-TASK-001',
      title: 'Tenant A Task',
      description: 'Test task for Tenant A',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-06-30'),
      projectId: tenantAProject.id,
      employeeId: tenantAEmployeeRecord.id,
      tenantId: tenantA.id,
    },
  });

  // Create tasks for Tenant B
  const tenantBTask = await prisma.task.create({
    data: {
      taskCode: 'TB-TASK-001',
      title: 'Tenant B Task',
      description: 'Test task for Tenant B',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-06-30'),
      projectId: tenantBProject.id,
      employeeId: tenantBEmployeeRecord.id,
      tenantId: tenantB.id,
    },
  });

  // Create leads for Tenant A
  const tenantALead = await prisma.lead.create({
    data: {
      companyName: 'Tenant A Lead',
      contactPerson: 'Lead Contact A',
      email: 'lead@tenant-a-lead.com',
      phone: '1111111111',
      status: 'NEW',
      tenantId: tenantA.id,
    },
  });

  // Create leads for Tenant B
  const tenantBLead = await prisma.lead.create({
    data: {
      companyName: 'Tenant B Lead',
      contactPerson: 'Lead Contact B',
      email: 'lead@tenant-b-lead.com',
      phone: '2222222222',
      status: 'NEW',
      tenantId: tenantB.id,
    },
  });

  // Create invoices for Tenant A
  const tenantAInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-A-001',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      subtotal: 5000,
      tax: 0,
      discount: 0,
      total: 5000,
      paidAmount: 0,
      balanceAmount: 5000,
      status: 'DRAFT',
      clientId: tenantAClient.id,
      tenantId: tenantA.id,
    },
  });

  // Create invoices for Tenant B
  const tenantBInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-B-001',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      subtotal: 5000,
      tax: 0,
      discount: 0,
      total: 5000,
      paidAmount: 0,
      balanceAmount: 5000,
      status: 'DRAFT',
      clientId: tenantBClient.id,
      tenantId: tenantB.id,
    },
  });

  // Create invoice items for Tenant A
  const tenantAInvoiceItem = await prisma.invoiceItem.create({
    data: {
      description: 'Tenant A Invoice Item',
      quantity: 10,
      unitPrice: 500,
      amount: 5000,
      invoiceId: tenantAInvoice.id,
      tenantId: tenantA.id,
    },
  });

  // Create invoice items for Tenant B
  const tenantBInvoiceItem = await prisma.invoiceItem.create({
    data: {
      description: 'Tenant B Invoice Item',
      quantity: 10,
      unitPrice: 500,
      amount: 5000,
      invoiceId: tenantBInvoice.id,
      tenantId: tenantB.id,
    },
  });

  // Create payments for Tenant A
  const tenantAPayment = await prisma.payment.create({
    data: {
      amount: 2500,
      paymentDate: new Date('2024-01-20'),
      method: 'BANK_TRANSFER',
      invoiceId: tenantAInvoice.id,
      tenantId: tenantA.id,
    },
  });

  // Create payments for Tenant B
  const tenantBPayment = await prisma.payment.create({
    data: {
      amount: 2500,
      paymentDate: new Date('2024-01-20'),
      method: 'BANK_TRANSFER',
      invoiceId: tenantBInvoice.id,
      tenantId: tenantB.id,
    },
  });

  // Create leaves for Tenant A
  const tenantALeave = await prisma.leave.create({
    data: {
      employeeId: tenantAEmployeeRecord.id,
      leaveType: 'SICK',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-02'),
      reason: 'Not feeling well',
      status: 'PENDING',
      tenantId: tenantA.id,
    },
  });

  // Create leaves for Tenant B
  const tenantBLeave = await prisma.leave.create({
    data: {
      employeeId: tenantBEmployeeRecord.id,
      leaveType: 'SICK',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-02'),
      reason: 'Not feeling well',
      status: 'PENDING',
      tenantId: tenantB.id,
    },
  });

  // Create attendance for Tenant A
  const tenantAAttendance = await prisma.attendance.create({
    data: {
      employeeId: tenantAEmployeeRecord.id,
      date: new Date('2024-01-20'),
      checkIn: new Date('2024-01-20T09:00:00'),
      checkOut: new Date('2024-01-20T18:00:00'),
      tenantId: tenantA.id,
    },
  });

  // Create attendance for Tenant B
  const tenantBAttendance = await prisma.attendance.create({
    data: {
      employeeId: tenantBEmployeeRecord.id,
      date: new Date('2024-01-20'),
      checkIn: new Date('2024-01-20T09:00:00'),
      checkOut: new Date('2024-01-20T18:00:00'),
      tenantId: tenantB.id,
    },
  });

  // Create notifications for Tenant A
  const tenantANotification = await prisma.notification.create({
    data: {
      userId: tenantAEmployee.id,
      title: 'Tenant A Notification',
      message: 'Test notification for Tenant A',
      isRead: false,
      tenantId: tenantA.id,
    },
  });

  // Create notifications for Tenant B
  const tenantBNotification = await prisma.notification.create({
    data: {
      userId: tenantBEmployee.id,
      title: 'Tenant B Notification',
      message: 'Test notification for Tenant B',
      isRead: false,
      tenantId: tenantB.id,
    },
  });

  // Create timesheets for Tenant A
  const tenantATimesheet = await prisma.timesheet.create({
    data: {
      employeeId: tenantAEmployeeRecord.id,
      projectId: tenantAProject.id,
      taskId: tenantATask.id,
      workDate: new Date('2024-01-20'),
      hours: 8,
      description: 'Worked on Tenant A project',
      tenantId: tenantA.id,
    },
  });

  // Create timesheets for Tenant B
  const tenantBTimesheet = await prisma.timesheet.create({
    data: {
      employeeId: tenantBEmployeeRecord.id,
      projectId: tenantBProject.id,
      taskId: tenantBTask.id,
      workDate: new Date('2024-01-20'),
      hours: 8,
      description: 'Worked on Tenant B project',
      tenantId: tenantB.id,
    },
  });

  // Create payroll for Tenant A
  const tenantAPayroll = await prisma.payroll.create({
    data: {
      employeeId: tenantAEmployeeRecord.id,
      month: 1,
      year: 2024,
      basicSalary: 75000,
      netSalary: 75000,
      status: 'PENDING',
      tenantId: tenantA.id,
    },
  });

  // Create payroll for Tenant B
  const tenantBPayroll = await prisma.payroll.create({
    data: {
      employeeId: tenantBEmployeeRecord.id,
      month: 1,
      year: 2024,
      basicSalary: 75000,
      netSalary: 75000,
      status: 'PENDING',
      tenantId: tenantB.id,
    },
  });

  // Create daily work reports for Tenant A
  const tenantADailyWorkReport = await prisma.dailyWorkReport.create({
    data: {
      employeeId: tenantAEmployeeRecord.id,
      projectId: tenantAProject.id,
      taskId: tenantATask.id,
      reportDate: new Date('2024-01-20'),
      todayWork: 'Worked on feature implementation',
      hoursWorked: 8,
      status: 'COMPLETED',
      tenantId: tenantA.id,
    },
  });

  // Create daily work reports for Tenant B
  const tenantBDailyWorkReport = await prisma.dailyWorkReport.create({
    data: {
      employeeId: tenantBEmployeeRecord.id,
      projectId: tenantBProject.id,
      taskId: tenantBTask.id,
      reportDate: new Date('2024-01-20'),
      todayWork: 'Worked on feature implementation',
      hoursWorked: 8,
      status: 'COMPLETED',
      tenantId: tenantB.id,
    },
  });

  // Create milestones for Tenant A
  const tenantAMilestone = await prisma.milestone.create({
    data: {
      title: 'Tenant A Milestone',
      description: 'Test milestone for Tenant A',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      progress: 0,
      startDate: new Date('2024-01-01'),
      deadline: new Date('2024-12-31'),
      projectId: tenantAProject.id,
      tenantId: tenantA.id,
    },
  });

  // Create milestones for Tenant B
  const tenantBMilestone = await prisma.milestone.create({
    data: {
      title: 'Tenant B Milestone',
      description: 'Test milestone for Tenant B',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      progress: 0,
      startDate: new Date('2024-01-01'),
      deadline: new Date('2024-12-31'),
      projectId: tenantBProject.id,
      tenantId: tenantB.id,
    },
  });

  return {
    tenantA,
    tenantB,
    tenantAAdmin,
    tenantAManager,
    tenantAEmployee,
    tenantAEmployeeRecord,
    tenantAClient,
    tenantAProject,
    tenantATask,
    tenantALead,
    tenantAInvoice,
    tenantAInvoiceItem,
    tenantAPayment,
    tenantALeave,
    tenantAAttendance,
    tenantANotification,
    tenantATimesheet,
    tenantAPayroll,
    tenantADailyWorkReport,
    tenantAMilestone,
    tenantBAdmin,
    tenantBManager,
    tenantBEmployee,
    tenantBEmployeeRecord,
    tenantBClient,
    tenantBProject,
    tenantBTask,
    tenantBLead,
    tenantBInvoice,
    tenantBInvoiceItem,
    tenantBPayment,
    tenantBLeave,
    tenantBAttendance,
    tenantBNotification,
    tenantBTimesheet,
    tenantBPayroll,
    tenantBDailyWorkReport,
    tenantBMilestone,
  };
}

export async function teardownTestDatabase() {
  await cleanDatabase();
  await prisma.$disconnect();
}
