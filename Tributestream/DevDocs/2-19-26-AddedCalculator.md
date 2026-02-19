# 2-19-26 — Calculator Feature Added

## Summary

Migrated the old site's calculator/booking logic to the new SvelteKit + Turso/Drizzle application. The calculator allows family members to select a livestream package tier, configure services (locations, dates, times), choose add-ons, and save booking data that drives the public memorial page and stream creation.

---

## What Was Built

### Shared Contract Layer
- **`src/lib/features/booking/types.ts`** — TypeScript types shared between the calculator write path and memorial read path. Defines `Tier`, `Addons`, `MemorialServices`, `BookingItem`, `CalculatorFormData`, `CalculatorConfig`, `CustomPricing`, `PaymentStatus`, and `StreamRecord`.
- **`src/lib/config/pricing.ts`** — Centralized pricing constants (tier prices, add-on prices, hourly overage, USB drive pricing) and pure functions (`calculateBookingItems`, `calculateTotal`) used on both client and server to prevent price tampering.

### Database Schema Extension
- **`src/lib/server/db/schema.ts`** — Extended the `memorial` table with ~20 new columns: `lovedOneName`, `ownerId`, `servicesJson`, `calculatorConfigJson`, `customPricingJson`, `totalPrice`, `isPaid`, `paymentStatus`, `funeralHomeName`, `directorFullName`, `familyContactName/Email/Phone`, `birthDate`, `deathDate`, `content`, `imageUrl`, `isPublic`, `fullSlug`.
- Created new **`stream`** table for per-service livestream records with Mux integration fields (`muxLiveStreamId`, `muxStreamKey`, `muxPlaybackId`, `muxRecordingReady`).
- **`drizzle/0001_eager_gateway.sql`** — Generated migration, pushed to Turso via `db:push`.

### Server Services
- **`src/lib/server/services/memorial.service.ts`** — Drizzle queries for memorial CRUD with JSON serialization/deserialization of services, calculator config, and custom pricing. Permission check via `canEditMemorial()` (admin, owner, funeral director, videographer).
- **`src/lib/server/services/stream.service.ts`** — Stream CRUD + Mux API integration. `syncStreamsWithSchedule()` reconciles desired streams from calculator data with existing DB records (creates new, removes orphans).
- **`src/lib/server/services/booking.service.ts`** — Orchestrator: server-side price re-validation, builds `CalculatorConfig`, saves to memorial, syncs streams. Also handles lightweight auto-save.

### API Routes
- **`src/routes/api/memorials/[memorialId]/schedule/+server.ts`** — `PATCH` to save full booking data (services, tier, add-ons, totals).
- **`src/routes/api/memorials/[memorialId]/schedule/auto-save/+server.ts`** — `POST` to save draft data, `GET` to retrieve last auto-saved state.
- **`src/routes/api/memorials/[memorialId]/streams/+server.ts`** — `GET` to list streams, `POST` to create a new stream.

### Calculator UI Components (Svelte 5)
- **`src/lib/components/calculator/TierSelector.svelte`** — Package tier cards (Record / Live / Legacy) with prices and features.
- **`src/lib/components/calculator/BookingForm.svelte`** — Core input form: loved one's name, main service details, funeral professional info, additional services, add-ons. Uses `$bindable` for two-way binding.
- **`src/lib/components/calculator/Summary.svelte`** — Booking line items, total price, action buttons (Save & Pay Later, Pay Now), auto-save status indicator.
- **`src/lib/components/calculator/Calculator.svelte`** — Main orchestrator: manages state, integrates sub-components, handles auto-save and API calls.
- **`src/lib/composables/useAutoSave.svelte.ts`** — Svelte 5 rune-based composable for debounced auto-save with status tracking.

### Calculator Page Route
- **`src/routes/(protected)/schedule/[memorialId]/+page.server.ts`** — Server load: fetches memorial (with parsed JSON), streams, validates permission.
- **`src/routes/(protected)/schedule/[memorialId]/+page.svelte`** — Renders `Calculator` component with loaded data.

### Memorial Page Updates (Read Path)
- **`src/routes/[slug]/+page.server.ts`** — Updated to use `memorial.service.ts`; returns loved one name, services, streams, content, dates, funeral home info.
- **`src/routes/[slug]/+page.svelte`** — Displays calculator-written data: loved one's name, birth/death dates, service details (locations, dates, times), multiple Mux stream players, funeral home info, content.

### Admin Form Updates
- **`src/routes/(protected)/admin/memorials/[id]/+page.server.ts`** — Added `lovedOneName`, `directorFullName`, `funeralHomeName` to update action; uses `memorial.service` for load.
- **`src/routes/(protected)/admin/memorials/[id]/+page.svelte`** — Added "Open Calculator" button, booking summary card, new form fields for memorial details.

