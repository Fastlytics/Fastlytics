# Fastlytics

> Democratising F1 telemetry data for everyone.

This README provides a comprehensive overview of the codebase, including the project structure, technology stack, API endpoints, database schema, frontend routes, and configuration.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Technology Stack](#technology-stack)
4. [Frontend Architecture](#frontend-architecture)
   - [Routing](#routing)
   - [State Management](#state-management)
   - [API Client](#api-client)
   - [Components](#components)
   - [Pages](#pages)
   - [Contexts](#contexts)
   - [Hooks](#hooks)
   - [Types](#types)
   - [Utilities](#utilities)
5. [API Endpoints](#api-endpoints)
   - [Sessions API](#sessions-api)
   - [Telemetry API](#telemetry-api)
   - [Standings API](#standings-api)
   - [Results API](#results-api)
   - [Schedule API](#schedule-api)
   - [Team Pace API](#team-pace-api)
   - [Replay API](#replay-api)
   - [Comparison API](#comparison-api)
   - [Other Endpoints](#other-endpoints)
6. [Database Schema](#database-schema)
   - [Profiles Table](#profiles-table)
   - [Migrations](#migrations)
7. [Backend Architecture](#backend-architecture)
   - [Cloudflare Worker Proxy](#cloudflare-worker-proxy)
8. [Configuration](#configuration)
   - [Environment Variables](#environment-variables)
   - [Vite Configuration](#vite-configuration)
   - [TypeScript Configuration](#typescript-configuration)
9. [Testing](#testing)
10. [Build and Deployment](#build-and-deployment)

---

## Project Overview

Fastlytics is a Formula 1 analytics platform that provides granular telemetry analysis, real-time race data, and historical performance comparisons. The codebase consists of a React-based frontend, a Cloudflare Worker API proxy, and integration with external F1 data APIs (OpenF1) and a Supabase backend for user authentication and data storage.

---

## Directory Structure

```
Fastlytics/
├── .github/              # GitHub workflows and configurations
├── .husky/               # Git hooks for pre-commit linting
├── .vscode/              # VS Code workspace settings
├── public/               # Static assets (images, icons)
│   ├── cars/             # F1 car images by year
│   └── drivers/         # Driver headshots by year
├── src/                  # Main application source code
│   ├── __tests__/        # Test files
│   ├── app/              # App-specific styles
│   ├── components/      # React components
│   │   ├── activity/    # Activity-related components
│   │   ├── calendar/    # Calendar components
│   │   ├── common/      # Shared/common components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── landing/     # Landing page components
│   │   ├── mobile/      # Mobile-specific components
│   │   ├── replay/      # Session replay components
│   │   └── ui/          # UI component library (shadcn/ui)
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Core libraries
│   │   ├── api.ts       # API client and endpoints
│   │   ├── supabase.ts  # Supabase client
│   │   └── utils.ts     # Utility functions
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── supabase/            # Supabase migrations
│   └── migrations/      # Database migrations
├── workers/             # Cloudflare Worker for API proxy
│   └── src/             # Worker source code
└── package.json         # Root package configuration
```

---

## Technology Stack

### Frontend

- **Framework**: [React](https://react.dev/) 18.x with [TypeScript](https://www.typescriptlang.org/) 5.x
- **Build Tool**: [Vite](https://vitejs.dev/) 7.x
- **Routing**: [React Router DOM](https://reactrouter.com/) 7.x
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x with [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query) 5.x
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives, [Tremor](https://www.tremor.so/) 3.x
- **Charts**: [Recharts](https://recharts.org/) 2.x
- **Forms**: [React Hook Form](https://react-hook-form.com/) 7.x with [Zod](https://zod.dev/) validation
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Testing**: [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/)

### Backend/Infrastructure

- **API Proxy**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **External APIs**: [OpenF1](https://openf1.org/) for F1 telemetry data

---

## Frontend Architecture

### Routing

The application uses React Router DOM for navigation. Routes are defined in [`src/App.tsx`](src/App.tsx:77) and include:

| Path                            | Component                                                          | Layout          | Protection |
| ------------------------------- | ------------------------------------------------------------------ | --------------- | ---------- |
| `/`                             | [`Landing`](src/pages/Landing.tsx)                                 | LandingLayout   | Public     |
| `/about`                        | [`AboutUs`](src/pages/AboutUs.tsx)                                 | MainLayout      | Public     |
| `/privacy-policy`               | [`PrivacyPolicy`](src/pages/PrivacyPolicy.tsx)                     | MainLayout      | Public     |
| `/terms-of-service`             | [`TermsOfService`](src/pages/TermsOfService.tsx)                   | MainLayout      | Public     |
| `/faq`                          | [`FAQ`](src/pages/FAQ.tsx)                                         | MainLayout      | Public     |
| `/refund-policy`                | [`RefundPolicy`](src/pages/RefundPolicy.tsx)                       | MainLayout      | Public     |
| `/contact`                      | [`Contact`](src/pages/Contact.tsx)                                 | MainLayout      | Public     |
| `/auth`                         | [`Auth`](src/pages/Auth.tsx)                                       | -               | Public     |
| `/dashboard`                    | [`Dashboard`](src/pages/Dashboard.tsx)                             | DashboardLayout | Public     |
| `/race/:raceId`                 | [`Race`](src/pages/Race.tsx)                                       | DashboardLayout | Public     |
| `/calendar`                     | [`Calendar`](src/pages/Calendar.tsx)                               | DashboardLayout | Public     |
| `/standings/teams`              | [`TeamStandings`](src/pages/TeamStandings.tsx)                     | DashboardLayout | Public     |
| `/standings/drivers`            | [`DriverStandings`](src/pages/DriverStandings.tsx)                 | DashboardLayout | Public     |
| `/standings/progression`        | [`ChampionshipProgression`](src/pages/ChampionshipProgression.tsx) | DashboardLayout | Gated      |
| `/team-pace`                    | [`TeamPaceAnalysis`](src/pages/TeamPaceAnalysis.tsx)               | DashboardLayout | Gated      |
| `/onboarding`                   | [`Onboarding`](src/pages/Onboarding.tsx)                           | -               | Protected  |
| `/account`                      | [`Account`](src/pages/Account.tsx)                                 | DashboardLayout | Protected  |
| `/replay/:year/:event/:session` | [`SessionReplayPage`](src/pages/SessionReplayPage.tsx)             | DashboardLayout | Gated      |

**Route Protection Types:**

- **Public**: Accessible to all users
- **Gated**: Shows login prompt for unauthenticated users, but allows access to basic features
- **Protected**: Requires authentication to access

### State Management

The application uses multiple state management approaches:

1. **TanStack Query**: For server state (API data fetching, caching, synchronization)
   - Configured in [`src/App.tsx`](src/App.tsx:36) with a `QueryClient` provider

2. **React Context**:
   - [`AuthContext`](src/contexts/AuthContext.tsx): Manages user authentication state
   - [`SeasonContext`](src/contexts/SeasonContext.tsx): Manages selected F1 season/year

3. **Local Component State**: Using `useState` and `useReducer` for UI-specific state

### API Client

The API client is implemented in [`src/lib/api.ts`](src/lib/api.ts) and uses a `request` helper from [`src/lib/api-client.ts`](src/lib/api-client.ts). All API calls go through the backend API proxy (Cloudflare Worker).

Key features:

- Base URL configuration via environment variable
- Automatic API key injection
- Type-safe responses using TypeScript generics

### Components

The codebase contains numerous React components organized by functionality:

#### UI Components (shadcn/ui)

Located in [`src/components/ui/`](src/components/ui/), these include:

- [`button.tsx`](src/components/ui/button.tsx)
- [`card.tsx`](src/components/ui/card.tsx)
- [`chart.tsx`](src/components/ui/chart.tsx)
- [`dialog.tsx`](src/components/ui/dialog.tsx)
- [`dropdown-menu.tsx`](src/components/ui/dropdown-menu.tsx)
- [`select.tsx`](src/components/ui/select.tsx)
- [`table.tsx`](src/components/ui/table.tsx)
- [`tabs.tsx`](src/components/ui/tabs.tsx)
- [`toast.tsx`](src/components/ui/toast.tsx)
- And many more...

#### Chart Components

Located in [`src/components/`](src/components/), these include:

- [`BrakeChart.tsx`](src/components/BrakeChart.tsx) - Brake pressure telemetry visualization
- [`DRSChart.tsx`](src/components/DRSChart.tsx) - DRS zone visualization
- [`GapToLeaderChart.tsx`](src/components/GapToLeaderChart.tsx) - Gap to leader over time
- [`GearMapChart.tsx`](src/components/GearMapChart.tsx) - Gear usage visualization
- [`PaceAnalysisChart.tsx`](src/components/PaceAnalysisChart.tsx) - Pace distribution
- [`PositionChart.tsx`](src/components/PositionChart.tsx) - Position changes over laps
- [`RPMChart.tsx`](src/components/RPMChart.tsx) - RPM telemetry
- [`SpeedTraceChart.tsx`](src/components/SpeedTraceChart.tsx) - Speed trace visualization
- [`ThrottleChart.tsx`](src/components/ThrottleChart.tsx) - Throttle application
- [`TireStrategy.tsx`](src/components/TireStrategy.tsx) - Tire compound visualization
- [`TrackEvolutionChart.tsx`](src/components/TrackEvolutionChart.tsx) - Lap time evolution
- [`CircuitComparisonChart.tsx`](src/components/CircuitComparisonChart.tsx) - Driver comparison
- [`RacingChart.tsx`](src/components/RacingChart.tsx) - Main racing telemetry chart

#### Mobile Components

Located in [`src/components/mobile/`](src/components/mobile/):

- [`MobileLanding.tsx`](src/components/mobile/MobileLanding.tsx)
- [`MobileCalendar.tsx`](src/components/mobile/MobileCalendar.tsx)
- [`MobileRace.tsx`](src/components/mobile/MobileRace.tsx)
- [`MobileTelemetry.tsx`](src/components/mobile/MobileTelemetry.tsx)
- [`MobileDriverStandings.tsx`](src/components/mobile/MobileDriverStandings.tsx)
- [`MobileTeamStandings.tsx`](src/components/mobile/MobileTeamStandings.tsx)
- [`MobileHeadToHead.tsx`](src/components/mobile/MobileHeadToHead.tsx)
- [`MobileAuth.tsx`](src/components/mobile/MobileAuth.tsx)
- [`MobileAccount.tsx`](src/components/mobile/MobileAccount.tsx)

#### Replay Components

Located in [`src/components/replay/`](src/components/replay/):

- [`SessionReplay.tsx`](src/components/replay/SessionReplay.tsx) - Full session replay visualization
- [`ReplayLoader.tsx`](src/components/replay/ReplayLoader.tsx) - Replay data loader

### Pages

Located in [`src/pages/`](src/pages/):

- [`Dashboard.tsx`](src/pages/Dashboard.tsx) - Main dashboard with widgets
- [`Race.tsx`](src/pages/Race.tsx) - Race analysis page (most complex, ~87KB)
- [`Calendar.tsx`](src/pages/Calendar.tsx) - Race calendar
- [`DriverStandings.tsx`](src/pages/DriverStandings.tsx) - Driver championship standings
- [`TeamStandings.tsx`](src/pages/TeamStandings.tsx) - Constructor championship standings
- [`ChampionshipProgression.tsx`](src/pages/ChampionshipProgression.tsx) - Season progression charts
- [`TeamPaceAnalysis.tsx`](src/pages/TeamPaceAnalysis.tsx) - Team pace analysis
- [`Auth.tsx`](src/pages/Auth.tsx) - Authentication page
- [`Onboarding.tsx`](src/pages/Onboarding.tsx) - User onboarding flow
- [`Account.tsx`](src/pages/Account.tsx) - User account management
- [`SessionReplayPage.tsx`](src/pages/SessionReplayPage.tsx) - Session replay viewer

### Contexts

Located in [`src/contexts/`](src/contexts/):

- [`AuthContext.tsx`](src/contexts/AuthContext.tsx): Provides authentication state and methods (login, logout, signup) using Supabase Auth
- [`SeasonContext.tsx`](src/contexts/SeasonContext.tsx): Manages the selected F1 season/year for data filtering

### Hooks

Located in [`src/hooks/`](src/hooks/):

- [`use-mobile.tsx`](src/hooks/use-mobile.tsx): Detects if the user is on a mobile device
- [`use-toast.ts`](src/hooks/use-toast.ts): Toast notification hook
- [`useAnalytics.ts`](src/hooks/useAnalytics.ts): Analytics tracking hook
- [`useChartVisibility.ts`](src/hooks/useChartVisibility.ts): Manages chart visibility states

### Types

Located in [`src/types/`](src/types/):

- [`index.ts`](src/types/index.ts) - Main type exports
- [`chart.types.ts`](src/types/chart.types.ts) - Chart-related types
- [`error.types.ts`](src/types/error.types.ts) - Error handling types

### Utilities

Located in [`src/lib/`](src/lib/):

- [`api.ts`](src/lib/api.ts) - API client and all endpoint functions
- [`api-client.ts`](src/lib/api-client.ts) - HTTP request helper
- [`supabase.ts`](src/lib/supabase.ts) - Supabase client initialization
- [`utils.ts`](src/lib/utils.ts) - General utility functions
- [`driverColor.ts`](src/lib/driverColor.ts) - Driver color mapping
- [`teamUtils.ts`](src/lib/teamUtils.ts) - Team-related utilities
- [`seasonUtils.ts`](src/lib/seasonUtils.ts) - Season utilities
- [`session.ts`](src/lib/session.ts) - Session utilities
- [`championship.ts`](src/lib/championship.ts) - Championship calculations
- [`openf1.ts`](src/lib/openf1.ts) - OpenF1 API helpers
- [`logger.ts`](src/lib/logger.ts) - Logging utility
- [`consent.ts`](src/lib/consent.ts) - Cookie consent management

---

## API Endpoints

All API endpoints are defined in [`src/lib/api.ts`](src/lib/api.ts) and communicate with the backend API via the Cloudflare Worker proxy. The base URL is configured via `VITE_API_BASE_URL` (defaults to `https://api.fastlytics.app`).

### Sessions API

| Function                                            | Endpoint                                                                           | Description                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| [`fetchAvailableSessions()`](src/lib/api.ts:335)    | `GET /api/sessions?year={year}&event={event}`                                      | Fetches available sessions for a given event |
| [`fetchSessionDrivers()`](src/lib/api.ts:345)       | `GET /api/session/drivers?year={year}&event={event}&session={session}`             | Fetches drivers participating in a session   |
| [`fetchDriverLapNumbers()`](src/lib/api.ts:696)     | `GET /api/laps/driver?year={year}&event={event}&session={session}&driver={driver}` | Fetches available lap numbers for a driver   |
| [`fetchEventSessionSchedule()`](src/lib/api.ts:688) | `GET /api/schedule/{year}/{event}/sessions`                                        | Fetches session schedule for an event        |

### Telemetry API

| Function                                         | Endpoint                                                                                             | Description                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------- |
| [`fetchTelemetrySpeed()`](src/lib/api.ts:370)    | `GET /api/telemetry/speed?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`     | Speed telemetry data         |
| [`fetchTelemetryGear()`](src/lib/api.ts:388)     | `GET /api/telemetry/gear?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`      | Gear shift data              |
| [`fetchGearShiftMap()`](src/lib/api.ts:406)      | `GET /api/telemetry/gear-map?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`  | Gear shift map (SVG paths)   |
| [`fetchTelemetryThrottle()`](src/lib/api.ts:424) | `GET /api/telemetry/throttle?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`  | Throttle application data    |
| [`fetchTelemetryBrake()`](src/lib/api.ts:442)    | `GET /api/telemetry/brake?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`     | Brake pressure data          |
| [`fetchTelemetryRPM()`](src/lib/api.ts:478)      | `GET /api/telemetry/rpm?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`       | RPM data                     |
| [`fetchTelemetryDRS()`](src/lib/api.ts:460)      | `GET /api/telemetry/drs?year={year}&event={event}&session={session}&driver={driver}&lap={lap}`       | DRS zone data                |
| [`fetchPaceDistribution()`](src/lib/api.ts:829)  | `GET /api/telemetry/pace-distribution?year={year}&event={event}&session={session}&drivers={drivers}` | Pace distribution statistics |

### Lap Data API

| Function                                    | Endpoint                                                                          | Description                              |
| ------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| [`fetchLapTimes()`](src/lib/api.ts:355)     | `GET /api/laptimes?year={year}&event={event}&session={session}&drivers={drivers}` | Lap time comparison for multiple drivers |
| [`fetchLapPositions()`](src/lib/api.ts:656) | `GET /api/lapdata/positions?year={year}&event={event}&session={session}`          | Lap-by-lap position data                 |

### Standings API

| Function                                               | Endpoint                                     | Description                     |
| ------------------------------------------------------ | -------------------------------------------- | ------------------------------- |
| [`fetchDriverStandings()`](src/lib/api.ts:506)         | `GET /api/standings/drivers?year={year}`     | Current driver standings        |
| [`fetchTeamStandings()`](src/lib/api.ts:510)           | `GET /api/standings/teams?year={year}`       | Current constructor standings   |
| [`fetchChampionshipProgression()`](src/lib/api.ts:540) | `GET /api/standings/progression?year={year}` | Championship points progression |

### Results API

| Function                                           | Endpoint                                                     | Description               |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| [`fetchRaceResults()`](src/lib/api.ts:516)         | `GET /api/results/races?year={year}`                         | Race winners for a season |
| [`fetchSpecificRaceResults()`](src/lib/api.ts:520) | `GET /api/results/race/{year}/{eventSlug}?session={session}` | Detailed race results     |

### Schedule API

| Function                                | Endpoint                   | Description          |
| --------------------------------------- | -------------------------- | -------------------- |
| [`fetchSchedule()`](src/lib/api.ts:548) | `GET /api/schedule/{year}` | Full season schedule |

### Strategy & Analysis API

| Function                                        | Endpoint                                                               | Description                         |
| ----------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| [`fetchTireStrategy()`](src/lib/api.ts:496)     | `GET /api/strategy?year={year}&event={event}&session={session}`        | Tire strategy for all drivers       |
| [`fetchStintAnalysis()`](src/lib/api.ts:792)    | `GET /api/stint-analysis?year={year}&event={event}&session={session}`  | Detailed stint analysis             |
| [`fetchTrackEvolution()`](src/lib/api.ts:532)   | `GET /api/track-evolution?year={year}&event={event}&session={session}` | Track evolution and lap time trends |
| [`fetchSessionIncidents()`](src/lib/api.ts:802) | `GET /api/incidents?year={year}&event={event}&session={session}`       | SC/VSC and Red Flag periods         |

### Team Pace API

| Function                                       | Endpoint                                                      | Description                     |
| ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| [`fetchTeamPaceSummary()`](src/lib/api.ts:641) | `GET /api/team-pace/summary?year={year}`                      | Team pace summary for season    |
| [`fetchTeamPaceEvent()`](src/lib/api.ts:647)   | `GET /api/team-pace/event?year={year}&event_slug={eventSlug}` | Detailed team pace for an event |

### Comparison API

| Function                                        | Endpoint                                                                                                                              | Description                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`fetchSectorComparison()`](src/lib/api.ts:712) | `GET /api/comparison/sectors?year={year}&event={event}&session={session}&driver1={driver1}&driver2={driver2}&lap1={lap1}&lap2={lap2}` | Sector-by-sector driver comparison |

### Replay API

| Function                                             | Endpoint                                                                               | Description              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------ |
| [`fetchSessionReplay()`](src/lib/api.ts:892)         | `GET /api/replay/session?year={year}&event={event}&session={session}`                  | Full session replay data |
| [`fetchSessionReplayMetadata()`](src/lib/api.ts:902) | `GET /api/replay/metadata?year={year}&event={event}&session={session}`                 | Replay metadata          |
| [`fetchSessionReplayChunk()`](src/lib/api.ts:920)    | `GET /api/replay/chunk?year={year}&event={event}&session={session}&chunk_id={chunkId}` | Chunked replay data      |

### Driver/Team Details API

| Function                                   | Endpoint                     | Description                 |
| ------------------------------------------ | ---------------------------- | --------------------------- |
| [`getDriverDetails()`](src/lib/api.ts:666) | `GET /api/driver/{driverId}` | Detailed driver information |
| [`getTeamDetails()`](src/lib/api.ts:679)   | `GET /api/team/{teamId}`     | Detailed team information   |

### Data Types

The API uses the following main data structures (defined in [`src/lib/api.ts`](src/lib/api.ts)):

```typescript
// Lap Time Data
interface LapTimeDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null;
}

// Telemetry Data
interface SpeedDataPoint {
  Distance: number;
  Speed: number;
}
interface ThrottleDataPoint {
  Distance: number;
  Throttle: number;
}
interface BrakeDataPoint {
  Distance: number;
  Brake: number;
}
interface RPMDataPoint {
  Distance: number;
  RPM: number;
}
interface DRSDataPoint {
  Distance: number;
  DRS: number;
}
interface GearMapDataPoint {
  X: number;
  Y: number;
  nGear: number;
}

// Race Results
interface DetailedRaceResult {
  position: number | null;
  driverCode: string;
  fullName: string;
  team: string;
  points: number | null;
  status: string;
  gridPosition?: number | null;
  teamColor: string;
  isFastestLap?: boolean;
  q1Time?: string | null;
  q2Time?: string | null;
  q3Time?: string | null;
  // ... more fields
}

// Session Replay (Columnar Format)
interface SessionReplayData {
  time: number[];
  drivers: ReplayDriversMap;
  driver_colors: { [code: string]: string };
  track_statuses: { status: string; start_time: number; end_time: number | null }[];
  circuit_layout: string;
  race_control_messages: { time: number; category: string; message: string; flag?: string }[];
  // ... more fields
}
```

---

## Database Schema

### Profiles Table

The main user table is `profiles`, created in [`supabase/migrations/20240523_init_profiles.sql`](supabase/migrations/20240523_init_profiles.sql):

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  favorite_driver TEXT,
  favorite_team TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);
```

**Row Level Security (RLS) Policies:**

- Public profiles are viewable by everyone
- Users can insert their own profile
- Users can update their own profile

### Migrations

Located in [`supabase/migrations/`](supabase/migrations/):

1. [`20240523_init_profiles.sql`](supabase/migrations/20240523_init_profiles.sql) - Initial profiles table with RLS
2. [`20251205_subscription_fields.sql`](supabase/migrations/20251205_subscription_fields.sql) - Subscription fields
3. [`20260130_remove_subscription_fields.sql`](supabase/migrations/20260130_remove_subscription_fields.sql) - Removed subscription fields
4. [`20260228_analytics_centralization.sql`](supabase/migrations/20260228_analytics_centralization.sql) - Analytics centralization

---

## Backend Architecture

### Cloudflare Worker Proxy

Located in [`workers/`](workers/), this Cloudflare Worker proxies API requests from the frontend to the backend API, injecting the API key server-side to keep it secure.

**Architecture:**

```
Frontend → Cloudflare Worker (injects X-API-Key) → Backend API (data.fastlytics.app)
```

**Key Features:**

- CORS handling for allowed origins (`fastlytics.app`, `beta.fastlytics.app`, `www.fastlytics.app`)
- API key injection via `X-API-Key` header
- Proxy all `/api/*` requests to backend
- Special handling for `sitemap.xml`

**Configuration** ([`workers/wrangler.toml`](workers/wrangler.toml)):

- Worker name: `fastlytics-api`
- Routes: Configured for `api.fastlytics.app`

**Environment Variables:**

- `FASTLYTICS_API_KEY` - Secret (set via `wrangler secret put`)
- `BACKEND_API_URL` - Backend API URL (default: `https://data.fastlytics.app`)

---

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
VITE_API_BASE_URL=https://api.fastlytics.app
VITE_FASTLYTICS_API_KEY=

# Analytics (Optional)
VITE_UMAMI_WEBSITE_ID=
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
```

### Vite Configuration

The Vite configuration ([`vite.config.ts`](vite.config.ts)) includes:

- React SWC plugin for fast builds
- Tailwind CSS plugin
- Path aliases (`@` for `src/`)

### TypeScript Configuration

Multiple TypeScript configs:

- [`tsconfig.json`](tsconfig.json) - Base configuration
- [`tsconfig.app.json`](tsconfig.app.json) - Frontend app config
- [`tsconfig.node.json`](tsconfig.node.json) - Node.js config

---

## Testing

The project uses [Vitest](https://vitest.dev/) for testing.

**Test Files:**

- [`src/__tests__/subscription-removal.test.ts`](src/__tests__/subscription-removal.test.ts)
- [`src/lib/api-client.test.ts`](src/lib/api-client.test.ts)
- [`src/lib/utils.test.ts`](src/lib/utils.test.ts)
- [`src/types/__tests__/*.test.ts`](src/types/__tests__/)
- [`src/components/ui/button.test.tsx`](src/components/ui/button.test.tsx)

**Running Tests:**

```bash
npm run test
```

---

## Build and Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Available at http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Development build
npm run build:dev
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Cloudflare Worker Deployment

```bash
cd workers

# Install dependencies
npm install

# Deploy
npm run deploy

# Local development
npm run dev

# View logs
npm run tail
```

---

## Additional Resources

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [License](LICENSE)
- [Security Policy](SECURITY.md)
