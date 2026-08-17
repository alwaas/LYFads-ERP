# Tenant Isolation Security Tests (Phase 3D)

## Overview

This directory contains comprehensive end-to-end tests for tenant isolation security in the LYFads ERP backend. These tests verify that:

1. **JWT tenantId Handling**: JWT tokens correctly include and extract tenantId
2. **Cross-Tenant Access Prevention**: Users cannot access resources from other tenants
3. **TenantId Spoofing Prevention**: Cannot spoof tenantId in request bodies
4. **Activity Logs Consistency**: All activity logs are created with correct tenantId
5. **Service-Level Isolation**: All tenant-scoped services properly enforce tenant boundaries

## Test Coverage

The following services are tested for tenant isolation:

- **ActivityLogsService**: Activity log queries and creation
- **CrmService (Leads)**: Lead CRUD operations
- **EmployeesService**: Employee CRUD operations
- **ClientsService**: Client CRUD operations
- **InvoiceService**: Invoice CRUD operations
- **ProjectsService**: Project CRUD operations with cross-tenant validation
- **TasksService**: Task CRUD operations with cross-tenant validation
- **DashboardService**: Dashboard stats, charts, and queries
- **UsersService**: User management operations
- **KanbanService**: Kanban board and task movement
- **ProjectTimelineService**: Timeline and deadline queries
- **AttachmentsService**: File attachment operations
- **CommentsService**: Comment CRUD operations

## Test Database Setup

The tests use the existing database but clean all data before and after test execution. This ensures tests are isolated and repeatable.

### Prerequisites

1. A running PostgreSQL database
2. Database credentials configured in environment variables

### Environment Configuration

Create a `.env.test` file in the server root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/lyfads_erp
JWT_SECRET=test-secret-key-for-testing-only
SUPABASE_URL=https://test.supabase.co
SUPABASE_SECRET_KEY=test-key
SUPABASE_STORAGE_BUCKET=test-bucket
NODE_ENV=test
```

### Running the Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run with coverage
npm run test:e2e -- --coverage

# Run in watch mode
npm run test:e2e -- --watch
```

## Test Data

The test setup creates two tenants (Tenant A and Tenant B) with:

- 3 users per tenant (Admin, Manager, Employee)
- 1 employee record per tenant
- 1 client per tenant
- 1 project per tenant
- 1 task per tenant
- 1 lead per tenant
- 1 invoice per tenant

This allows testing:
- Same-tenant access (should succeed)
- Cross-tenant access (should fail with 403 Forbidden)
- TenantId spoofing attempts (should be ignored/rejected)

## Test Scenarios

### 1. JWT tenantId Handling
- Verifies tenantId is included in JWT tokens
- Verifies tenantId is correctly extracted from JWT

### 2. Service-Level Tenant Isolation
For each service, tests verify:
- `findAll` returns only tenant-scoped data
- `findOne` rejects cross-tenant access (403)
- `create` assigns correct tenantId
- `update` rejects cross-tenant access (403)
- `delete` rejects cross-tenant access (403)

### 3. Cross-Tenant Relationship Validation
- Projects validate client belongs to same tenant
- Tasks validate project belongs to same tenant
- Attachments validate related entities belong to same tenant
- Comments validate related entities belong to same tenant

### 4. TenantId Spoofing Prevention
- Cannot create resources with spoofed tenantId in body
- Cannot update resources to change tenantId

### 5. Activity Logs Consistency
- All activities logged with correct tenantId
- Failed cross-tenant access attempts don't create logs

## CI/CD Integration

For CI/CD pipelines:

1. Set up a test database
2. Configure environment variables
3. Run `npm run test:e2e` as part of the test suite
4. Fail the build if tests don't pass

## Test File Structure

```
test/
├── setup/
│   └── test-database.ts       # Database seeding and cleanup utilities
├── setup.ts                   # Jest setup file
├── jest-e2e.json             # Jest configuration for e2e tests
├── tenant-isolation.e2e-spec.ts  # Main tenant isolation test suite
├── app.e2e-spec.ts           # Original app e2e test (unchanged)
└── README.md                 # This file
```

## Important Notes

- Tests **delete all data** from the database before and after execution
- Do **not** run these tests against a production database
- Tests require a clean database state to pass reliably
- The existing `app.e2e-spec.ts` is kept unchanged as per requirements

## Troubleshooting

### Database Connection Errors

If you see "Authentication failed against database server":
1. Verify DATABASE_URL is correct
2. Ensure PostgreSQL is running
3. Check database credentials

### Test Failures

If tests fail after changes:
1. Ensure database is clean (run tests to clean it)
2. Check that tenant isolation logic hasn't been inadvertently removed
3. Verify JWT tokens include tenantId

## Security Assertions

The tests enforce the following security invariants:

1. **Tenant Data Isolation**: Each tenant can only access their own data
2. **Cross-Tenant Access Rejection**: All cross-tenant access attempts return 403
3. **Immutable TenantId**: Cannot change a resource's tenantId after creation
4. **Consistent Activity Logging**: All activity logs have correct tenantId
5. **JWT Integrity**: JWT tokens cannot be tampered with to change tenantId
