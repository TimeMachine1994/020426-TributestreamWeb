# WBS: Fixing WHIP Endpoint — Mux Live Ingest

**Date:** February 6, 2026  
**Status:** Ready to implement  
**Priority:** High — Required for GO LIVE to work end-to-end

---

## Problem Statement

The switcher page's `goLive()` function expects `createData.whipEndpoint` from the `/api/streams/create` response, but the API currently only returns `streamKey` and `playbackId`. Without the WHIP endpoint URL, the `WhipClient` has no target to connect to, and the GO LIVE button silently skips the WebRTC ingest step.

---

## Mux WHIP Reference

Mux supports **WHIP (WebRTC-HTTP Ingest Protocol)** for low-latency live streaming directly from the browser.

### WHIP Ingest URL Format
```
https://global-live.mux.com/app/{STREAM_KEY}/whip
```

### How It Works
1. Browser creates `RTCPeerConnection` and adds video/audio tracks
2. Browser creates SDP offer
3. Browser POSTs SDP offer to WHIP URL with `Content-Type: application/sdp`
4. Mux responds with SDP answer
5. Browser sets remote description → WebRTC connection established
6. Media flows from browser to Mux via WebRTC
7. On disconnect, browser sends DELETE to the resource URL returned in `Location` header

### Requirements
- Live stream must be created first via Mux API (`mux.video.liveStreams.create`)
- Stream key is returned in the create response
- WHIP URL is derived from the stream key (not returned directly by Mux API)
- Latency mode should be `'low'` for WHIP compatibility (already configured)

### Authentication
- No Bearer token needed for WHIP ingest — the stream key in the URL acts as authentication
- The stream key should never be exposed to unauthorized clients

---

## Current Code Analysis

### `src/lib/server/mux.ts`

```typescript
// Current LiveStreamResult — missing whipEndpoint
export interface LiveStreamResult {
    streamKey: string;
    playbackId: string;
    liveStreamId: string;
}

// createLiveStream() returns streamKey but doesn't derive WHIP URL
```

**Issue:** No `whipEndpoint` field in the result.

### `src/routes/api/streams/create/+server.ts`

```typescript
// Existing stream response (line 35-39)
return json({
    streamKey: memorial.muxStreamKey,
    playbackId: memorial.muxPlaybackId,
    alreadyExists: true
});

// New stream response (line 60-64)
return json({
    streamKey: result.streamKey,
    playbackId: result.playbackId,
    alreadyExists: false
});
```

**Issue:** Neither response includes `whipEndpoint`.

### `src/routes/(protected)/switcher/[memorialId]/+page.svelte`

```typescript
// goLive() already expects whipEndpoint (line ~105-136)
const createData = await createResponse.json();
// ...
if (createData.whipEndpoint) {
    whipClient = new WhipClient((state) => { whipState = state; });
    await whipClient.connect(combinedStream, createData.whipEndpoint);
}
```

**Status:** Client-side is already wired. Just needs the server to return the URL.

---

## Implementation Plan

### Task 1: Update `LiveStreamResult` interface

**File:** `src/lib/server/mux.ts`  
**Change:** Add `whipEndpoint` to the interface

```typescript
export interface LiveStreamResult {
    streamKey: string;
    playbackId: string;
    liveStreamId: string;
    whipEndpoint: string;  // NEW
}
```

### Task 2: Derive WHIP URL in `createLiveStream()`

**File:** `src/lib/server/mux.ts`  
**Change:** Construct WHIP URL from stream key in the return value

```typescript
return {
    streamKey: liveStream.stream_key!,
    playbackId,
    liveStreamId: liveStream.id,
    whipEndpoint: `https://global-live.mux.com/app/${liveStream.stream_key!}/whip`
};
```

### Task 3: Return `whipEndpoint` for existing streams

**File:** `src/routes/api/streams/create/+server.ts`  
**Change:** Add `whipEndpoint` to the "already exists" response

```typescript
if (memorial.muxStreamKey) {
    return json({
        streamKey: memorial.muxStreamKey,
        playbackId: memorial.muxPlaybackId,
        whipEndpoint: `https://global-live.mux.com/app/${memorial.muxStreamKey}/whip`,
        alreadyExists: true
    });
}
```

### Task 4: Return `whipEndpoint` for new streams

**File:** `src/routes/api/streams/create/+server.ts`  
**Change:** Pass through `whipEndpoint` from `createLiveStream()` result

```typescript
return json({
    streamKey: result.streamKey,
    playbackId: result.playbackId,
    whipEndpoint: result.whipEndpoint,
    alreadyExists: false
});
```

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/lib/server/mux.ts` | Add `whipEndpoint` to interface + return value | ~4 lines |
| `src/routes/api/streams/create/+server.ts` | Add `whipEndpoint` to both response branches | ~2 lines |

**Total:** ~6 lines changed across 2 files. Zero client-side changes needed.

---

## Security Considerations

- The WHIP URL contains the stream key, which acts as authentication
- The `/api/streams/create` endpoint already requires authentication (`locals.user` check)
- The endpoint already verifies role-based access (admin or assigned videographer)
- The stream key is already returned in the response — adding the WHIP URL doesn't increase the attack surface
- The WHIP URL is only used client-side within the `WhipClient` and never persisted in localStorage

---

## Testing Checklist

- [ ] `/api/streams/create` returns `whipEndpoint` for new streams
- [ ] `/api/streams/create` returns `whipEndpoint` for existing streams
- [ ] WHIP URL format matches `https://global-live.mux.com/app/{key}/whip`
- [ ] `goLive()` creates `WhipClient` with the returned endpoint
- [ ] `WhipClient` successfully negotiates SDP with Mux
- [ ] Video appears in Mux dashboard after WHIP connection
- [ ] `endStream()` disconnects WHIP and sends DELETE to resource URL
- [ ] WHIP connection state indicator shows correct status in header

---

## Dependencies

- **Mux API credentials** must be set: `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` in `.env`
- **Mux account** must support WHIP ingest (available on all paid plans)
- **Browser** must support WebRTC (all modern browsers)
- **HTTPS** required for WebRTC in production (localhost is exempt for dev)
