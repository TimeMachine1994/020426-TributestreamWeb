# Tributestream New Architecture
**Date:** February 4, 2026

## Overview

Rebuilding Tributestream with a clean, scalable foundation focused on:
- **Backend-first approach** — Admin and videographer workflows before public frontend
- **Role-based access control** — 6 distinct user types with appropriate permissions
- **Multi-device videography** — Phones as remote camera sources via WebRTC

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | SvelteKit + Svelte 5 |
| **Database** | Turso (SQLite) |
| **ORM** | Drizzle |
| **Auth** | Lucia (custom implementation with oslo packages) |
| **Styling** | Tailwind CSS 4 |
| **Hosting** | Vercel |
| **Video** | Mux (livestream + VOD) |
| **Real-time** | WebRTC (camera ingest), WebSocket (chat) |

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Administrator** | Full system access, billing, audit logs, user management |
| **Funeral Director** | Create/edit memorials, schedule streams, moderate chat |
| **Videographer** | Access switcher console, connect devices, go live |
| **Family Member** | View memorials, upload tributes, access contributor features |
| **Contributor** | Upload photos/content during service |
| **Viewer** | Watch streams, participate in chat |

---

## Database Schema

### Users Table
```sql
user (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer',
  created_at    INTEGER NOT NULL
)
```

### Sessions Table (Multi-device support)
```sql
session (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES user(id),
  expires_at  INTEGER NOT NULL,
  device_name TEXT,
  device_type TEXT  -- 'browser', 'phone_camera', 'tablet'
)
```

### Memorials Table
```sql
memorial (
  id                  TEXT PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  description         TEXT,
  scheduled_at        INTEGER,
  status              TEXT DEFAULT 'draft',  -- draft, scheduled, live, ended, archived
  funeral_director_id TEXT REFERENCES user(id),
  mux_stream_key      TEXT,
  mux_playback_id     TEXT,
  chat_enabled        INTEGER DEFAULT 1,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
)
```

### Devices Table (Camera Rig)
```sql
device (
  id            TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  memorial_id   TEXT REFERENCES memorial(id),
  user_id       TEXT REFERENCES user(id),
  device_name   TEXT NOT NULL,
  status        TEXT DEFAULT 'disconnected',  -- connected, disconnected, streaming
  battery_level INTEGER,
  last_seen     INTEGER
)
```

---

## Route Structure

```
src/routes/
│
├── (public)/                      # Public layout group
│   ├── +layout.svelte
│   ├── +page.svelte               # Landing page (/)
│   ├── login/+page.svelte         # Login (/login)
│   └── register/
│       └── [role]/+page.svelte    # Role-specific registration (/register/viewer)
│
├── (protected)/                   # Authenticated layout group
│   ├── +layout.server.ts          # Auth guard - redirects to /login if not authenticated
│   ├── +layout.svelte
│   │
│   ├── dashboard/+page.svelte     # Role-aware redirect (/dashboard)
│   │                              # → Admin goes to /admin
│   │                              # → Videographer goes to /switcher
│   │                              # → Others go to role-specific dashboard
│   │
│   ├── admin/                     # Admin-only routes
│   │   ├── +layout.server.ts      # Role guard (admin only)
│   │   ├── +page.svelte           # Admin dashboard (/admin)
│   │   ├── memorials/
│   │   │   ├── +page.svelte       # Memorial list (/admin/memorials)
│   │   │   ├── new/+page.svelte   # Create memorial (/admin/memorials/new)
│   │   │   └── [id]/+page.svelte  # Edit memorial (/admin/memorials/[id])
│   │   ├── users/
│   │   │   └── +page.svelte       # User management (/admin/users)
│   │   ├── billing/
│   │   │   └── +page.svelte       # Billing (/admin/billing)
│   │   └── audit/
│   │       └── +page.svelte       # Audit logs (/admin/audit)
│   │
│   └── switcher/                  # Videographer-only routes
│       ├── +layout.server.ts      # Role guard (videographer, admin)
│       ├── +page.svelte           # Switcher dashboard (/switcher)
│       └── [memorialId]/
│           └── +page.svelte       # Active production session (/switcher/[memorialId])
│
├── camera/                        # Token-authenticated (no login required)
│   └── +page.svelte               # Phone camera UI (/camera?token=xxx)
│
└── [slug]/                        # Public memorial page (ROOT LEVEL)
    ├── +page.server.ts            # Load memorial by slug
    └── +page.svelte               # Stream viewer + chat (/john-doe-2026)
```

### Route Priority Note
The `[slug]` route is at the root level for clean memorial URLs. SvelteKit will match specific routes first, so:
- `/login` → login page (specific route wins)
- `/admin` → admin dashboard (specific route wins)
- `/john-doe-2026` → memorial page (slug fallback)

---

## Auth Flow

### Standard Login
1. User submits credentials at `/login`
2. Server validates, creates session with device metadata
3. Session token stored in HTTP-only cookie
4. Redirect to `/dashboard` → role-aware redirect to appropriate area

### Videographer Multi-Device
1. Videographer logs in on laptop → accesses `/switcher`
2. Clicks "Add Camera" → generates QR code with signed token
3. Phone scans QR → opens `/camera?token=xxx`
4. Token grants temporary camera-contributor access (no full login)
5. WebRTC connection established to switcher

### Protected Route Guards

```typescript
// (protected)/+layout.server.ts
export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(303, `/login?redirectTo=${url.pathname}`);
  }
  return { user: locals.user };
};
```

```typescript
// admin/+layout.server.ts
export const load: LayoutServerLoad = async ({ parent }) => {
  const { user } = await parent();
  if (user.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }
};
```

---

## Key Features by Phase

### Phase 1: Identity & Access Management
- [x] Basic session auth (exists)
- [ ] Extend schema with roles
- [ ] Role-based route guards
- [ ] Multi-device session support
- [ ] Audit logging

### Phase 2: Admin Memorial Management
- [ ] Block-based editor (BlockNote)
- [ ] Memorial CRUD
- [ ] Slug generation
- [ ] Stream scheduling

### Phase 3: Remote Camera Ingest
- [ ] QR code pairing
- [ ] `/camera` page with getUserMedia
- [ ] WebRTC contribution pipeline

### Phase 4: Cloud Switcher
- [ ] Multiviewer grid
- [ ] Preview/Program switching
- [ ] Lower-third overlays
- [ ] Audio mixer

### Phase 5: Mux Integration
- [ ] Live streaming
- [ ] DVR mode
- [ ] Live-to-VOD archiving

### Phase 6: Chat & Moderation
- [ ] WebSocket chat
- [ ] Moderation dashboard
- [ ] Contributor uploads

---

## Implementation Order

1. **RBAC & Authentication** (Phase 1)
2. **WebRTC Phone-to-Browser Ingest** (Phase 3)
3. **Basic Switcher UI & Cloud Mixing** (Phase 4)
4. **Mux Integration & Playback** (Phase 5)
5. **Admin Block Editor** (Phase 2)
6. **Chat & Moderation** (Phase 6)

---

## File Organization

```
src/lib/
├── server/
│   ├── auth.ts              # Session management, role helpers
│   └── db/
│       ├── index.ts         # Drizzle client
│       └── schema.ts        # All table definitions
│
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── admin/               # Admin-specific components
│   ├── switcher/            # Switcher-specific components
│   └── memorial/            # Memorial page components
│
└── utils/
    ├── guards.ts            # Role checking utilities
    └── slugify.ts           # URL slug generation
```
