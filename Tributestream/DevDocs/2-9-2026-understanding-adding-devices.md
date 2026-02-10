# Understanding Adding Devices — Work Breakdown Structure

**Created:** February 9, 2026  
**Status:** 📚 Documentation  
**Purpose:** Technical reference for QR code device pairing and WebRTC connection flow

---

## Overview

The device pairing system allows videographers to connect phone cameras to the switcher console via QR code scanning. This creates a WebRTC peer-to-peer connection between the phone and the switcher, enabling real-time video streaming for live production.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVICE PAIRING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   SWITCHER   │         │    SERVER    │         │    PHONE     │        │
│  │   CONSOLE    │         │   (API/DB)   │         │   CAMERA     │        │
│  └──────┬───────┘         └──────┬───────┘         └──────┬───────┘        │
│         │                        │                        │                 │
│         │  1. Generate Token     │                        │                 │
│         │ ──────────────────────>│                        │                 │
│         │                        │                        │                 │
│         │  2. Token + Expiry     │                        │                 │
│         │ <──────────────────────│                        │                 │
│         │                        │                        │                 │
│         │  3. Display QR Code    │                        │                 │
│         │  (encodes camera URL)  │                        │                 │
│         │                        │                        │                 │
│         │                        │  4. Scan QR → Navigate │                 │
│         │                        │ <──────────────────────│                 │
│         │                        │                        │                 │
│         │                        │  5. Validate Token     │                 │
│         │                        │ <──────────────────────│                 │
│         │                        │                        │                 │
│         │                        │  6. Device ID + Info   │                 │
│         │                        │ ──────────────────────>│                 │
│         │                        │                        │                 │
│         │                        │  7. WebRTC Offer       │                 │
│         │                        │ <──────────────────────│                 │
│         │                        │                        │                 │
│         │  8. Poll for Offer     │                        │                 │
│         │ ──────────────────────>│                        │                 │
│         │                        │                        │                 │
│         │  9. WebRTC Answer      │                        │                 │
│         │ ──────────────────────>│                        │                 │
│         │                        │                        │                 │
│         │                        │  10. Poll for Answer   │                 │
│         │                        │ ──────────────────────>│                 │
│         │                        │                        │                 │
│         │  11. ICE Candidates    │  (bidirectional)       │                 │
│         │ <─────────────────────>│<─────────────────────> │                 │
│         │                        │                        │                 │
│         │  ═══════════════════════════════════════════════│                 │
│         │         12. WebRTC P2P Connection Established   │                 │
│         │  ═══════════════════════════════════════════════│                 │
│         │                        │                        │                 │
└─────────┴────────────────────────┴────────────────────────┴─────────────────┘
```

---

## Components

### 1. Token Generation

**File:** `src/routes/api/devices/create-token/+server.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/devices/create-token` |
| **Auth** | Required (videographer or admin) |
| **Input** | `{ memorialId: string }` |
| **Output** | `{ token: string, expiresAt: string }` |

**Flow:**
1. Verify user is authenticated
2. Verify user has access to the memorial (admin or assigned videographer)
3. Generate 32-character hex token via `crypto.getRandomValues()`
4. Create device record with `status: 'pending'` and 5-minute expiry
5. Return token and expiry timestamp

**Database Record Created:**
```typescript
{
  id: string,           // 30-char hex ID
  token: string,        // 32-char hex token
  memorialId: string,   // FK to memorial
  userId: string,       // FK to user who created it
  status: 'pending',    // Initial status
  tokenExpiresAt: Date, // 5 minutes from creation
  createdAt: Date
}
```

---

### 2. QR Code Display

**File:** `src/lib/components/AddCameraModal.svelte`

| State | Description |
|-------|-------------|
| `mode` | `'choose' | 'qr' | 'local'` — Current modal view |
| `token` | The generated pairing token |
| `qrCodeDataUrl` | Base64 data URL of QR code image |
| `timeRemaining` | Countdown seconds until token expires |

**QR Code Content:**
```
{origin}/camera?token={token}
```

**⚠️ Known Issue:** If accessed via `localhost`, the QR code encodes `http://localhost:5174/camera?token=...` which the phone cannot reach. **Solution:** Access the switcher via network IP (e.g., `http://192.168.1.17:5174`).

**Auto-Refresh:** When `timeRemaining` reaches 0, `generateToken()` is called automatically to create a fresh token.

---

### 3. Token Validation

