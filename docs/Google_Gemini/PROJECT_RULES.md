# LYFads ERP - Project Rules

## 1. General Rules

- TypeScript Only
- Functional Components Only
- Clean Code
- Component-Based Architecture
- Mobile First
- Responsive Design
- Reusable Components
- Open Source Technologies Only

---

## 2. Component Rules

- One Component = One Responsibility
- Max Component Size = 150 Lines
- Max Function Size = 25 Lines
- Max File Size = 180 Lines

If limit exceeds:
- Split Component
- Extract Function
- Refactor Code

---

## 3. Naming Convention

Components:
PascalCase

Example:
Button.tsx
Navbar.tsx
Sidebar.tsx

Pages:
Folder + Same Name

Example:
pages/
    Login/
        Login.tsx

Hooks:
useSomething.ts

Example:
useAuth.ts

Services:
something.service.ts

Example:
auth.service.ts

Types:
something.types.ts

Example:
user.types.ts

Constants:
camelCase.ts

Example:
roles.ts

---

## 4. Folder Structure

src/

components/

pages/

layouts/

hooks/

services/

utils/

types/

constants/

assets/

styles/

routes/

---

## 5. Coding Rules

- Don't Repeat Yourself (DRY)
- Keep Components Small
- Keep Functions Small
- Avoid Deep Nesting
- Meaningful Variable Names
- No Unused Code
- No Console.log in Production

---

## 6. Git Rules

Commit After Every Completed Step

Commit Message Example

feat: login page

fix: sidebar responsive issue

refactor: dashboard cards

---

## 7. Responsive Rule

Must Work On

Mobile

Tablet

Desktop

---

## 8. Golden Rule

First Think

Then Design

Then Code

Then Test

Then Refactor