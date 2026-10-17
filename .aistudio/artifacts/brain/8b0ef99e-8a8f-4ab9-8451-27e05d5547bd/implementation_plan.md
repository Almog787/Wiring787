# HarnessMap Pro: Relays, Fuses & Terminals Studio (Pure Client-Side & CI/CD)

An industrial-grade, 100% client-side wiring harness design and verification workstation that integrates automotive/industrial power switching (standard ISO 4/5-pin and Micro-ISO relays), overcurrent protection (ATO/ATC, MINI, MAXI, AGC/MDL fuses & modular blocks), precision terminal crimping matrices (Faston 2.8/4.8/6.3mm, Open/Closed barrel, Ring/Stud terminals), 3D procedural component inspection via Three.js, real-time AWG safety validation, an automated Vitest unit testing suite, and a conditional GitHub Actions deployment pipeline for GitHub Pages.

### User Review & Critical Decisions

> [!IMPORTANT]
> The revised architecture strictly adheres to a **100% Pure Client-Side Execution model** (Zero-Backend) suitable for free, static hosting on GitHub Pages, coupled with an automated CI/CD pipeline enforcing a 100% green-test quality gate before production deployment.

- **Confirmed Decision 1 (Zero-Backend Client Architecture)**: All circuit calculations, Three.js 3D rendering, state persistence, BOM generation, and safety checks run exclusively in the browser runtime with zero dependency on active servers or paid runtime APIs.
- **Confirmed Decision 2 (Automated Safety Testing Pipeline)**: Automated Vitest suite testing the mathematical precision of Ohm's Law, continuous/intermittent ampacity ratings (SAE J1128 / DIN 72551), relay contact routing (30, 85, 86, 87, 87a), and crimp tooling matrices.
- **Confirmed Decision 3 (Conditional GitHub Actions CI/CD)**: Complete workflow (`.github/workflows/deploy.yml`) executing lint, type-check, unit tests, and production build, deploying to GitHub Pages *only* when all safety and quality gates pass.
- **Confirmed Decision 4 (Dual 2D/3D Split Studio)**: Synchronized 2D wiring schematic canvas and Three.js 3D procedural workbench with exploded views and microscopic crimp cross-sections.

---

### 1. Overview & Core Concept

