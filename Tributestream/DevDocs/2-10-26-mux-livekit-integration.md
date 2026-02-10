# Mux + LiveKit Integration - Work Breakdown Structure

**Created:** February 10, 2026  
**Status:** 🔵 Planning  
**Depends On:** Video Switcher & Compositor WBS ✅ Complete, Videographer Journey ✅ Complete

---

## Overview

Complete the LiveKit integration to replace the non-functional WHIP ingest approach. The codebase is ~80% wired — all LiveKit client code, server SDK helpers, API routes, compositor pipeline, and UI components exist. The remaining work is configuration, credential setup, verification, cleanup of legacy code, and end-to-end testing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHONE (Camera Page)                                  │
│  getUserMedia → LiveKitRoom.connect() → publishTrack(video+audio)           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ WebRTC (via LiveKit Cloud / Server)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LIVEKIT ROOM (memorial-{id})                           │
│  Manages WebRTC transport, SFU routing, track subscriptions                  │
└──────────┬──────────────────────────────────┬───────────────────────────────┘
           │ Subscribe to camera tracks        │ Egress (RTMP)
           ▼                                   ▼
┌──────────────────────────────┐  ┌───────────────────────────────────────────┐
│   SWITCHER (Compositor)       │  │              MUX                           │
│                               │  │  Receives RTMP via mux://{streamKey}       │
│  onTrackSubscribed            │  │  Transcodes → HLS playback                 │
│  → SourceManager.addSource()  │  │  playbackId → public viewer page           │
│  → Compositor canvas render   │  └───────────────────────────────────────────┘
│  → canvas.captureStream()     │
│  → publishTrack(composited)   │──── published to LiveKit room
│  → API: egress/start          │──── triggers TrackCompositeEgress → Mux
└──────────────────────────────┘
```

---

## Phase 1: Environment & Credentials Setup

**Goal:** Get valid LiveKit and Mux credentials configured.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.1 | Fix `.env` variable names: rename `livekit_websocket_url` → `LIVEKIT_URL`, split `livekit_secret_token` → `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` | `.env` | ⬜ |
| 1.2 | Obtain LiveKit Cloud credentials (sign up at cloud.livekit.io, create project) **OR** generate local keys with `livekit-server generate-keys` | `.env` | ⬜ |
| 1.3 | Verify `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set and valid | `.env` | ⬜ |
| 1.4 | Add `MUX_WEBHOOK_SECRET` to `.env.example` for documentation | `.env.example` | ⬜ |
| 1.5 | Decide: LiveKit Cloud vs local `livekit-server --dev` for development | — | ⬜ |

**Verification:**
- `npm run dev` starts without credential warnings in console
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` all read correctly by `src/lib/livekit/token.ts`

---

## Phase 2: LiveKit Server Configuration

**Goal:** Ensure LiveKit server/cloud is reachable and webhook is configured.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 2.1 | **If using LiveKit Cloud:** Configure webhook URL to `https://<domain>/api/livekit/webhook` in LiveKit dashboard | LiveKit Cloud Dashboard | ⬜ |
| 2.2 | **If using local `livekit-server`:** Start with `livekit-server --dev --bind 0.0.0.0` and set `LIVEKIT_URL=ws://localhost:7880` | `.env` | ⬜ |
| 2.3 | **Optional:** Install `lk` CLI for debugging: `curl -sSL https://get.livekit.io/cli \| bash` | — | ⬜ |
| 2.4 | Test connectivity: verify switcher page shows green "LiveKit" indicator in header after login | Browser | ⬜ |

**Verification:**
- Switcher page header shows green dot + "LiveKit" text (not red "LiveKit Off")
- Console logs: `[Switcher] Connected to LiveKit room: memorial-{id}`

---

## Phase 3: Camera Ingest Verification

**Goal:** Verify phone cameras can publish tracks to LiveKit and switcher receives them.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 3.1 | Open switcher, click "Add Camera" → "Use Local Camera" → verify stream appears in source grid | `AddCameraModal.svelte`, `+page.svelte` | ⬜ |
| 3.2 | Click "Add Camera" → QR code → scan with phone → verify phone camera page loads | `AddCameraModal.svelte`, `create-token/+server.ts` | ⬜ |
| 3.3 | On phone: verify camera preview shows, LiveKit connects (green dot), tracks publish | `camera/+page.svelte` | ⬜ |
| 3.4 | On switcher: verify remote camera appears in source grid via `onTrackSubscribed` | `+page.svelte` lines 85-112 | ⬜ |
| 3.5 | Select remote source → click TAKE → verify it renders in Program monitor | `Compositor.svelte.ts`, `SourceManager.svelte.ts` | ⬜ |
| 3.6 | Test camera flip on phone (front/back) — tracks should unpublish/republish | `camera/+page.svelte` `flipCamera()` | ⬜ |
| 3.7 | Test multiple cameras simultaneously (2-3 phones) | — | ⬜ |

