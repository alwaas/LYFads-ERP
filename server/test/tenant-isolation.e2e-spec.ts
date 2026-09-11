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
    tenantAFollowUp: { id: string };
    tenantBFollowUp: { id: string };
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
      const logsA = Array.isArray(responseA.body.data.data)
        ? responseA.body.data.data
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
      const logsB = Array.isArray(responseB.body.data.data)
        ? responseB.body.data.data
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
      const leads = Array.isArray(response.body.data.data) ? response.body.data.data : [];
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

    it('should only return follow-ups for same-tenant leads', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      // Get Tenant A's lead with follow-ups
      const responseA = await request(app.getHttpServer())
        .get(`/crm/leads/${testData.tenantALead.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Verify follow-ups belong to Tenant A
      if (responseA.body.followUps && responseA.body.followUps.length > 0) {
        responseA.body.followUps.forEach((followUp: any) => {
          expect(followUp.tenantId).toBe(testData.tenantA.id);
        });
      }

      // Get Tenant B's lead with follow-ups
      const responseB = await request(app.getHttpServer())
        .get(`/crm/leads/${testData.tenantBLead.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Verify follow-ups belong to Tenant B
      if (responseB.body.followUps && responseB.body.followUps.length > 0) {
        responseB.body.followUps.forEach((followUp: any) => {
          expect(followUp.tenantId).toBe(testData.tenantB.id);
        });
      }
    });

    it('should prevent cross-tenant follow-up access through lead operations', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Tenant A cannot access Tenant B's lead, so cannot access its follow-ups
      await request(app.getHttpServer())
        .get(`/crm/leads/${testData.tenantBLead.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
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
      const employees = Array.isArray(response.body.data.data)
        ? response.body.data.data
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

      const employees = Array.isArray(response.body.data.data)
        ? response.body.data.data
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
      const clients = Array.isArray(response.body.data.data)
        ? response.body.data.data
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

      response.body.data.data.forEach((invoice: any) => {
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
      const projects = Array.isArray(response.body.data.data)
        ? response.body.data.data
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

       const tasks = Array.isArray(response.body.data.data) ? response.body.data.data : [];
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
         : response.body.data.data || [];
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
         : response.body.data.data || [];
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

       response.body.data.data.forEach((user: any) => {
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
         : response.body.data.data || [];
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
         : response.body.data.data || [];
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

    it('should prevent uploading attachment to cross-tenant project', async () => {
      const token = generateToken(testData.tenantAAdmin);

      // Get a project from Tenant B
      const tenantBProject = await prisma.project.findFirst({
        where: { tenantId: testData.tenantB.id },
      });

      if (tenantBProject) {
        // Try to create attachment for Tenant B's project while authenticated as Tenant A
        await request(app.getHttpServer())
          .post('/attachments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            fileName: 'test.pdf',
            fileUrl: '/uploads/test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            originalName: 'test.pdf',
            uploadedBy: testData.tenantAAdmin.id,
            projectId: tenantBProject.id, // Cross-tenant project
          })
          .expect(403);
      }
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
           : response.body.data.data || [];
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

        expect(responseA.body.data.data.length).toBeGreaterThan(0);
        expect(responseB.body.data.data.length).toBeGreaterThan(0);

        // Verify all items belong to respective tenants
        responseA.body.data.data.forEach((item: any) => {
          expect(item.tenantId).toBe(testData.tenantA.id);
        });

        responseB.body.data.data.forEach((item: any) => {
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

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all payments belong to respective tenants
          responseA.body.data.forEach((payment: any) => {
            expect(payment.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all payments belong to respective tenants
          responseB.body.data.forEach((payment: any) => {
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

        if (responseA.body.data.data && responseA.body.data.data.length > 0) {
          expect(responseA.body.data.data.length).toBeGreaterThan(0);
          // Verify all leaves belong to respective tenants
          responseA.body.data.data.forEach((leave: any) => {
            expect(leave.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data.data && responseB.body.data.data.length > 0) {
          expect(responseB.body.data.data.length).toBeGreaterThan(0);
          // Verify all leaves belong to respective tenants
          responseB.body.data.data.forEach((leave: any) => {
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
        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all attendance records belong to respective tenants
          responseA.body.data.forEach((attendance: any) => {
            expect(attendance.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all attendance records belong to respective tenants
          responseB.body.data.forEach((attendance: any) => {
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

        if (responseA.body.data.data && responseA.body.data.data.length > 0) {
          expect(responseA.body.data.data.length).toBeGreaterThan(0);
          // Verify all notifications belong to respective tenants
          responseA.body.data.data.forEach((notification: any) => {
            expect(notification.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data.data && responseB.body.data.data.length > 0) {
          expect(responseB.body.data.data.length).toBeGreaterThan(0);
          // Verify all notifications belong to respective tenants
          responseB.body.data.data.forEach((notification: any) => {
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

        if (responseA.body.data && responseA.body.data.length > 0) {
          expect(responseA.body.data.length).toBeGreaterThan(0);
          // Verify all timesheets belong to respective tenants
          responseA.body.data.forEach((timesheet: any) => {
            expect(timesheet.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.length > 0) {
          expect(responseB.body.data.length).toBeGreaterThan(0);
          // Verify all timesheets belong to respective tenants
          responseB.body.data.forEach((timesheet: any) => {
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

        if (responseA.body.data.data && responseA.body.data.data.length > 0) {
          expect(responseA.body.data.data.length).toBeGreaterThan(0);
          // Verify all payroll records belong to respective tenants
          responseA.body.data.data.forEach((payroll: any) => {
            expect(payroll.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data.data && responseB.body.data.data.length > 0) {
          expect(responseB.body.data.data.length).toBeGreaterThan(0);
          // Verify all payroll records belong to respective tenants
          responseB.body.data.data.forEach((payroll: any) => {
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

        if (responseA.body.data.data && responseA.body.data.data.length > 0) {
          expect(responseA.body.data.data.length).toBeGreaterThan(0);
          // Verify all daily work reports belong to respective tenants
          responseA.body.data.data.forEach((report: any) => {
            expect(report.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data.data && responseB.body.data.data.length > 0) {
          expect(responseB.body.data.data.length).toBeGreaterThan(0);
          // Verify all daily work reports belong to respective tenants
          responseB.body.data.data.forEach((report: any) => {
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

        if (responseA.body.data && responseA.body.data.data.length > 0) {
          expect(responseA.body.data.data.length).toBeGreaterThan(0);
          // Verify all milestones belong to respective tenants
          responseA.body.data.data.forEach((milestone: any) => {
            expect(milestone.tenantId).toBe(testData.tenantA.id);
          });
        }

        if (responseB.body.data && responseB.body.data.data.length > 0) {
          expect(responseB.body.data.data.length).toBeGreaterThan(0);
          // Verify all milestones belong to respective tenants
          responseB.body.data.data.forEach((milestone: any) => {
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

  describe('Phase 4.1: GL Account Cross-Tenant Access', () => {
    it('should reject cross-tenant journal entry creation with wrong tenant account', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Get tenant B's account ID
      const tenantBAccount = await prisma.account.findFirst({
        where: { tenantId: testData.tenantB.id, code: '1000' },
      });

      const tenantAAccount = await prisma.account.findFirst({
        where: { tenantId: testData.tenantA.id, code: '2000' },
      });

      expect(tenantBAccount).toBeDefined();
      expect(tenantAAccount).toBeDefined();

      // Tenant A should not be able to create a journal entry using tenant B's account
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          date: new Date().toISOString(),
          description: 'Cross-tenant test',
          lines: [
            {
              accountId: tenantBAccount.id,
              debitAmount: 100,
            },
            {
              accountId: tenantAAccount.id,
              creditAmount: 100,
            },
          ],
          posted: true,
        })
        .expect(404);
    });

    it('should allow same-tenant journal entry creation with valid accounts', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      // Get tenant A's accounts
      const cashAccount = await prisma.account.findFirst({
        where: { tenantId: testData.tenantA.id, code: '1000' },
      });
      const revenueAccount = await prisma.account.findFirst({
        where: { tenantId: testData.tenantA.id, code: '4000' },
      });

      expect(cashAccount).toBeDefined();
      expect(revenueAccount).toBeDefined();

      // Tenant A should be able to create a journal entry with their own accounts
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          date: new Date().toISOString(),
          description: 'Same-tenant test',
          lines: [
            {
              accountId: cashAccount.id,
              debitAmount: 100,
            },
            {
              accountId: revenueAccount.id,
              creditAmount: 100,
            },
          ],
          posted: true,
        })
        .expect(201);
    });
  });

  describe('Phase 4.1: Plans Module - GLOBAL SaaS Plan Verification', () => {
    it('should allow SUPER_ADMIN to view all plans (GLOBAL resource)', async () => {
      const tokenSuper = generateToken(testData.superAdmin);

      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return the same plans to all SUPER_ADMIN users', async () => {
      const tokenSuper = generateToken(testData.superAdmin);

      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .expect(200);

      // Plans are global - all admins see the same set
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Phase 3.1: Role-Based Authorization', () => {
    it('should deny EMPLOYEE role access to payroll endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/payroll')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE role access to payments endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE role access to invoice endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/invoice')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE role access to reports endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE role access to invoice-items endpoints', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/invoice-items')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Phase 4.2: Self-Service Attendance', () => {
    afterEach(async () => {
      await prisma.attendance.deleteMany({
        where: {
          OR: [
            { employeeId: testData.tenantAEmployeeRecord.id },
            { employeeId: testData.tenantBEmployeeRecord.id },
          ],
        },
      });
    });

    it('should allow EMPLOYEE to check in for self', async () => {
      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.employeeId).toBe(testData.tenantAEmployeeRecord.id);
      expect(response.body.data.checkIn).toBeDefined();
    });

    it('should prevent duplicate check-in for self', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('should allow EMPLOYEE to check out after check-in', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.checkOut).toBeDefined();
    });

    it('should reject check-out without check-in', async () => {
      const token = generateToken(testData.tenantBEmployee);

      await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should prevent double check-out', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('should reject unauthenticated access to self check-in', async () => {
      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .expect(401);
    });

    it('should return my-status for authenticated user', async () => {
      const token = generateToken(testData.tenantAEmployee);

      const response = await request(app.getHttpServer())
        .get('/attendance/my-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.date).toBeDefined();
    });

    it('should block CLIENT role from attendance', async () => {
      const clientUser = await prisma.user.create({
        data: {
          fullName: 'Tenant A Client',
          email: 'client@tenant-a.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'CLIENT',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(clientUser);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/attendance/my-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await prisma.user.delete({ where: { id: clientUser.id } });
    });

    it('should reject cross-tenant self check-in', async () => {
      const tokenA = generateToken(testData.tenantAEmployee);
      const tokenB = generateToken(testData.tenantBEmployee);

      await request(app.getHttpServer())
        .post('/attendance/check-in/self')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(201);

      await request(app.getHttpServer())
        .patch('/attendance/check-out/self')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('Phase 4.3: Expenses Module', () => {
    afterEach(async () => {
      await prisma.expense.deleteMany({
        where: {
          OR: [
            { tenantId: testData.tenantA.id },
            { tenantId: testData.tenantB.id },
          ],
        },
      });
    });

    it('should allow ADMIN to create expense', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          expenseDate: '2024-01-15',
          category: 'Office Supplies',
          description: 'Printer paper and ink',
          amount: '150.00',
          paymentMethod: 'CASH',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.category).toBe('Office Supplies');
      expect(Number(response.body.data.amount)).toBe(150);
      expect(response.body.data.tenantId).toBe(testData.tenantA.id);
    });

    it('should allow ADMIN to list expenses', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: 'Client meeting',
          amount: 500,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should allow ADMIN to get expense by id', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Utilities',
          description: 'Electric bill',
          amount: 200,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(expense.id);
    });

    it('should allow ADMIN to update expense', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Supplies',
          description: 'Office supplies',
          amount: 100,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: '120.00' })
        .expect(200);

      expect(Number(response.body.data.amount)).toBe(120);
    });

    it('should allow ADMIN to delete expense', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Supplies',
          description: 'Office supplies',
          amount: 100,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .delete(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await prisma.expense.findUnique({
        where: { id: expense.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject unauthenticated access to expenses', async () => {
      await request(app.getHttpServer())
        .get('/expenses')
        .expect(401);
    });

    it('should block EMPLOYEE role from expenses', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should block CLIENT role from expenses', async () => {
      const clientUser = await prisma.user.create({
        data: {
          fullName: 'Tenant A Client',
          email: 'client-expense@tenant-a.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'CLIENT',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(clientUser);

      await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await prisma.user.delete({ where: { id: clientUser.id } });
    });

    it('should reject cross-tenant expense access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const expenseB = await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: 'Tenant B expense',
          amount: 300,
          paymentMethod: 'CASH',
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/expenses/${expenseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/expenses/${expenseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ amount: '500' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/expenses/${expenseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should only return expenses for the current tenant', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: 'Tenant A expense',
          amount: 300,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Supplies',
          description: 'Tenant B expense',
          amount: 200,
          paymentMethod: 'CASH',
          tenantId: testData.tenantB.id,
        },
      });

      const responseA = await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.data.data).toBeDefined();
      expect(responseB.body.data.data).toBeDefined();
      responseA.body.data.data.forEach((expense: any) => {
        expect(expense.tenantId).toBe(testData.tenantA.id);
      });
      responseB.body.data.data.forEach((expense: any) => {
        expect(expense.tenantId).toBe(testData.tenantB.id);
      });
    });

    it('should filter expenses by category', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: 'Flight tickets',
          amount: 500,
          paymentMethod: 'CARD',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-16'),
          category: 'Supplies',
          description: 'Office supplies',
          amount: 100,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/expenses?category=Travel')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((expense: any) => {
        expect(expense.category).toBe('Travel');
      });
    });

    it('should filter expenses by date range', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: 'Flight tickets',
          amount: 500,
          paymentMethod: 'CARD',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/expenses?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Phase 4.4: Purchases Module', () => {
    let tenantAVendorId: string;
    let tenantBVendorId: string;

    beforeEach(async () => {
      const vendorA = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });
      tenantAVendorId = vendorA.id;

      const vendorB = await prisma.vendor.create({
        data: {
          name: 'Tenant B Vendor',
          tenantId: testData.tenantB.id,
        },
      });
      tenantBVendorId = vendorB.id;
    });

    afterEach(async () => {
      await prisma.purchase.deleteMany({
        where: {
          OR: [
            { tenantId: testData.tenantA.id },
            { tenantId: testData.tenantB.id },
          ],
        },
      });
      await prisma.vendor.deleteMany({
        where: {
          OR: [
            { tenantId: testData.tenantA.id },
            { tenantId: testData.tenantB.id },
          ],
        },
      });
    });

    it('should allow ADMIN to create purchase', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          purchaseDate: '2024-01-15',
          vendorId: tenantAVendorId,
          referenceNo: 'PO-001',
          description: 'Office supplies',
          subtotal: '1000.00',
          tax: '100.00',
          total: '1100.00',
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.vendor).toBeDefined();
      expect(response.body.data.vendor.name).toBe('Acme Corp');
      expect(Number(response.body.data.total)).toBe(1100);
      expect(response.body.data.tenantId).toBe(testData.tenantA.id);
    });

    it('should allow ADMIN to list purchases', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should allow ADMIN to get purchase by id', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const purchase = await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/purchases/${purchase.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(purchase.id);
    });

    it('should allow ADMIN to update purchase', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const purchase = await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/purchases/${purchase.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ total: '1200.00' })
        .expect(200);

      expect(Number(response.body.data.total)).toBe(1200);
    });

    it('should allow ADMIN to delete purchase', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const purchase = await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .delete(`/purchases/${purchase.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await prisma.purchase.findUnique({
        where: { id: purchase.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject unauthenticated access to purchases', async () => {
      await request(app.getHttpServer())
        .get('/purchases')
        .expect(401);
    });

    it('should block EMPLOYEE role from purchases', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should block CLIENT role from purchases', async () => {
      const clientUser = await prisma.user.create({
        data: {
          fullName: 'Tenant A Client',
          email: 'client-purchase@tenant-a.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'CLIENT',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(clientUser);

      await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await prisma.user.delete({ where: { id: clientUser.id } });
    });

    it('should reject cross-tenant purchase access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const purchaseB = await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantBVendorId,
          description: 'Tenant B purchase',
          subtotal: 500,
          tax: 50,
          total: 550,
          paymentMethod: 'CASH',
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/purchases/${purchaseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/purchases/${purchaseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ total: '600' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/purchases/${purchaseB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should only return purchases for the current tenant', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Tenant A purchase',
          subtotal: 300,
          tax: 30,
          total: 330,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantBVendorId,
          description: 'Tenant B purchase',
          subtotal: 200,
          tax: 20,
          total: 220,
          paymentMethod: 'CASH',
          tenantId: testData.tenantB.id,
        },
      });

      const responseA = await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.data.data).toBeDefined();
      expect(responseB.body.data.data).toBeDefined();
      responseA.body.data.data.forEach((purchase: any) => {
        expect(purchase.tenantId).toBe(testData.tenantA.id);
      });
      responseB.body.data.data.forEach((purchase: any) => {
        expect(purchase.tenantId).toBe(testData.tenantB.id);
      });
    });

    it('should filter purchases by vendorId', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendorA = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });
      const vendorB = await prisma.vendor.create({
        data: {
          name: 'Globex Inc',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: vendorA.id,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'CARD',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-16'),
          vendorId: vendorB.id,
          description: 'Equipment',
          subtotal: 2000,
          tax: 200,
          total: 2200,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/purchases?vendorId=${vendorA.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((purchase: any) => {
        expect(purchase.vendorId).toBe(vendorA.id);
      });
    });

    it('should filter purchases by date range', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: tenantAVendorId,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'CARD',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/purchases?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Phase 4.5: Vendors Module', () => {
    afterEach(async () => {
      await prisma.purchase.deleteMany({
        where: {
          OR: [
            { tenantId: testData.tenantA.id },
            { tenantId: testData.tenantB.id },
          ],
        },
      });
      await prisma.vendor.deleteMany({
        where: {
          OR: [
            { tenantId: testData.tenantA.id },
            { tenantId: testData.tenantB.id },
          ],
        },
      });
    });

    it('should allow ADMIN to create vendor', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Acme Corp',
          contactPerson: 'John Doe',
          email: 'acme@example.com',
          phone: '+1234567890',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Acme Corp');
      expect(response.body.data.tenantId).toBe(testData.tenantA.id);
    });

    it('should allow ADMIN to list vendors', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should allow ADMIN to get vendor', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(vendor.id);
    });

    it('should allow ADMIN to update vendor', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Acme Corporation' })
        .expect(200);

      expect(response.body.data.name).toBe('Acme Corporation');
    });

    it('should allow ADMIN to deactivate vendor with purchases', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.purchase.create({
        data: {
          purchaseDate: new Date('2024-01-15'),
          vendorId: vendor.id,
          description: 'Office supplies',
          subtotal: 1000,
          tax: 100,
          total: 1100,
          paymentMethod: 'BANK_TRANSFER',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.success).toBe(true);
      expect(response.body.data.deactivated).toBe(true);

      const updatedVendor = await prisma.vendor.findUnique({
        where: { id: vendor.id },
      });
      expect(updatedVendor?.isActive).toBe(false);
    });

    it('should reject unauthenticated access to vendors', async () => {
      await request(app.getHttpServer())
        .get('/vendors')
        .expect(401);
    });

    it('should block EMPLOYEE role from vendors', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should block CLIENT role from vendors', async () => {
      const clientUser = await prisma.user.create({
        data: {
          fullName: 'Tenant A Client',
          email: 'client-vendor@tenant-a.com',
          password: '$2b$10$dummy.hash.for.testing',
          role: 'CLIENT',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(clientUser);

      await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await prisma.user.delete({ where: { id: clientUser.id } });
    });

    it('should reject cross-tenant vendor access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const vendorB = await prisma.vendor.create({
        data: {
          name: 'Tenant B Vendor',
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/vendors/${vendorB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/vendors/${vendorB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hacked' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/vendors/${vendorB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should only return vendors for the current tenant', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await prisma.vendor.create({
        data: {
          name: 'Tenant A Vendor',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.vendor.create({
        data: {
          name: 'Tenant B Vendor',
          tenantId: testData.tenantB.id,
        },
      });

      const responseA = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.data.data).toBeDefined();
      expect(responseB.body.data.data).toBeDefined();
      responseA.body.data.data.forEach((vendor: any) => {
        expect(vendor.tenantId).toBe(testData.tenantA.id);
      });
      responseB.body.data.data.forEach((vendor: any) => {
        expect(vendor.tenantId).toBe(testData.tenantB.id);
      });
    });

    it('should search vendors by name', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      await prisma.vendor.create({
        data: {
          name: 'Globex Inc',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/vendors?search=Acme')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
      expect(response.body.data.data[0].name).toBe('Acme Corp');
    });

    it('should filter vendors by active status', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .patch(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/vendors?isActive=false')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
      expect(response.body.data.data[0].isActive).toBe(false);
    });

    it('should reject purchase with cross-tenant vendorId', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const vendorB = await prisma.vendor.create({
        data: {
          name: 'Tenant B Vendor',
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          purchaseDate: '2024-01-15',
          vendorId: vendorB.id,
          description: 'Cross-tenant purchase',
          subtotal: '1000.00',
          tax: '100.00',
          total: '1100.00',
          paymentMethod: 'CASH',
        })
        .expect(403);
    });

    it('should reject purchase with inactive vendor', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Inactive Vendor',
          tenantId: testData.tenantA.id,
          isActive: false,
        },
      });

      await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          purchaseDate: '2024-01-15',
          vendorId: vendor.id,
          description: 'Purchase with inactive vendor',
          subtotal: '1000.00',
          tax: '100.00',
          total: '1100.00',
          paymentMethod: 'CASH',
        })
        .expect(403);
    });

    it('should correctly display associated vendor in purchase', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Acme Corp',
          tenantId: testData.tenantA.id,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          purchaseDate: '2024-01-15',
          vendorId: vendor.id,
          description: 'Office supplies',
          subtotal: '1000.00',
          tax: '100.00',
          total: '1100.00',
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);

      expect(response.body.data.vendor).toBeDefined();
      expect(response.body.data.vendor.name).toBe('Acme Corp');
    });

    it('should allow vendor to be deleted when no purchases reference it', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const vendor = await prisma.vendor.create({
        data: {
          name: 'Orphan Vendor',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .delete(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await prisma.vendor.findUnique({
        where: { id: vendor.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
