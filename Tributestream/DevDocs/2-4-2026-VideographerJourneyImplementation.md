# Videographer Journey — Work Breakdown Structure

## WBS Overview

```
1.0 Admin Memorial Management
2.0 Videographer Memorial Selection
3.0 Switcher Console UI
4.0 QR Code Device Pairing
5.0 Phone Camera Contribution
6.0 WebRTC Signaling Infrastructure
7.0 Multiviewer Rendering
8.0 Mux Live Streaming Integration
9.0 Testing & Polish
```

---

## 1.0 Admin Memorial Management

### 1.1 Memorial List Page
- [ ] 1.1.1 Create `/(protected)/admin/memorials/+page.server.ts` — fetch all memorials
- [ ] 1.1.2 Create memorial list table component with columns: title, slug, status, scheduled date, videographer
- [ ] 1.1.3 Add status badge component (draft/scheduled/live/ended/archived)
- [ ] 1.1.4 Add "New Memorial" button linking to creation form
- [ ] 1.1.5 Add edit/delete action buttons per row

### 1.2 Memorial Creation Form
- [ ] 1.2.1 Update `/(protected)/admin/memorials/new/+page.svelte` with full form
- [ ] 1.2.2 Add title input with validation
- [ ] 1.2.3 Add slug input with auto-generation from title
- [ ] 1.2.4 Add description textarea
- [ ] 1.2.5 Add date/time picker for scheduled_at
- [ ] 1.2.6 Add videographer dropdown (fetch users with videographer role)
- [ ] 1.2.7 Add chat enabled toggle
- [ ] 1.2.8 Implement form action to insert memorial

### 1.3 Memorial Edit Page
- [ ] 1.3.1 Create `/(protected)/admin/memorials/[id]/+page.server.ts` — fetch memorial by ID
- [ ] 1.3.2 Create edit form (reuse creation form component)
- [ ] 1.3.3 Implement update action
- [ ] 1.3.4 Add delete confirmation modal

### 1.4 Database Updates
- [ ] 1.4.1 Add `assignedVideographerId` column to memorial table
- [ ] 1.4.2 Run `npm run db:push` to sync schema

---

## 2.0 Videographer Memorial Selection

### 2.1 Memorial List for Videographer
- [ ] 2.1.1 Update `/(protected)/switcher/+page.server.ts` — fetch memorials assigned to current user
- [ ] 2.1.2 Create memorial card component showing: title, date, status
- [ ] 2.1.3 Filter to only show scheduled/live memorials
- [ ] 2.1.4 Add "Enter Production" button per memorial
- [ ] 2.1.5 Navigate to `/switcher/[memorialId]` on click

---

## 3.0 Switcher Console UI

### 3.1 Layout Structure
- [ ] 3.1.1 Create switcher console layout with grid: multiviewer (left), controls (right)
- [ ] 3.1.2 Add header with memorial title, status badge, back button
- [ ] 3.1.3 Add footer with stream health indicator, connection count

### 3.2 Multiviewer Component
- [ ] 3.2.1 Create `Multiviewer.svelte` — 2x2 or 3x2 grid of video slots
- [ ] 3.2.2 Each slot shows: video preview, device name, status indicator
- [ ] 3.2.3 Empty slots show "No source" placeholder
- [ ] 3.2.4 Click slot to select as preview source
- [ ] 3.2.5 Double-click to send to program (live output)

