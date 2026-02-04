# Videographer Journey - Work Breakdown Structure

**Last Updated:** February 4, 2026  
**Status:** ✅ Phase 1-8 Complete  
**Dev Server:** http://localhost:5176

---

## Overview

The Videographer Journey enables multi-device livestream production for memorial services. Videographers can pair multiple phone cameras via QR code, manage sources in a switcher console, and broadcast to Mux for live streaming.

---

## Architecture Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│   Memorial DB    │◀────│ Switcher Console│
│  (CRUD Memorials)│     │   (Drizzle/Turso)│     │  (Videographer) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                               ┌──────────────────────────┼──────────────────────────┐
                               │                          │                          │
                               ▼                          ▼                          ▼
                        ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
                        │ Phone Cam 1 │           │ Phone Cam 2 │           │ Phone Cam N │
                        │  (WebRTC)   │           │  (WebRTC)   │           │  (WebRTC)   │
                        └─────────────┘           └─────────────┘           └─────────────┘
                               │                          │                          │
                               └──────────────────────────┼──────────────────────────┘
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │  Mux Live     │
                                                  │  Streaming    │
                                                  └───────────────┘
```

---

## Work Breakdown Structure

### ✅ 1.0 Admin Memorial Management
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 1.1 | `src/lib/server/db/schema.ts` | Memorial table with `assignedVideographerId`, `muxStreamKey`, `muxPlaybackId`, `muxAssetId` |
| 1.2 | `src/routes/(protected)/admin/memorials/+page.server.ts` | Fetch all memorials with videographer names |
| 1.3 | `src/routes/(protected)/admin/memorials/+page.svelte` | Memorial list with status badges, actions |
| 1.4 | `src/routes/(protected)/admin/memorials/new/+page.server.ts` | Create memorial with videographer assignment |
| 1.5 | `src/routes/(protected)/admin/memorials/new/+page.svelte` | Form with auto-slug generation |
| 1.6 | `src/routes/(protected)/admin/memorials/[id]/+page.server.ts` | Update/delete memorial actions |
| 1.7 | `src/routes/(protected)/admin/memorials/[id]/+page.svelte` | Edit form with status selector, delete modal |

---

### ✅ 2.0 Videographer Memorial Selection
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 2.1 | `src/routes/(protected)/switcher/+layout.server.ts` | RBAC check with `canAccessSwitcher` |
| 2.2 | `src/routes/(protected)/switcher/+page.server.ts` | Fetch assigned memorials (admin sees all) |
| 2.3 | `src/routes/(protected)/switcher/+page.svelte` | Memorial cards with status, "Enter Production" links |

---

### ✅ 3.0 Switcher Console UI
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 3.1 | `src/routes/(protected)/switcher/[memorialId]/+page.server.ts` | Load memorial + devices, enforce access |
| 3.2 | `src/routes/(protected)/switcher/[memorialId]/+page.svelte` | Multiviewer with PVW/PGM monitors, source grid, sidebar |

**UI Features:**
- Header with memorial info, status badge, GO LIVE / END STREAM buttons
- Preview monitor (green border) with TAKE button
- Program monitor (red border) with LIVE indicator
- Source thumbnails grid (4 columns)
- Right sidebar: device list, stream info, edit link
- QR code modal trigger

---

### ✅ 4.0 QR Code Device Pairing
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 4.1 | `src/routes/api/devices/create-token/+server.ts` | Generate device token (5-min expiry) |
| 4.2 | `src/routes/api/devices/validate/+server.ts` | Validate token, return memorial info |
| 4.3 | `src/lib/components/QRCodeModal.svelte` | QR code display with countdown, auto-refresh |

**Token Flow:**
1. Videographer clicks "Add Camera" → POST `/api/devices/create-token`
2. Token stored in `device` table with `pending` status
3. QR code encodes: `{origin}/camera?token={token}`
4. Phone scans → validates → status updates to `connecting`

---

### ✅ 5.0 Phone Camera Contribution
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 5.1 | `src/routes/camera/+page.svelte` | Full-screen camera UI with token validation |

**Features:**
- Token validation on load
- Camera access request (rear-facing default)
- Flip camera button
- Battery level display
- Connection status indicator
- Memorial title display

---

### ✅ 6.0 WebRTC Signaling Infrastructure
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 6.1 | `src/lib/server/db/schema.ts` | `signalingMessage` table for offer/answer/ICE |
| 6.2 | `src/routes/api/signaling/send/+server.ts` | Store signaling messages |
| 6.3 | `src/routes/api/signaling/poll/+server.ts` | Fetch unconsumed messages, mark consumed |
| 6.4 | `src/lib/webrtc/signaling.ts` | `SignalingClient` class with polling |
| 6.5 | `src/lib/webrtc/peer.ts` | `WebRTCPeer` class wrapping RTCPeerConnection |

**Signaling Flow:**
1. Phone (initiator) creates offer → sends via `/api/signaling/send`
2. Switcher polls `/api/signaling/poll` → receives offer
3. Switcher creates answer → sends via `/api/signaling/send`
4. Both exchange ICE candidates
5. Connection established

---

### ✅ 7.0 Multiviewer Rendering
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 7.1 | `src/lib/components/DeviceStream.svelte` | WebRTC video receiver component |

**Component Features:**
- Auto-connects via `WebRTCPeer` (non-initiator mode)
- Connection state overlay (connecting/disconnected/failed)
- Device name label
- Status indicator dot

---

### ✅ 8.0 Mux Live Streaming Integration
**Status:** Complete

| Task | File | Description |
|------|------|-------------|
| 8.1 | `src/lib/server/mux.ts` | Mux client, `createLiveStream`, `deleteLiveStream`, helpers |
| 8.2 | `src/routes/api/streams/create/+server.ts` | Create Mux live stream, store keys in DB |
| 8.3 | `src/routes/api/streams/go-live/+server.ts` | Update memorial status to `live` |
| 8.4 | `src/routes/api/streams/end/+server.ts` | Update memorial status to `ended` |

**Mux Helpers:**
- `getPlaybackUrl(playbackId)` → HLS URL
- `getThumbnailUrl(playbackId)` → Thumbnail URL

---

## Database Schema

### Tables Created/Modified

```typescript
// user - existing, added role enum
// session - existing
// memorial - added: assignedVideographerId, muxStreamKey, muxPlaybackId, muxAssetId
// device - token-based pairing with status tracking
// signalingMessage - WebRTC offer/answer/ICE storage
// auditLog - SOC2 compliance logging
```

### Key Enums

```typescript
USER_ROLES = ['admin', 'funeral_director', 'videographer', 'family_member', 'contributor', 'viewer']
MEMORIAL_STATUSES = ['draft', 'scheduled', 'live', 'ended', 'archived']
DEVICE_STATUSES = ['pending', 'connecting', 'connected', 'disconnected', 'streaming']
```

---

## Environment Variables Required

```env
# Database (Turso)
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token

