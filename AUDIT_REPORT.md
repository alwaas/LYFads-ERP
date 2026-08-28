# LYFADS ERP — PHASE 1 AUDIT REPORT: REPORTS & ANALYTICS FOUNDATION

## 1. PROJECT STRUCTURE OVERVIEW

- **Backend**: NestJS (Node 22, TypeScript, Prisma ORM, PostgreSQL)
- **Frontend**: React 19 + Vite 8 + TypeScript + Tailwind CSS 4 + Recharts 3
- **State Management**: Zustand 5 + React Query 5
- **Auth**: JWT with Passport, role-based access control (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, CLIENT)
- **Multi-tenancy**: Tenant-scoped with tenantId in JWT, strict isolation enforced

## 2. PRISMA SCHEMA AUDIT

### 2.1 Existing Financial Models

| Model | Fields | Status |
|-------|--------|--------|
| `Invoice` | id, invoiceNumber, clientId, projectId, issueDate, dueDate, subtotal, tax, discount, total, paidAmount, balanceAmount, status, notes, tenantId, timestamps | ✅ Exists |
| `InvoiceItem` | id, invoiceId, description, quantity, unitPrice, amount, tenantId, createdAt | ✅ Exists |
| `Payment` | id, invoiceId, amount, paymentDate, method, referenceNo, remarks, tenantId, timestamps | ✅ Exists (BASIC) |

### 2.2 Missing Financial Models (Required for Full Reporting)

| Model | Purpose | Impact |
|-------|---------|--------|
| `PaymentAllocation` | Link payments to invoices with allocation amounts | Payments currently simple one-to-one with invoices |
| `Payment` status field | Track ACTIVE / REVERSED / VOID | Cannot exclude void payments from totals |
| `Purchase` | Purchase orders and vendor bills | Purchase report impossible |
| `Expense` | Operational expenses by category | Expense report impossible |
| `Vendor` | Vendor master data | Vendor report impossible |
| `SalesOrder` | Pre-invoice sales orders | Sales order reporting impossible |

### 2.3 Prisma Schema Indexes

**Existing relevant indexes:**
- `Invoice`: clientId, status
- `Payment`: invoiceId, paymentDate, tenantId

**Missing reporting-critical indexes:**
- `Invoice(tenantId)` — no composite index
- `Invoice(issueDate)` — needed for date-range sales reports
- `Invoice(dueDate)` — needed for aging/overdue reports
- `Invoice(status, issueDate)` — composite for filtered reports
- `Payment(tenantId)` — no index
- `Payment(paymentDate, tenantId)` — needed for payment trend reports
- `Payment(status)` — no status field exists

## 3. BACKEND MODULES AUDIT

### 3.1 Existing Modules

| Module | Location | Status | Financial Relevance |
|--------|----------|--------|---------------------|
| `auth` | `modules/auth/` | Complete | N/A |
| `users` | `modules/users/` | Complete | N/A |
| `clients` | `modules/clients/` | Complete | Customer data for reports |
| `projects` | `modules/projects/` | Complete | Project-linked invoices |
| `tasks` | `modules/tasks/` | Complete | N/A |
| `employees` | `modules/employees/` | Complete | N/A |
| `attendance` | `modules/attendance/` | Complete | N/A |
| `leaves` | `modules/leaves/` | Complete | N/A |
| `payroll` | `modules/payroll/` | Complete | Payroll expenses (not operational) |
| `invoice` | `modules/invoice/` | Complete | **Core financial** |
| `invoice-items` | `modules/invoice-items/` | Complete | Invoice detail |
| `payments` | `modules/payments/` | Basic | **Core financial** — no void/reversal |
| `dashboard` | `modules/dashboard/` | Complete | Non-financial stats |
| `reports` | `reports/` (top-level) | **Scaffold only** | **Needs full implementation** |

### 3.2 Missing Modules for Reporting

| Module | Impact on Reports |
|--------|-------------------|
| `purchase` | Purchase report impossible |
| `expense` | Expense report impossible |
| `vendor` | Vendor report impossible |
| `sales-order` | Sales order report impossible |

## 4. REPORTS MODULE AUDIT (CURRENT STATE)

### 4.1 Location
`server/src/reports/` — **Note**: This is OUTSIDE `modules/`, inconsistent with project convention.

### 4.2 Current Endpoints
- `GET /reports/dashboard` — Returns non-financial counts only

### 4.3 Current Service Logic
```typescript
async dashboard(userTenantId: string) {
  const [employees, clients, projects, tasks, leads, attendance, leaves] = ...
  return { employees, clients, projects, tasks, leads, attendance, leaves };
}
```

