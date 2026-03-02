# Student Budget Tracker & Financial Intelligence System

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add

**Authentication**
- User registration and login with Internet Identity (via Caffeine authorization component)
- Protected routes for authenticated users

**User Profile & Financial Survey**
- Profile storing: age, gender, course/stream, living situation
- Income source and income range
- Financial habits survey: tracks expenses, month-end shortage, major spending category, borrowing behavior, budget discipline level, stress level (1–5), emergency savings status, app usefulness opinion, shared expense behavior, conflict frequency, auto-split preference, feature preferences, biggest financial problem (text)

**Expense Management**
- Add, edit, delete expenses
- Fields: amount, category, date, note
- View expense history with filters by date, category, month

**Category Management**
- Predefined categories: Food, Transport, Books, Entertainment, Shopping, Rent, Miscellaneous
- Custom category creation per user

**Budget Management**
- Set and update monthly budgets per category
- Track: total spent, remaining balance, percentage used
- Compare income vs total expenses

**Intelligent Alert System**
- Per-category budget threshold alerts: 75% (warning), 90% (critical), 100% (exceeded)
- Detect repeated overspending patterns
- Suggest corrective actions based on spending

**Financial Intelligence Engine**
- Compute: income-to-expense ratio, highest spending category, monthly trend, borrowing risk, financial discipline level
- Financial Score (0–100) based on: overspending, budget discipline, emergency savings, income management, stress level
- Generate: personalized saving tips, weekly spending cap suggestions, emergency fund recommendations

**Shared Expense Module**
- Create expense groups, add/remove members
- Add shared expenses with equal or custom splits
- Track paid/pending status per member
- Generate settlement summary (who owes whom)

**Dashboard & Analytics**
- Pie chart: category expense distribution
- Bar chart: monthly expense comparison
- Line graph: spending trend over time
- Budget utilization progress bars per category
- Income vs expense summary
- Financial score meter (0–100)

**Reporting**
- Monthly summary report
- Improvement trends over months
- Behavioral insights based on survey + spending data

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

**Backend (Motoko)**
1. User profile store: demographic + survey fields
2. Expense CRUD: add, update, delete, query with filters
3. Custom categories store per user
4. Budget store: monthly limits per category; compute spent/remaining/percentage
5. Alert logic: compute threshold alerts and overspending detection
6. Financial Intelligence: score computation, saving tips, weekly cap, emergency fund suggestion
7. Shared expense groups: CRUD for groups, members, shared expenses, splits, settlements
8. Analytics queries: monthly aggregates, category totals, trend data

**Frontend (React + TypeScript)**
1. Auth screens: login/register via authorization component
2. Onboarding: profile + financial survey form (multi-step)
3. Dashboard: financial score meter, income vs expense, budget utilization cards, charts (pie, bar, line)
4. Expenses page: add/edit/delete expense form, filterable history table
5. Budgets page: set/update category budgets, progress indicators with alert colors
6. Alerts panel: active alerts with suggested actions
7. Shared Expenses page: group management, add shared expense, split UI, settlement summary
8. Reports page: monthly summary, trend charts, behavioral insights
9. Navigation: sidebar or tab-based navigation across all sections
