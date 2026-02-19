# User Journey Master Summary

Comprehensive map of every user role, journey, page, API route, and supporting function in the Tributestream codebase.

---

## Roles

| Role | Self-register? | Dashboard redirect |
|------|---------------|-------------------|
| `admin` | No (seed only) | `/admin` |
| `funeral_director` | No (seed only) | `/dashboard` (TODO) |
| `videographer` | No (seed only) | `/switcher` |
| `family_member` | Yes (`/register/family_member`) | `/dashboard` |
| `contributor` | Yes (`/register/contributor`) | `/dashboard` |
| `viewer` | Yes (`/register/viewer`) | `/dashboard` |

---

## Journey 1: Authentication (All Roles)

### 1A. Login
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Visit login page | `GET /login` | `(public)/login/+page.svelte` | — |
| Submit credentials | `POST /login` | `(public)/login/+page.server.ts` | `verify()` (argon2), `auth.generateSessionToken()`, `auth.createSession()`, `auth.setSessionTokenCookie()` |
| Redirect | → `/dashboard` | `(protected)/dashboard/+page.server.ts` | Role-aware switch → `/admin`, `/switcher`, or stay |

### 1B. Registration (viewer, family_member, contributor only)
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Visit register page | `GET /register/[role]` | `(public)/register/[role]/+page.server.ts` | Validates role against `ALLOWED_REGISTRATION_ROLES` |
| Submit form | `POST /register/[role]` | `(public)/register/[role]/+page.server.ts` | `hash()` (argon2), `auth.generateId()`, `db.insert(user)`, `auth.createSession()` |
| Redirect | → `/dashboard` | — | — |

### 1C. Logout
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Sign out | `POST /logout` | `logout/+page.server.ts` | `auth.invalidateSession()`, `auth.deleteSessionTokenCookie()` |

### Auth Guard
- **`(protected)/+layout.server.ts`** — Checks `locals.user`, redirects to `/login?redirectTo=` if unauthenticated.
- **`(protected)/admin/+layout.server.ts`** — Checks `isAdmin(user)`, redirects to `/dashboard` if not admin.
- **`(protected)/switcher/+layout.server.ts`** — Checks `canAccessSwitcher(user)` (admin or videographer).

### Auth Lib (`$lib/server/auth.ts`)
- `generateSessionToken()`, `generateId()`, `createSession()`, `validateSessionToken()`
- `invalidateSession()`, `setSessionTokenCookie()`, `deleteSessionTokenCookie()`
- Role helpers: `hasRole()`, `isAdmin()`, `canAccessSwitcher()`, `canManageMemorials()`

---

## Journey 2: Family Member — Create Memorial & Book Services

### 2A. Dashboard
| Step | Route | File | Functions |
|------|-------|------|-----------|
| View my memorials | `GET /dashboard` | `dashboard/+page.server.ts` | `db.select().from(memorial).where(ownerId = user.id)` |
| Display list | — | `dashboard/+page.svelte` | Memorial cards with status, price, Calculator/View links |

### 2B. Create Memorial
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Open form | `GET /dashboard/new` | `dashboard/new/+page.svelte` | — |
| Submit name | `POST /dashboard/new` | `dashboard/new/+page.server.ts` | `generateId()`, `slugify()`, `db.insert(memorial)` with `ownerId = user.id` |
| Redirect | → `/schedule/{memorialId}` | — | Calculator page |

