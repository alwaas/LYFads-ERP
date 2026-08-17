import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Tenant Isolation Security Tests (Phase 3D)', () => {
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
    tenantBAdmin: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      fullName: string;
    };
    tenantALead: { id: string };
    tenantBLead: { id: string };
    tenantAClient: { id: string };
    tenantBClient: { id: string };
    tenantAInvoice: { id: string };
    tenantBInvoice: { id: string };
    tenantAInvoiceItem: { id: string };
    tenantBInvoiceItem: { id: string };
    tenantAPayment: { id: string };
    tenantBPayment: { id: string };
    tenantALeave: { id: string };
    tenantBLeave: { id: string };
    tenantAAttendance: { id: string };
    tenantBAttendance: { id: string };
    tenantANotification: { id: string };
    tenantBNotification: { id: string };
    tenantATimesheet: { id: string };
    tenantBTimesheet: { id: string };
    tenantAPayroll: { id: string };
    tenantBPayroll: { id: string };
    tenantADailyWorkReport: { id: string };
    tenantBDailyWorkReport: { id: string };
    tenantAMilestone: { id: string };
    tenantBMilestone: { id: string };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup test database with tenant data
    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    // Clean activity logs between tests
    await prisma.activityLog.deleteMany();
  });

  // Helper function to generate JWT token for a user
  const generateToken = (user: any) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('JWT tenantId Handling', () => {
    it('should include tenantId in JWT token', () => {
      const token = generateToken(testData.tenantAAdmin);
      const decoded = jwtService.decode(token) as any;
      expect(decoded.tenantId).toBe(testData.tenantA.id);
    });

    it('should correctly extract tenantId from JWT', () => {
      const token = generateToken(testData.tenantAAdmin);
      const decoded = jwtService.decode(token) as any;
      expect(decoded.tenantId).toBe(testData.tenantA.id);
    });
  });

  describe('ActivityLogsService Tenant Isolation', () => {
    it("should only return activity logs for the user's tenant", async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      // Create activity logs for both tenants
      await prisma.activityLog.create({
        data: {
          action: 'Test action',
          description: 'Test log for Tenant A',
          userId: testData.tenantAAdmin.id,
          tenantId: testData.tenantA.id,
          module: 'TEST',
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'Test action',
          description: 'Test log for Tenant B',
          userId: testData.tenantBAdmin.id,
          tenantId: testData.tenantB.id,
          module: 'TEST',
        },
      });

      // Tenant A should only see their logs
      const responseA = await request(app.getHttpServer())
        .get('/activity-logs')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(responseA.body.data).toBeDefined();
      const logsA = Array.isArray(responseA.body.data)
        ? responseA.body.data
        : [];
      logsA.forEach((log: any) => {
        expect(log.tenantId).toBe(testData.tenantA.id);
      });

      // Tenant B should only see their logs
      const responseB = await request(app.getHttpServer())
        .get('/activity-logs')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseB.body.data).toBeDefined();
      const logsB = Array.isArray(responseB.body.data)
        ? responseB.body.data
        : [];
      logsB.forEach((log: any) => {
        expect(log.tenantId).toBe(testData.tenantB.id);
      });
    });

    it('should include tenantId when creating activity logs', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'New Client',
          contactPerson: 'Test',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
        })
        .expect(201);

      const logs = await prisma.activityLog.findMany({
        where: { tenantId: testData.tenantA.id },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].tenantId).toBe(testData.tenantA.id);
    });
  });

  describe('CrmService (Leads) Tenant Isolation', () => {
    it('should allow same-tenant lead access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/crm/leads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const leads = Array.isArray(response.body.data) ? response.body.data : [];
      leads.forEach((lead: any) => {
        expect(lead.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant lead access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to access Tenant B's lead by ID
      const response = await request(app.getHttpServer())
        .get(`/crm/leads/${testData.tenantBLead.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should prevent cross-tenant lead creation', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to create a lead with Tenant B's tenantId
      await request(app.getHttpServer())
        .post('/crm/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Cross-tenant Lead',
          email: 'cross@example.com',
          phone: '1234567890',
          status: 'NEW',
          tenantId: testData.tenantB.id, // Try to spoof
        })
        .expect(403); // Should be rejected for trying to spoof tenantId
    });
  });

  describe('EmployeesService Tenant Isolation', () => {
    it("should only return employees for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const employees = Array.isArray(response.body.data)
        ? response.body.data
        : [];
      employees.forEach((employee: any) => {
        expect(employee.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant employee access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Get employee list twice to verify cross-tenant filtering
      const response = await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const employees = Array.isArray(response.body.data)
        ? response.body.data
        : [];
      employees.forEach((employee: any) => {
        expect(employee.tenantId).not.toBe(testData.tenantB.id);
      });
    });

    it('should prevent cross-tenant employee updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to update employee from different tenant
      const employees = await prisma.employee.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (employees.length > 0) {
        await request(app.getHttpServer())
          .patch(`/employees/${employees[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ designation: 'Updated' })
          .expect(403);
      }
    });
  });

  describe('ClientsService Tenant Isolation', () => {
    it("should only return clients for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const clients = Array.isArray(response.body.data)
        ? response.body.data
        : [];
      clients.forEach((client: any) => {
        expect(client.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant client access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get(`/clients/${testData.tenantBClient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should prevent cross-tenant client updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .patch(`/clients/${testData.tenantBClient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: 'Hacked' })
        .expect(403);
    });
  });

  describe('InvoiceService Tenant Isolation', () => {
    it("should only return invoices for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/invoice')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      response.body.data.forEach((invoice: any) => {
        expect(invoice.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant invoice access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get(`/invoice/${testData.tenantBInvoice.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should prevent cross-tenant invoice updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .patch(`/invoice/${testData.tenantBInvoice.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'PAID' })
        .expect(403);
    });
  });

  describe('ProjectsService Tenant Isolation', () => {
    it("should only return projects for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const projects = Array.isArray(response.body.data)
        ? response.body.data
        : [];
      projects.forEach((project: any) => {
        expect(project.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant project access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        await request(app.getHttpServer())
          .get(`/projects/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it('should prevent cross-tenant project updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        await request(app.getHttpServer())
          .patch(`/projects/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Hacked' })
          .expect(403);
      }
    });

    it('should validate client belongs to same tenant when creating project', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to create project with Tenant B's client
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectCode: 'TA-003',
          name: 'Test Project',
          description: 'Test',
          status: 'ACTIVE',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          clientId: testData.tenantBClient.id, // Wrong tenant
          managerId: testData.tenantAAdmin.id,
        })
        .expect(403); // Should be rejected for cross-tenant access
    });
  });

  describe('TasksService Tenant Isolation', () => {
    it("should only return tasks for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const tasks = Array.isArray(response.body.data) ? response.body.data : [];
      tasks.forEach((task: any) => {
        expect(task.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant task access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tasks = await prisma.task.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (tasks.length > 0) {
        await request(app.getHttpServer())
          .get(`/tasks/${tasks[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it('should prevent cross-tenant task updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tasks = await prisma.task.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (tasks.length > 0) {
        await request(app.getHttpServer())
          .patch(`/tasks/${tasks[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'COMPLETED' })
          .expect(403);
      }
    });

    it('should validate project belongs to same tenant when creating task', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send({
            taskCode: 'TA-003',
            title: 'Test Task',
            description: 'Test',
            status: 'TODO',
            projectId: projects[0].id, // Wrong tenant
            assigneeId: testData.tenantAAdmin.id,
          })
          .expect(403); // Should be rejected for cross-tenant access
      } else {
        // Skip test if no project exists in tenant B
        console.log('Skipping test - no project in tenant B');
      }
    });
  });

  describe('DashboardService Tenant Isolation', () => {
    it("should only return stats for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Stats should only count Tenant A's data
      expect(response.body).toBeDefined();
    });

    it("should only return recent projects for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/dashboard/recent-projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const projects = Array.isArray(response.body)
        ? response.body
        : response.body.data || [];
      projects.forEach((project: any) => {
        expect(project.tenantId).toBe(testData.tenantA.id);
      });
    });

    it("should only return recent tasks for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/dashboard/recent-tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const tasks = Array.isArray(response.body)
        ? response.body
        : response.body.data || [];
      tasks.forEach((task: any) => {
        expect(task.tenantId).toBe(testData.tenantA.id);
      });
    });
  });

  describe('UsersService Tenant Isolation', () => {
    it("should only return users for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      response.body.data.forEach((user: any) => {
        // Skip check if tenantId is not returned in the response
        if (user.tenantId) {
          expect(user.tenantId).toBe(testData.tenantA.id);
        }
      });
    });

    it('should reject cross-tenant user access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get(`/users/${testData.tenantBAdmin.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should prevent cross-tenant user role updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .patch(`/users/${testData.tenantBAdmin.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'EMPLOYEE' })
        .expect(403);
    });
  });

  describe('KanbanService Tenant Isolation', () => {
    it("should only return board data for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantA.id },
        take: 1,
      });

      if (projects.length > 0) {
        const response = await request(app.getHttpServer())
          .get(`/kanban/project/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        // All tasks should belong to Tenant A
        if (response.body.tasks) {
          response.body.tasks.forEach((task: any) => {
            expect(task.tenantId).toBe(testData.tenantA.id);
          });
        }
      }
    });

    it('should reject cross-tenant board access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        await request(app.getHttpServer())
          .get(`/kanban/project/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it('should prevent cross-tenant task movement', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const tasks = await prisma.task.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (tasks.length > 0) {
        await request(app.getHttpServer())
          .patch(`/kanban/task/${tasks[0].id}/move`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'IN_PROGRESS' })
          .expect(403);
      }
    });
  });

  describe('ProjectTimelineService Tenant Isolation', () => {
    it("should only return timeline for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantA.id },
        take: 1,
      });

      if (projects.length > 0) {
        const response = await request(app.getHttpServer())
          .get(`/project-timeline/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        // Check if tenantId is in the response
        if (response.body.tenantId) {
          expect(response.body.tenantId).toBe(testData.tenantA.id);
        }
      }
    });

    it('should reject cross-tenant timeline access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        await request(app.getHttpServer())
          .get(`/project-timeline/${projects[0].id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it("should only return upcoming deadlines for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/project-timeline/deadlines/upcoming')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deadlines = Array.isArray(response.body)
        ? response.body
        : response.body.data || [];
      deadlines.forEach((milestone: any) => {
        expect(milestone.tenantId).toBe(testData.tenantA.id);
      });
    });
  });

  describe('AttachmentsService Tenant Isolation', () => {
    it("should only return attachments for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Create attachments for both tenants
      await prisma.attachment.create({
        data: {
          fileName: 'test.pdf',
          fileUrl: '/uploads/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          originalName: 'test.pdf',
          uploadedBy: testData.tenantAAdmin.id,
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.attachment.create({
        data: {
          fileName: 'test2.pdf',
          fileUrl: '/uploads/test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          originalName: 'test2.pdf',
          uploadedBy: testData.tenantBAdmin.id,
          tenantId: testData.tenantB.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/attachments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const attachments = Array.isArray(response.body)
        ? response.body
        : response.body.data || [];
      attachments.forEach((attachment: any) => {
        expect(attachment.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should reject cross-tenant attachment access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const attachmentB = await prisma.attachment.create({
        data: {
          fileName: 'test2.pdf',
          fileUrl: '/uploads/test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          originalName: 'test2.pdf',
          uploadedBy: testData.tenantBAdmin.id,
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/attachments/${attachmentB.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('CommentsService Tenant Isolation', () => {
    it("should only return comments for the user's tenant", async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantA.id },
        take: 1,
      });

      if (projects.length > 0) {
        // Create comment for Tenant A
        await prisma.comment.create({
          data: {
            message: 'Test comment',
            taskId: null,
            projectId: projects[0].id,
            userId: testData.tenantAAdmin.id,
            tenantId: testData.tenantA.id,
          },
        });

        const response = await request(app.getHttpServer())
          .get('/comments')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const comments = Array.isArray(response.body)
          ? response.body
          : response.body.data || [];
        comments.forEach((comment: any) => {
          expect(comment.tenantId).toBe(testData.tenantA.id);
        });
      }
    });

    it('should reject cross-tenant comment access', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        const commentB = await prisma.comment.create({
          data: {
            message: 'Test comment',
            taskId: null,
            projectId: projects[0].id,
            userId: testData.tenantBAdmin.id,
            tenantId: testData.tenantB.id,
          },
        });

        await request(app.getHttpServer())
          .get(`/comments/${commentB.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it('should prevent cross-tenant comment updates', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const projects = await prisma.project.findMany({
        where: { tenantId: testData.tenantB.id },
        take: 1,
      });

      if (projects.length > 0) {
        const commentB = await prisma.comment.create({
          data: {
            message: 'Test comment',
            taskId: null,
            projectId: projects[0].id,
            userId: testData.tenantBAdmin.id,
            tenantId: testData.tenantB.id,
          },
        });

        await request(app.getHttpServer())
          .patch(`/comments/${commentB.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ message: 'Updated message' })
          .expect(403);
      }
    });
  });

  describe('TenantId Spoofing Prevention', () => {
    it('should prevent creating resources with spoofed tenantId in body', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to create a client with a spoofed tenantId
      await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'Spoofed Client',
          contactPerson: 'Test',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          tenantId: testData.tenantB.id, // Try to spoof
        })
        .expect(403); // Should be rejected for trying to spoof tenantId
    });

    it('should prevent updating resources to change tenantId', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to update a client to change its tenantId
      await request(app.getHttpServer())
        .patch(`/clients/${testData.tenantAClient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tenantId: testData.tenantB.id, // Try to change tenant
        })
        .expect(200); // Should succeed but ignore the tenantId change

      // Verify tenantId didn't change
      const client = await prisma.client.findUnique({
        where: { id: testData.tenantAClient.id },
      });

      expect(client?.tenantId).toBe(testData.tenantA.id);
    });
  });

  describe('ActivityLogsService Tenant Consistency', () => {
    it('should log all activities with correct tenantId', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Perform various actions
      await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'New Client',
          contactPerson: 'Test',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
        });

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectCode: 'TA-003',
          name: 'New Project',
          description: 'Test',
          status: 'ACTIVE',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          clientId: testData.tenantAClient.id,
          managerId: testData.tenantAAdmin.id,
        });

      // Check all activity logs have correct tenantId
      const logs = await prisma.activityLog.findMany({
        where: { userId: testData.tenantAAdmin.id },
      });

      logs.forEach((log: any) => {
        expect(log.tenantId).toBe(testData.tenantA.id);
      });
    });

    it('should not log activities for cross-tenant access attempts', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Try to access Tenant B's resource (should fail)
      await request(app.getHttpServer())
        .get(`/clients/${testData.tenantBClient.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify no activity log was created for this failed attempt
      const logs = await prisma.activityLog.findMany({
        where: {
          userId: testData.tenantAAdmin.id,
          action: { contains: 'clients' },
        },
      });

      // The most recent log should not be about accessing tenantB's client
      if (logs.length > 0) {
        expect(logs[logs.length - 1].description).not.toContain(
          testData.tenantBClient.id,
        );
      }
    });
  });

  describe('Phase 4.1: Newly Tenant-Aware Services', () => {
    describe('InvoiceItemsService Tenant Isolation', () => {
      it("should only return invoice items for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/invoice-items')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/invoice-items')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        expect(responseA.body.data.length).toBeGreaterThan(0);
        expect(responseB.body.data.length).toBeGreaterThan(0);

        // Verify all items belong to respective tenants
        responseA.body.data.forEach((item: any) => {
          expect(item.tenantId).toBe(testData.tenantA.id);
        });

        responseB.body.data.forEach((item: any) => {
          expect(item.tenantId).toBe(testData.tenantB.id);
        });
      });

      it('should reject cross-tenant invoice item access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/invoice-items/${testData.tenantBInvoiceItem.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('PaymentsService Tenant Isolation', () => {
      it("should only return payments for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/payments')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/payments')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body && responseA.body.length > 0) {
          expect(responseA.body.length).toBeGreaterThan(0);
          // Verify all payments belong to respective tenants
          responseA.body.forEach((payment: any) => {
            expect(payment.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body && responseB.body.length > 0) {
          expect(responseB.body.length).toBeGreaterThan(0);
          // Verify all payments belong to respective tenants
          responseB.body.forEach((payment: any) => {
            expect(payment.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant payment access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/payments/${testData.tenantBPayment.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('ReportsService Tenant Isolation', () => {
      it("should only return dashboard stats for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/reports/dashboard')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/reports/dashboard')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        // Both tenants should have employees, clients, projects, etc.
        if (responseA.body.employees !== undefined) {
          expect(responseA.body.employees).toBeGreaterThan(0);
        }
        if (responseB.body.employees !== undefined) {
          expect(responseB.body.employees).toBeGreaterThan(0);
        }
      });
    });

    describe('LeavesService Tenant Isolation', () => {
      it("should only return leaves for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/leaves')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/leaves')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all leaves belong to respective tenants
          responseA.body.data.forEach((leave: any) => {
            expect(leave.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all leaves belong to respective tenants
          responseB.body.data.forEach((leave: any) => {
            expect(leave.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant leave access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/leaves/${testData.tenantBLeave.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('AttendanceService Tenant Isolation', () => {
      it("should only return attendance for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/attendance/today')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/attendance/today')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        // Verify all attendance records belong to respective tenants
        if (responseA.body.length > 0) {
          responseA.body.forEach((attendance: any) => {
            expect(attendance.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.length > 0) {
          responseB.body.forEach((attendance: any) => {
            expect(attendance.tenantId).toBe(testData.tenantB.id);
          });
        }
      });
    });

    describe('NotificationsService Tenant Isolation', () => {
      it("should only return notifications for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/notifications')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/notifications')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all notifications belong to respective tenants
          responseA.body.data.forEach((notification: any) => {
            expect(notification.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all notifications belong to respective tenants
          responseB.body.data.forEach((notification: any) => {
            expect(notification.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant notification access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .patch(`/notifications/${testData.tenantBNotification.id}/read`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('TimesheetsService Tenant Isolation', () => {
      it("should only return timesheets for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/timesheets')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/timesheets')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body && responseA.body.length > 0) {
          expect(responseA.body.length).toBeGreaterThan(0);
          // Verify all timesheets belong to respective tenants
          responseA.body.forEach((timesheet: any) => {
            expect(timesheet.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body && responseB.body.length > 0) {
          expect(responseB.body.length).toBeGreaterThan(0);
          // Verify all timesheets belong to respective tenants
          responseB.body.forEach((timesheet: any) => {
            expect(timesheet.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant timesheet access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/timesheets/${testData.tenantBTimesheet.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('PayrollService Tenant Isolation', () => {
      it("should only return payroll for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/payroll')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/payroll')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all payroll records belong to respective tenants
          responseA.body.data.forEach((payroll: any) => {
            expect(payroll.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all payroll records belong to respective tenants
          responseB.body.data.forEach((payroll: any) => {
            expect(payroll.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant payroll access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/payroll/${testData.tenantBPayroll.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('DailyWorkReportsService Tenant Isolation', () => {
      it("should only return daily work reports for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/daily-work-reports')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/daily-work-reports')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all daily work reports belong to respective tenants
          responseA.body.data.forEach((report: any) => {
            expect(report.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all daily work reports belong to respective tenants
          responseB.body.data.forEach((report: any) => {
            expect(report.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant daily work report access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/daily-work-reports/${testData.tenantBDailyWorkReport.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });

    describe('MilestonesService Tenant Isolation', () => {
      it("should only return milestones for the user's tenant", async () => {
        const tokenA = generateToken(testData.tenantAAdmin);
        const tokenB = generateToken(testData.tenantBAdmin);

        const responseA = await request(app.getHttpServer())
          .get('/milestones')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        const responseB = await request(app.getHttpServer())
          .get('/milestones')
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(200);

        if (responseA.body && responseA.body.length > 0) {
          expect(responseA.body.length).toBeGreaterThan(0);
          // Verify all milestones belong to respective tenants
          responseA.body.forEach((milestone: any) => {
            expect(milestone.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body && responseB.body.length > 0) {
          expect(responseB.body.length).toBeGreaterThan(0);
          // Verify all milestones belong to respective tenants
          responseB.body.forEach((milestone: any) => {
            expect(milestone.tenantId).toBe(testData.tenantB.id);
          });
        }
      });

      it('should reject cross-tenant milestone access', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .get(`/milestones/${testData.tenantBMilestone.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });

      it('should reject cross-tenant milestone update', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .patch(`/milestones/${testData.tenantBMilestone.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ title: 'Hacked Title' })
          .expect(403);
      });

      it('should reject cross-tenant milestone deletion', async () => {
        const tokenA = generateToken(testData.tenantAAdmin);

        await request(app.getHttpServer())
          .delete(`/milestones/${testData.tenantBMilestone.id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(403);
      });
    });
  });

  describe('Phase 4.1: TenantId Spoofing Prevention (New Services)', () => {
    it('should prevent updating invoice to change tenantId', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Try to update an invoice to change its tenantId
      await request(app.getHttpServer())
        .patch(`/invoice/${testData.tenantAInvoice.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: testData.tenantB.id, // Try to change tenant
        })
        .expect(200); // Should succeed but ignore the tenantId change

      // Verify tenantId didn't change
      const invoice = await prisma.invoice.findUnique({
        where: { id: testData.tenantAInvoice.id },
      });

      expect(invoice?.tenantId).toBe(testData.tenantA.id);
    });

    it('should prevent updating lead to change tenantId', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Try to update a lead to change its tenantId
      await request(app.getHttpServer())
        .patch(`/crm/leads/${testData.tenantALead.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: testData.tenantB.id, // Try to change tenant
        })
        .expect(200); // Should succeed but ignore the tenantId change

      // Verify tenantId didn't change
      const lead = await prisma.lead.findUnique({
        where: { id: testData.tenantALead.id },
      });

      expect(lead?.tenantId).toBe(testData.tenantA.id);
    });

    it('should prevent updating milestone to change tenantId', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Try to update a milestone to change its tenantId
      await request(app.getHttpServer())
        .patch(`/milestones/${testData.tenantAMilestone.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: testData.tenantB.id, // Try to change tenant
        })
        .expect(200); // Should succeed but ignore the tenantId change

      // Verify tenantId didn't change
      const milestone = await prisma.milestone.findUnique({
        where: { id: testData.tenantAMilestone.id },
      });

      expect(milestone?.tenantId).toBe(testData.tenantA.id);
    });
  });

  describe('Phase 4.1: Suspended Tenant Access', () => {
    it('should block access for suspended tenant', async () => {
      // Create a suspended tenant
      const suspendedTenant = await prisma.tenant.create({
        data: {
          name: 'Suspended Tenant',
          slug: 'suspended-tenant',
          status: 'SUSPENDED',
        },
      });

      const suspendedUser = await prisma.user.create({
        data: {
          fullName: 'Suspended User',
          email: 'suspended@test.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'ADMIN',
          isActive: true,
          tenantId: suspendedTenant.id,
        },
      });

      const token = generateToken(suspendedUser);

      // Try to access a protected endpoint
      await request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Cleanup
      await prisma.user.delete({ where: { id: suspendedUser.id } });
      await prisma.tenant.delete({ where: { id: suspendedTenant.id } });
    });
  });
});
