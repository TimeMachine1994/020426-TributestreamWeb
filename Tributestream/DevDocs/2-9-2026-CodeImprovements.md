# Code Improvement Recommendations

Review of the Tributestream codebase against Svelte 5 and Mux best practices, with actionable improvements organized by priority.

---

## Critical: Mux WHIP / Live Streaming

### 1. Mux Does NOT Support WHIP Ingest

**Impact: Architecture change required**

Per [Mux's FAQ](https://docs.mux.com/guides/video/live-streaming-faqs):
> "We currently do not support direct WebRTC ingest to a Live Stream."

Our `WhipClient.ts` sends an SDP offer to `https://global-live.mux.com/app/{streamKey}/whip` — this endpoint **does not exist**. That's why the connection keeps failing.

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **A. Use RTMP via a media server** | Mux-supported, proven | Requires running a media server (e.g., MediaMTX, OBS) to convert WebRTC → RTMP |
| **B. Use a WHIP-compatible provider** | Browser-native WHIP works | Switch from Mux to Cloudflare Stream, LiveKit, or another WHIP-supporting CDN |
| **C. Use Mux + LiveKit** | Mux recommends LiveKit for WebRTC | Adds a dependency but is the officially recommended path |
| **D. Client-side MediaRecorder → RTMP relay** | No extra server | Higher latency, more complex |

**Recommendation:** Option B (Cloudflare Stream supports WHIP natively) or Option C (LiveKit for WebRTC ingest, Mux for delivery/recording).

### 2. Stream Key Reuse

Per Mux docs, stream keys are persistent and reusable. Currently we create a new Mux live stream every time `goLive()` is called. We should:
- Check if a valid stream already exists before creating a new one
- Reuse stream keys across sessions for the same memorial
- Clean up old live streams that are no longer active

**File:** `src/routes/api/streams/create/+server.ts` — already has `alreadyExists` check but creates duplicates if the memorial's `muxStreamKey` is null after cleanup.

---

## High Priority: Svelte 5 Best Practices

### 3. Replace `use:action` with `@attach` for DOM Side Effects

Svelte 5 introduced `@attach` as the modern replacement for `use:action` directives. Our `srcObject` action in the switcher page should be converted:

**Current (`+page.svelte`):**
```svelte
function srcObject(node: HTMLVideoElement, stream: MediaStream) {
    node.srcObject = stream;
    return { update(s) { node.srcObject = s; }, destroy() { node.srcObject = null; } };
}
<video use:srcObject={source.stream}></video>
```

**Improved:**
```svelte
function srcObject(stream: MediaStream) {
    return (node: HTMLVideoElement) => {
        node.srcObject = stream;
        return () => { node.srcObject = null; };
    };
}
<video {@attach srcObject(source.stream)}></video>
```

**Files:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte`

### 4. Add `<svelte:boundary>` for Error Handling

WebRTC components can fail unpredictably. Wrap `DeviceStream` and `CompositorCanvas` in error boundaries:

```svelte
<svelte:boundary onerror={(e) => console.error('Device error:', e)}>
    <DeviceStream ... />
    {#snippet failed(error, reset)}
        <button onclick={reset}>Reconnect</button>
    {/snippet}
</svelte:boundary>
```

**Files:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte`

### 5. Use `$state.raw` for Non-Mutated Objects

Large objects that are replaced (not mutated) should use `$state.raw` for better performance:

```typescript
// Current
let memorial: { id: string; title: string; slug: string } | null = $state(null);

// Improved — memorial is replaced, never mutated
let memorial: { id: string; title: string; slug: string } | null = $state.raw(null);
```

**Files:** `src/routes/camera/+page.svelte` (memorial, stream objects)

### 6. Use `$derived` Instead of Manual State Tracking

The camera page has manual state that could be derived:

```typescript
// Current: manually tracked
let connectionStatus = $state('idle');

// Could derive from peer state if peer was reactive
```

### 7. Replace `$page` Store with `$app/state`

Svelte 5 / SvelteKit 2.12+ provides `$app/state` as the runes-based replacement for `$app/stores`:

```typescript
// Current (legacy store)
import { page } from '$app/stores';
const token = $derived($page.url.searchParams.get('token'));

// Improved (runes)
import { page } from '$app/state';
const token = $derived(page.url.searchParams.get('token'));
```

**Files:** `src/routes/camera/+page.svelte`

---

## Medium Priority: WebRTC Architecture

### 8. Replace HTTP Polling with Server-Sent Events (SSE) or WebSocket

Current signaling uses `setInterval` HTTP polling at 500ms — generating constant server load. Replace with SSE for server→client and POST for client→server:

```
Phone ─── POST offer ──→ Server ──── SSE event ──→ Switcher
Phone ←── SSE event ──── Server ←── POST answer ── Switcher
```

**Benefits:**
- Instant message delivery (vs 500ms polling delay)
- ~90% fewer HTTP requests
- Lower server load
- Better battery life on phones

**Files:** `src/lib/webrtc/signaling.ts`, `src/routes/api/signaling/`

### 9. Add TURN Server Configuration

Currently only STUN servers are configured:
```typescript
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];
```

STUN only works when both peers are on the same network or have simple NAT. For production, add TURN servers (e.g., Twilio, Metered, or self-hosted coturn):

```typescript
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn-server.com:443', username: '...', credential: '...' }
];
```

**File:** `src/lib/webrtc/peer.ts`

### 10. Add WebRTC Reconnection Logic

`WebRTCPeer` has no reconnection on `disconnected` or `failed`. Add:
- ICE restart on `disconnected`
- Full re-offer on `failed`
- Exponential backoff

**File:** `src/lib/webrtc/peer.ts`

---

## Low Priority: Code Quality

### 11. Remove Excessive Console Logging

Debug logging was added throughout (40+ `console.log` calls). Before production:
- Replace with a configurable logger (e.g., `import { dev } from '$app/environment'`)
- Only log in dev mode
- Use structured log levels (debug, info, warn, error)

```typescript
import { dev } from '$app/environment';
const log = dev ? console.log.bind(console, '[WebRTCPeer]') : () => {};
```

**Files:** All files in `src/lib/webrtc/`, `src/lib/components/DeviceStream.svelte`, API routes

### 12. Type-Safe Error Handling in API Routes

API routes use bare `throw error()` without consistent error shapes. Standardize:

```typescript
// Create a shared error helper
function apiError(status: number, code: string, message: string) {
    throw error(status, { code, message });
}
```

**Files:** All `+server.ts` files

### 13. Add Cleanup for Stale Mux Live Streams

Currently stale devices are cleaned up, but orphaned Mux live streams are not. Add a cleanup endpoint or cron job to:
- Delete Mux live streams in `idle` state for > 24 hours
- Reset memorial `muxStreamKey` fields when streams are cleaned up

**Files:** `src/lib/server/mux.ts`, new cleanup route

### 14. Accessibility Warnings

The compiler warns about buttons without labels:
```
src/routes/(protected)/switcher/[memorialId]/+page.svelte:419:7
Buttons and links should either contain text or have an `aria-label`
```

Add `aria-label` to the remove device buttons:

```svelte
<button aria-label="Remove device" ...>
```

**Files:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte`

---

## Summary Priority Matrix

| # | Item | Priority | Effort |
|---|------|----------|--------|
| 1 | Fix Mux WHIP (not supported) | **Critical** | High |
| 2 | Stream key reuse | **Critical** | Low |
| 3 | `use:action` → `@attach` | High | Low |
| 4 | `<svelte:boundary>` error handling | High | Low |
| 5 | `$state.raw` for immutables | High | Low |
| 6 | Derive connection status | High | Low |
| 7 | `$app/stores` → `$app/state` | High | Low |
| 8 | Polling → SSE signaling | Medium | Medium |
| 9 | Add TURN servers | Medium | Low |
| 10 | WebRTC reconnection | Medium | Medium |
| 11 | Remove debug logging | Low | Low |
| 12 | Standardize API errors | Low | Low |
| 13 | Mux stream cleanup | Low | Medium |
| 14 | Fix a11y warnings | Low | Low |