**File:** `src/routes/api/devices/validate/+server.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/devices/validate` |
| **Auth** | None (token acts as auth) |
| **Input** | `{ token: string }` |
| **Output** | `{ deviceId: string, memorial: { id, title, slug } }` |

**Flow:**
1. Look up device by token where `tokenExpiresAt > now`
2. Verify status is `'pending'` (not already used)
3. Fetch memorial info
4. Update device status to `'connecting'`
5. Return device ID and memorial info

**Error Cases:**
- `400` — Token missing, invalid, or expired
- `400` — Token already used (status !== 'pending')
- `404` — Memorial not found

---

### 4. Phone Camera Page

**File:** `src/routes/camera/+page.svelte`

| State | Description |
|-------|-------------|
| `connectionStatus` | `'idle' | 'validating' | 'connecting' | 'connected' | 'disconnected'` |
| `stream` | `MediaStream` from getUserMedia |
| `memorial` | Memorial info from validation |
| `facingMode` | `'environment' | 'user'` — Front/back camera |
| `batteryLevel` | Device battery percentage (if available) |

**Lifecycle:**
1. `onMount` → Extract `token` from URL query param
2. Call `/api/devices/validate` with token
3. If valid, request camera permissions (`getUserMedia`)
4. Create `WebRTCPeer` as **initiator** (`isInitiator: true`)
5. Add media stream to peer connection
6. Start signaling (create offer)

**Camera Constraints:**
```typescript
{
  video: {
    facingMode: 'environment',  // Rear camera by default
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: true
}
```

---

### 5. WebRTC Peer Connection

**File:** `src/lib/webrtc/peer.ts`

| Class | `WebRTCPeer` |
|-------|--------------|
| **Role** | Manages RTCPeerConnection and signaling |

**Constructor Config:**
```typescript
{
  deviceId: string,
  memorialId: string,
  isInitiator: boolean,        // true = phone, false = switcher
  onStateChange: (state) => void,
  onTrack?: (stream) => void   // Only used by non-initiator (switcher)
}
```

**ICE Servers:**
```typescript
[
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]
```

**Connection States:**
| State | Description |
|-------|-------------|
| `new` | Peer created, not yet connecting |
| `connecting` | ICE negotiation in progress |
| `connected` | Media flowing |
| `disconnected` | Temporary disconnect |
| `failed` | Connection failed permanently |

**Initiator Flow (Phone):**
1. Add local stream tracks to peer connection
2. Create SDP offer
3. Set local description
4. Send offer via signaling
5. Wait for answer
6. Exchange ICE candidates

**Non-Initiator Flow (Switcher):**
1. Wait for offer via signaling
2. Set remote description (offer)
3. Create SDP answer
4. Set local description
5. Send answer via signaling
6. Exchange ICE candidates
7. Receive remote tracks via `ontrack` event

---

### 6. Signaling Client

**File:** `src/lib/webrtc/signaling.ts`

| Class | `SignalingClient` |
|-------|-------------------|
| **Role** | HTTP polling-based signaling for WebRTC |

**Message Types:**
| Type | Direction | Content |
|------|-----------|---------|
| `offer` | Phone → Switcher | SDP offer |
| `answer` | Switcher → Phone | SDP answer |
| `ice-candidate` | Bidirectional | ICE candidate |

**Polling Logic:**
- Poll every 500ms via `POST /api/signaling/poll`
- Request messages where `fromDevice` is opposite of caller
- Mark received messages as `consumed`

---

### 7. Signaling API — Send

**File:** `src/routes/api/signaling/send/+server.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/signaling/send` |
| **Auth** | None (device ID acts as auth) |
| **Input** | `{ deviceId, memorialId, fromDevice, type, payload }` |

**Flow:**
1. Validate device exists and belongs to memorial
2. Insert signaling message into database
3. Update device `lastSeen` timestamp

---

### 8. Signaling API — Poll

**File:** `src/routes/api/signaling/poll/+server.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/signaling/poll` |
| **Auth** | None |
| **Input** | `{ deviceId, memorialId, fromDevice }` |
| **Output** | `{ messages: SignalingMessage[] }` |

**Flow:**
1. Fetch unconsumed messages where `fromDevice` is opposite
2. Mark fetched messages as `consumed`
3. Update device `lastSeen` timestamp
4. Return messages ordered by `createdAt`

---

### 9. Device Stream Component

**File:** `src/lib/components/DeviceStream.svelte`

| Prop | Type | Description |
|------|------|-------------|
| `deviceId` | `string` | Device ID for signaling |
| `memorialId` | `string` | Memorial ID for signaling |
| `deviceName` | `string` | Display label |
| `onConnectionChange` | `(state) => void` | Connection state callback |
| `onStream` | `(stream) => void` | Stream received callback |