- **What It Does**: Enables harness engineers, technicians, and defense/automotive electricians to design circuits, place standard relays and fuse blocks, route wiring with automated ISO pinouts, simulate current loads, validate conductor cross-sections (AWG/mm²), match crimp dies, and generate shop-ready Bills of Materials (BOM) — entirely in the browser without server latency or costs.
- **Target Audience / Persona**: Automotive wire harness builders, off-road & heavy equipment (צמ"ה) upfitters, military/defense electronics technicians, motorsport electricians, and technical students.
- **Key Value**: Zero-cost, instantly accessible engineering workstation with zero server downtime risk, validated by rigorous automated CI test suites against electrical fire hazards and manufacturing errors.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Interactive Schematic Design**: User places ISO relays (4/5-pin), fuse blocks (ATO, MINI, MAXI, AGC), switches, and loads on an interactive grid with magnetic snap-to-pin wiring.
  2. **Automated Safety Checking**: Instant feedback computes current draw, resistance, and voltage drop. Undersized conductors (e.g. 22 AWG on 40A pin 30) immediately flag a hazard warning recommending 12/14 AWG and 6.3mm Faston terminals.
  3. **Procedural 3D Workbench**: Selection of any component or connection loads a 3D procedural model in Three.js with 360° orbit inspection, exploded assembly views (case, coil, contacts, pins), and open-barrel F-crimp conductor cross-sections.
  4. **Crimp & Tooling Matrix**: Filterable reference connecting terminal geometry (Faston 2.8/4.8/6.3mm, Ring M4–M8) to AWG ranges and ratchet crimpers (SN-48B, PA-09, LY-03BC).
  5. **BOM & Shop Traveler Export**: One-click generation and download of complete Bills of Materials (CSV format and formatted printable shop traveler cards) with wire cut lengths and crimp tools.
  6. **CI/CD & Verification Badge**: Visual in-app inspection of pipeline status and built-in self-test diagnostics runner verifying that all mathematical algorithms match SAE/DIN standards.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Industrial precision workstation. Deep slate/graphite palette (`#0B0F17` / `#131B2A`) with CAD-level technical contrast, clean typography, and zero visual clutter.
  - *Palette*: Deep Obsidian Slate canvas, Electric Amber (`#F59E0B`) for power rails, Industrial Cyan (`#06B6D4`) for signal/coil controls, Signal Emerald (`#10B981`) for ground and verified connections, Crimson Hazard (`#EF4444`) for electrical overloads.
  - *Typography*: `Plus Jakarta Sans` for titles and UI controls; `JetBrains Mono` / `tabular-nums` for pin labels (30, 85, 86, 87, 87a), wire gauges, current, and voltage figures.
  - *Anti-Slop Discipline*: Zero pills for static metadata (unboxed text with `·` separators), clean 3-zone top bar contract, and collapsible bottom dock for 3D controls.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: 100% Client-Side Engine vs Server-Assisted Backend**
  - *Chosen Approach*: Pure client-side SPA with all domain rules, lookup tables, and test runners bundled in client TypeScript.
  - *Why*: Meets the strict requirement for zero hosting cost, infinite scalability on GitHub Pages, zero backend maintenance, and offline functionality.
  - *Trade-off*: Advanced LLM assistance is converted into an ultra-fast local client-side Electrical Knowledge Base & Wiring Advisor with full offline capability.

- **Decision 2: Automated Testing Suite & In-App Diagnostics**
  - *Chosen Approach*: Dual testing architecture:
    1. Standalone **Vitest** test suite for CI runner (`npm run test`) validating core electrical math.
    2. An **In-App Self-Diagnostic Runner** allowing users and technicians to click "Run Safety Verification" to execute all unit assertions directly inside the browser UI, displaying test reports.
  - *Why*: Bridges automated GitHub Actions CI with runtime transparency for field electricians.

- **Decision 3: GitHub Actions CI/CD Pipeline with Quality Gate**
  - *Chosen Approach*: Multi-stage GitHub Actions workflow file (`.github/workflows/deploy.yml`):
    - `Job: test` -> checks out code, installs dependencies, runs linter (`npm run lint`), type-checker (`tsc --noEmit`), and Vitest safety suite (`npm run test -- --run`).
    - `Job: deploy` -> depends on `test` passing; builds static bundle with relative base paths for GitHub Pages (`npm run build`) and uploads artifact via `actions/deploy-pages@v4`.
  - *Why*: Strict quality gate prevents broken or miscalculated electrical formulas from reaching production.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   HarnessMap Pro: Pure Client Architecture                  │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 2D Schematic & Wiring Designer       │ 3D Procedural Three.js Workbench     │
│  - Interactive SVG/Canvas Grid       │  - ISO Relay 5-Pin Exploded Assembly │
│  - Snap-to-pin Wire Routing Engine   │  - ATO/MINI/MAXI Blade Fuse Models   │
│  - Real-time Current Flow Animation  │  - Faston Crimp Cross-Section Viewer │
│  - Toggleable Relay Switches & Loads │  - Studio PBR Lighting & ACES Tone   │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ Pure Client-Side Domain & Safety Engines                                     │
│  - AWG Ampacity & Voltage Drop Engine (DIN 72551 & SAE J1128 standards)     │
│  - Terminal & Crimp Die Matcher (Faston 2.8/4.8/6.3mm, Rings M4-M8, SN-48B)  │
│  - BOM Generator & CSV/Print Exporter                                       │
│  - Local Automotive Electrical Advisor & Reference Guide                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Automated Testing & Quality Assurance                                       │
│  - Vitest Unit Test Suite (`src/test/safetyEngine.test.ts`)                  │
│  - In-App Self-Test Diagnostics Panel                                       │
│  - GitHub Actions Workflow (`.github/workflows/deploy.yml`)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Core Data Structures & Calculation Rules**:
  - `AWG_AMPACITY_TABLE`: Mapping AWG 10–26 to cross-section (mm²), resistance (mΩ/m), continuous current rating at 80°C/105°C, and recommended fuse rating.
  - `CRIMP_MATRIX`: Mapping terminal type (Faston 2.8/4.8/6.3mm Open vs Closed, Ring M4–M8) to AWG conductor range, insulation crimp height, and specific tooling (SN-48B, PA-09, LY-03BC).
  - `ISO_RELAY_SPECS`: Standard pin mapping:
    - `30`: Common Power Feed (High-Current)
    - `85`: Coil Ground / Control Trigger (-)
    - `86`: Coil Positive Feed (+)
    - `87`: Normally Open Contact (NO - High Current)
    - `87a`: Normally Closed Contact (NC)
  - `CIRCUIT_SAFETY_RULES`: Enforces maximum 3% voltage drop on critical circuits, wire ampacity $\ge 125\%$ continuous load, and correct Faston blade width for relay socket currents.

- **Testing & CI/CD Pipeline Artifacts**:
  - Vitest configuration (`vite.config.ts` test block).
  - Unit test suite: `src/test/safetyEngine.test.ts` with test cases for:
    - High-current 40A on 22 AWG (must return `CRITICAL` hazard alert).
    - Proper 12 AWG on 40A with 6.3mm Faston (must return `SAFE`).
    - Voltage drop formula $V_{drop} = 2 \times L \times I \times R$.
    - Crimp die matching (Faston 6.3mm Open Barrel $\rightarrow$ SN-48B jaw B/F-crimp).
    - ISO relay pinout integrity.
  - GitHub Actions workflow: `.github/workflows/deploy.yml` with permissions, checkout, setup-node, test gate, and `actions/deploy-pages`.
