# Smart Roster Management System — Seed Data Architecture & Guide

This directory contains the realistic sample dataset generator and documentation for the **Smart Roster Management System** based on the DataStraw assessment specifications.

---

## 1. Overview of Dataset

The dataset populates the system with realistic operational records simulating a multi-brand D2C workforce management environment:

- **Total Employees**: 30 (6 per pod, realistic Indian professional names)
- **Operational Pods**: 5 specialized pods
- **Pod Leads**: 5 designated leads (directly referenced from existing employee records)
- **Fictional D2C Brands**: 12 brands (10 single-resource brands, 2 multi-resource brands)
- **Operational Processes**: 4 distinct process types
- **Operating Rules**: 3 scheduling models (365-day, holidays off, Sundays & holidays off)
- **Resource Allocations**: Primary, shared, and backup assignments
- **Weekly Offs**: Individual preferences (Sunday, Wednesday, Friday, Saturday, Rotational)
- **Public Holidays**: Gazetted & regional holidays for November 2026
- **Leaves**: Planned leaves, approved leaves, and comp-offs
- **Monthly Roster**: Complete November 2026 scheduling matrix (30 days)
- **Validation Conflicts**: Hard constraints (coverage gaps, insufficient staff) and soft warnings (weekly-off violations, double bookings)

---

## 2. Operational Pods & Leads

Each pod contains exactly 6 employees, and each pod lead is linked to an existing employee record within that pod:

| Pod Name | Designated Pod Lead | Employee ID | Primary Operational Focus |
|---|---|---|---|
| **Customer Support Pod** | Aarav Sharma | `EMP001` | First-line omnichannel customer care, live chat triage, SLA response |
| **Conversion Pod** | Priya Patel | `EMP007` | Abandoned cart checkout recovery, customer winback, sales conversion |
| **Retention Pod** | Rohan Gupta | `EMP013` | Subscriber retention, churn prevention, loyalty rewards, customer LTV |
| **Operations Pod** | Ananya Deshmukh | `EMP019` | Logistics fulfillment, NDR resolution, carrier escalations, delivery routing |
| **Escalation Pod** | Vikram Malhotra | `EMP025` | Critical ticket handling, VIP executive complaints, dispute mitigation |

---

## 3. Brand & Staffing Distribution

The 12 fictional D2C client brands are structured following the assessment's resource allocation models:

### Single-Resource Brands (~80% of Brands: 10 Brands)
In single-resource brands, **one dedicated primary employee** is responsible for all operational processes assigned to that brand:

1. **UrbanNest** (`URBN`): Dedicated Employee: **Aarav Sharma** (`EMP001`) — Handles CS, ACC, NDR.
2. **GlowTheory** (`GLOW`): Dedicated Employee: **Rahul Sharma** (`EMP002`) — Handles CS, ACC, NDR.
3. **FitFuel** (`FUEL`): Dedicated Employee: **Diya Mehta** (`EMP003`) — Handles CS, Retention, NDR.
4. **PureHarvest** (`PURE`): Dedicated Employee: **Kabir Joshi** (`EMP004`) — Handles CS, ACC.
5. **Trendora** (`TRND`): Dedicated Employee: **Ishita Sen** (`EMP005`) — Handles CS, ACC, NDR.
6. **SkinBloom** (`SBLM`): Dedicated Employee: **Arjun Nair** (`EMP006`) — Handles CS, Retention.
7. **HomeCraft** (`HMCR`): Dedicated Employee: **Priya Patel** (`EMP007`) — Handles CS, ACC, NDR.
8. **NutriVibe** (`NVIB`): Dedicated Employee: **Rohan Verma** (`EMP008`) — Handles CS, Retention.
9. **StyleSphere** (`SSPH`): Dedicated Employee: **Ananya Rao** (`EMP009`) — Handles CS, ACC.
10. **EcoEssentials** (`ECOE`): Dedicated Employee: **Devansh Kapoor** (`EMP010`) — Handles CS, NDR.

### Multi-Resource Brands (2 Brands)
The remaining 2 brands have multiple employees assigned across processes:

- **Brand 11: LuxeLiving** (`LUXE`) — Premium Interior Furnishings:
  - **Employee A**: Tanvi Kulkarni (`EMP011`) — Primary for **Customer Support (CS)**
  - **Employee B**: Siddharth Jain (`EMP012`) — Primary for **Abandoned Cart Conversion (ACC)**
  - **Employee C**: Rohan Gupta (`EMP013`) — Primary for **Non-Delivery Report (NDR)**

- **Brand 12: DailyDose** (`DLYD`) — Subscription Specialty Coffee:
  - **Employee A & Employee B**: Sneha Chatterjee (`EMP014`) & Aditya Singhania (`EMP015`) — **Shared Process!** Both are primary agents on **Customer Support (CS)** to satisfy the minimum 2-agent requirement.
  - **Employee C**: Riya Saxena (`EMP016`) — Primary for **Retention** & **Non-Delivery Report (NDR)**.

### Cross-Brand & Backup Allocations
- `EMP001` (Aarav Sharma): Primary on UrbanNest, Backup on GlowTheory (CS)
- `EMP002` (Rahul Sharma): Primary on GlowTheory, Backup on UrbanNest (CS)
- `EMP003` (Diya Mehta): Primary on FitFuel, Backup on PureHarvest (CS)
- `EMP007` (Priya Patel): Primary on HomeCraft, Backup on LuxeLiving (ACC)
- `EMP013` (Rohan Gupta): Primary on LuxeLiving (NDR), Backup on DailyDose (NDR)
- Dedicated backup specialists from Operations and Escalation pods (`EMP020`, `EMP022`, `EMP026`, `EMP027`).

---

## 4. Brand Operating Rules

Demonstrates all three required operational models across brand-process configurations:

- **Rule A: 365-Day Operations** (Monday–Sunday, Public Holidays included):
  - Example: `UrbanNest` Customer Support, `FitFuel` Customer Support, `DailyDose` Customer Support.
- **Rule B: Public Holidays Off** (Monday–Sunday, Public Holidays excluded):
  - Example: `UrbanNest` NDR, `Trendora` Customer Support, `LuxeLiving` NDR.
- **Rule C: Sundays and Public Holidays Off** (Monday–Saturday, Sundays & Holidays excluded):
  - Example: `UrbanNest` ACC, `Trendora` ACC, `Trendora` NDR, `HomeCraft` Customer Support.

*Different processes under the same brand feature distinct operating rules (e.g., UrbanNest CS is 365-day, ACC is Sundays off, NDR is Public holidays off).*

---

## 5. Public Holidays & Leaves (November 2026)

### Public Holidays
1. **Diwali / Deepavali**: 2026-11-10 (Tuesday) — Gazetted National Holiday
2. **Govardhan Puja**: 2026-11-12 (Thursday) — Regional Observance
3. **Guru Nanak Jayanti**: 2026-11-24 (Tuesday) — Gazetted National Holiday
4. **Guru Tegh Bahadur Martyrdom Day**: 2026-11-28 (Saturday) — Regional Observance

### Key Leaves & Conflict Triggers
- **Ishita Sen (`EMP005`)**: Approved leave on Nov 20–21, 2026. (Triggers Critical Coverage Gap on Trendora).
- **Sneha Chatterjee (`EMP014`)**: Approved leave on Nov 21, 2026. (Triggers Insufficient Staffing on DailyDose).
- **Rahul Sharma (`EMP002`)**: Approved casual leave on Nov 16, 2026 (covered by backup).
- **Rohan Verma (`EMP008`)**: Compensatory off (Comp-off) on Nov 05, 2026.

---

## 6. How to Run the Seed Script

### Using NPM Script
From the project root:
```bash
npm run seed
```

Or from the `backend/` directory:
```bash
cd backend
npm run seed
```

### Direct Node Invocation
```bash
node backend/seeders/seedData.js
```

### Safety & Idempotency
- The seeder uses controlled replacement and upsert logic.
- Admin and user authentication credentials (`admin@datastraw.io`, `ops.manager@datastraw.io`, etc.) are automatically preserved and updated.
- The script works seamlessly both with MongoDB Atlas connected and in in-memory resilience mode.

---

## 7. Sample Seeding Output

```
======================================================
Sample data successfully created.

Employees: 30
Pods: 5
Pod Leads: 5
Brands: 12
Processes: 4
Assignments: 27
Leaves: 5
Holidays: 4
Roster Entries: 810
Conflicts: 5
======================================================
```