### 3.3 Preview/Program Monitors
- [ ] 3.3.1 Create larger preview monitor (selected source)
- [ ] 3.3.2 Create program monitor (what's going to Mux)
- [ ] 3.3.3 Add "Take" button to push preview → program
- [ ] 3.3.4 Add transition options (cut, fade) — stretch goal

### 3.4 Device Panel
- [ ] 3.4.1 Create `DevicePanel.svelte` — list of connected devices
- [ ] 3.4.2 Show device name, type icon, status, battery level
- [ ] 3.4.3 Add "Add Device" button to trigger QR modal
- [ ] 3.4.4 Add "Remove" button per device

### 3.5 Control Buttons
- [ ] 3.5.1 "Go Live" button — starts Mux stream
- [ ] 3.5.2 "End Stream" button — stops Mux stream
- [ ] 3.5.3 Confirmation modals for both actions
- [ ] 3.5.4 Update memorial status on go live/end

---

## 4.0 QR Code Device Pairing

### 4.1 Token Generation API
- [ ] 4.1.1 Create `/api/devices/create-token/+server.ts`
- [ ] 4.1.2 Generate unique token (crypto.randomUUID or nanoid)
- [ ] 4.1.3 Insert device record with status `pending`, token, memorial_id
- [ ] 4.1.4 Return token in response
- [ ] 4.1.5 Add token expiration (5 minutes)

### 4.2 QR Code Modal
- [ ] 4.2.1 Create `QRCodeModal.svelte`
- [ ] 4.2.2 Install QR code library (`qrcode` or `@bitjson/qr-code`)
- [ ] 4.2.3 Generate QR encoding: `https://[domain]/camera?token=[token]`
- [ ] 4.2.4 Show "Waiting for device..." spinner
- [ ] 4.2.5 Listen for device connection via WebSocket
- [ ] 4.2.6 Auto-close modal when device connects
- [ ] 4.2.7 Add "Cancel" button to close and invalidate token

### 4.3 Token Validation API
- [ ] 4.3.1 Create `/api/devices/validate/+server.ts`
- [ ] 4.3.2 Check token exists and not expired
- [ ] 4.3.3 Check token not already used
- [ ] 4.3.4 Return memorial info if valid
- [ ] 4.3.5 Return error if invalid/expired

---

## 5.0 Phone Camera Contribution

### 5.1 Camera Page UI
- [ ] 5.1.1 Update `/camera/+page.svelte` with token validation
- [ ] 5.1.2 Create loading state: "Validating..."
- [ ] 5.1.3 Create error state: "Invalid or expired link"
- [ ] 5.1.4 Create permission request UI with camera icon
- [ ] 5.1.5 Create permission denied state with instructions
- [ ] 5.1.6 Create connected state: video preview, status, battery

### 5.2 Camera Access
- [ ] 5.2.1 Request `getUserMedia({ video: true, audio: true })`
- [ ] 5.2.2 Use back camera by default: `facingMode: 'environment'`
- [ ] 5.2.3 Request HD resolution: `1920x1080` ideal
- [ ] 5.2.4 Handle permission denied gracefully
- [ ] 5.2.5 Show local video preview

### 5.3 Device Info Display
- [ ] 5.3.1 Show battery level using Battery API
- [ ] 5.3.2 Show connection status indicator (green/yellow/red)
- [ ] 5.3.3 Show memorial name being streamed to
- [ ] 5.3.4 Add "Disconnect" button

### 5.4 Camera Page Server
- [ ] 5.4.1 Create `/camera/+page.server.ts`
- [ ] 5.4.2 Validate token on page load
- [ ] 5.4.3 Return memorial info for display
- [ ] 5.4.4 Mark device as `connecting` in database

---

## 6.0 WebRTC Signaling Infrastructure

### 6.1 Signaling Service Setup
- [ ] 6.1.1 Choose provider: PartyKit / Ably / Pusher
- [ ] 6.1.2 Create account and get API keys
- [ ] 6.1.3 Add keys to `.env`
- [ ] 6.1.4 Install client SDK

### 6.2 Signaling Client (Switcher)
- [ ] 6.2.1 Create `$lib/signaling/switcher.ts`
- [ ] 6.2.2 Connect to signaling channel for memorial
- [ ] 6.2.3 Listen for `device-joined` events
- [ ] 6.2.4 Send WebRTC `offer` to new devices
- [ ] 6.2.5 Handle `answer` from devices
- [ ] 6.2.6 Exchange ICE candidates
- [ ] 6.2.7 Handle `device-left` events

### 6.3 Signaling Client (Phone)
- [ ] 6.3.1 Create `$lib/signaling/camera.ts`
- [ ] 6.3.2 Connect to signaling channel with device token
- [ ] 6.3.3 Send `device-joined` event
- [ ] 6.3.4 Wait for `offer` from switcher
- [ ] 6.3.5 Create `answer` and send back
- [ ] 6.3.6 Exchange ICE candidates
- [ ] 6.3.7 Send `device-left` on disconnect

### 6.4 TURN Server
- [ ] 6.4.1 Set up TURN server (Twilio / Metered / self-hosted coturn)
- [ ] 6.4.2 Add TURN credentials to `.env`
- [ ] 6.4.3 Include TURN in RTCPeerConnection config

---

## 7.0 Multiviewer Rendering

### 7.1 Stream Handling
- [ ] 7.1.1 Create `$lib/stores/switcher.svelte.ts` — Svelte 5 state
- [ ] 7.1.2 Track connected devices and their MediaStreams
- [ ] 7.1.3 Assign streams to multiviewer slots
- [ ] 7.1.4 Handle stream disconnect/reconnect

### 7.2 Video Rendering
- [ ] 7.2.1 Render `<video>` elements for each slot
- [ ] 7.2.2 Set `srcObject` to device MediaStream
- [ ] 7.2.3 Mute audio on multiviewer (prevent feedback)
- [ ] 7.2.4 Add click handler for source selection

### 7.3 Preview/Program Logic
- [ ] 7.3.1 Track `previewSource` and `programSource` in state
- [ ] 7.3.2 Render preview monitor with selected stream
- [ ] 7.3.3 Render program monitor with live stream
- [ ] 7.3.4 Implement "Take" to swap preview → program

---

## 8.0 Mux Live Streaming Integration

### 8.1 Mux API Setup
- [ ] 8.1.1 Create Mux account, get API credentials
- [ ] 8.1.2 Add `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` to `.env`
- [ ] 8.1.3 Install `@mux/mux-node` SDK
- [ ] 8.1.4 Create `$lib/server/mux.ts` — API client wrapper

### 8.2 Create Live Stream
- [ ] 8.2.1 Create `/api/mux/create-stream/+server.ts`
- [ ] 8.2.2 Call Mux API to create live stream
- [ ] 8.2.3 Store `stream_key` and `playback_id` in memorial record
- [ ] 8.2.4 Return stream info to client

### 8.3 Browser to Mux Pipeline
- [ ] 8.3.1 Research browser → Mux options (WHIP, MediaRecorder, relay)
- [ ] 8.3.2 Implement chosen approach
- [ ] 8.3.3 Send program source to Mux when "Go Live" clicked
- [ ] 8.3.4 Stop sending when "End Stream" clicked

### 8.4 Mux Webhooks
- [ ] 8.4.1 Create `/api/mux/webhook/+server.ts`
- [ ] 8.4.2 Verify webhook signature
- [ ] 8.4.3 Handle `video.live_stream.active` — update status to live
- [ ] 8.4.4 Handle `video.live_stream.idle` — update status to ended
- [ ] 8.4.5 Handle `video.asset.ready` — VOD available

### 8.5 Memorial Page Playback
- [ ] 8.5.1 Install `@mux/mux-player` or `@mux/mux-player-react` (check Svelte support)
- [ ] 8.5.2 Update `/[slug]/+page.svelte` to use Mux Player
- [ ] 8.5.3 Show player when status is `live`
- [ ] 8.5.4 Show "Starting soon" when status is `scheduled`
- [ ] 8.5.5 Show VOD when status is `ended` and asset exists

---

## 9.0 Testing & Polish

### 9.1 End-to-End Testing
- [ ] 9.1.1 Test full flow: create memorial → go live → view on memorial page
- [ ] 9.1.2 Test multi-device: connect 2-4 phones simultaneously
- [ ] 9.1.3 Test reconnection: disconnect phone, reconnect
- [ ] 9.1.4 Test on real mobile devices (iOS Safari, Android Chrome)

### 9.2 Error Handling
- [ ] 9.2.1 Handle WebRTC connection failures gracefully
- [ ] 9.2.2 Handle Mux API errors
- [ ] 9.2.3 Handle signaling disconnects
- [ ] 9.2.4 Show user-friendly error messages

### 9.3 UI Polish
- [ ] 9.3.1 Add loading spinners where needed
- [ ] 9.3.2 Add toast notifications for actions
- [ ] 9.3.3 Mobile-optimize camera page
- [ ] 9.3.4 Add keyboard shortcuts to switcher (1-4 for sources, space for take)

### 9.4 Performance
- [ ] 9.4.1 Optimize video rendering (requestAnimationFrame)
- [ ] 9.4.2 Monitor WebRTC stats (bitrate, packet loss)
- [ ] 9.4.3 Implement adaptive bitrate if needed

---

## Dependencies to Install

```bash
npm install qrcode @mux/mux-node
npm install -D @types/qrcode
```

Choose one signaling provider:
```bash
# Option A: PartyKit
npm install partykit partysocket

# Option B: Ably
npm install ably

# Option C: Pusher
npm install pusher pusher-js
```

---

## Environment Variables Needed

```env
# Existing
DATABASE_URL=
DATABASE_AUTH_TOKEN=

# New - Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# New - Signaling (choose one)
PARTYKIT_HOST=
# or
ABLY_API_KEY=
# or
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# New - TURN Server
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=
```

---

## Estimated Effort

| Section | Estimated Hours |
|---------|-----------------|
| 1.0 Admin Memorial Management | 4-6 |
| 2.0 Videographer Memorial Selection | 2-3 |
| 3.0 Switcher Console UI | 6-8 |
| 4.0 QR Code Device Pairing | 3-4 |
| 5.0 Phone Camera Contribution | 4-5 |
| 6.0 WebRTC Signaling Infrastructure | 6-8 |
| 7.0 Multiviewer Rendering | 4-6 |
| 8.0 Mux Live Streaming Integration | 6-8 |
| 9.0 Testing & Polish | 4-6 |
| **Total** | **39-54 hours** |
