# Eliminate `any` Types and Enable Strict TypeScript

## Context

### Original Request

User wants to eliminate all `any` type usage from the Fastlytics codebase (React/TypeScript F1 analytics platform) and enable strict TypeScript settings to prevent future occurrences.

### Interview Summary

**Key Discussions**:

- Found 72 instances of `any` across 23 files
- Current tsconfig is permissive (`noImplicitAny: false`, `strictNullChecks: false`)
- User wants strict mode enabled after fixes
- User wants organized type definitions in `src/types/` directory
- User prefers `unknown` + type guard pattern for error handling
- TDD approach requested with existing Vitest infrastructure

**Research Findings**:

- Recharts exports proper types: `TooltipProps<TValue, TName>`, `LegendProps` from `recharts`
- Existing good type infrastructure in `src/lib/api.ts` with 45+ interfaces to follow as patterns
- Vitest v4.0.18 already installed with 4 existing test files
- Categories of `any` usage identified: Recharts callbacks (31), Dynamic objects (15), Type assertions (8), Function params (6), Error handling (4), Other (6)

### Self-Review Findings

**Identified Gaps** (addressed in plan):

- Need to handle `strictNullChecks` incrementally (many places may have implicit null issues)
- Recharts generic types require knowing the data shape for `TValue` and `TName`
- `SessionReplay.tsx` has the most complex `any` patterns (11 instances) - needs careful refactoring
- Location state typing requires router type augmentation

---

## Work Objectives

### Core Objective

Eliminate all 72 `any` type instances from the codebase and enable strict TypeScript settings (`noImplicitAny: true`, `strictNullChecks: true`) to prevent future regressions.

### Concrete Deliverables

- `src/types/recharts.types.ts` - Custom Recharts type definitions
- `src/types/session.types.ts` - Session replay and driver data types
- `src/types/error.types.ts` - Error handling utilities with proper types
- `src/types/router.types.ts` - React Router location state types
- `src/types/index.ts` - Barrel export for all types
- Updated 23 source files with proper type annotations
- Updated `tsconfig.json` with strict settings
- Type validation tests for critical type definitions

### Definition of Done

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npx tsc --noEmit` passes with strict settings
- [ ] `npm run test` passes all type-related tests
- [ ] Zero instances of `any` in `src/` directory (verified by grep)
- [ ] `noImplicitAny: true` and `strictNullChecks: true` enabled in tsconfig

### Must Have

- All 72 `any` instances replaced with proper types
- `src/types/` directory with organized type files
- Error handling uses `unknown` + type guard pattern
- TDD verification for type utilities
- Strict TypeScript settings enabled

### Must NOT Have (Guardrails)

- DO NOT change component runtime behavior (only type annotations)
- DO NOT add `@ts-ignore` or `@ts-expect-error` as fixes (these hide problems)
- DO NOT use overly generic types like `Record<string, unknown>` when specific types are known
- DO NOT modify third-party library types in node_modules
- DO NOT create circular type dependencies between files
- DO NOT use `as` assertions to silence errors without proper justification

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (Vitest 4.0.18)
- **User wants tests**: TDD
- **Framework**: Vitest

### TDD Approach

Each type-related task follows RED-GREEN-REFACTOR:

1. **RED**: Write type test first (compile-time checks + runtime guards)
2. **GREEN**: Implement types to pass tests
3. **REFACTOR**: Clean up while keeping tests passing

**Verification Commands**:

```bash
# Type checking (fast feedback)
npx tsc --noEmit

# Run all tests
npm run test

# Verify no any remaining
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
# Expected: 0

# Build verification
npm run build
```

---

## Task Flow

```
Task 0 (Infrastructure)
    ↓
Task 1-5 (Type Definitions) ← Can run in parallel
    ↓
Task 6 (Error Handling - depends on types)
    ↓
Task 7-11 (Fix Components) ← Can run in parallel within groups
    ↓
Task 12 (Enable Strict Mode - depends on all fixes)
    ↓