**Verification:**
- Remote camera video visible in switcher source grid
- Console: `[Switcher] Track subscribed: video from {deviceId}`
- Selecting source and TAKE renders it in Program canvas

---

## Phase 4: Go Live — Mux Egress Verification

**Goal:** Verify the full Go Live flow: Mux stream creation → compositor publish → LiveKit Egress → Mux RTMP.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4.1 | Ensure at least one source is in Program monitor before clicking GO LIVE | — | ⬜ |
| 4.2 | Click GO LIVE → verify Mux stream created (`/api/streams/create`) | `streams/create/+server.ts`, `mux.ts` | ⬜ |
| 4.3 | Verify memorial status set to "live" (`/api/streams/go-live`) | `streams/go-live/+server.ts` | ⬜ |
| 4.4 | Verify compositor output + audio mixer published to LiveKit room | `+page.svelte` `goLive()` lines 266-306 | ⬜ |
| 4.5 | Verify egress started (`/api/livekit/egress/start` → `startMuxEgress()`) | `egress/start/+server.ts`, `egress.ts` | ⬜ |
| 4.6 | Check Mux dashboard — stream should show as "Active" with video | Mux Dashboard | ⬜ |
| 4.7 | Verify playback URL works: `https://stream.mux.com/{playbackId}.m3u8` | Browser / VLC | ⬜ |
| 4.8 | Verify webhook fires: `egress_started` event updates memorial `egressId` in DB | `webhook/+server.ts` | ⬜ |

**Verification:**
- Header shows "LIVE" badge with red pulse
- Mux dashboard shows active stream
- HLS playback URL serves video
- Console: `[Switcher] Egress started! ID: {egressId}`

---

## Phase 5: End Stream Verification

**Goal:** Verify clean stream shutdown.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 5.1 | Click END STREAM → verify egress stopped (`/api/livekit/egress/stop`) | `egress/stop/+server.ts`, `egress.ts` | ⬜ |
| 5.2 | Verify composited tracks unpublished from LiveKit | `+page.svelte` `endStream()` lines 357-367 | ⬜ |
| 5.3 | Verify memorial status set to "ended" (`/api/streams/end`) | `streams/end/+server.ts` | ⬜ |
| 5.4 | Verify webhook fires: `egress_ended` clears `egressId` in DB | `webhook/+server.ts` | ⬜ |
| 5.5 | Verify Mux stream transitions to "Idle" then creates asset | Mux Dashboard | ⬜ |

**Verification:**
- Header shows "ENDED" badge
- Console: `[Switcher] Stopping egress: {egressId}`
- Mux dashboard shows stream ended, asset created for VOD

---

## Phase 6: Device Lifecycle & Edge Cases

**Goal:** Verify device management, reconnection, and error handling.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 6.1 | Test phone disconnect (close browser tab) → verify `participant_left` webhook updates DB | `webhook/+server.ts`, `+page.svelte` `onParticipantDisconnected` | ⬜ |
| 6.2 | Test phone reconnect (reopen camera URL) → verify re-joins room | `camera/+page.svelte` | ⬜ |
| 6.3 | Test "Remove device" button on switcher → verify source removed + DB cleaned | `+page.svelte` `removeDevice()` | ⬜ |
| 6.4 | Test stale device cleanup on switcher page load | `+page.server.ts` lines 24-60 | ⬜ |
| 6.5 | Test expired QR token → phone should show error message | `validate/+server.ts` | ⬜ |
| 6.6 | Test GO LIVE without LiveKit connected → should show error | `+page.svelte` `goLive()` line 275 | ⬜ |
| 6.7 | Test GO LIVE without source in Program → should show error | `+page.svelte` `goLive()` line 271 | ⬜ |

**Verification:**
- All error states show user-friendly messages
- Device status correctly reflects in sidebar and source grid
- No orphaned devices in database after disconnect

---

## Phase 7: Legacy Cleanup (Non-Blocking)

**Goal:** Remove unused WebRTC polling code and signaling table.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 7.1 | Remove `signalingMessage` table from schema | `src/lib/server/db/schema.ts` lines 96-113 | ⬜ |
| 7.2 | Create migration to drop `signaling_message` table | `drizzle-kit generate` | ⬜ |
| 7.3 | Remove signaling message cleanup from device delete API | `api/devices/[deviceId]/+server.ts` lines 31-33 | ⬜ |
| 7.4 | Remove signaling message cleanup from switcher page loader | `+page.server.ts` line 56 | ⬜ |
| 7.5 | Audit for any remaining references to `signalingMessage` | `grep -r signalingMessage src/` | ⬜ |

**Verification:**
- `npm run check` passes with no type errors
- `npm run db:push` applies schema without errors
- No references to `signalingMessage` remain in source

---

## Phase 8: Production Readiness (Future)

