# Firestore → Turso/Drizzle Migration — Master Interface Document

**Date:** February 19, 2026
**Status:** Draft — Awaiting old Firestore schema confirmation
**Project:** Tributestream Memorial Livestreaming SaaS

---

## 1. Executive Summary

This document defines the complete interface contract for migrating data from the legacy Firestore-backed Tributestream website to the new SvelteKit + Turso (SQLite) + Drizzle ORM stack. It covers:

- **Source**: Firestore (NoSQL document collections)
- **Target**: Turso (SQLite via libsql) with Drizzle ORM
- **Scope**: All user data, memorial content, media references, chat history, and any billing/analytics records

---

## 2. Architecture Comparison

| Aspect | Old (Firestore) | New (Turso/Drizzle) |
|--------|-----------------|---------------------|
| **Database** | Cloud Firestore (NoSQL) | Turso (SQLite edge DB) |
| **Data Model** | Document → Collection → Subcollection | Relational tables with FKs |
| **Auth** | Firebase Auth (UID-based) | Lucia-style custom sessions (Argon2 passwords) |
| **Hosting** | Firebase Hosting / Cloud Functions | Vercel / Netlify + SvelteKit |
| **Video** | Unknown (confirm: Mux, YouTube embed, or other?) | Mux + LiveKit |
| **Real-time** | Firestore onSnapshot listeners | LiveKit rooms, future SSE/WebSocket |
| **File Storage** | Firebase Storage (gs:// buckets) | TBD — needs migration target (S3, Cloudflare R2, or Mux assets) |

---

## 3. Firestore Source Schema (Assumed — CONFIRM WITH OLD CODEBASE)

> **ACTION REQUIRED:** Review the old Firestore codebase and confirm/correct each collection below. Mark each with ✅ (confirmed), ❌ (doesn't exist), or ✏️ (exists but different shape).

### 3.1 `users` Collection

```
/users/{userId}
├── uid: string              (Firebase Auth UID)
├── email: string
├── displayName: string
├── role: string             ("admin" | "funeral_director" | "videographer" | "family" | "viewer")
├── phone?: string
├── avatarUrl?: string
├── funeralHomeId?: string   (reference to funeral home)
├── createdAt: Timestamp
├── updatedAt?: Timestamp
└── metadata?: map           (any additional profile data)
```

**Status:** [ ] Confirmed

### 3.2 `memorials` Collection

```
/memorials/{memorialId}
├── title: string
├── slug?: string
├── deceasedName: string
├── dateOfBirth?: Timestamp
├── dateOfDeath?: Timestamp
├── obituary?: string        (rich text / HTML)
├── coverImageUrl?: string
├── status: string           ("draft" | "scheduled" | "live" | "ended" | "archived")
├── scheduledAt?: Timestamp
├── funeralDirectorId: string (ref → users)
├── videographerId?: string   (ref → users)
├── funeralHomeId?: string
├── streamUrl?: string       (HLS/RTMP URL or Mux playback ID)
├── streamKey?: string
├── chatEnabled: boolean
├── viewerCount?: number
├── createdAt: Timestamp
├── updatedAt: Timestamp
│
├── /tributes (subcollection)
│   └── {tributeId}
│       ├── authorId: string
│       ├── authorName: string
│       ├── type: string     ("photo" | "video" | "text" | "candle")
│       ├── content: string  (text or URL)
│       ├── approved: boolean
│       └── createdAt: Timestamp
│
├── /chatMessages (subcollection)
│   └── {messageId}
│       ├── userId: string
│       ├── displayName: string
│       ├── text: string
│       ├── flagged: boolean
│       ├── deleted: boolean
│       └── createdAt: Timestamp
│
└── /blocks (subcollection) — if block editor was used
    └── {blockId}
        ├── type: string     ("text" | "image" | "video" | "embed" | "stream")
        ├── content: map
        ├── order: number
        └── updatedAt: Timestamp
```

**Status:** [ ] Confirmed

### 3.3 `funeralHomes` Collection (if multi-tenant)

```
/funeralHomes/{homeId}
├── name: string
├── address: string
├── phone: string
├── email: string
├── logoUrl?: string
├── website?: string
├── subscriptionTier?: string
├── stripeCustomerId?: string
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

**Status:** [ ] Confirmed / Does not exist

### 3.4 `orders` / `billing` Collection (if applicable)

```
/orders/{orderId}
├── memorialId: string
├── funeralHomeId: string
├── userId: string
├── amount: number
├── currency: string
├── status: string           ("pending" | "paid" | "refunded")
├── stripePaymentIntentId?: string
├── lineItems: array
├── createdAt: Timestamp
└── paidAt?: Timestamp
```

**Status:** [ ] Confirmed / Does not exist

### 3.5 `media` Collection (if centralized)

```
/media/{mediaId}
├── memorialId: string
├── uploadedBy: string
├── type: string             ("photo" | "video" | "document")
├── url: string              (Firebase Storage URL)
├── storagePath: string      (gs:// path)
├── thumbnailUrl?: string
├── fileSize: number
├── mimeType: string
├── createdAt: Timestamp
```

**Status:** [ ] Confirmed / Does not exist

### 3.6 Other Possible Collections

| Collection | Purpose | Status |
|-----------|---------|--------|
| `notifications` | Push/email notification records | [ ] |
| `analytics` | Page views, stream watch time | [ ] |
| `settings` | Global app configuration | [ ] |
| `invitations` | Family invite links | [ ] |
| `guestbook` | Signed guestbook entries | [ ] |
| `flowers` / `donations` | Sympathy gifts / charity links | [ ] |

---

## 4. Target Schema (Current Turso/Drizzle — Implemented)

Located at `src/lib/server/db/schema.ts`:

### 4.1 `user` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Hex-encoded random bytes |
| `username` | TEXT UNIQUE NOT NULL | — |
| `email` | TEXT UNIQUE | — |
| `password_hash` | TEXT NOT NULL | Argon2 hash |
| `role` | TEXT NOT NULL | `admin`, `funeral_director`, `videographer`, `family_member`, `contributor`, `viewer` |
| `created_at` | INTEGER (timestamp) | — |

### 4.2 `session` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | SHA-256 of token |
| `user_id` | TEXT FK → user | — |
| `expires_at` | INTEGER (timestamp) | 30-day sliding window |
| `device_name` | TEXT | — |
| `device_type` | TEXT | `browser`, `phone_camera`, `tablet` |

### 4.3 `memorial` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | — |
| `slug` | TEXT UNIQUE NOT NULL | URL-friendly identifier |
| `title` | TEXT NOT NULL | — |
| `description` | TEXT | Plain text |
| `scheduled_at` | INTEGER (timestamp) | — |
| `status` | TEXT NOT NULL | `draft`, `scheduled`, `live`, `ended`, `archived` |
| `funeral_director_id` | TEXT FK → user | — |
| `assigned_videographer_id` | TEXT FK → user | — |
| `mux_stream_key` | TEXT | — |
| `mux_playback_id` | TEXT | — |
| `mux_asset_id` | TEXT | — |
| `livekit_room_name` | TEXT | — |
| `egress_id` | TEXT | — |
| `chat_enabled` | INTEGER (boolean) | Default `true` |
| `created_at` | INTEGER (timestamp) | — |
| `updated_at` | INTEGER (timestamp) | — |

### 4.4 `device` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | — |
| `token` | TEXT UNIQUE NOT NULL | Device pairing token |
| `memorial_id` | TEXT FK → memorial | — |
| `user_id` | TEXT FK → user | — |
| `name` | TEXT | — |
| `type` | TEXT | `phone`, `webcam`, `rtmp` |
| `status` | TEXT NOT NULL | `pending`, `connecting`, `connected`, `disconnected`, `streaming` |
| `battery_level` | INTEGER | — |
| `token_expires_at` | INTEGER (timestamp) | — |
| `connected_at` | INTEGER (timestamp) | — |
| `last_seen` | INTEGER (timestamp) | — |
| `created_at` | INTEGER (timestamp) | — |

### 4.5 `audit_log` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | — |
| `user_id` | TEXT FK → user | — |
| `action` | TEXT NOT NULL | e.g. `memorial.created` |
| `target_type` | TEXT | e.g. `memorial`, `user` |
| `target_id` | TEXT | — |
| `metadata` | TEXT | JSON string |
| `ip_address` | TEXT | — |
| `created_at` | INTEGER (timestamp) | — |

---

## 5. Field Mapping: Firestore → Turso

### 5.1 Users

| Firestore (`/users/{uid}`) | Turso (`user`) | Transform | Notes |
|----------------------------|----------------|-----------|-------|
| `uid` | `id` | Direct or re-generate | Firebase UIDs are 28-char strings; new system uses hex IDs |
| `email` | `email` | Direct | — |
| `displayName` | `username` | Slugify / deduplicate | Must be unique; handle collisions |
| `role` | `role` | Map values | e.g. `"family"` → `"family_member"` |
| `phone` | ❌ **NOT IN SCHEMA** | — | **Add column or drop** |
| `avatarUrl` | ❌ **NOT IN SCHEMA** | — | **Add column or drop** |
| `funeralHomeId` | ❌ **NOT IN SCHEMA** | — | **Multi-tenancy not yet modeled** |
| `createdAt` | `created_at` | Firestore Timestamp → Unix epoch int | `timestamp.toMillis()` |
| *(no password in Firestore)* | `password_hash` | Generate temp hash + force reset | Firebase Auth uses separate identity; users must set new password |

### 5.2 Memorials

| Firestore (`/memorials/{id}`) | Turso (`memorial`) | Transform | Notes |
|-------------------------------|-------------------|-----------|-------|
| `memorialId` | `id` | Direct or re-generate | — |
| `slug` | `slug` | Generate if missing | Slugify from `deceasedName` + year |
| `title` | `title` | Direct | — |
| `deceasedName` | ❌ **NOT IN SCHEMA** | — | **Add column — critical for memorial identity** |
| `dateOfBirth` | ❌ **NOT IN SCHEMA** | — | **Add column** |
| `dateOfDeath` | ❌ **NOT IN SCHEMA** | — | **Add column** |
| `obituary` | `description` | Truncate or store as-is | May need rich text column or separate `blocks` table |
| `coverImageUrl` | ❌ **NOT IN SCHEMA** | — | **Add column** |
| `status` | `status` | Map values | Should be 1:1 |
| `scheduledAt` | `scheduled_at` | Timestamp → epoch | — |
| `funeralDirectorId` | `funeral_director_id` | FK remap if user IDs change | — |
| `videographerId` | `assigned_videographer_id` | FK remap | — |
| `streamUrl` | `mux_playback_id` | Extract ID or re-provision | — |
| `streamKey` | `mux_stream_key` | Direct if still valid | Old keys may be expired |
| `chatEnabled` | `chat_enabled` | bool → integer | `true` → `1` |
| `viewerCount` | ❌ **NOT IN SCHEMA** | — | Consider analytics table |
| `createdAt` | `created_at` | Timestamp → epoch | — |
| `updatedAt` | `updated_at` | Timestamp → epoch | — |

### 5.3 Subcollections — No Target Table Yet

| Firestore Subcollection | Proposed New Table | Priority |
|------------------------|-------------------|----------|
| `/memorials/{id}/tributes` | `tribute` | **HIGH** — core feature |
| `/memorials/{id}/chatMessages` | `chat_message` | **MEDIUM** — historical archive |
| `/memorials/{id}/blocks` | `memorial_block` | **HIGH** — page content |
| `/media/{id}` | `media` | **HIGH** — photos/videos |

### 5.4 Collections With No Target

| Firestore Collection | Action Needed |
|---------------------|---------------|
| `funeralHomes` | New `funeral_home` table if multi-tenant |
| `orders` / `billing` | New `order` table or integrate Stripe directly |
| `notifications` | Decide: rebuild or drop |
| `guestbook` | Fold into `tribute` or new table |
| `flowers` / `donations` | New table or third-party integration |

---

## 6. Schema Extensions Required

The following tables/columns must be added to `schema.ts` to fully accommodate the migrated data:

### 6.1 New Columns on Existing Tables

```typescript
// user table additions
phone: text('phone'),
avatarUrl: text('avatar_url'),
displayName: text('display_name'),       // preserve original Firestore display name
firebaseUid: text('firebase_uid'),       // preserve for cross-reference during migration
funeralHomeId: text('funeral_home_id'),  // if multi-tenant

// memorial table additions
deceasedName: text('deceased_name'),
dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
dateOfDeath: integer('date_of_death', { mode: 'timestamp' }),
obituary: text('obituary'),              // rich text / HTML
coverImageUrl: text('cover_image_url'),
firebaseId: text('firebase_id'),         // preserve for cross-reference
```

### 6.2 New Tables

```typescript
// ============================================================================
// TRIBUTES (migrated from /memorials/{id}/tributes)
// ============================================================================
export const tribute = sqliteTable('tribute', {
  id: text('id').primaryKey(),
  memorialId: text('memorial_id').notNull().references(() => memorial.id),
  authorId: text('author_id').references(() => user.id),
  authorName: text('author_name'),            // denormalized for anonymous/guest tributes
  type: text('type').$type<'photo' | 'video' | 'text' | 'candle'>().notNull(),
  content: text('content'),                   // text body or media URL
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ============================================================================
// CHAT MESSAGES (migrated from /memorials/{id}/chatMessages)
// ============================================================================
export const chatMessage = sqliteTable('chat_message', {
  id: text('id').primaryKey(),
  memorialId: text('memorial_id').notNull().references(() => memorial.id),
  userId: text('user_id').references(() => user.id),
  displayName: text('display_name'),
  text: text('text').notNull(),
  flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ============================================================================
// MEMORIAL BLOCKS (migrated from /memorials/{id}/blocks)
// ============================================================================
export const memorialBlock = sqliteTable('memorial_block', {
  id: text('id').primaryKey(),
  memorialId: text('memorial_id').notNull().references(() => memorial.id),
  type: text('type').$type<'text' | 'image' | 'video' | 'embed' | 'stream'>().notNull(),
  content: text('content'),                   // JSON string
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// ============================================================================
// MEDIA (migrated from /media or Firebase Storage)
// ============================================================================
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  memorialId: text('memorial_id').references(() => memorial.id),
  uploadedBy: text('uploaded_by').references(() => user.id),
  type: text('type').$type<'photo' | 'video' | 'document'>().notNull(),
  url: text('url').notNull(),                 // new storage URL (post-migration)
  originalFirebaseUrl: text('original_firebase_url'), // preserve for verification
  storagePath: text('storage_path'),
  thumbnailUrl: text('thumbnail_url'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ============================================================================
// FUNERAL HOMES (if multi-tenant)
// ============================================================================
export const funeralHome = sqliteTable('funeral_home', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  website: text('website'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

---

## 7. Migration Strategy

### 7.1 Phase Overview

```
Phase A: Export    →  Pull all Firestore data into JSON/NDJSON files
Phase B: Transform →  Run mapping scripts to reshape data
Phase C: Load      →  Insert into Turso via Drizzle
Phase D: Media     →  Copy Firebase Storage → new storage (S3/R2)
Phase E: Validate  →  Reconcile counts, spot-check records
Phase F: Cutover   →  DNS switch, disable Firestore writes
```

### 7.2 Phase A — Firestore Export

```bash
# Option 1: Firebase CLI export (full backup)
gcloud firestore export gs://your-backup-bucket/migration-export

# Option 2: Script-based export (more control)
# Use firebase-admin SDK to iterate collections and write NDJSON
node scripts/firestore-export.js --collections users,memorials,media --output ./export/
```

**Output format** (one NDJSON file per collection):
```
export/
├── users.ndjson
├── memorials.ndjson
├── memorials_tributes.ndjson    (flattened subcollection)
├── memorials_chatMessages.ndjson
├── memorials_blocks.ndjson
├── media.ndjson
├── funeralHomes.ndjson          (if exists)
└── orders.ndjson                (if exists)
```

### 7.3 Phase B — Transform

A TypeScript migration script at `scripts/migrate-firestore.ts` should:

1. **Read** each NDJSON file
2. **Map** fields per Section 5 mappings
3. **Generate** new IDs (or preserve old ones with a `firebase_uid` / `firebase_id` cross-ref column)
4. **Build** an ID remap table (`oldId → newId`) for FK resolution
5. **Resolve** user role name differences
6. **Generate** slugs for memorials missing them
7. **Generate** temporary password hashes (users must reset on first login)
8. **Convert** Firestore Timestamps → Unix epoch integers
9. **Output** validated INSERT-ready JSON

### 7.4 Phase C — Load

```typescript
// scripts/migrate-load.ts
import { db } from './turso-client';
import * as table from '../src/lib/server/db/schema';

// Insert order matters for FK constraints:
// 1. funeral_home (if applicable)
// 2. user
// 3. memorial
// 4. tribute, chat_message, memorial_block, media
// 5. audit_log (create migration audit entry)

async function loadUsers(data: TransformedUser[]) {
  for (const batch of chunk(data, 100)) {
    await db.insert(table.user).values(batch);
  }
}
// ... repeat for each table
```

### 7.5 Phase D — Media Migration

| Source | Target | Tool |
|--------|--------|------|
| Firebase Storage (`gs://bucket/...`) | Cloudflare R2 / AWS S3 | `gsutil cp` or `rclone` |
| Firebase Storage URLs | New CDN URLs | Find-and-replace in `media.url` |

**Steps:**
1. Download all files from Firebase Storage bucket
2. Upload to new storage provider
3. Update `media.url` column with new CDN URLs
4. Keep `original_firebase_url` for rollback verification

### 7.6 Phase E — Validation

| Check | Query |
|-------|-------|
| User count match | `SELECT COUNT(*) FROM user` vs Firestore `users` collection size |
| Memorial count match | `SELECT COUNT(*) FROM memorial` vs Firestore `memorials` |
| Tribute count match | `SELECT COUNT(*) FROM tribute` vs sum of all subcollection sizes |
| FK integrity | `SELECT * FROM memorial WHERE funeral_director_id NOT IN (SELECT id FROM user)` |
| Slug uniqueness | `SELECT slug, COUNT(*) FROM memorial GROUP BY slug HAVING COUNT(*) > 1` |
| Media URL reachability | Spot-check 10% of `media.url` values with HEAD requests |
| Password reset flow | Test login with temp password for 3 sample users |

---

## 8. Auth Migration — Special Handling

Firebase Auth is **completely separate** from Firestore documents. The new system uses custom Argon2-hashed passwords with Lucia-style sessions.

### 8.1 Options

| Option | Approach | User Impact |
|--------|----------|-------------|
| **A: Force reset (Recommended)** | Generate random temp password, email reset link | Users must reset once |
| **B: Firebase Auth bridge** | Keep Firebase Auth temporarily, proxy validation | Complex, temporary |
| **C: Social re-auth** | If old site used Google/Facebook, add OAuth to new site | Seamless but scope creep |

### 8.2 Recommended Flow (Option A)

1. During migration, set `password_hash` to Argon2 hash of a random 32-char string
2. Store the random string nowhere (not recoverable)
3. After migration, send all users a "Welcome to the new Tributestream" email with a password reset link
4. Build a `/reset-password` route (not yet implemented)
5. Preserve `firebase_uid` on user record for audit trail

---

## 9. API Route Impact

Current API routes and their migration considerations:

| Route | Current Purpose | Migration Impact |
|-------|----------------|------------------|
| `POST /api/devices/create-token` | QR pairing | None — new feature |
| `POST /api/devices/validate` | Token validation | None — new feature |
| `PATCH /api/devices/[deviceId]/status` | Device status | None — new feature |
| `POST /api/livekit/token` | LiveKit room token | None — new feature |
| `POST /api/livekit/egress/start` | Start egress | None — new feature |
| `POST /api/livekit/egress/stop` | Stop egress | None — new feature |
| `POST /api/livekit/webhook` | LiveKit callbacks | None — new feature |
| `POST /api/streams/create` | Create Mux stream | None — new feature |
| `POST /api/streams/go-live` | Go live | None — new feature |
| `POST /api/streams/end` | End stream | None — new feature |
| `GET /[slug]` | Public memorial page | **Must load migrated memorial + tributes + blocks** |
| `GET /admin/memorials` | Memorial list | **Will show migrated records** |
| `POST /admin/memorials/new` | Create memorial | **Needs new columns in form** |
| `POST /admin/memorials/[id]` | Edit memorial | **Needs new columns in form** |

### New Routes Needed Post-Migration

| Route | Purpose |
|-------|---------|
| `GET/POST /api/tributes` | CRUD for migrated tributes |
| `GET /api/memorials/[id]/chat-history` | Load archived chat messages |
| `GET/POST /api/media` | Media upload + listing |
| `GET /reset-password` | Password reset page |
| `POST /api/auth/reset-password` | Password reset handler |

---

## 10. Rollback Plan

| Scenario | Action |
|----------|--------|
| Data corruption during load | Drop all Turso tables, re-run `drizzle-kit push`, re-import |
| Media URLs broken | Restore from `original_firebase_url` column |
| Auth issues | Firebase Auth remains live for 30 days post-cutover as fallback |
| Full rollback | Re-point DNS back to Firebase Hosting; Firestore is read-only but intact |

---

## 11. Migration Script Skeleton

```
scripts/
├── firestore-export.ts       # Connect to Firestore, export all collections to NDJSON
├── transform.ts              # Read NDJSON, apply field mappings, output INSERT-ready JSON
├── load.ts                   # Read transformed JSON, insert into Turso via Drizzle
├── migrate-media.ts          # Download from Firebase Storage, upload to new provider
├── validate.ts               # Run count checks, FK integrity, URL reachability
├── send-reset-emails.ts      # Email all migrated users with password reset links
└── utils/
    ├── id-remap.ts           # Map old Firestore IDs → new Turso IDs
    ├── slug-generator.ts     # Generate unique slugs for memorials
    └── timestamp-convert.ts  # Firestore Timestamp → Unix epoch integer
```

---

## 12. Open Questions

> Fill in answers as they are resolved.

| # | Question | Answer |
|---|----------|--------|
| 1 | What Firestore collections exist in the old project? List all top-level collections. | |
| 2 | Are there subcollections under `memorials`? (tributes, chat, blocks, etc.) | |
| 3 | Does the old site use Firebase Auth? Which providers (email/password, Google, etc.)? | |
| 4 | Does the old site use Firebase Storage? How much data (GB)? | |
| 5 | Is there a `funeralHomes` or multi-tenant structure? | |
| 6 | Is there billing/order data in Firestore or in a separate system (Stripe)? | |
| 7 | How many total users, memorials, and media files exist? | |
| 8 | Is there data we should **not** migrate (test data, spam, etc.)? | |
| 9 | What is the target cutover date? | |
| 10 | Should historical chat messages be preserved or only future chats? | |
| 11 | Are there any Firestore Security Rules that encode business logic we need to replicate? | |
| 12 | Does the old site have Cloud Functions? What do they do? | |

---

## 13. Checklist

### Pre-Migration
- [ ] Confirm Firestore schema (Section 3) with old codebase
- [ ] Fill in Open Questions (Section 12)
- [ ] Add new columns to `schema.ts` (Section 6.1)
- [ ] Add new tables to `schema.ts` (Section 6.2)
- [ ] Run `drizzle-kit generate` + `drizzle-kit push` for schema changes
- [ ] Build export script (`scripts/firestore-export.ts`)
- [ ] Build transform script (`scripts/transform.ts`)
- [ ] Build load script (`scripts/load.ts`)
- [ ] Build `/reset-password` route

### Migration Day
- [ ] Set Firestore to read-only (or disable old site writes)
- [ ] Run export
- [ ] Run transform
- [ ] Run load
- [ ] Run media migration
- [ ] Run validation
- [ ] Smoke test: login, view memorial, check images
- [ ] Send password reset emails
- [ ] Switch DNS

### Post-Migration
- [ ] Monitor error logs for 48 hours
- [ ] Verify no Firestore writes are occurring
- [ ] Confirm media CDN is serving correctly
- [ ] Schedule Firestore decommission (30 days post-cutover)
- [ ] Archive exported NDJSON files for compliance

---

*This is a living document. Update it as the old Firestore schema is confirmed and migration scripts are developed.*