# Mux Live Streaming
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@mux/mux-node": "^x.x.x",
    "qrcode": "^x.x.x"
  },
  "devDependencies": {
    "@types/qrcode": "^x.x.x"
  }
}
```

---

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── DeviceStream.svelte      # WebRTC video receiver
│   │   └── QRCodeModal.svelte       # QR code pairing modal
│   ├── server/
│   │   ├── auth.ts                  # Session management
│   │   ├── db/
│   │   │   ├── index.ts             # Drizzle client
│   │   │   └── schema.ts            # All tables
│   │   └── mux.ts                   # Mux API client
│   └── webrtc/
│       ├── peer.ts                  # WebRTCPeer class
│       └── signaling.ts             # SignalingClient class
├── routes/
│   ├── api/
│   │   ├── devices/
│   │   │   ├── create-token/+server.ts
│   │   │   └── validate/+server.ts
│   │   ├── signaling/
│   │   │   ├── poll/+server.ts
│   │   │   └── send/+server.ts
│   │   └── streams/
│   │       ├── create/+server.ts
│   │       ├── end/+server.ts
│   │       └── go-live/+server.ts
│   ├── camera/
│   │   └── +page.svelte             # Phone camera UI
│   └── (protected)/
│       ├── admin/
│       │   └── memorials/           # Admin CRUD
│       └── switcher/
│           ├── +layout.server.ts    # RBAC
│           ├── +page.svelte         # Memorial list
│           └── [memorialId]/
│               └── +page.svelte     # Production console
```

---

## Testing Checklist

- [ ] Admin can create/edit/delete memorials
- [ ] Admin can assign videographer to memorial
- [ ] Videographer sees only assigned memorials
- [ ] QR code generates and displays correctly
- [ ] Phone validates token and gets memorial info
- [ ] Phone camera streams to switcher via WebRTC
- [ ] Multiple phones can connect simultaneously
- [ ] GO LIVE creates Mux stream and updates status
- [ ] END STREAM updates status to ended
- [ ] Playback URL works for viewers

---

## Next Steps (Future Phases)

1. **WebSocket Signaling** - Replace polling with real-time WebSocket for lower latency
2. **Audio Mixing** - Support for audio-only sources
3. **Recording** - Save streams as Mux assets
4. **Chat Integration** - Real-time chat during live streams
5. **Viewer Analytics** - Track concurrent viewers
6. **Mobile App** - Native camera app for better performance

---

## Commands

```bash
# Development
npm run dev

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed test data

# Build
npm run build
npm run preview
```
