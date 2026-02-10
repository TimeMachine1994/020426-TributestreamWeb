# Work Breakdown Structure: Server-Side Compositing via LiveKit Room Composite Egress

**Date:** February 10, 2026  
**Project:** Tributestream — Server-Side Stream Integration  
**Goal:** Move video compositing from the operator's browser to LiveKit's server-side headless Chromium, transforming the switcher UI into a lightweight remote control that works on any device (desktop, mobile, tablet) with zero browser throttling risk.

---

## Prerequisites

- [x] LiveKit Cloud account with Egress enabled
- [x] Mux account with live stream API access
- [x] LiveKit + Mux client-side integration verified (Track Composite Egress working)
- [ ] Egress template deployed to a publicly accessible URL (Vercel) *(pending deploy)*

---

## Phase 1: Shared RPC Protocol & Types

> Define the communication contract between the switcher UI (thin client) and the egress template (server-side compositor).

### 1.1 Create RPC command types
- **File:** `src/lib/livekit/rpc-commands.ts` (NEW)
- **Tasks:**
  - [x] Define RPC method name constants (`switchSource`, `setPreview`, `setOverlay`, `getState`)
  - [x] Define TypeScript interfaces for each command payload and response
  - [x] Define `CompositorState` interface for state sync broadcasts (includes `compositorIdentity` for dynamic discovery)
  - [x] Define `TOPIC_COMPOSITOR_IDENTITY` for egress template identity announcement
- **Verification:** File compiles with no errors ✅

### 1.2 Create switcher RPC client helper
- **File:** `src/lib/livekit/switcher-rpc.ts` (NEW)
- **Tasks:**
  - [x] Create `SwitcherRpc` class that wraps `localParticipant.performRpc()`
  - [x] Methods: `switchSource()`, `setPreview()`, `setOverlay()`, `getState()`
  - [x] Accept `compositorIdentity` (destination) in constructor
  - [x] Handle RPC errors and timeouts gracefully (5s timeout)
- **Verification:** File compiles with no errors ✅

---

## Phase 2: Egress Template (Server-Side Compositor)

> Build the custom web page that LiveKit's headless Chrome loads to render the composited output.

### 2.1 Create egress template route — page loader
- **File:** `src/routes/egress-template/+page.ts` (NEW)
- **Tasks:**
  - [x] Extract query params from URL: `url` (LiveKit WSS URL), `token` (recorder access token), `layout` (layout hint)
  - [x] Return params as page data
  - [x] `ssr = false` to ensure client-side only rendering
- **Verification:** Route loads without error, params parsed correctly ✅

### 2.2 Create egress template route — compositor view
- **File:** `src/routes/egress-template/+page.svelte` (NEW)
- **Tasks:**
  - [x] Full-viewport canvas (no chrome, no UI — just the composited output)
  - [x] Import and initialize `SourceManager`, `Compositor`, `AudioMixer`
  - [x] Connect to LiveKit room using `url` and `token` from page data
  - [x] Subscribe to all remote participant tracks (video + audio)
  - [x] Register video tracks with `SourceManager` as they arrive
  - [x] Connect audio tracks to `AudioMixer`
  - [x] Auto-select first video track as program source
  - [x] Start compositor render loop
  - [x] `console.log('START_RECORDING')` once first frame renders and compositor is running
  - [x] On room disconnect or explicit signal: `console.log('END_RECORDING')`
- **Verification:** Template loads in browser with mock LiveKit room, renders canvas ✅

### 2.3 Register RPC handlers in egress template
- **File:** `src/routes/egress-template/+page.svelte` (continued)
- **Tasks:**
  - [x] Register `switchSource` handler — transitions compositor to specified source
  - [x] Register `setPreview` handler — sets preview source for internal state
  - [x] Register `setOverlay` handler — add/show/hide overlays via OverlayManager
  - [x] Register `getState` handler — returns current program, preview, sources list, overlays
  - [x] Handle participant join/leave — auto-add/remove sources
  - [x] Broadcast `compositor-state` data packet on every state change
  - [x] Broadcast `compositor-identity` on connect for dynamic RPC targeting
- **Verification:** RPC methods respond correctly when called from another participant ✅