**Issues:**
- No date filtering
- No financial metrics
- No tenant isolation validation (relies on caller passing correct tenantId)
- No authorization guard on controller (no `@UseGuards(JwtAuthGuard)`)

### 4.4 Frontend Reports
- `client/src/pages/reports/ReportsPage.tsx` — Single page, basic stats cards
- `client/src/components/reports/ReportStats.tsx` — Grid of count cards
- `client/src/types/report.ts` — DashboardReport interface with 7 count fields
- `client/src/services/report.service.ts` — Single `getDashboardReport()` function

## 5. FINANCIAL CALCULATION AUDIT

### 5.1 InvoiceService
- Uses `Prisma.Decimal` for all monetary fields ✅
- Tenant isolation enforced via `userTenantId` parameter ✅
- No status-based filtering (DRAFT invoices included in findAll) ⚠️

### 5.2 PaymentsService
- Uses `Prisma.Decimal` for amount ✅
- `refreshInvoice()` recalculates paidAmount/balanceAmount/status ✅
- **CRITICAL**: `refreshInvoice()` uses `Number(payment.amount)` and floating-point arithmetic:
  ```typescript
  const paidAmount = invoice.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),  // FLOATING POINT
    0,
  );
  const total = Number(invoice.total);  // FLOATING POINT
  const balance = total - paidAmount;    // FLOATING POINT
  ```
- No PaymentAllocation — payments directly linked to invoices
- No void/reversal mechanism
- No payment status field

### 5.3 Missing Financial Infrastructure
- No centralized financial calculation service
- No AR aging logic
- No client ledger
- No cash flow tracking
- No expense categorization
- No COGS/ inventory valuation

## 6. TENANT ISOLATION AUDIT

### 6.1 Pattern
- Consistent: `userTenantId` derived from JWT via `@GetUser()` decorator
- Never accepts `tenantId` from request body/query
- All findOne operations verify `record.tenantId === userTenantId`
- All findAll operations filter by `tenantId`

### 6.2 Risks
- Reports controller missing `@UseGuards(JwtAuthGuard)` — **anyone can access without auth**
- Reports service has no tenant validation — trusts caller entirely
- Invoice.findAll() returns ALL tenant invoices (no status filter) — DRAFT/VOID included

## 7. FRONTEND ARCHITECTURE AUDIT

### 7.1 Routing
- Lazy-loaded routes via `react-router-dom` v7
- ProtectedRoute wrapper for authenticated pages
- `/reports` route exists

### 7.2 UI Components
- Tailwind CSS 4 for styling
- Recharts 3 for charts (PieChart, BarChart available)
- Lucide React for icons
- No PDF/Excel export libraries installed

### 7.3 Patterns
- `@tanstack/react-query` for data fetching
- Loading/error states in components
- DashboardLayout wrapper for authenticated pages

## 8. E2E TESTS AUDIT

### 8.1 Existing Test Files
1. `server/test/app.e2e-spec.ts` — Basic health check
2. `server/test/tenant-isolation.e2e-spec.ts` — Comprehensive tenant isolation (1537 lines)

### 8.2 Test Database
- Dedicated test DB: `lyfads_erp_test`
- Safety guard prevents accidental production DB access
- Clean database function with dependency-order deletion
- setupTestDatabase creates two tenants with sample data

### 8.3 Gaps
- **No invoice-specific E2E tests**
- **No payment-specific E2E tests**
- **No financial correctness tests**
- **No reports-specific E2E tests** (only tenant isolation check)
- No date-range filtering tests
- No decimal precision tests

## 9. GIT & MIGRATION AUDIT

### 9.1 Git Status
- Working directory: clean (no uncommitted changes)
- Branch: `coal-lead` (same as `main` for server code)
- Recent commits: production hardening, tenant isolation

### 9.2 Migration History
- 24 migrations total
- Latest: `20260817230000_tenant_scoped_unique_constraints`
- All migrations are additive (no destructive operations)

### 9.3 Prisma Version Mismatch
- `prisma` CLI: **7.9.1**
- `@prisma/client`: **^6.16.2** in package.json
- `node_modules`: **NOT INSTALLED**
- `prisma migrate status`: **FAILS** with P1012 error (datasource url deprecated in v7)

### 9.4 Schema vs Migration Drift
- Schema shows `tenantId` as required on Invoice, Payment, InvoiceItem, etc.
- Migrations added `SET NOT NULL` constraints for tenantId on most models
- Migration `20260813205340_add_tenantid_to_phase3a_models` and `20260813185903_make_tenantid_not_null` exist
- Schema includes `tenantId` on Invoice, Payment, InvoiceItem — migrations match