### Family Member Dashboard & Memorial Creation Flow
- **`src/routes/(protected)/dashboard/new/+page.server.ts`** — Form action: creates memorial with `ownerId = user.id`, auto-generated slug, redirects to `/schedule/{memorialId}`.
- **`src/routes/(protected)/dashboard/new/+page.svelte`** — Simple form: loved one's name (required) + optional funeral home → "Start Planning" button.
- **`src/routes/(protected)/dashboard/+page.server.ts`** — Queries memorials where `ownerId = user.id`, returns list.
- **`src/routes/(protected)/dashboard/+page.svelte`** — Memorial card grid with status badges, pricing info, Calculator/View links, and empty state CTA.

---

## Architecture Decisions

1. **Single type contract** — `features/booking/types.ts` is imported by both the write path (calculator → API) and read path (memorial page loader). Any shape change is caught at compile time.
2. **Server-side price validation** — `calculateBookingItems()` runs on both client (display) and server (save). The server never trusts client-submitted totals.
3. **JSON columns for flexibility** — `services_json`, `calculator_config_json`, and `custom_pricing_json` store structured data as JSON text in SQLite, parsed via `memorial.service.ts` using shared types.
4. **Owner-based permissions** — `canEditMemorial()` grants access to admins, the memorial owner, the assigned funeral director, and the assigned videographer. Family members access their own memorials via `ownerId`.
5. **Stripe stubbed** — Payment flow placeholder exists in `Calculator.svelte` but actual Stripe integration is deferred.

---

## File Inventory

### New Files (19)
| File | Purpose |
|------|---------|
| `src/lib/features/booking/types.ts` | Shared type definitions |
| `src/lib/config/pricing.ts` | Pricing constants + calculation functions |
| `src/lib/server/services/memorial.service.ts` | Memorial CRUD + JSON parsing |
| `src/lib/server/services/stream.service.ts` | Stream CRUD + Mux integration |
| `src/lib/server/services/booking.service.ts` | Booking orchestration |
| `src/lib/components/calculator/TierSelector.svelte` | Tier selection UI |
| `src/lib/components/calculator/BookingForm.svelte` | Service details form |
| `src/lib/components/calculator/Summary.svelte` | Booking summary sidebar |
| `src/lib/components/calculator/Calculator.svelte` | Main calculator component |
| `src/lib/composables/useAutoSave.svelte.ts` | Auto-save composable |
| `src/routes/(protected)/schedule/[memorialId]/+page.server.ts` | Calculator page loader |
| `src/routes/(protected)/schedule/[memorialId]/+page.svelte` | Calculator page |
| `src/routes/api/memorials/[memorialId]/schedule/+server.ts` | Schedule save API |
| `src/routes/api/memorials/[memorialId]/schedule/auto-save/+server.ts` | Auto-save API |
| `src/routes/api/memorials/[memorialId]/streams/+server.ts` | Streams API |
| `src/routes/(protected)/dashboard/new/+page.server.ts` | Memorial creation action |
| `src/routes/(protected)/dashboard/new/+page.svelte` | Memorial creation form |
| `drizzle/0001_eager_gateway.sql` | Schema migration |

### Modified Files (5)
| File | Changes |
|------|---------|
| `src/lib/server/db/schema.ts` | +20 memorial columns, +stream table |
| `src/routes/[slug]/+page.server.ts` | Uses memorial.service, returns calculator data |
| `src/routes/[slug]/+page.svelte` | Displays services, streams, content |
| `src/routes/(protected)/admin/memorials/[id]/+page.server.ts` | New fields + memorial.service |
| `src/routes/(protected)/admin/memorials/[id]/+page.svelte` | Calculator link + memorial detail fields |
| `src/routes/(protected)/dashboard/+page.server.ts` | Queries user's memorials |
| `src/routes/(protected)/dashboard/+page.svelte` | Memorial list + create button |

---

## Testing Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |
| Family Member | `family_member` | `family_member` |

## User Flow

1. Login as `family_member` → `/dashboard`
2. Click "+ Create Memorial" → `/dashboard/new`
3. Enter loved one's name → "Start Planning"
4. Redirected to `/schedule/{memorialId}` (calculator)
5. Select tier, fill services, add-ons → auto-saves
6. "Save & Pay Later" or "Pay Now" (Stripe stubbed)
7. Public memorial page at `/{slug}` reflects saved data

## Remaining Work

- **Stripe integration** — Wire up payment intent creation, confirmation, and webhook
- **Admin form refinements** — Additional memorial management features
- **Funeral director dashboard** — Dedicated view for funeral directors