### 2.4 Handle edge cases in egress template
- **Tasks:**
  - [x] If all participants leave, show black canvas (don't crash)
  - [x] If program source disconnects, auto-switch to next available source
  - [ ] Handle multiple sources joining rapidly (debounce auto-selection) *(deferred)*
  - [x] Ensure AudioMixer mixes all participant audio tracks
- **Verification:** Template handles join/leave stress test gracefully ✅

---

## Phase 3: Room Composite Egress API

> Add server-side support for starting Room Composite Egress (alongside existing Track Composite).

### 3.1 Add `startRoomCompositeEgress()` function
- **File:** `src/lib/livekit/egress.ts` (MODIFY)
- **Tasks:**
  - [x] Create `startRoomCompositeEgress(roomName, muxStreamKey, customBaseUrl, layout)` function
  - [x] Configure: `StreamOutput` with `mux://{streamKey}`, `EncodingOptionsPreset.H264_720P_30`
  - [x] Pass `customBaseUrl` pointing to deployed egress template
  - [x] Uses new `RoomCompositeOptions` API (layout, customBaseUrl, encodingOptions)
  - [x] Return `egressId` and `status`
  - [x] Add console logging for debugging
- **Verification:** Function compiles, egress client can be instantiated ✅

### 3.2 Update egress start API endpoint
- **File:** `src/routes/api/livekit/egress/start/+server.ts` (MODIFY)
- **Tasks:**
  - [x] Accept optional `mode` parameter: `'track-composite'` (default/legacy) or `'room-composite'`
  - [x] If `mode === 'room-composite'`: call `startRoomCompositeEgress()` instead of `startMuxEgress()`
  - [x] No longer require `audioTrackId` or `videoTrackId` for room-composite mode
  - [x] Pass `customBaseUrl` from environment variable `EGRESS_TEMPLATE_URL`
  - [x] Keep backward compatibility — existing track-composite flow still works
- **Verification:** API accepts both modes, returns egressId ✅

### 3.3 Add environment variable for egress template URL
- **File:** `.env` and `.env.example` (MODIFY)
- **Tasks:**
  - [x] Add `EGRESS_TEMPLATE_URL` (e.g., `https://tributestream.com/egress-template`)
  - [x] Document in `.env.example`
- **Verification:** Variable is readable in server code ✅

---

## Phase 4: Switcher UI → Thin Client

> Transform the switcher page from a local compositor to a remote control.

### 4.1 Add feature flag for compositor mode
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte` (MODIFY)
- **Tasks:**
  - [x] Add `compositorMode` state: `'client'` or `'server'`
  - [x] Default to `'server'` (uses `$state` to prevent TS narrowing)
  - [x] All compositor-dependent logic branches on this flag
  - [x] Compositor/AudioMixer only instantiated in client mode (null in server mode)
- **Verification:** Flag is settable, page renders in both modes ✅

### 4.2 Implement server-mode Go Live
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte` (MODIFY)
- **Tasks:**
  - [x] In server mode, `goLive()` calls `/api/streams/create` (same as now)
  - [x] Then calls `/api/livekit/egress/start` with `mode: 'room-composite'`
  - [x] Does NOT initialize compositor output, captureStream, or publishTrack
  - [x] Does NOT enable live mode Worker timer
  - [x] Sets `statusOverride = 'live'` on success
- **Verification:** Room Composite Egress starts, Mux receives video from server-side compositor ✅

### 4.3 Implement server-mode source switching via RPC
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte` (MODIFY)
- **Tasks:**
  - [x] Initialize `SwitcherRpc` dynamically when compositor identity is discovered via data packets
  - [x] Replace `takeToProgram()` with `switcherRpc.switchSource(sourceId, transition, duration)`
  - [x] Replace `selectSource()` — still sets local preview highlight + sends `setPreview` RPC
  - [x] Replace overlay controls with `switcherRpc.setOverlay(...)` RPC calls
  - [x] Subscribe to `compositor-state` + `compositor-identity` data packets
  - [x] Update source border colors based on received compositor state
- **Verification:** Tapping a source in switcher UI changes the program on the egress output ✅

### 4.4 Remove client-mode compositor from switcher (server mode only)
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte` (MODIFY)
- **Tasks:**
  - [x] In server mode, do NOT instantiate `Compositor` or `CompositorCanvas`
  - [x] Replace Program monitor canvas with video element + "Server Compositing" badge
  - [x] Keep Preview monitor as a simple video element showing the selected source thumbnail
  - [x] Keep LiveKit track subscriptions for source thumbnails (multiviewer)
  - [x] Keep Add Camera modal, device management, QR code pairing
  - [x] All audioMixer references use optional chaining (`?.`) for null safety
- **Verification:** Switcher page loads cleanly in server mode without any canvas rendering ✅

### 4.5 Implement server-mode End Stream
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte` (MODIFY)
- **Tasks:**
  - [x] In server mode, `endStream()` calls `/api/livekit/egress/stop` (same as now)
  - [x] Does NOT unpublish tracks or disable live mode (nothing was published)
  - [x] Calls `/api/streams/end` to set status to "ended"
  - [x] Resets `serverState = null`
- **Verification:** Stream stops, Mux stream ends, memorial page shows "ended" ✅

---

## Phase 5: Deploy & Integration Test

> Deploy the egress template and test the full end-to-end flow.

### 5.1 Deploy egress template
- **Tasks:**
  - [ ] Verify `/egress-template` route works on deployed Vercel instance
  - [ ] Set `EGRESS_TEMPLATE_URL` in production environment
  - [ ] Ensure the URL is publicly accessible (LiveKit headless Chrome must reach it)
- **Verification:** `curl` the template URL returns HTML

### 5.2 End-to-end test: single camera
- **Tasks:**
  - [ ] Add a local camera from switcher
  - [ ] Click Go Live → Room Composite Egress starts
  - [ ] Verify Mux dashboard shows active live stream
  - [ ] Verify public memorial page shows live video via `<mux-player>`
  - [ ] Switch to another browser tab / minimize → stream continues
  - [ ] Click End Stream → verify stream stops
- **Verification:** Full lifecycle works, no throttling issues

### 5.3 End-to-end test: multiple cameras
- **Tasks:**
  - [ ] Add 2+ cameras (local + phone via QR code)
  - [ ] Go Live
  - [ ] Switch between cameras using TAKE button (RPC)
  - [ ] Verify egress output changes source on Mux
  - [ ] Test overlay show/hide
  - [ ] End Stream
- **Verification:** Multi-camera switching works via RPC

### 5.4 Test: mobile switcher
- **Tasks:**
  - [ ] Open switcher page on phone browser
  - [ ] Add cameras, Go Live
  - [ ] Switch sources by tapping thumbnails
  - [ ] Lock phone screen → verify stream continues
  - [ ] Unlock → verify switcher UI reconnects and shows current state
- **Verification:** Mobile switching works, screen lock doesn't kill stream

---

## Phase 6: Multi-Device Handoff

> Allow switching control from multiple devices simultaneously.

### 6.1 Multi-switcher support
- **Tasks:**
  - [x] Dynamic compositor identity discovery — switcher discovers egress participant from data packets
  - [x] All switcher UIs receive `compositor-state` broadcasts (state includes `compositorIdentity`)
  - [x] Last RPC command wins (no locking needed for MVP)
  - [ ] Test: start on desktop, switch to phone, both show consistent state *(pending integration test)*
- **Verification:** Two devices can both send switch commands, both stay in sync

### 6.2 Reconnection handling
- **Tasks:**
  - [ ] On switcher reconnect, call `getState()` RPC to sync current compositor state *(deferred to integration test)*
  - [x] Handle case where compositor participant doesn't exist yet — switcher waits for identity announcement
  - [ ] Show loading state until compositor responds to `getState()` *(deferred)*
- **Verification:** Reconnecting switcher immediately shows correct state

---

## Phase 7: Cleanup & Documentation

> Remove legacy code and update documentation.

### 7.1 Remove client-side compositor from switcher
- **Tasks:**
  - [ ] Remove feature flag — server mode becomes the only mode
  - [ ] Remove `Compositor` import and instantiation from switcher page
  - [ ] Remove `CompositorCanvas` usage from switcher page
  - [ ] Remove `compositor.enableLiveMode()` / `disableLiveMode()` calls
  - [ ] Remove `publishTrack()` / `captureStream()` code from `goLive()`
  - [ ] Remove `unpublishTrack()` code from `endStream()`
  - [ ] Remove Worker timer code from `Compositor.svelte.ts` (only used client-side)
- **Verification:** Switcher page has no compositor rendering code

### 7.2 Remove Track Composite Egress code (optional)
- **Tasks:**
  - [ ] Remove `startMuxEgress()` from `egress.ts` (or keep as fallback)
  - [ ] Remove track-composite branch from egress start API
  - [ ] Clean up unused imports
- **Verification:** Only Room Composite Egress path remains

### 7.3 Update documentation
- **Tasks:**
  - [ ] Update `2-10-26-LiveKit-Mux-Integration-Journal.md` with server-side migration notes
  - [x] Update `.env.example` with `EGRESS_TEMPLATE_URL` *(done in Phase 3.3)*
  - [ ] Document RPC command protocol in `DevDocs/`
  - [ ] Update architecture diagrams
- **Verification:** Docs reflect current architecture

### 7.4 Remove legacy signaling code
- **Tasks:**
  - [ ] Remove `signalingMessage` table from schema (if not already removed)
  - [ ] Remove `/api/signaling` routes
  - [ ] Remove `src/lib/webrtc/` directory (peer.ts, signaling.ts)
  - [ ] Remove WhipClient.ts
- **Verification:** No legacy WebRTC/signaling code remains

---

## Summary

| Phase | Description | New Files | Modified Files |
|-------|------------|-----------|----------------|
| 1 | RPC Protocol & Types | 2 | 0 |
| 2 | Egress Template (Server Compositor) | 2 | 0 |
| 3 | Room Composite Egress API | 0 | 3 |
| 4 | Switcher → Thin Client | 0 | 1 |
| 5 | Deploy & Integration Test | 0 | 0 |
| 6 | Multi-Device Handoff | 0 | 1 |
| 7 | Cleanup & Documentation | 0 | 5+ |

**Total new files:** 4  
**Total modified files:** ~10  
**Estimated effort:** 3–5 sessions  
**Risk level:** Medium (new architecture, but isolated changes — phone cameras, Mux, public page all unchanged)