Task 13 (Final Verification)
```

## Parallelization

| Group | Tasks           | Reason                                        |
| ----- | --------------- | --------------------------------------------- |
| A     | 1, 2, 3, 4, 5   | Independent type file creation                |
| B     | 7, 8, 9, 10, 11 | Independent component fixes after types exist |

| Task | Depends On | Reason                                |
| ---- | ---------- | ------------------------------------- |
| 6    | 5          | Error types needed for error utility  |
| 7-11 | 1-5        | Component fixes need type definitions |
| 12   | 6-11       | Strict mode needs all fixes complete  |
| 13   | 12         | Final verification after strict mode  |

---

## TODOs

### Phase 1: Infrastructure & Type Foundations

- [ ] 0. Create types directory structure

  **What to do**:
  - Create `src/types/` directory
  - Create empty barrel file `src/types/index.ts`
  - Verify directory structure

  **Must NOT do**:
  - Create types yet (just structure)

  **Parallelizable**: NO (must be first)

  **References**:
  - `src/lib/api.ts:21-330` - Existing type patterns to follow (interface naming, exports)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Command: `ls -la src/types/`
  - [ ] Expected: Directory exists with `index.ts`
  - [ ] Command: `cat src/types/index.ts`
  - [ ] Expected: Empty or comment-only file

  **Commit**: NO (groups with 1-5)

---

- [ ] 1. Create Recharts type definitions with TDD

  **What to do**:
  - Write test file `src/types/__tests__/recharts.types.test.ts`
  - Test that custom tooltip/legend types are compatible with Recharts props
  - Create `src/types/recharts.types.ts` with:
    - `CustomTooltipProps<TData>` - generic tooltip props
    - `CustomLegendProps` - legend component props
    - `ChartPayloadEntry<TData>` - payload item type
    - `RechartsEventHandler` - onClick/onMouseEnter types

  **Must NOT do**:
  - Don't duplicate Recharts internal types
  - Don't create types that conflict with Recharts exports

  **Parallelizable**: YES (with 2, 3, 4, 5)

  **References**:
  - Pattern: `node_modules/recharts/types/component/Tooltip.d.ts` - Official TooltipProps
  - Pattern: `node_modules/recharts/types/component/Legend.d.ts` - Official LegendProps
  - Usage: `src/pages/TeamPaceAnalysis.tsx:212-248` - Current CustomTooltip/CustomLegend patterns
  - Usage: `src/components/RacingChart.tsx:247-286` - Tooltip with sorting, Legend onClick
  - Usage: `src/components/PositionChart.tsx:140-210` - Complex tooltip with driver data

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] Test file created: `src/types/__tests__/recharts.types.test.ts`
  - [ ] RED: `npx vitest run src/types/__tests__/recharts.types.test.ts` → FAIL (types don't exist)
  - [ ] GREEN: Create types → `npx vitest run src/types/__tests__/recharts.types.test.ts` → PASS
  - [ ] `npx tsc --noEmit` → No errors in recharts.types.ts

  **Commit**: YES
  - Message: `feat(types): add Recharts custom component type definitions`
  - Files: `src/types/recharts.types.ts`, `src/types/__tests__/recharts.types.test.ts`
  - Pre-commit: `npx vitest run src/types/ && npx tsc --noEmit`

---

- [ ] 2. Create Session Replay type definitions with TDD

  **What to do**:
  - Write test file `src/types/__tests__/session.types.test.ts`
  - Create `src/types/session.types.ts` with:
    - `DriverTelemetryArrays` - x, y, dist, speed, gear, etc. arrays
    - `DriversMap` - Record of driver code to telemetry
    - `ChunkManifest` - manifest array structure
    - `SessionMetadataExtended` - metadata with chunk_manifest

  **Must NOT do**:
  - Don't duplicate types already in `src/lib/api.ts`
  - Don't create breaking changes to existing SessionReplayData

  **Parallelizable**: YES (with 1, 3, 4, 5)

  **References**:
  - Existing: `src/lib/api.ts:1358-1385` - `ReplayDriverData`, `SessionReplayData` interfaces
  - Usage: `src/components/replay/SessionReplay.tsx:128-155` - initDrivers pattern, metadata casting
  - Usage: `src/components/replay/SessionReplay.tsx:172-207` - chunk merging logic

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] Test file created: `src/types/__tests__/session.types.test.ts`
  - [ ] RED: Test fails (types don't exist)
  - [ ] GREEN: Create types → Test passes
  - [ ] Types are compatible with existing `SessionReplayData` from api.ts

  **Commit**: YES
  - Message: `feat(types): add Session Replay extended type definitions`
  - Files: `src/types/session.types.ts`, `src/types/__tests__/session.types.test.ts`
  - Pre-commit: `npx vitest run src/types/ && npx tsc --noEmit`

---

- [ ] 3. Create chart data point types

  **What to do**:
  - Create `src/types/chart.types.ts` with:
    - `EvolutionDataPoint` - { name: string, [teamName: string]: number }
    - `PaceGapDataPoint` - extends TeamPaceSession with gapToLeader
    - `SparklineData` - for MobileHeadToHead sparkline generation

  **Must NOT do**:
  - Don't duplicate types from api.ts

  **Parallelizable**: YES (with 1, 2, 4, 5)

  **References**:
  - Usage: `src/pages/TeamPaceAnalysis.tsx:142-153` - Evolution data construction
  - Usage: `src/components/mobile/MobileHeadToHead.tsx:189-190` - Sparkline data type
  - Existing: `src/lib/api.ts:299-316` - TeamPaceSession, TeamPaceEvent

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] Types compile without error
  - [ ] `npx tsc --noEmit` passes

  **Commit**: YES
  - Message: `feat(types): add chart data point type definitions`
  - Files: `src/types/chart.types.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 4. Create Router location state types

  **What to do**:
  - Create `src/types/router.types.ts` with:
    - `LocationState` - { from?: string } for redirect tracking
    - Type-safe location.state access pattern

  **Must NOT do**:
  - Don't augment global react-router types (causes conflicts)

  **Parallelizable**: YES (with 1, 2, 3, 5)

  **References**:
  - Usage: `src/pages/Pricing.tsx:38` - `(location.state as any)?.from`
  - Usage: `src/components/mobile/MobilePricing.tsx:35` - Same pattern

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] Types compile without error
  - [ ] `npx tsc --noEmit` passes

  **Commit**: YES
  - Message: `feat(types): add Router location state types`
  - Files: `src/types/router.types.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 5. Create error handling types

  **What to do**:
  - Create `src/types/error.types.ts` with:
    - `ErrorWithMessage` - type guard interface
    - `isErrorWithMessage(error: unknown): error is ErrorWithMessage` - type guard
    - `getErrorMessage(error: unknown): string` - safe error message extraction

  **Must NOT do**:
  - Don't create overly complex error hierarchies

  **Parallelizable**: YES (with 1, 2, 3, 4)

  **References**:
  - Usage: `src/pages/Auth.tsx:47-48` - `catch (error: any) { toast.error(error.message) }`
  - Usage: `src/components/mobile/MobileAuth.tsx:49-50` - Same pattern
  - Best practice: TypeScript handbook on unknown type

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] Test file: `src/types/__tests__/error.types.test.ts`
  - [ ] Test: `isErrorWithMessage` returns true for Error objects
  - [ ] Test: `isErrorWithMessage` returns false for non-Error objects
  - [ ] Test: `getErrorMessage` extracts message from Error
  - [ ] Test: `getErrorMessage` returns fallback for non-Error
  - [ ] `npx vitest run src/types/__tests__/error.types.test.ts` → PASS

  **Commit**: YES
  - Message: `feat(types): add error handling utilities with type guards`
  - Files: `src/types/error.types.ts`, `src/types/__tests__/error.types.test.ts`
  - Pre-commit: `npx vitest run src/types/ && npx tsc --noEmit`

---

- [ ] 6. Update types barrel file

  **What to do**:
  - Update `src/types/index.ts` to export all types from:
    - recharts.types.ts
    - session.types.ts
    - chart.types.ts
    - router.types.ts
    - error.types.ts

  **Must NOT do**:
  - Don't re-export types from api.ts (keep those separate)

  **Parallelizable**: NO (depends on 1-5)

  **References**:
  - Pattern: Standard barrel file pattern

  **Acceptance Criteria**:

  **Manual Verification:**
  - [ ] Command: `cat src/types/index.ts`
  - [ ] Expected: All exports present
  - [ ] `npx tsc --noEmit` passes

  **Commit**: YES
  - Message: `feat(types): add barrel export for all type definitions`
  - Files: `src/types/index.ts`
  - Pre-commit: `npx tsc --noEmit`

---

### Phase 2: Fix Components by Category

- [ ] 7. Fix Recharts `any` types in chart components (31 instances)

  **What to do**:
  - Update CustomTooltip components to use `CustomTooltipProps<T>`
  - Update CustomLegend components to use `CustomLegendProps`
  - Update onClick/onMouseEnter handlers with proper event types
  - Files to update:
    - `src/pages/TeamPaceAnalysis.tsx` (8 instances)
    - `src/pages/ChampionshipProgression.tsx` (6 instances)
    - `src/components/RacingChart.tsx` (6 instances)
    - `src/components/PositionChart.tsx` (5 instances)
    - `src/components/PaceAnalysisChart.tsx` (2 instances)
    - `src/components/ThrottleChart.tsx` (1 instance)
    - `src/components/BrakeChart.tsx` (1 instance)
    - `src/components/RPMChart.tsx` (1 instance)
    - `src/components/DRSChart.tsx` (1 instance - not in grep but similar pattern expected)
    - `src/components/SpeedTraceChart.tsx` (1 instance)

  **Must NOT do**:
  - Don't change chart rendering logic
  - Don't use `as any` to silence new errors

  **Parallelizable**: YES (with 8, 9, 10, 11)

  **References**:
  - Types: `src/types/recharts.types.ts` - CustomTooltipProps, CustomLegendProps
  - Pattern: `src/pages/TeamPaceAnalysis.tsx:212-248` - Current tooltip/legend implementations
  - Pattern: `src/components/RacingChart.tsx:285-286` - Legend event handlers

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes for all updated files
  - [ ] `npm run build` succeeds
  - [ ] Grep verification: `grep -r ": any" src/pages/TeamPaceAnalysis.tsx` → 0 matches
  - [ ] Grep verification: `grep -r ": any" src/components/RacingChart.tsx` → 0 matches

  **Manual Verification (browser):**
  - [ ] Open http://localhost:5173/team-pace (or appropriate route)
  - [ ] Hover over chart → Tooltip displays correctly
  - [ ] Click legend items → Interaction works

  **Commit**: YES
  - Message: `fix(types): replace any with proper Recharts types in chart components`
  - Files: All 10 chart component files
  - Pre-commit: `npx tsc --noEmit && npm run build`

---

- [ ] 8. Fix mobile component `any` types (11 instances)

  **What to do**:
  - Update mobile chart components with proper types
  - Files to update:
    - `src/components/mobile/MobileTelemetry.tsx` (6 instances)
    - `src/components/mobile/MobileHeadToHead.tsx` (3 instances)
    - `src/components/mobile/MobileLapTimes.tsx` (3 instances)

  **Must NOT do**:
  - Don't change mobile-specific rendering logic
  - Don't break touch event handling

  **Parallelizable**: YES (with 7, 9, 10, 11)

  **References**:
  - Types: `src/types/recharts.types.ts`, `src/types/chart.types.ts`
  - Usage: `src/components/mobile/MobileTelemetry.tsx:462-521` - Chart event handlers
  - Usage: `src/components/mobile/MobileHeadToHead.tsx:189-190` - Sparkline generation

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes
  - [ ] Grep: `grep -r ": any" src/components/mobile/MobileTelemetry.tsx` → 0 matches

  **Commit**: YES
  - Message: `fix(types): replace any with proper types in mobile components`
  - Files: 3 mobile component files
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 9. Fix Session Replay `any` types (11 instances)

  **What to do**:
  - Update `src/components/replay/SessionReplay.tsx` with proper types:
    - `initDrivers` → `Record<string, DriverTelemetryArrays>`
    - `metadata as any` → proper SessionMetadataExtended type
    - `dData as any` → DriverTelemetryArrays
    - `driver as any` → typed driver object
    - Sorting functions with proper comparators

  **Must NOT do**:
  - Don't break chunk loading logic
  - Don't change driver data structure

  **Parallelizable**: YES (with 7, 8, 10, 11)

  **References**:
  - Types: `src/types/session.types.ts` - DriverTelemetryArrays, SessionMetadataExtended
  - Existing: `src/lib/api.ts:1358-1385` - Base types to extend
  - Usage: `src/components/replay/SessionReplay.tsx:128-210` - Data initialization and merging

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes
  - [ ] Grep: `grep -r ": any" src/components/replay/SessionReplay.tsx` → 0 matches

  **Manual Verification:**
  - [ ] Navigate to session replay page
  - [ ] Verify replay loads and plays correctly
  - [ ] Verify driver data displays properly

  **Commit**: YES
  - Message: `fix(types): replace any with proper types in SessionReplay component`
  - Files: `src/components/replay/SessionReplay.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 10. Fix error handling and auth `any` types (4 instances)

  **What to do**:
  - Update catch blocks in auth files:
    - `src/pages/Auth.tsx` (2 instances)
    - `src/components/mobile/MobileAuth.tsx` (2 instances)
  - Use `getErrorMessage()` utility from error.types.ts

  **Must NOT do**:
  - Don't change auth flow logic
  - Don't suppress errors silently

  **Parallelizable**: YES (with 7, 8, 9, 11)

  **References**:
  - Types: `src/types/error.types.ts` - getErrorMessage utility
  - Usage: `src/pages/Auth.tsx:47-48, 68-69` - catch blocks
  - Usage: `src/components/mobile/MobileAuth.tsx:49-50, 70-71` - catch blocks

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes
  - [ ] Grep: `grep -r "error: any" src/pages/Auth.tsx` → 0 matches

  **Manual Verification:**
  - [ ] Try invalid login → Error message displays
  - [ ] Try invalid signup → Error message displays

  **Commit**: YES
  - Message: `fix(types): use typed error handling in auth components`
  - Files: `src/pages/Auth.tsx`, `src/components/mobile/MobileAuth.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 11. Fix remaining `any` types (15 instances)

  **What to do**:
  - Fix type assertions in Race.tsx (5 instances):
    - Icon prop typing with LucideIcon type
    - F1Card team prop with proper union type
  - Fix DriverComparisonTelemetry.tsx (5 instances):
    - Dynamic key access with proper indexing
  - Fix location state in Pricing pages (2 instances):
    - Use LocationState type
  - Fix CircuitComparisonChart.tsx (1 instance):
    - Section hover handler typing
  - Fix AuthContext.tsx (1 instance):
    - userMeta parameter typing
  - Fix DriverComparison.tsx (1 instance):
    - data prop typing

  **Must NOT do**:
  - Don't change rendering logic
  - Don't use overly permissive types

  **Parallelizable**: YES (with 7, 8, 9, 10)

  **References**:
  - Types: `src/types/router.types.ts` - LocationState
  - Usage: `src/pages/Race.tsx:240-249` - Icon component typing
  - Usage: `src/components/DriverComparisonTelemetry.tsx:170-189` - Dynamic key access
  - Usage: `src/pages/Pricing.tsx:38` - Location state

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes
  - [ ] Full grep: `grep -r ": any\|as any" src/ --include="*.ts" --include="*.tsx" | wc -l` → 0

  **Commit**: YES
  - Message: `fix(types): replace remaining any types across codebase`
  - Files: Race.tsx, DriverComparisonTelemetry.tsx, Pricing.tsx, MobilePricing.tsx, CircuitComparisonChart.tsx, AuthContext.tsx, DriverComparison.tsx
  - Pre-commit: `npx tsc --noEmit`

---

### Phase 3: Enable Strict Mode

- [ ] 12. Update tsconfig.json for strict mode

  **What to do**:
  - Update `tsconfig.json`:
    - Set `noImplicitAny: true`
    - Set `strictNullChecks: true`
  - Fix any new errors that arise from strict settings

  **Must NOT do**:
  - Don't add `@ts-ignore` to silence errors
  - Don't revert to `any` usage

  **Parallelizable**: NO (depends on all previous fixes)

  **References**:
  - Current: `tsconfig.json` - Current permissive settings
  - TypeScript docs: Strict mode options

  **Acceptance Criteria**:

  **TDD Verification:**
  - [ ] `npx tsc --noEmit` passes with strict settings
  - [ ] `npm run build` succeeds
  - [ ] Cat tsconfig.json shows strict settings enabled

  **Commit**: YES
  - Message: `chore(config): enable strict TypeScript settings`
  - Files: `tsconfig.json`, `tsconfig.app.json` (if needed)
  - Pre-commit: `npx tsc --noEmit && npm run build`

---

### Phase 4: Final Verification

- [ ] 13. Final verification and cleanup

  **What to do**:
  - Run full test suite
  - Run build
  - Verify zero `any` remaining
  - Run linter

  **Must NOT do**:
  - Don't skip any verification step

  **Parallelizable**: NO (final step)

  **References**:
  - All previous work

  **Acceptance Criteria**:

  **Manual Verification:**
  - [ ] `npm run test` → All tests pass
  - [ ] `npm run build` → Build succeeds
  - [ ] `npm run lint` → No type-related lint errors
  - [ ] `grep -r ": any\|as any\|<any>" src/ --include="*.ts" --include="*.tsx" | grep -v "eslint-disable" | wc -l` → 0
  - [ ] Application starts: `npm run dev` → Opens at localhost:5173
  - [ ] Basic smoke test: Navigate to dashboard, charts render

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message                                                                  | Files                   | Verification |
| ---------- | ------------------------------------------------------------------------ | ----------------------- | ------------ |
| 1          | `feat(types): add Recharts custom component type definitions`            | recharts.types.ts, test | vitest, tsc  |
| 2          | `feat(types): add Session Replay extended type definitions`              | session.types.ts, test  | vitest, tsc  |
| 3          | `feat(types): add chart data point type definitions`                     | chart.types.ts          | tsc          |
| 4          | `feat(types): add Router location state types`                           | router.types.ts         | tsc          |
| 5          | `feat(types): add error handling utilities with type guards`             | error.types.ts, test    | vitest, tsc  |
| 6          | `feat(types): add barrel export for all type definitions`                | index.ts                | tsc          |
| 7          | `fix(types): replace any with proper Recharts types in chart components` | 10 chart files          | tsc, build   |
| 8          | `fix(types): replace any with proper types in mobile components`         | 3 mobile files          | tsc          |
| 9          | `fix(types): replace any with proper types in SessionReplay component`   | SessionReplay.tsx       | tsc          |
| 10         | `fix(types): use typed error handling in auth components`                | Auth files              | tsc          |
| 11         | `fix(types): replace remaining any types across codebase`                | 7 files                 | tsc          |
| 12         | `chore(config): enable strict TypeScript settings`                       | tsconfig.json           | tsc, build   |

---

## Success Criteria

### Verification Commands

```bash
# Zero any types remaining
grep -r ": any\|as any\|<any>" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
# Expected: 0

# TypeScript strict check
npx tsc --noEmit
# Expected: No errors

# Build passes
npm run build
# Expected: Build successful

# Tests pass
npm run test
# Expected: All tests pass

# Lint passes
npm run lint
# Expected: No errors
```

### Final Checklist

- [ ] All 72 "Must Have" `any` instances replaced
- [ ] All "Must NOT Have" guardrails respected (no @ts-ignore, no overly generic types)
- [ ] `src/types/` directory exists with 5 type files + index
- [ ] tsconfig.json has `noImplicitAny: true` and `strictNullChecks: true`
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Application runs correctly