**Behavior:**
- Creates `WebRTCPeer` as **non-initiator** (`isInitiator: false`)
- Starts polling for signaling messages
- Attaches received stream to video element
- Shows connection state overlay (connecting/disconnected/failed)

---

## Database Schema

### Device Table

```typescript
device = sqliteTable('device', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  memorialId: text('memorial_id').references(() => memorial.id),
  userId: text('user_id').references(() => user.id),
  name: text('name'),
  type: text('type'),  // 'phone' | 'webcam' | 'rtmp'
  status: text('status'),  // 'pending' | 'connecting' | 'connected' | 'disconnected' | 'streaming'
  batteryLevel: integer('battery_level'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
  connectedAt: integer('connected_at', { mode: 'timestamp' }),
  lastSeen: integer('last_seen', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
});
```

### Signaling Message Table

```typescript
signalingMessage = sqliteTable('signaling_message', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').references(() => device.id),
  memorialId: text('memorial_id').references(() => memorial.id),
  fromDevice: integer('from_device', { mode: 'boolean' }),  // true = from phone
  type: text('type'),  // 'offer' | 'answer' | 'ice-candidate'
  payload: text('payload'),  // JSON stringified SDP/ICE
  consumed: integer('consumed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
});
```

---

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── AddCameraModal.svelte      # QR code / local camera chooser
│   │   └── DeviceStream.svelte        # WebRTC video receiver
│   └── webrtc/
│       ├── peer.ts                    # WebRTCPeer class
│       └── signaling.ts               # SignalingClient class
├── routes/
│   ├── api/
│   │   ├── devices/
│   │   │   ├── create-token/+server.ts   # Generate pairing token
│   │   │   └── validate/+server.ts       # Validate token, return device ID
│   │   └── signaling/
│   │       ├── send/+server.ts           # Store signaling message
│   │       └── poll/+server.ts           # Fetch unconsumed messages
│   └── camera/
│       └── +page.svelte               # Phone camera UI
```

---

## Known Issues & Limitations

### 1. Localhost QR Code Problem
**Issue:** When accessing switcher via `localhost`, QR code encodes localhost URL which phone cannot reach.  
**Workaround:** Access switcher via network IP (e.g., `http://192.168.1.17:5174`).  
**Future Fix:** Detect localhost and prompt user for network IP, or auto-detect via server.

### 2. Polling-Based Signaling
**Issue:** 500ms polling interval adds latency to connection setup.  
**Future Fix:** Replace with WebSocket signaling for real-time message delivery.

### 3. No TURN Server
**Issue:** Only STUN servers configured. Connections may fail in restrictive NAT environments.  
**Future Fix:** Add TURN server for NAT traversal fallback.

### 4. Token Expiry During Connection
**Issue:** If WebRTC negotiation takes longer than 5 minutes, token may expire mid-connection.  
**Mitigation:** Token is only checked during initial validation, not during signaling.

### 5. No Reconnection Logic
**Issue:** If connection drops, user must re-scan QR code.  
**Future Fix:** Implement automatic reconnection with backoff.

---

## Testing Checklist

- [ ] Token generated successfully with 5-minute expiry
- [ ] QR code displays and auto-refreshes on expiry
- [ ] Phone navigates to camera page after scanning QR
- [ ] Token validation returns device ID and memorial info
- [ ] Phone camera permission requested and granted
- [ ] WebRTC offer sent from phone to server
- [ ] Switcher receives offer via polling
- [ ] Switcher sends answer back
- [ ] ICE candidates exchanged bidirectionally
- [ ] WebRTC connection established (state: 'connected')
- [ ] Video stream visible in DeviceStream component
- [ ] Connection state indicators update correctly
- [ ] Flip camera button toggles front/back
- [ ] Battery level displays (if supported)
- [ ] Device shows in switcher source grid

---

## Future Enhancements

1. **WebSocket Signaling** — Replace polling with real-time WebSocket
2. **TURN Server** — Add fallback for restrictive NAT
3. **Reconnection Logic** — Auto-reconnect on disconnect
4. **Device Management UI** — Rename, remove, reorder devices
5. **Multiple Memorials** — Allow device to switch between memorials
6. **Quality Selector** — 720p/1080p/4K options on phone
7. **Audio Monitoring** — VU meter on phone and switcher
8. **Latency Display** — Show RTT between phone and switcher