### 2C. Calculator (Booking)
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Load calculator | `GET /schedule/[memorialId]` | `schedule/[memorialId]/+page.server.ts` | `getMemorialById()`, `canEditMemorial()`, `getStreamsForMemorial()` |
| Render UI | — | `schedule/[memorialId]/+page.svelte` | Renders `Calculator.svelte` |
| Select tier | — | `components/calculator/TierSelector.svelte` | `TIER_PRICES`, `TIER_FEATURES` from `config/pricing.ts` |
| Fill services | — | `components/calculator/BookingForm.svelte` | Two-way bound `services`, `calculatorData`, `addons` |
| View summary | — | `components/calculator/Summary.svelte` | `calculateBookingItems()`, `calculateTotal()` from `config/pricing.ts` |
| Auto-save (debounced) | `POST /api/memorials/[id]/schedule/auto-save` | `schedule/auto-save/+server.ts` | `autoSaveBooking()` from `booking.service.ts` |
| Load auto-saved data | `GET /api/memorials/[id]/schedule/auto-save` | `schedule/auto-save/+server.ts` | `getMemorialById()`, returns `servicesJson` + `calculatorConfigJson` |
| Save & Pay Later | `PATCH /api/memorials/[id]/schedule` | `schedule/+server.ts` | `saveBooking()` from `booking.service.ts` → `calculateBookingItems()` (server-side re-validation), `updateMemorialBookingData()`, `syncStreamsWithSchedule()` |
| Pay Now | — | `Calculator.svelte` | Stubbed — placeholder for Stripe integration |

### Auto-Save Composable (`$lib/composables/useAutoSave.svelte.ts`)
- `scheduleSave()`, `save()`, `load()` — debounced 3s POST to auto-save endpoint
- Tracks `isSaving`, `lastSaved`, `hasUnsavedChanges`

### Pricing Lib (`$lib/config/pricing.ts`)
- Constants: `TIER_PRICES`, `TIER_FEATURES`, `ADDON_PRICES`, `HOURLY_OVERAGE`, `USB_DRIVE_PRICING`
- Functions: `calculateBookingItems()`, `calculateTotal()`, `getBaseTierPrice()`, `getPricingForMemorial()`

### Booking Service (`$lib/server/services/booking.service.ts`)
- `saveBooking()` — validates pricing server-side, builds `CalculatorConfig`, saves to memorial, syncs streams
- `autoSaveBooking()` — lightweight save of services + calculator config JSON

### Memorial Service (`$lib/server/services/memorial.service.ts`)
- `getMemorialById()` — returns `ParsedMemorial` with JSON fields deserialized
- `getMemorialBySlug()` — same, by slug
- `updateMemorialBookingData()` — saves services, config, pricing, totals, contact info
- `markMemorialPaid()` — sets `isPaid = true`, `paymentStatus = 'paid'`
- `canEditMemorial()` — permission check (admin, owner, funeral director, videographer)

### Stream Service (`$lib/server/services/stream.service.ts`)
- `createStream()` — creates Mux live stream + DB record
- `syncStreamsWithSchedule()` — reconciles desired streams with existing (create new, remove orphans)
- `getStreamsForMemorial()`, `updateStream()`, `deleteStream()`

---

## Journey 3: Public Viewer — Watch Memorial

| Step | Route | File | Functions |
|------|-------|------|-----------|
| Visit memorial page | `GET /[slug]` | `[slug]/+page.server.ts` | `getMemorialBySlug()`, `getStreamsForMemorial()` |
| View memorial | — | `[slug]/+page.svelte` | Displays: loved one name, birth/death dates, service details (location/date/time), Mux player(s), content, funeral home |

### Data displayed on memorial page (sourced from calculator):
- `lovedOneName`, `birthDate`, `deathDate`, `imageUrl`
- `services` (parsed from `services_json`) — main + additional service locations, dates, times
- `streams` — Mux playback IDs for video players
- `content` — memorial body text
- `funeralHomeName`, `status`

---

## Journey 4: Admin — Platform Management

### 4A. Admin Dashboard
| Step | Route | File | Functions |
|------|-------|------|-----------|
| View dashboard | `GET /admin` | `admin/+page.svelte` | Stat cards (stub), quick actions |
| Navigate | Sidebar: Dashboard, Memorials, Users, Billing, Audit | `admin/+layout.svelte` | `navItems[]` |