## 10. MISSING INDEXES FOR REPORTING PERFORMANCE

Justified additions based on query patterns:

```sql
-- Invoice date-range queries
CREATE INDEX "Invoice_tenantId_issueDate_idx" ON "Invoice"(tenantId, issueDate);
CREATE INDEX "Invoice_tenantId_dueDate_idx" ON "Invoice"(tenantId, dueDate);
CREATE INDEX "Invoice_tenantId_status_issueDate_idx" ON "Invoice"(tenantId, status, issueDate);

-- Payment date-range queries  
CREATE INDEX "Payment_tenantId_paymentDate_idx" ON "Payment"(tenantId, paymentDate);
CREATE INDEX "Payment_tenantId_invoiceId_idx" ON "Payment"(tenantId, invoiceId);

-- Client-linked invoice queries
CREATE INDEX "Invoice_tenantId_clientId_idx" ON "Invoice"(tenantId, clientId);

-- Project-linked invoice queries
CREATE INDEX "Invoice_tenantId_projectId_idx" ON "Invoice"(tenantId, projectId);
```

## 11. DECIMAL / NUMBER SERIALIZATION PROBLEMS

1. **PaymentsService.refreshInvoice()**: Uses `Number()` conversion which loses Decimal precision
2. **Invoice DTOs**: Accept strings for Decimal fields, convert with `new Prisma.Decimal()` — correct pattern
3. **Frontend**: No explicit Decimal serialization — relies on JSON parsing

## 12. DATE/TIMEZONE PROBLEMS

1. All dates stored as `DateTime` in Prisma (TIMESTAMP in PostgreSQL)
2. No explicit timezone handling in services
3. `new Date(dateString)` used throughout — browser/server timezone dependent
4. No UTC normalization for date-range filtering

## 13. WHAT DATA IS ALREADY AVAILABLE FOR REPORTING

| Data | Source | Completeness |
|------|--------|-------------|
| Invoice totals, dates, status | Invoice model | ✅ Complete |
| Payment amounts, dates | Payment model | ⚠️ No status/void tracking |
| Client info | Client model | ✅ Complete |
| Project info | Project model | ✅ Complete |
| Invoice items | InvoiceItem model | ✅ Complete |
| Employee/count data | Employee/User | ✅ Non-financial only |
| Payroll | Payroll model | ⚠️ Not operational expenses |

## 14. WHAT APIS ALREADY EXIST

| Endpoint | Purpose | Financial |
|----------|---------|-----------|
| `GET /dashboard/stats` | Non-financial counts | ❌ |
| `GET /dashboard/charts` | Project/task status charts | ❌ |
| `GET /reports/dashboard` | Basic counts | ❌ |
| `GET /invoice` | List invoices | ✅ |
| `GET /invoice/:id` | Invoice detail | ✅ |
| `GET /payments` | List payments | ✅ |
| `GET /payments/:id` | Payment detail | ✅ |

## 15. WHAT APIS ARE MISSING

| Endpoint | Purpose |
|----------|---------|
| `GET /reports/dashboard` | Financial KPI dashboard |
| `GET /reports/sales` | Sales report |
| `GET /reports/receivables` | AR aging report |
| `GET /reports/expenses` | Expense report |
| `GET /reports/purchases` | Purchase report |
| `GET /reports/customers` | Customer analytics |
| `GET /reports/vendors` | Vendor analytics |
| `GET /reports/profitability` | Profitability (if data available) |

## 16. CRITICAL RISKS

1. **Prisma v6/v7 mismatch**: `prisma migrate` and `prisma generate` will fail until resolved
2. **node_modules missing**: Cannot build or test without `npm install`
3. **No PaymentAllocation**: Cannot track partial payments across multiple invoices
4. **No payment void/reversal**: Cannot exclude invalid payments from totals
5. **Floating-point in refreshInvoice()**: Financial calculation precision risk
6. **Reports controller unguarded**: Security vulnerability — no auth required
7. **No Purchase/Expense/Vendor modules**: 4 of 8 required reports cannot be implemented

## 17. RECOMMENDATIONS

1. **Resolve Prisma version mismatch** before any migration work
2. **Install dependencies** (`npm install`) before testing
3. **Add missing indexes** after implementing report queries
4. **Fix floating-point arithmetic** in PaymentsService.refreshInvoice()
5. **Add auth guard** to ReportsController
6. **Do NOT implement** Purchase, Expense, Vendor, SalesOrder reports until those modules exist
7. **Implement PaymentAllocation** if partial payment tracking across invoices is required
