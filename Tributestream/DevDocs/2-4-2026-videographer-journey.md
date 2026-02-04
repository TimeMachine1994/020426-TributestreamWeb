# Videographer Journey — Implementation Breakdown

## Overview

This document outlines the complete flow from memorial creation to live streaming, broken into implementable components.

---

## Phase 1: Admin Creates Memorial

### Components Needed

- **`/(protected)/admin/memorials/new`** — Memorial creation form
  - Title, slug, description
  - Scheduled date/time picker
  - Assigned videographer (dropdown of users with videographer role)
  - Chat enabled toggle
  - Save to `memorial` table

- **`/(protected)/admin/memorials`** — Memorial list/management
  - Table view of all memorials
  - Status badges (draft, scheduled, live, ended, archived)
  - Edit/delete actions

### Database

```
memorial
├── id
├── slug (unique, URL-friendly)
├── title
├── description
├── scheduled_at
├── status (draft → scheduled → live → ended → archived)
├── assigned_videographer_id (FK → user.id)
├── chat_enabled
├── mux_stream_key
├── mux_playback_id
└── created_at
```

---

## Phase 2: Videographer Selects Memorial

### Components Needed

- **`/(protected)/switcher`** — Memorial selection page
  - List of memorials assigned to logged-in videographer
  - Filter by status (scheduled, live)
  - "Enter Production" button → navigates to switcher console

### API/Logic

- Query memorials where `assigned_videographer_id = currentUser.id`
- Only show memorials with status `scheduled` or `live`

---

## Phase 3: Switcher Console

### Components Needed

- **`/(protected)/switcher/[memorialId]`** — Production console
  - **Header**: Memorial title, status, go live/end stream buttons
  - **Multiviewer**: Grid of camera sources (2x2 or 3x2)
  - **Preview Monitor**: Currently selected source (larger view)
  - **Program Monitor**: What's going out to Mux (if live)
  - **Device Panel**: List of connected devices with status
  - **Add Device Button**: Opens QR code modal

### State Management

```typescript
interface SwitcherState {
  memorialId: string;
  devices: Device[];           // Connected camera devices
  selectedSource: string | null;  // Device ID shown in preview
  programSource: string | null;   // Device ID going to Mux
  isLive: boolean;
  streamHealth: 'good' | 'degraded' | 'poor';
}

interface Device {
  id: string;
  name: string;
  type: 'phone' | 'webcam' | 'rtmp';
  status: 'connecting' | 'connected' | 'disconnected';
  stream: MediaStream | null;
  batteryLevel?: number;
}
```

---

## Phase 4: QR Code Device Pairing

### Components Needed

- **QR Code Modal** (in switcher console)
  - Generates unique device token
  - Displays QR code encoding: `https://[domain]/camera?token=[token]&memorial=[id]`
  - Shows "Waiting for device..." status
  - Auto-closes when device connects

- **`/api/devices/create-token`** — Server endpoint
  - Creates a device record with status `pending`
  - Returns token (short-lived, single-use)

### Database

```
device
├── id
├── memorial_id (FK → memorial.id)
├── token (unique, expires after use)
├── name (set by phone after connection)
├── type (phone, webcam, rtmp)
├── status (pending → connecting → connected → disconnected)
├── created_at
└── connected_at
```

---

## Phase 5: Phone Camera Page

### Components Needed

- **`/camera`** — Phone camera contribution page
  - Validates token from URL params
  - Requests camera/microphone permissions
  - Shows permission denied error if rejected
  - On success: establishes WebRTC connection to switcher
  - Displays: connection status, battery level, streaming indicator

### Flow

```
1. Phone scans QR → opens /camera?token=abc123&memorial=xyz
2. Page validates token against database
3. If valid → request getUserMedia (camera + mic)
4. If granted → establish WebRTC peer connection
5. Send video stream to switcher via WebRTC
6. Update device status to 'connected'
7. Display "Streaming to [Memorial Name]" confirmation
```

### UI States

- **Loading**: Validating token...
- **Permission Request**: "Allow camera access to stream"
- **Permission Denied**: "Camera access required. Please allow and refresh."
- **Connecting**: "Connecting to switcher..."
- **Connected**: Green indicator, battery level, "Streaming to [Memorial]"
- **Disconnected**: "Connection lost. Reconnecting..."

---

## Phase 6: WebRTC Signaling