### 4B. Memorial Management
| Step | Route | File | Functions |
|------|-------|------|-----------|
| List all memorials | `GET /admin/memorials` | `admin/memorials/+page.server.ts` | `db.select()` all memorials, joins videographer usernames |
| Display list | — | `admin/memorials/+page.svelte` | Table with status, slug, videographer, dates |
| Create memorial | `GET /admin/memorials/new` | `admin/memorials/new/+page.server.ts` | Loads videographers list |
| Submit creation | `POST /admin/memorials/new` | `admin/memorials/new/+page.server.ts` | `generateId()`, `db.insert(memorial)` |
| Edit memorial | `GET /admin/memorials/[id]` | `admin/memorials/[id]/+page.server.ts` | `getMemorialById()`, loads videographers |
| Update memorial | `POST ?/update` | `admin/memorials/[id]/+page.server.ts` | `db.update(memorial)` — title, slug, description, status, videographer, chat, lovedOneName, directorFullName, funeralHomeName |
| Delete memorial | `POST ?/delete` | `admin/memorials/[id]/+page.server.ts` | `db.delete(memorial)` |
| Open calculator | Link: `/schedule/{id}` | `admin/memorials/[id]/+page.svelte` | "Open Calculator" button |
| View booking summary | — | `admin/memorials/[id]/+page.svelte` | Shows `calculatorConfig.status`, total, isPaid |

### 4C. Other Admin Pages (stubs)
- `/admin/users` — `admin/users/+page.svelte` (placeholder)
- `/admin/billing` — `admin/billing/+page.svelte` (placeholder)
- `/admin/audit` — `admin/audit/+page.svelte` (placeholder)

---

## Journey 5: Videographer — Switcher & Live Production

### 5A. Memorial List
| Step | Route | File | Functions |
|------|-------|------|-----------|
| View assigned memorials | `GET /switcher` | `switcher/+page.server.ts` | Queries memorials by `assignedVideographerId` (or all if admin) |
| Display list | — | `switcher/+page.svelte` | Memorial cards with status |

### 5B. Switcher Console
| Step | Route | File | Functions |
|------|-------|------|-----------|
| Load switcher | `GET /switcher/[memorialId]` | `switcher/[memorialId]/+page.server.ts` | Loads memorial, cleans stale devices, fetches active devices |
| Render console | — | `switcher/[memorialId]/+page.svelte` | `SourceManager`, `Compositor`, `AudioMixer`, `SwitcherRpc`, device streams |
| Add camera | Open `AddCameraModal` | `components/AddCameraModal.svelte` | Calls `POST /api/devices/create-token` → generates QR code |
| Create Mux stream | Button | — | Calls `POST /api/streams/create` |
| Connect to LiveKit | Auto | — | `LiveKitRoom.connect()`, subscribes to `Track.Source.Camera/Microphone` |
| Start egress | Button | — | Calls `POST /api/livekit/egress/start` (track-composite or room-composite mode) |
| Go live | Button | — | Calls `POST /api/streams/go-live` → sets memorial status to `'live'` |
| End stream | Button | — | Calls `POST /api/streams/end` → sets memorial status to `'ended'` |
| Stop egress | Button | — | Calls `POST /api/livekit/egress/stop` |

### Compositor Lib (`$lib/compositor/`)
- `SourceManager.svelte.ts` — Manages video/audio sources from LiveKit tracks
- `Compositor.svelte.ts` — Canvas-based video compositing with layout modes
- `AudioMixer.ts` — Audio mixing for multi-camera setups
- `OverlayManager.ts` — Text/image overlays on canvas
- `TransitionEngine.ts` — Cut/fade/wipe transitions between sources

### LiveKit Lib (`$lib/livekit/`)
- `client.ts` — `LiveKitRoom` class wrapping `livekit-client` SDK
- `token.ts` — `createCameraToken()`, `createSwitcherToken()`, `LIVEKIT_URL`
- `egress.ts` — `startMuxEgress()`, `startRoomCompositeEgress()`, `stopEgress()`
- `rpc-commands.ts` — Data channel topics (`TOPIC_COMPOSITOR_STATE`, etc.)
- `switcher-rpc.ts` — `SwitcherRpc` class for sending compositor commands via data channels

---

## Journey 6: Camera Device — Phone/Tablet as Camera Source