**Goal:** Prepare for production deployment.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 8.1 | Switch from local `livekit-server` to LiveKit Cloud | `.env` | ⬜ |
| 8.2 | Configure LiveKit Cloud webhook URL for production domain | LiveKit Dashboard | ⬜ |
| 8.3 | Configure Mux webhook URL for production domain | Mux Dashboard | ⬜ |
| 8.4 | Add TURN server configuration for restrictive networks | LiveKit Cloud (built-in) or self-hosted | ⬜ |
| 8.5 | Load test with 4+ simultaneous camera sources | — | ⬜ |
| 8.6 | Verify HTTPS camera access works on real phones (not just localhost) | `vite.config.ts` (basicSsl plugin already present) | ⬜ |
| 8.7 | Add error monitoring / alerting for egress failures | — | ⬜ |
| 8.8 | Document deployment runbook | `DevDocs/` | ⬜ |

---

## Execution Order

```
Phase 1 (Env Setup)     ──▶ Phase 2 (LiveKit Server)  ──▶ Phase 3 (Camera Ingest)
                                                              │
                                                              ▼
Phase 7 (Cleanup)  ◀──  Phase 6 (Edge Cases)  ◀──  Phase 5 (End Stream)  ◀──  Phase 4 (Go Live)
                                                                                    │
                                                                                    ▼
                                                                              Phase 8 (Production)
```

**Critical path:** Phases 1 → 2 → 3 → 4 (everything else can be done in parallel after Phase 4)

---

## File Inventory

### Files Already Complete (No Changes Needed)

| File | Purpose |
|------|---------|
| `src/lib/livekit/client.ts` | LiveKit Room wrapper — connect, publish, subscribe, events |
| `src/lib/livekit/token.ts` | Server-side token generation — camera (publish-only) + switcher (pub+sub) |
| `src/lib/livekit/egress.ts` | Server-side egress — start/stop/list via `mux://{streamKey}` RTMP |
| `src/lib/components/LiveKitDeviceStream.svelte` | Remote device video renderer with status overlay |
| `src/lib/components/CompositorCanvas.svelte` | Canvas display component (preview/program) |
| `src/lib/components/AddCameraModal.svelte` | QR code generation + local camera modal |
| `src/lib/compositor/Compositor.svelte.ts` | Canvas 2D render loop, transitions, overlays, `captureStream()` |
| `src/lib/compositor/SourceManager.svelte.ts` | Reactive source registry with `SvelteMap` |
| `src/lib/compositor/AudioMixer.ts` | Web Audio API mixer with per-source gain |
| `src/lib/compositor/TransitionEngine.ts` | Cut/fade transition state machine |
| `src/lib/compositor/OverlayManager.ts` | Lower-third + image overlays |
| `src/lib/compositor/types.ts` | Shared TypeScript types |
| `src/lib/server/mux.ts` | Mux API client — create/delete/status/playback URLs |
| `src/lib/server/db/schema.ts` | DB schema with `livekitRoomName`, `egressId` fields |
| `src/routes/api/livekit/token/+server.ts` | POST — generate LiveKit join token |
| `src/routes/api/livekit/egress/start/+server.ts` | POST — start track composite egress |
| `src/routes/api/livekit/egress/stop/+server.ts` | POST — stop egress |
| `src/routes/api/livekit/webhook/+server.ts` | POST — handle egress + participant lifecycle events |
| `src/routes/api/streams/create/+server.ts` | POST — create Mux live stream |
| `src/routes/api/streams/go-live/+server.ts` | POST — set memorial status to live |
| `src/routes/api/streams/end/+server.ts` | POST — set memorial status to ended |
| `src/routes/api/devices/create-token/+server.ts` | POST — generate device pairing token |
| `src/routes/api/devices/validate/+server.ts` | POST — validate token, return LiveKit creds |
| `src/routes/api/devices/[deviceId]/status/+server.ts` | GET/PATCH — device status |
| `src/routes/api/devices/[deviceId]/+server.ts` | DELETE — remove device |
| `src/routes/api/devices/cleanup/+server.ts` | POST — cleanup stale devices |
| `src/routes/camera/+page.svelte` | Phone camera page — validate, connect LiveKit, publish tracks |
| `src/routes/(protected)/switcher/[memorialId]/+page.svelte` | Switcher console — subscribe, compose, egress |
| `src/routes/(protected)/switcher/[memorialId]/+page.server.ts` | Server load — device cleanup + active device list |

### Files Needing Minor Changes

| File | Change | Phase |
|------|--------|-------|
| `.env` | Rename/add `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | 1 |
| `.env.example` | Add `MUX_WEBHOOK_SECRET=""` | 1 |

### Files Needing Cleanup (Phase 7)

| File | Change |
|------|--------|
| `src/lib/server/db/schema.ts` | Remove `signalingMessage` table (lines 96-113) |
| `src/routes/api/devices/[deviceId]/+server.ts` | Remove signaling message delete (lines 31-33) |
| `src/routes/(protected)/switcher/[memorialId]/+page.server.ts` | Remove signaling cleanup (line 56) |

### No New Files Required

All necessary files already exist in the codebase.
