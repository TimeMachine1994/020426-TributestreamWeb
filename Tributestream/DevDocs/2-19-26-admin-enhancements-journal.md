# Admin Enhancements — Session Journal (Feb 19, 2026)

## Summary

Implemented a full admin enhancement sprint across 3 phases, covering user management, memorial visibility, booking management, and customer account creation on behalf of families.

---

## What Was Done

### Phase 1: Admin Visibility

#### 1.1 Users Page (wired up)
- **New file**: `src/routes/(protected)/admin/users/+page.server.ts`
- Loads all users from DB with memorial count per user (via GROUP BY)
- **Updated**: `src/routes/(protected)/admin/users/+page.svelte`
- Real table with columns: User (name + email + phone), Role (color-coded badge), Memorials (count), Created, Actions (View link → detail page)

#### 1.2 User Detail Page
- **New files**: `src/routes/(protected)/admin/users/[id]/+page.server.ts`, `+page.svelte`
- Shows user info card (name, email, phone, role, member since)
- Lists all memorials owned by that user with status badges, booking status, and links (Edit, Calculator, View)
- Admin actions: **Change Role** (dropdown + submit), **Reset Password** (generates new password, logs to console)

#### 1.3 Memorial List — Owner & Booking Columns
- **Updated**: `src/routes/(protected)/admin/memorials/+page.server.ts`
  - Added `lovedOneName`, `ownerId`, `calculatorConfigJson` to query
  - Added owner lookup (joins user table for name/email)
  - Returns `ownerName`, `hasBooking` per memorial
- **Updated**: `src/routes/(protected)/admin/memorials/+page.svelte`
  - New columns: Memorial (lovedOneName), Owner (linked to user detail), Booking (green badge or "None"), Scheduled
  - Actions now include: Edit | Calculator | View

#### 1.4 Dashboard Stats
- **New file**: `src/routes/(protected)/admin/+page.server.ts`
  - COUNT queries for: total memorials, scheduled, live, total users, active streams
- **Updated**: `src/routes/(protected)/admin/+page.svelte`
  - Replaced `--` placeholders with real numbers from DB

### Phase 2: Admin Actions

#### 2.1 Admin Edit Booking
- Already existed from prior work: memorial detail page has "Open Calculator" button and booking summary (tier, total, paid status)
- **Enhanced**: `src/routes/(protected)/admin/memorials/[id]/+page.server.ts`
  - Added owner lookup (id, email, displayName, phone)
- **Enhanced**: `src/routes/(protected)/admin/memorials/[id]/+page.svelte`
  - New "Family Contact" info card showing owner name, email (mailto link), phone, and "View Account" link
  - Shows `familyContactName/Email/Phone` from memorial record if present

#### 2.2 Create Memorial on Behalf of Customer
- **Updated**: `src/routes/(protected)/admin/memorials/new/+page.server.ts`
  - Added optional customer fields: `customerName`, `customerEmail`, `customerPhone`
  - If email provided: validates uniqueness, generates password, creates `family_member` user, sends registration email (stub), creates memorial owned by that user
  - If no email: behaves as before (admin-owned memorial)
- **Updated**: `src/routes/(protected)/admin/memorials/new/+page.svelte`
  - Added "Loved One's Name" field
  - Added "Customer Account" section with Name, Email, Phone fields
  - Descriptive help text explaining the optional account creation

#### 2.3 Admin Reset Customer Password
- Implemented in user detail page (`admin/users/[id]/+page.server.ts`)
- `resetPassword` action: generates random 12-char password, hashes with Argon2, updates DB, logs new password to console (stub email)
- UI: amber "Reset Password" button on user detail page

### Phase 3: Polish

#### 3.1 Nav Cleanup
- Billing and Audit placeholder pages already existed — no changes needed

#### 3.2 Memorial Detail — Richer View
- Owner/family contact info card added to memorial edit page (see 2.1 above)

---

## Files Changed

### New Files (4)
| File | Purpose |
|------|---------|
| `src/routes/(protected)/admin/+page.server.ts` | Dashboard stats queries |
| `src/routes/(protected)/admin/users/+page.server.ts` | Users list with memorial counts |
| `src/routes/(protected)/admin/users/[id]/+page.server.ts` | User detail + role change + password reset |
| `src/routes/(protected)/admin/users/[id]/+page.svelte` | User detail UI |

### Updated Files (6)
| File | Changes |
|------|---------|
| `admin/+page.svelte` | Real stats from DB |
| `admin/users/+page.svelte` | Full user table with data |
| `admin/memorials/+page.server.ts` | Owner + booking data |
| `admin/memorials/+page.svelte` | Owner, Booking columns + Calculator link |
| `admin/memorials/[id]/+page.server.ts` | Owner lookup |
| `admin/memorials/[id]/+page.svelte` | Family contact card |
| `admin/memorials/new/+page.server.ts` | Create-on-behalf logic |
| `admin/memorials/new/+page.svelte` | Customer account fields + loved one name |

---

## Earlier in This Session (Pre-Admin)

### username → email Rename (Site-wide)
- DB schema: renamed `username` → `email` (notNull, unique), added `displayName` and `phone` columns
- Updated 20+ files: login, register, admin, dashboard, demo lucia, device API, seed
- Pushed schema to Turso, re-seeded with email-based users

### Home Page Registration Flow
- New home page with "Create Memorial" and "Find a Memorial" hero cards
- `/register/loved-one` — public registration: collects name/email/phone, creates user + memorial, auto-login, redirects to memorial page
- 3-second delayed "Complete Booking" banner on memorial page → links to calculator
- `/search` — public memorial search with client-side filtering
- Stub email service (`src/lib/server/email.ts`)
- Updated public nav with Create Memorial + Search links

---

## Build Status
- `svelte-check`: **0 errors**, 11 warnings (all non-critical)
- Dev server running on `https://localhost:5173`
