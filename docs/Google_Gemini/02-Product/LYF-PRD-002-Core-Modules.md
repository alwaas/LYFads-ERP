# PRD-002: Core ERP Business Modules Requirements

* **Document ID:** LYF-PRD-002
* **Version:** 1.0.0
* **Status:** Approved
* **Owner:** Product Manager & Enterprise Solution Architect
* **Purpose:** To define functional and technical requirements for Phase 1 Core Modules of LYFADS ERP.
* **Scope:** Finance, Inventory, and HR/Payroll modules, fully isolated per tenant.

## 1. Finance & Accounting Module
* **Multi-Currency Support:** Every tenant must be able to configure their base operating currency.
* **General Ledger (GL):** Automated double-entry bookkeeping for every transaction (Sales, Purchases, Expenses).
* **Tenant Scoping:** All financial records, ledgers, and vouchers must enforce strict `tenant_id` foreign keys to prevent data bleeding across companies.

## 2. Inventory & Stock Management Module
* **Multi-Warehouse Support:** Tenants can manage multiple inventory locations/warehouses under a single corporate account.
* **Stock Tracking:** Real-time tracking of goods in, goods out, and stock valuation (FIFO/Weighted Average methods).
* **Tenant Isolation:** Stock levels, item catalogs, and SKUs are strictly partitioned per tenant. Tenant A cannot view or modify Tenant B's item inventory or pricing tiers.

## 3. HR & Payroll Module
* **Employee Management:** Secure records of employee details, department allocations, and designation structures.
* **Payroll Processing:** Automated salary computation based on attendance, deductions, and tax configurations set by the tenant admin.
* **Access Control (RBAC):** Strict permission checks (`payroll:read`, `payroll:process`) ensuring only authorized HR managers within the specific tenant can access sensitive salary data.