### Components Needed

- **WebSocket Server** — Real-time signaling
  - Rooms per memorial: `memorial:[memorialId]`
  - Message types: `offer`, `answer`, `ice-candidate`, `device-joined`, `device-left`

- **`/api/signaling`** — WebSocket endpoint (or use Vercel Edge with Durable Objects alternative)

### Signaling Flow

```
PHONE                          SERVER                         SWITCHER
  |                              |                               |
  |-- join(token, memorialId) -->|                               |
  |                              |-- device-joined ------------->|
  |                              |                               |
  |                              |<-- offer (SDP) ---------------|
  |<-- offer (SDP) --------------|                               |
  |                              |                               |
  |-- answer (SDP) ------------->|                               |
  |                              |-- answer (SDP) -------------->|
  |                              |                               |
  |<-- ice-candidate ------------|-- ice-candidate ------------->|
  |-- ice-candidate ------------>|                               |
  |                              |                               |
  [WebRTC P2P connection established]
```

### Tech Options

| Option | Pros | Cons |
|--------|------|------|
| **Socket.io** | Easy, well-documented | Needs persistent server (not Vercel) |
| **Ably/Pusher** | Managed, scales | Cost, dependency |
| **PartyKit** | Vercel-friendly, edge | Newer, less docs |
| **Liveblocks** | Real-time state | Overkill for signaling |

**Recommendation**: PartyKit (Vercel-native) or Ably (proven, generous free tier)

---

## Phase 7: Go Live to Mux

### Components Needed

- **Mux API Integration**
  - Create live stream → get stream key + playback ID
  - Store in memorial record
  - Monitor stream health

- **Browser → Mux Pipeline**
  - Option A: Send WebRTC stream to server → RTMP to Mux
  - Option B: Use Mux's WebRTC input (if available)
  - Option C: MediaRecorder → chunked upload to Mux

### Flow

```
1. Videographer clicks "Go Live"
2. Server creates Mux live stream (if not exists)
3. Server returns RTMP URL + stream key
4. Switcher sends selected source to Mux via:
   - WebRTC → Server → RTMP relay
   - Or direct browser-to-Mux (if supported)
5. Mux provides HLS playback URL
6. Memorial page shows live stream via Mux Player
```

---

## Implementation Order

1. **Admin memorial CRUD** — Create/edit/list memorials
2. **Videographer memorial list** — See assigned memorials
3. **Switcher console UI** — Basic layout with placeholders
4. **QR code generation** — Device tokens + QR display
5. **Camera page** — Permission handling + video preview
6. **WebRTC signaling** — PartyKit or Ably setup
7. **WebRTC peer connection** — Phone ↔ Switcher video
8. **Multiviewer rendering** — Display connected streams
9. **Mux integration** — Go live functionality
10. **Stream health monitoring** — Status indicators

---

## File Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── mux.ts              # Mux API client
│   │   └── signaling.ts        # WebSocket/signaling logic
│   ├── stores/
│   │   └── switcher.svelte.ts  # Switcher state (Svelte 5 runes)
│   └── components/
│       ├── Multiviewer.svelte
│       ├── DevicePanel.svelte
│       ├── QRCodeModal.svelte
│       └── StreamHealth.svelte
├── routes/
│   ├── (protected)/
│   │   ├── admin/
│   │   │   └── memorials/
│   │   │       ├── +page.svelte        # List
│   │   │       ├── new/+page.svelte    # Create
│   │   │       └── [id]/+page.svelte   # Edit
│   │   └── switcher/
│   │       ├── +page.svelte            # Memorial selection
│   │       └── [memorialId]/
│   │           └── +page.svelte        # Production console
│   ├── camera/
│   │   └── +page.svelte                # Phone camera contribution
│   └── api/
│       ├── devices/
│       │   ├── create-token/+server.ts
│       │   └── [id]/+server.ts
│       └── mux/
│           └── webhook/+server.ts
```

---

## Questions to Resolve

1. **Signaling service**: PartyKit, Ably, or self-hosted Socket.io?
2. **TURN server**: Needed for NAT traversal — use Twilio TURN or self-host?
3. **Max devices per memorial**: Limit to 4? 6? Configurable?
4. **Recording**: Save raw camera feeds or just Mux recording?
5. **Fallback**: What if WebRTC fails? RTMP from OBS as backup?
