# ADR-002: Role-Based Access Control (RBAC) and Permission Matrix

* **Document ID:** LYF-ADR-002
* **Version:** 1.0.0
* **Status:** Approved
* **Owner:** Chief Software Architect
* **Purpose:** To establish a scalable multi-tenant RBAC and granular permission system for LYFADS ERP.
* **Scope:** All backend endpoints, frontend routing, and tenant administrative controls.

## Context
In a multi-tenant SaaS ERP system, different users within a company (Tenant) require different access levels (e.g., Tenant Super Admin, Finance Manager, Inventory Clerk, Regular Employee). Security requires that users can only access data and perform actions explicitly permitted by their assigned roles, restricted strictly within their own `tenant_id`.

## Decision
We implement a **Hierarchical Role-Based Access Control (RBAC) combined with Dynamic Permission Strings** (e.g., `invoice:create`, `inventory:delete`). 
* Roles are scoped per tenant (except system-level super admins).
* Permissions are checked via backend middleware prior to executing any controller logic.