| Step | Route | File | Functions |
|------|-------|------|-----------|
| Scan QR code | `GET /camera?token=...` | `camera/+page.svelte` | Token from query string |
| Validate token | — | `camera/+page.svelte` | Calls `POST /api/devices/validate` |
| Token validation API | `POST /api/devices/validate` | `api/devices/validate/+server.ts` | Finds device by token, checks expiry, updates status to `'connecting'`, generates LiveKit token via `createCameraToken()` |
| Init camera | — | `camera/+page.svelte` | `getUserMedia()` (video + audio), `LiveKitRoom.connect()`, `publishTrack()` |
| Status sync | — | `camera/+page.svelte` | Calls `PATCH /api/devices/[id]/status` on connection state changes |
| Flip camera | — | `camera/+page.svelte` | `flipCamera()` — stops tracks, switches `facingMode`, re-publishes |
| Display | — | `camera/+page.svelte` | Fullscreen video preview, connection status indicator, battery level, memorial title |

---

## Journey 7: Egress Template (LiveKit headless browser)

| Step | Route | File | Functions |
|------|-------|------|-----------|
| LiveKit loads template | `GET /egress-template?url=&token=&layout=` | `egress-template/+page.ts` | Parses query params (SSR disabled) |
| Render composite | — | `egress-template/+page.svelte` | Connects to LiveKit room, renders video tracks in specified layout for RTMP output |

---

## API Route Summary

### Memorial & Booking APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `PATCH` | `/api/memorials/[id]/schedule` | User + owner check | Save full booking data |
| `POST` | `/api/memorials/[id]/schedule/auto-save` | User + owner check | Auto-save draft |
| `GET` | `/api/memorials/[id]/schedule/auto-save` | User + owner check | Load auto-saved data |
| `GET` | `/api/memorials/[id]/streams` | User + owner check | List memorial streams |
| `POST` | `/api/memorials/[id]/streams` | User + owner check | Create stream for memorial |

### Stream Lifecycle APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/streams/create` | Admin/videographer | Create Mux live stream + update memorial |
| `POST` | `/api/streams/go-live` | Admin/videographer | Set memorial status → `live` |
| `POST` | `/api/streams/end` | Admin/videographer | Set memorial status → `ended` |

### Device APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/devices/create-token` | Admin/videographer | Generate device token + QR code data |
| `POST` | `/api/devices/validate` | None (token-based) | Validate camera device token |
| `GET` | `/api/devices/[id]/status` | None | Get device status |
| `PATCH` | `/api/devices/[id]/status` | None | Update device connection status |
| `DELETE` | `/api/devices/[id]` | User | Remove device |
| `POST` | `/api/devices/cleanup` | Admin only | Delete stale devices |

### LiveKit APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/livekit/token` | User (switcher) or none (camera) | Generate LiveKit join token |
| `POST` | `/api/livekit/egress/start` | User | Start RTMP egress to Mux |
| `POST` | `/api/livekit/egress/stop` | User | Stop egress |
| `POST` | `/api/livekit/webhook` | LiveKit signature | Receive lifecycle events (egress, participant) |

---

## Database Tables

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `user` | id, username, email, passwordHash, role | All user accounts |
| `session` | id, userId, expiresAt, deviceName, deviceType | Auth sessions |
| `memorial` | id, slug, title, status, ownerId, lovedOneName, servicesJson, calculatorConfigJson, muxStreamKey, muxPlaybackId, ... | Central entity |
| `stream` | id, memorialId, title, status, muxLiveStreamId, muxStreamKey, muxPlaybackId, calculatorServiceType, ... | Per-service streams (from calculator) |
| `device` | id, token, memorialId, userId, status, tokenExpiresAt, lastSeen, ... | Camera devices for switcher |
| `audit_log` | id, userId, action, resourceType, resourceId, ... | Audit trail |

---

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Turso** (libSQL) | Database | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |
| **Mux** | Live stream ingest + playback | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` |
| **LiveKit** | WebRTC rooms, camera → switcher | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` |
| **Stripe** | Payments (stubbed) | TBD |
