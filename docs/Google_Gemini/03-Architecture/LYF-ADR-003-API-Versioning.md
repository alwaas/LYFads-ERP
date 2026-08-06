# ADR-003: API Versioning Strategy

* **Document ID:** LYF-ADR-003
* **Version:** 1.0.0
* **Status:** Approved
* **Owner:** Chief Software Architect
* **Purpose:** To define a clean versioning mechanism for all LYFADS ERP backend endpoints.
* **Scope:** All REST and GraphQL endpoints exposed to web/mobile clients or third-party integrations.

## Context
As LYFADS ERP evolves, business logic will change. Breaking changes in APIs can disrupt existing enterprise client integrations and frontend applications. We need a predictable versioning strategy.

## Decision
We adopt **URI Path Versioning** (e.g., `/api/v1/finance/accounts`, `/api/v2/inventory/items`). 
* Every breaking change requires a major version increment (`v1` to `v2`).
* Non-breaking additive changes (like adding an optional field) do not require a new version.
* Deprecated API versions will be maintained for a minimum of 6 months with clear deprecation headers (`Deprecation: true`).