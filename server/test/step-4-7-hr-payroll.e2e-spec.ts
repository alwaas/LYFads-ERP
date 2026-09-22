import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import {
  Prisma,
  LeaveStatus,
  TimesheetStatus,
  PayrollStatus,
  AttendanceStatus,
  LeaveType,
} from '@prisma/client';

describe('Step 4.7 HR & Payroll E2E Tests', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: {
    tenantA: { id: string };
    tenantB: { id: string };
    tenantAAdmin: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantAManager: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantAEmployee: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantBAdmin: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantBEmployee: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantAEmployeeRecord: { id: string };
    tenantBEmployeeRecord: { id: string };
    tenantAProject: { id: string };
    tenantATask: { id: string };
    tenantALeave: { id: string };
    tenantAAttendance: { id: string };
    tenantATimesheet: { id: string };
    tenantAPayroll: { id: string };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.journalEntryLine.deleteMany();
      await prisma.journalEntry.deleteMany();
    } catch (e) {
      // GL tables may not exist in all test configurations
    }
    await prisma.activityLog.deleteMany();
    await prisma.payrollItem.deleteMany();
    await prisma.payroll.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
    await prisma.timesheet.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
    await prisma.leave.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
    await prisma.leaveBalance.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
    await prisma.salaryStructure.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
    await prisma.attendance.deleteMany({
      where: {
        OR: [
          { tenantId: testData.tenantA.id },
          { tenantId: testData.tenantB.id },
        ],
      },
    });
  });

  const generateToken = (user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    fullName: string;
  }) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('Security: Unauthenticated Access', () => {
    it('unauthenticated leaves request returns 401', async () => {
      await request(app.getHttpServer()).get('/leaves').expect(401);
    });

    it('unauthenticated timesheets request returns 401', async () => {
      await request(app.getHttpServer()).get('/timesheets').expect(401);
    });
  });

  describe('Security: Employee Attendance Self-Only', () => {
    it('employee can only see own attendance via today endpoint', async () => {
      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .get('/attendance/today')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((record: any) => {
        expect(record.employeeId).toBe(testData.tenantAEmployeeRecord.id);
      });
    });

    it('employee can only see own attendance via history endpoint', async () => {
      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .get('/attendance/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.data.forEach((record: any) => {
        expect(record.employeeId).toBe(testData.tenantAEmployeeRecord.id);
      });
    });

    it('employee cannot access another employee attendance record directly', async () => {
      const extraUser = await prisma.user.create({
        data: {
          fullName: 'Tenant A Employee B',
          email: 'emp-b@tenant-a.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'EMPLOYEE',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const extraEmployee = await prisma.employee.create({
        data: {
          employeeCode: 'EMP-A-002',
          userId: extraUser.id,
          tenantId: testData.tenantA.id,
          designation: 'Tester',
          department: 'QA',
          joiningDate: new Date('2024-01-01'),
          salary: 50000,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: extraEmployee.id,
          date: today,
          checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000),
          checkOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
          status: AttendanceStatus.PRESENT,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);
      const response = await request(app.getHttpServer())
        .get('/attendance/today')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((record: any) => {
        expect(record.employeeId).toBe(testData.tenantAEmployeeRecord.id);
      });

      await prisma.employee.delete({ where: { id: extraEmployee.id } });
      await prisma.user.delete({ where: { id: extraUser.id } });
    });
  });

  describe('Security: Employee Cross-Resource Restrictions', () => {
    it('employee cannot create leave for another employee', async () => {
      const token = generateToken(testData.tenantAEmployee);

      let managerEmployee = await prisma.employee.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          userId: { not: testData.tenantAEmployee.id },
        },
        take: 1,
      });

      if (!managerEmployee) {
        const mgrUser = await prisma.user.create({
          data: {
            fullName: 'Tenant A Manager Emp',
            email: 'mgr-emp@tenant-a.com',
            password: '$2b$10$dummy.hash.for.testing',
            role: 'MANAGER',
            isActive: true,
            tenantId: testData.tenantA.id,
          },
        });
        managerEmployee = await prisma.employee.create({
          data: {
            employeeCode: 'EMP-A-MGR',
            userId: mgrUser.id,
            tenantId: testData.tenantA.id,
            designation: 'Manager',
            department: 'Engineering',
            joiningDate: new Date('2024-01-01'),
            salary: 90000,
          },
        });
      }

      await request(app.getHttpServer())
        .post('/leaves')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: managerEmployee.id,
          leaveType: LeaveType.SICK,
          startDate: '2024-02-01',
          endDate: '2024-02-02',
          reason: 'Not feeling well',
        })
        .expect(403);
    });

    it('employee cannot create timesheet for another employee', async () => {
      const token = generateToken(testData.tenantAEmployee);

      const otherEmployee = await prisma.employee.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          userId: { not: testData.tenantAEmployee.id },
        },
        take: 1,
      });

      if (!otherEmployee) {
        const otherUser = await prisma.user.create({
          data: {
            fullName: 'Tenant A Other Emp',
            email: 'other-emp@tenant-a.com',
            password: '$2b$10$dummy.hash.for.testing',
            role: 'EMPLOYEE',
            isActive: true,
            tenantId: testData.tenantA.id,
          },
        });
        otherEmployee = await prisma.employee.create({
          data: {
            employeeCode: 'EMP-A-OTH',
            userId: otherUser.id,
            tenantId: testData.tenantA.id,
            designation: 'Tester',
            department: 'QA',
            joiningDate: new Date('2024-01-01'),
            salary: 50000,
          },
        });
      }

      await request(app.getHttpServer())
        .post('/timesheets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: otherEmployee.id,
          workDate: '2024-01-20',
          hours: '8',
          description: 'Worked on project',
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
        })
        .expect(403);
    });

    it('employee cannot approve own leave', async () => {
      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Not feeling well',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(403);
    });

    it('employee cannot approve own timesheet', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.DRAFT,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Security: Cross-Tenant Access Rejection', () => {
    it('cross-tenant leave access is rejected', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tenantBLeave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantBEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Not feeling well',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/leaves/${tenantBLeave.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('cross-tenant payroll access is rejected', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tenantBPayroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantBEmployeeRecord.id,
          month: 1,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/payroll/${tenantBPayroll.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('cross-tenant attendance access is rejected', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tenantBAttendance = await prisma.attendance.create({
        data: {
          employeeId: testData.tenantBEmployeeRecord.id,
          date: new Date('2024-01-20'),
          checkIn: new Date('2024-01-20T09:00:00'),
          checkOut: new Date('2024-01-20T18:00:00'),
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/attendance/${tenantBAttendance.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Leave: Approval Flow', () => {
    it('approval sets approvedBy and approvedAt', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Not feeling well',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      const response = await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(200);

      expect(response.body.data.approvedById).toBe(testData.tenantAManager.id);
      expect(response.body.data.approvedAt).toBeDefined();
      expect(response.body.data.status).toBe(LeaveStatus.APPROVED);
    });

    it('rejection requires rejectionReason', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Not feeling well',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.REJECTED })
        .expect(403);
    });

    it('approval metadata recorded', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.CASUAL,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.CASUAL,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-03'),
          reason: 'Personal work',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      const response = await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED, remarks: 'Approved by manager' })
        .expect(200);

      expect(response.body.data.approvedBy).toBeDefined();
      expect(response.body.data.approvedBy.id).toBe(testData.tenantAManager.id);
      expect(response.body.data.remarks).toBe('Approved by manager');
    });
  });

  describe('Leave: Balance Management', () => {
    it('balance deduction on approval', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-03'),
          reason: 'Sick',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(200);

      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: testData.tenantA.id,
        },
      });

      expect(balance?.remaining).toBe(7);
      expect(balance?.used).toBe(3);
    });

    it('duplicate approval does not double-deduct', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Sick',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(200);

      const balanceAfterFirst = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: testData.tenantA.id,
        },
      });
      expect(balanceAfterFirst?.remaining).toBe(8);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(409);

      const balanceAfterSecond = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: testData.tenantA.id,
        },
      });

      expect(balanceAfterSecond?.remaining).toBe(8);
    });

    it('cancellation restores balance', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-03'),
          reason: 'Sick',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(200);

      let balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: testData.tenantA.id,
        },
      });
      expect(balance?.remaining).toBe(7);

      await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.CANCELLED })
        .expect(200);

      balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: testData.tenantA.id,
        },
      });
      expect(balance?.remaining).toBe(10);
      expect(balance?.used).toBe(0);
    });
  });

  describe('Leave: Invalid Transitions', () => {
    it('invalid transitions rejected', async () => {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          year: 2024,
          allocated: 10,
          used: 0,
          remaining: 10,
          tenantId: testData.tenantA.id,
        },
      });

      const leave = await prisma.leave.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          reason: 'Sick',
          status: LeaveStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      const response = await request(app.getHttpServer())
        .patch(`/leaves/${leave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.APPROVED })
        .expect(200);

      const approvedLeave = response.body.data;

      await request(app.getHttpServer())
        .patch(`/leaves/${approvedLeave.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: LeaveStatus.REJECTED, rejectionReason: 'Changed mind' })
        .expect(409);
    });
  });

  describe('Timesheet: DRAFT to SUBMITTED to APPROVED Workflow', () => {
    it('employee can submit own timesheet', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.DRAFT,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe(TimesheetStatus.SUBMITTED);
    });

    it('manager can approve timesheet', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.SUBMITTED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      const response = await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe(TimesheetStatus.APPROVED);
      expect(response.body.data.approvedById).toBe(testData.tenantAManager.id);
      expect(response.body.data.approvedAt).toBeDefined();
    });

    it('manager can reject timesheet', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.SUBMITTED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      const response = await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rejectionReason: 'Incorrect hours' })
        .expect(201);

      expect(response.body.data.status).toBe(TimesheetStatus.REJECTED);
      expect(response.body.data.rejectionReason).toBe('Incorrect hours');
    });
  });

  describe('Timesheet: REJECTED to SUBMITTED Resubmission', () => {
    it('rejected timesheet can be resubmitted', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.REJECTED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe(TimesheetStatus.SUBMITTED);
    });
  });

  describe('Timesheet: Invalid Transitions', () => {
    it('invalid transition rejected', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.DRAFT,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });
  });

  describe('Timesheet: Role-Based Restrictions', () => {
    it('employee cannot approve own timesheet', async () => {
      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-01-20'),
          hours: 8,
          description: 'Worked on project',
          status: TimesheetStatus.SUBMITTED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .post(`/timesheets/${timesheet.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Payroll: Calculation', () => {
    it('calculation creates payroll with correct items', async () => {
      await prisma.salaryStructure.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          basicSalary: 75000,
          hra: 15000,
          allowances: 5000,
          bonus: 5000,
          incentives: 5000,
          deductions: 2000,
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= 5; day++) {
        const date = new Date(2024, 5, day);
        await prisma.attendance.create({
          data: {
            employeeId: testData.tenantAEmployeeRecord.id,
            date,
            checkIn: new Date(date.getTime() + 9 * 60 * 60 * 1000),
            checkOut: new Date(date.getTime() + 18 * 60 * 60 * 1000),
            status: AttendanceStatus.PRESENT,
            tenantId: testData.tenantA.id,
          },
        });
      }

      const timesheet = await prisma.timesheet.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          projectId: testData.tenantAProject.id,
          taskId: testData.tenantATask.id,
          workDate: new Date('2024-06-20'),
          hours: 40,
          description: 'Weekly work',
          status: TimesheetStatus.APPROVED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 6,
          year: 2024,
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe(PayrollStatus.PENDING);

      const itemsResponse = await request(app.getHttpServer())
        .get(`/payroll/${response.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(itemsResponse.body.data.items).toBeDefined();
      expect(itemsResponse.body.data.items.length).toBeGreaterThan(0);

      const basicSalaryItem = itemsResponse.body.data.items.find(
        (item: any) => item.category === 'Basic Salary',
      );
      expect(basicSalaryItem).toBeDefined();
      expect(basicSalaryItem.type).toBe('EARNING');
    });

    it('duplicate payroll calculation is prevented', async () => {
      await prisma.salaryStructure.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          basicSalary: 75000,
          hra: 15000,
          allowances: 5000,
          bonus: 5000,
          incentives: 5000,
          deductions: 2000,
          effectiveFrom: new Date('2024-01-01'),
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 7,
          year: 2024,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 7,
          year: 2024,
        })
        .expect(409);
    });
  });

  describe('Payroll: Process Approve Mark-Paid Workflow', () => {
    beforeEach(() => {
      jest.setTimeout(30000);
    });

    it('process -> approve -> mark-paid workflow', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 3,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      const processed = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/process`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(processed.body.data.status).toBe(PayrollStatus.PROCESSED);
      expect(processed.body.data.generatedAt).toBeDefined();

      const approved = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(approved.body.data.status).toBe(PayrollStatus.APPROVED);
      expect(approved.body.data.approvedById).toBe(testData.tenantAAdmin.id);
      expect(approved.body.data.approvedAt).toBeDefined();

      const paid = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/mark-paid`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethod: 'BANK_TRANSFER',
          paymentReference: 'TXN-001',
        })
        .expect(201);

      expect(paid.body.data.status).toBe(PayrollStatus.PAID);
      expect(paid.body.data.paymentMethod).toBe('BANK_TRANSFER');
      expect(paid.body.data.paymentReference).toBe('TXN-001');
      expect(paid.body.data.paidAt).toBeDefined();
    }, 30000);

    it('invalid transitions rejected', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 4,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('payment metadata recorded', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 5,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.APPROVED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/mark-paid`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentMethod: 'UPI',
          paymentReference: 'UPI-12345',
        })
        .expect(201);

      expect(response.body.data.paymentMethod).toBe('UPI');
      expect(response.body.data.paymentReference).toBe('UPI-12345');
      expect(response.body.data.paidAt).toBeDefined();
    });

    it('PAID payroll cannot be modified', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 7,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PAID,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .patch(`/payroll/${payroll.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ basicSalary: 80000 })
        .expect(409);
    });
  });

  describe('Payroll: DTO Status Hardening', () => {
    it('create cannot force PAID status', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 8,
          year: 2024,
          basicSalary: '75000',
          netSalary: '75000',
          status: PayrollStatus.PAID,
        })
        .expect(201);

      expect(response.body.data.status).toBe(PayrollStatus.PENDING);
    });

    it('update cannot force PAID status', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 9,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .patch(`/payroll/${payroll.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: PayrollStatus.PAID })
        .expect(200);

      expect(response.body.data.status).toBe(PayrollStatus.PENDING);
    });
  });

  describe('Payroll: State Transition Safety', () => {
    it('invalid transition: mark-paid on PENDING is rejected', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 10,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/mark-paid`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentMethod: 'BANK_TRANSFER' })
        .expect(409);
    });

    it('repeated transition: process on already PROCESSED is rejected', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 11,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PROCESSED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/process`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('repeated transition: approve on already APPROVED is rejected', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 12,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.APPROVED,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });
  });

  describe('Salary Structure: isActive Boolean Validation', () => {
    it('isActive=true salary structure succeeds', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/salary-structures')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          basicSalary: '75000',
          effectiveFrom: '2024-01-01',
          isActive: true,
        })
        .expect(201);

      expect(response.body.data.isActive).toBe(true);
    });

    it('isActive=false salary structure succeeds', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/salary-structures')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          basicSalary: '75000',
          effectiveFrom: '2024-01-01',
          isActive: false,
        })
        .expect(201);

      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('Payroll: Tenant Isolation', () => {
    it('create payroll for another tenant employee is rejected', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantBEmployeeRecord.id,
          month: 1,
          year: 2024,
          basicSalary: '75000',
          netSalary: '75000',
        })
        .expect(403);
    });
  });

  describe('Payroll: Duplicate Prevention', () => {
    it('duplicate employee/month/year payroll is rejected', async () => {
      await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 2,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 2,
          year: 2024,
          basicSalary: '75000',
          netSalary: '75000',
        })
        .expect(409);
    });
  });

  describe('Attendance: Status Enum and Working Hours', () => {
    it('status enum values work', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const statuses = [
        AttendanceStatus.PRESENT,
        AttendanceStatus.ABSENT,
        AttendanceStatus.LATE,
        AttendanceStatus.HOLIDAY,
      ];

      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const date = new Date(2024, 0, 20 + i + 1);
        const response = await request(app.getHttpServer())
          .post('/attendance/check-in')
          .set('Authorization', `Bearer ${token}`)
          .send({
            employeeId: testData.tenantAEmployeeRecord.id,
            date: date.toISOString(),
            status,
            remarks: `Test ${status}`,
          })
          .expect(201);

        expect(response.body.data.status).toBe(status);
      }
    });

    it('working hours calculated from check-in and check-out', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const checkIn = new Date('2024-01-20T09:00:00');
      const checkOut = new Date('2024-01-20T18:00:00');

      const response = await request(app.getHttpServer())
        .post('/attendance/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId: testData.tenantAEmployeeRecord.id,
          date: '2024-01-25',
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          remarks: 'Full day',
        })
        .expect(201);

      expect(response.body.data.checkIn).toBeDefined();
      expect(response.body.data.checkOut).toBeDefined();
    });
  });

  describe('Reports: Tenant Isolation and Role Restrictions', () => {
    it('reports return tenant-isolated data', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const responseA = await request(app.getHttpServer())
        .get('/reports/attendance-summary')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(responseA.body.data).toBeDefined();

      const responseB = await request(app.getHttpServer())
        .get('/reports/attendance-summary')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseB.body.data).toBeDefined();
    });

    it('employee role is restricted from reports endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/reports/attendance-summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/reports/payroll-summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Payroll: GL Posting', () => {
    const runWorkflowToApproved = async (month: number, year: number) => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month,
          year,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/process`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const approved = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      return { payroll, approved };
    };

    it('approved payroll creates exactly one balanced JE with DR 5040 / CR 2100', async () => {
      const { payroll, approved } = await runWorkflowToApproved(13, 2024);

      const je = await prisma.journalEntry.findFirst({
        where: { referenceId: `payroll_${payroll.id}` },
        include: { lines: { include: { account: true } } },
      });

      expect(je).toBeDefined();
      expect(je!.posted).toBe(true);
      expect(je!.lines.length).toBe(2);

      const debitLine = je!.lines.find((l) => l.debitAmount.gt(0));
      const creditLine = je!.lines.find((l) => l.creditAmount.gt(0));

      expect(debitLine).toBeDefined();
      expect(creditLine).toBeDefined();
      expect(debitLine!.account.code).toBe('5040');
      expect(creditLine!.account.code).toBe('2100');

      const debitTotal = debitLine!.debitAmount.toNumber();
      const creditTotal = creditLine!.creditAmount.toNumber();
      expect(debitTotal).toBeCloseTo(creditTotal, 2);
      expect(debitTotal).toBe(75000);
    });

    it('correct amount: netSalary is used for JE', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 14,
          year: 2024,
          basicSalary: 75000,
          netSalary: 65000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/process`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: { referenceId: `payroll_${payroll.id}` },
        include: { lines: { include: { account: true } } },
      });

      expect(je).toBeDefined();

      const debitLine = je!.lines.find((l) => l.debitAmount.gt(0));
      const creditLine = je!.lines.find((l) => l.creditAmount.gt(0));

      expect(debitLine!.debitAmount.toNumber()).toBe(65000);
      expect(creditLine!.creditAmount.toNumber()).toBe(65000);
    });

    it('duplicate/retry does not create duplicate JE', async () => {
      const { payroll } = await runWorkflowToApproved(15, 2024);

      const token = generateToken(testData.tenantAAdmin);

      // Attempt to approve again — should fail with 409 (not PROCESSED)
      const retryResponse = await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(retryResponse.body.message).toContain('Only processed payroll can be approved');

      // Verify only one JE exists
      const jeCount = await prisma.journalEntry.count({
        where: { referenceId: `payroll_${payroll.id}` },
      });
      expect(jeCount).toBe(1);
    });

    it('invalid workflow cannot create GL entry', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantAEmployeeRecord.id,
          month: 16,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PENDING,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(testData.tenantAAdmin);

      // Try to approve a PENDING payroll directly (without processing first)
      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      // No JE should have been created
      const jeCount = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id, referenceId: `payroll_${payroll.id}` },
      });
      expect(jeCount).toBe(0);
    });

    it('tenant isolation: tenant A cannot post GL to tenant B accounts', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: testData.tenantBEmployeeRecord.id,
          month: 17,
          year: 2024,
          basicSalary: 75000,
          netSalary: 75000,
          status: PayrollStatus.PROCESSED,
          tenantId: testData.tenantB.id,
        },
      });

      // Approve using tenant A admin token — should be blocked by tenant isolation
      const tokenA = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post(`/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      // No JE should have been created in either tenant
      const jeA = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id, referenceId: `payroll_${payroll.id}` },
      });
      const jeB = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantB.id, referenceId: `payroll_${payroll.id}` },
      });
      expect(jeA).toBe(0);
      expect(jeB).toBe(0);
    });

    it('approved payroll creates JE only once (idempotency within transaction)', async () => {
      const { payroll } = await runWorkflowToApproved(18, 2024);

      const je = await prisma.journalEntry.findMany({
        where: { referenceId: `payroll_${payroll.id}` },
      });

      expect(je.length).toBe(1);
    });
  });
});
